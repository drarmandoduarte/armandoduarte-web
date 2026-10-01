import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';

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
