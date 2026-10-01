import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';

/** Un renglón de `pagos_libro` (003), lo que esta API lee de él. */
export interface Renglon {
  orden: number | string;
  tipo: string;
  nota: string | null;
  comprobante_path: string | null;
  monto: number | string | null;
  moneda: string | null;
  created_at: string;
}

/** Lo que el correo necesita saber de una inscripción. */
export interface DatosDelCorreo {
  email: string;
  nombre: string | null;
  referencia: string;
  curso: string;
  inicio: string;
  fin: string;
  zona: string;
  sede: string | null;
  ciudad: string | null;
}

/**
 * El libro, ordenado del último al primero. `orden` es la columna monótona de
 * la 003 —`created_at` empata dentro de una transacción—, y llega como número o
 * como texto según el driver (`bigserial`): se compara como número.
 */
export function delUltimoAlPrimero(renglones: Renglon[]): Renglon[] {
  return [...renglones].sort((a, b) => Number(b.orden) - Number(a.orden));
}

/**
 * El estado, deducido del último renglón — la misma tabla que
 * `estado_inscripcion()` (003). Se repite acá para no pedirle a la base una
 * segunda vuelta por algo que ya está en la mano; si la 003 cambiara, el test
 * contra el banco lo diría (`las-consultas-corren-contra-la-base.spec.ts`).
 */
export function estadoDelLibro(renglones: Renglon[]): 'pendiente_de_pago' | 'en_revision' | 'confirmada' | 'anulada' {
  const [ultimo] = delUltimoAlPrimero(renglones);
  switch (ultimo?.tipo) {
    case 'declarado': return 'en_revision';
    case 'confirmado': return 'confirmada';
    case 'anulado': return 'anulada';
    default: return 'pendiente_de_pago';
  }
}

/**
 * Lo que el comprobante lee y escribe — orden #27 C.
 *
 * **Todo con el token de quien pide**, nunca con `service_role`: que el cliente
 * declare solo sobre lo suyo (`libro_el_cliente_declara`), que el equipo
 * resuelva solo en su territorio y con segundo paso (`libro_el_equipo_resuelve`
 * y `libro_segundo_paso`) y quién lee qué comprobante (las policies de la 006)
 * lo decide la base. Este archivo no tiene forma de saltearla.
 */
@Injectable()
export class PagosRepositorio {
  private readonly logger = new Logger(PagosRepositorio.name);

  constructor(private readonly supabase: SupabaseService) {}

  /** La inscripción, si quien pide la puede ver (la suya, o la de su territorio). */
  async inscripcion(token: string, id: string): Promise<{ id: string; referencia: string; persona_id: string; edicion_id: string } | null> {
    const { data, error } = await this.supabase.comoElUsuario(token)
      .from('inscripciones').select('id, referencia, persona_id, edicion_id').eq('id', id).maybeSingle();
    if (error) throw this.traducir(error, 'leer la inscripción');
    return (data as { id: string; referencia: string; persona_id: string; edicion_id: string } | null) ?? null;
  }

  /** El libro de una inscripción, del último renglón al primero. */
  async libro(token: string, inscripcionId: string): Promise<Renglon[]> {
    const { data, error } = await this.supabase.comoElUsuario(token)
      .from('pagos_libro')
      .select('orden, tipo, nota, comprobante_path, monto, moneda, created_at')
      .eq('inscripcion_id', inscripcionId);
    if (error) throw this.traducir(error, 'leer el libro');
    return delUltimoAlPrimero((data as Renglon[] | null) ?? []);
  }

  /** Un renglón nuevo. `hecho_por` va explícito: la policy exige que sea quien firma. */
  async anotar(token: string, renglon: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase.comoElUsuario(token).from('pagos_libro').insert(renglon);
    if (error) throw this.traducir(error, 'anotar el pago');
  }

  /**
   * Borra el comprobante recién subido, **con el token del cliente** (orden #27
   * C.1: «si el insert falla, la API borra el archivo»).
   *
   * Devuelve si se borró. **Hoy no se borra**: la 006 no le da `delete` a nadie
   * sobre `storage.objects` —es lo que hace que un comprobante no se pueda
   * cambiar después de declarado—, así que Storage contesta sin error y sin
   * filas. Queda huérfano en la carpeta del cliente y se anota; no se usa
   * `service_role` para forzarlo. Está en el informe como decisión para
   * dirección (una policy de borrado solo de lo que el libro no nombra).
   */
  async borrarComprobante(token: string, ruta: string): Promise<boolean> {
    const { data, error } = await this.supabase.comoElUsuario(token).storage.from('comprobantes').remove([ruta]);
    const borrado = !error && Array.isArray(data) && data.length > 0;
    if (!borrado) this.logger.warn('El comprobante de una declaración fallida quedó en Storage sin renglón en el libro.');
    return borrado;
  }

  /** Una URL firmada de 60 s, creada con el token de quien pide: la policy de lectura de la 006 manda. */
  async urlFirmada(token: string, ruta: string): Promise<string> {
    const { data, error } = await this.supabase.comoElUsuario(token).storage.from('comprobantes').createSignedUrl(ruta, 60);
    if (error || !data?.signedUrl) {
      this.logger.warn('No se pudo firmar la URL de un comprobante.');
      throw new NotFoundException({ message: 'No encontramos ese comprobante.', code: 'SIN_COMPROBANTE' });
    }
    return data.signedUrl;
  }

  /**
   * Lo que el correo dice, leído con el token del miembro que confirma: la
   * persona es de su territorio (si no, no habría podido confirmar) y el curso
   * lo ve todo el equipo. `null` si algo no se pudo leer: el correo no sale y la
   * confirmación queda igual.
   */
  async datosParaElCorreo(token: string, inscripcionId: string): Promise<DatosDelCorreo | null> {
    const cliente = this.supabase.comoElUsuario(token);
    const insc = await this.inscripcion(token, inscripcionId);
    if (!insc) return null;
    const { data: persona } = await cliente.from('personas').select('email, nombre').eq('id', insc.persona_id).maybeSingle();
    const { data: edicion } = await cliente.from('ediciones')
      .select('curso_id, inicio, fin, zona, sede, ciudad').eq('id', insc.edicion_id).maybeSingle();
    const e = edicion as { curso_id: string; inicio: string; fin: string; zona: string; sede: string | null; ciudad: string | null } | null;
    if (!persona || !e) return null;
    const { data: curso } = await cliente.from('cursos').select('titulo').eq('id', e.curso_id).maybeSingle();
    if (!curso) return null;
    const p = persona as { email: string; nombre: string | null };
    return {
      email: p.email, nombre: p.nombre, referencia: insc.referencia, curso: (curso as { titulo: string }).titulo,
      inicio: e.inicio, fin: e.fin, zona: e.zona, sede: e.sede, ciudad: e.ciudad,
    };
  }

  private traducir(error: { code?: string; message?: string }, que: string): Error {
    this.logger.warn(`No se pudo ${que}: ${error.code ?? 'sin código'}`);
    if (error.code === '23514' || error.code === '22P02' || error.code === '23502' || error.code === '22007' || error.code === '22008') {
      return new BadRequestException({ message: 'Algún dato no es válido.', code: 'NO_VALIDO' });
    }
    if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) {
      return new ForbiddenException({ message: 'No tienes permiso para esto.', code: 'SIN_PERMISO' });
    }
    return new BadRequestException({ message: `No pudimos ${que}.`, code: 'DESCONOCIDO' });
  }
}
