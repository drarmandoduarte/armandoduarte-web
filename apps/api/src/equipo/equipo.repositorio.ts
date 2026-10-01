import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';

/** Los campos de `libro_de_edicion()` (010) de una inscripción sin renglones. */
const LIBRO_VACIO = {
  ultimo_tipo: null, ultimo_el: null, ultimo_por: null, ultima_nota: null,
  monto_declarado: null, moneda_declarada: null, fecha_transferencia: null, banco: null,
  ultimos4_o_folio: null, comprobante_path: null, monto_confirmado: null, moneda_confirmada: null,
};

/**
 * Lo que el panel del equipo lee y escribe — orden #24 A.
 *
 * **Todo con el token de quien pide**, nunca con `service_role`: el territorio
 * (D11), el segundo paso y «solo el dueño suma al equipo» los decide la RLS de
 * la base, y este archivo no tiene forma de saltearla. Las tres lecturas son
 * las funciones de la migración 008 (`rpc`); las escrituras van contra las
 * tablas, con las policies de la 001 y la 002.
 *
 * Los errores de Postgres se traducen a algo que la pantalla sabe decir:
 *   · `23505` (único): el slug ya existe → 409 `SLUG_REPETIDO`.
 *   · `23514` / `22P02` / `23502` (un `check`, un formato, un nulo): → 400 `NO_VALIDO`.
 *   · `42501` o RLS: → 403 `SIN_PERMISO`.
 * Nunca se devuelve el mensaje de Postgres: puede nombrar columnas y policies.
 */
@Injectable()
export class EquipoRepositorio {
  private readonly logger = new Logger(EquipoRepositorio.name);

  constructor(private readonly supabase: SupabaseService) {}

  async cursos(token: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.comoElUsuario(token).rpc('panel_cursos');
    if (error) throw this.traducir(error, 'leer los cursos');
    return Array.isArray(data) ? data : [];
  }

  /**
   * Inscriptos con su libro: `panel_inscriptos()` (008) y `libro_de_edicion()`
   * (010), juntadas por `inscripcion_id`. Las dos corren con el token de quien
   * pide, así que las dos traen las mismas filas —las de su territorio—; una
   * inscripción sin libro trae los campos del libro en nulo (#27 C.2).
   */
  async inscriptos(token: string, edicionId: string): Promise<unknown[]> {
    const cliente = this.supabase.comoElUsuario(token);
    const [filas, libro] = await Promise.all([
      cliente.rpc('panel_inscriptos', { edicion: edicionId }),
      cliente.rpc('libro_de_edicion', { edicion: edicionId }),
    ]);
    if (filas.error) throw this.traducir(filas.error, 'leer los inscriptos');
    if (libro.error) throw this.traducir(libro.error, 'leer el libro de los inscriptos');
    const porInscripcion = new Map(
      ((libro.data ?? []) as { inscripcion_id: string }[]).map((l) => [l.inscripcion_id, l]),
    );
    return ((filas.data ?? []) as { inscripcion_id: string }[]).map((f) => ({
      ...LIBRO_VACIO,
      ...porInscripcion.get(f.inscripcion_id),
      ...f,
    }));
  }

  async clientes(token: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.comoElUsuario(token).rpc('panel_clientes');
    if (error) throw this.traducir(error, 'leer los clientes');
    return data ?? [];
  }

  async crearCurso(token: string, curso: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase.comoElUsuario(token).from('cursos').insert(curso);
    if (error) throw this.traducir(error, 'crear el curso');
  }

  async editarCurso(token: string, id: string, cambios: Record<string, unknown>): Promise<void> {
    const { data, error } = await this.supabase
      .comoElUsuario(token).from('cursos').update(cambios).eq('id', id).select('id');
    if (error) throw this.traducir(error, 'editar el curso');
    if ((data ?? []).length === 0) throw new NotFoundException({ message: 'Ese curso no existe.', code: 'NO_EXISTE' });
  }

  async crearEdicion(token: string, edicion: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase.comoElUsuario(token).from('ediciones').insert(edicion);
    if (error) throw this.traducir(error, 'crear la edición');
  }

  async editarEdicion(token: string, id: string, cambios: Record<string, unknown>): Promise<void> {
    const { data, error } = await this.supabase
      .comoElUsuario(token).from('ediciones').update(cambios).eq('id', id).select('id');
    if (error) throw this.traducir(error, 'editar la edición');
    if ((data ?? []).length === 0) throw new NotFoundException({ message: 'Esa edición no existe.', code: 'NO_EXISTE' });
  }

  /**
   * Sumar al equipo: si la persona ya estuvo (fila desactivada) se reactiva con
   * el territorio nuevo; si no, se inserta. Las dos cosas solo las deja hacer la
   * base al dueño con segundo paso, y las dos quedan en `auditoria` (004).
   */
  async sumarAlEquipo(token: string, personaId: string, territorio: string, invitadoPor: string): Promise<void> {
    const cliente = this.supabase.comoElUsuario(token);
    const { data: previa, error: alLeer } = await cliente
      .from('miembros').select('user_id, rol').eq('user_id', personaId).maybeSingle();
    if (alLeer) throw this.traducir(alLeer, 'leer el equipo');
    if (previa?.rol === 'dueno') {
      throw new BadRequestException({ message: 'Esa persona ya es dueña.', code: 'NO_VALIDO' });
    }
    const { error } = previa
      ? await cliente.from('miembros').update({ rol: 'equipo', territorio, activo: true }).eq('user_id', personaId)
      : await cliente.from('miembros').insert({ user_id: personaId, rol: 'equipo', territorio, invitado_por: invitadoPor });
    if (error) throw this.traducir(error, 'sumar al equipo');
  }

  /** Quitar del equipo es desactivar: la fila se queda, con su historia (001). */
  async quitarDelEquipo(token: string, personaId: string): Promise<void> {
    const { data, error } = await this.supabase
      .comoElUsuario(token).from('miembros').update({ activo: false })
      .eq('user_id', personaId).eq('rol', 'equipo').select('user_id');
    if (error) throw this.traducir(error, 'quitar del equipo');
    if ((data ?? []).length === 0) {
      throw new NotFoundException({ message: 'Esa persona no está en el equipo.', code: 'NO_EXISTE' });
    }
  }

  private traducir(error: { code?: string; message?: string }, que: string): Error {
    this.logger.warn(`No se pudo ${que}: ${error.code ?? 'sin código'}`);
    if (error.code === '23505') {
      return new ConflictException({ message: 'Ya hay un curso con esa dirección.', code: 'SLUG_REPETIDO' });
    }
    if (error.code === '23514' || error.code === '22P02' || error.code === '23502' || error.code === '22007' || error.code === '23503') {
      return new BadRequestException({ message: 'Algún dato no es válido.', code: 'NO_VALIDO' });
    }
    if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) {
      return new ForbiddenException({ message: 'No tienes permiso para esto.', code: 'SIN_PERMISO' });
    }
    return new BadRequestException({ message: `No pudimos ${que}.`, code: 'DESCONOCIDO' });
  }
}
