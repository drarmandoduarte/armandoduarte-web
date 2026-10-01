import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';

/** Lo que se le suma a cada fila de «Mis talleres» para el comprobante (orden #27 C.1). */
export interface PagoDeMiInscripcion {
  inscripcion_id: string;
  precio_monto: number | string | null;
  precio_moneda: string | null;
  /** La nota del último renglón, si es un rechazo: lo que escribió el equipo. */
  motivo_rechazo: string | null;
  tiene_comprobante: boolean;
}

/** Los datos para transferir, tal como los lee el cliente: la cuenta vigente. */
export interface DatosDeCobro {
  banco: string;
  titular: string;
  clabe: string;
  concepto_sugerido: string | null;
}

/**
 * Lo que «Me anoto» lee y escribe — orden #24 B.
 *
 * **Todo con el token de quien pide.** Las tres consultas son las de la
 * migración 009 (`talleres_abiertos`, `mis_talleres`, `inscribirme`); la ficha
 * se corrige con `personas_edito_la_mia` (001) y los datos de cobro se leen con
 * `cobro_con_sesion_lee_la_vigente` (004). Ninguna usa `service_role`.
 *
 * Los dos códigos propios de la 009 se traducen a lo que la pantalla sabe
 * decir: `CD409` → 409 `SIN_LUGARES`, `CD410` → 409 `EDICION_CERRADA`. Nunca
 * se devuelve el mensaje de Postgres.
 */
@Injectable()
export class TalleresRepositorio {
  private readonly logger = new Logger(TalleresRepositorio.name);

  constructor(private readonly supabase: SupabaseService) {}

  async abiertos(token: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.comoElUsuario(token).rpc('talleres_abiertos');
    if (error) throw this.traducir(error, 'leer los talleres');
    return data ?? [];
  }

  async mios(token: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.comoElUsuario(token).rpc('mis_talleres');
    if (error) throw this.traducir(error, 'leer tus talleres');
    return data ?? [];
  }

  /**
   * Lo que «Mis talleres» necesita para el comprobante (orden #27 C.1) y
   * `mis_talleres()` (009) no trae: el id de cada inscripción (la carpeta de
   * Storage), el precio (para prellenar el monto), el motivo del último rechazo
   * y si hay un comprobante para ver. Por referencia, que es la llave que
   * `mis_talleres()` sí devuelve.
   *
   * Con el token de la persona y tres lecturas sencillas por inscripción: sus
   * inscripciones (`inscripciones_leo_las_mias`), su libro
   * (`libro_el_cliente_lee_el_suyo`) y el precio de la edición (002: lo
   * publicado se ve). Una clienta tiene uno o dos talleres; si la edición ya no
   * se ve (curso pasado a borrador), el precio viene en nulo y el monto no se
   * prellena.
   */
  async pagosDeMisInscripciones(token: string, personaId: string): Promise<Map<string, PagoDeMiInscripcion>> {
    const cliente = this.supabase.comoElUsuario(token);
    const { data, error } = await cliente.from('inscripciones').select('id, referencia, edicion_id').eq('persona_id', personaId);
    if (error) throw this.traducir(error, 'leer tus inscripciones');
    const resultado = new Map<string, PagoDeMiInscripcion>();
    for (const i of (data ?? []) as { id: string; referencia: string; edicion_id: string }[]) {
      const [libro, edicion] = await Promise.all([
        cliente.from('pagos_libro').select('orden, tipo, nota, comprobante_path').eq('inscripcion_id', i.id),
        cliente.from('ediciones').select('precio_monto, precio_moneda').eq('id', i.edicion_id).maybeSingle(),
      ]);
      if (libro.error) throw this.traducir(libro.error, 'leer tus pagos');
      const renglones = ((libro.data ?? []) as { orden: number | string; tipo: string; nota: string | null; comprobante_path: string | null }[])
        .sort((a, b) => Number(b.orden) - Number(a.orden));
      const precio = edicion.data as { precio_monto: number | string | null; precio_moneda: string | null } | null;
      resultado.set(i.referencia, {
        inscripcion_id: i.id,
        precio_monto: precio?.precio_monto ?? null,
        precio_moneda: precio?.precio_moneda ?? null,
        motivo_rechazo: renglones[0]?.tipo === 'rechazado' ? renglones[0].nota : null,
        tiene_comprobante: renglones.some((r) => r.tipo === 'declarado' && r.comprobante_path),
      });
    }
    return resultado;
  }

  /** Completa en la ficha **solo** los datos que se mandaron (los que faltaban). */
  async completarFicha(token: string, personaId: string, datos: Record<string, string>): Promise<void> {
    if (Object.keys(datos).length === 0) return;
    const { error } = await this.supabase.comoElUsuario(token).from('personas').update(datos).eq('id', personaId);
    if (error) throw this.traducir(error, 'guardar tus datos');
  }

  async inscribirme(token: string, edicionId: string): Promise<{ referencia: string; ya_estaba: boolean }> {
    const { data, error } = await this.supabase.comoElUsuario(token).rpc('inscribirme', { edicion: edicionId });
    if (error) throw this.traducir(error, 'anotarte');
    const fila = (Array.isArray(data) ? data[0] : data) as { referencia?: string; ya_estaba?: boolean } | undefined;
    if (!fila?.referencia) throw this.traducir({ code: 'sin-fila' }, 'anotarte');
    return { referencia: fila.referencia, ya_estaba: fila.ya_estaba === true };
  }

  /**
   * La cuenta vigente, o `null` si no hay ninguna cargada. **Vacía es un caso
   * normal**, no un error: los datos reales los carga el CEO por SQL y la
   * pantalla, sin ellos, ofrece pedirlos por WhatsApp.
   */
  async cobroVigente(token: string): Promise<DatosDeCobro | null> {
    const { data, error } = await this.supabase.comoElUsuario(token)
      .from('datos_de_cobro')
      .select('banco, titular, clabe, concepto_sugerido')
      .is('vigente_hasta', null)
      .maybeSingle();
    if (error) {
      /* Sin la cuenta, la inscripción ya quedó hecha: no se la tira abajo por
         esto. Se anota y se sigue como si no hubiera datos. */
      this.logger.warn(`No se pudieron leer los datos de cobro: ${error.code ?? 'sin código'}`);
      return null;
    }
    return (data as DatosDeCobro | null) ?? null;
  }

  private traducir(error: { code?: string; message?: string }, que: string): Error {
    this.logger.warn(`No se pudo ${que}: ${error.code ?? 'sin código'}`);
    if (error.code === 'CD409') {
      return new ConflictException({ message: 'Ya no quedan lugares en este taller.', code: 'SIN_LUGARES' });
    }
    if (error.code === 'CD410') {
      return new ConflictException({ message: 'Este taller ya no recibe inscripciones.', code: 'EDICION_CERRADA' });
    }
    if (error.code === '23514' || error.code === '22P02' || error.code === '23502') {
      return new BadRequestException({ message: 'Algún dato no es válido.', code: 'NO_VALIDO' });
    }
    if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) {
      return new ForbiddenException({ message: 'No tienes permiso para esto.', code: 'SIN_PERMISO' });
    }
    return new BadRequestException({ message: `No pudimos ${que}.`, code: 'DESCONOCIDO' });
  }
}
