import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';

/**
 * Lo que el rescate solo lee y escribe — orden #37, PR 2 (fase-2 §8).
 *
 * Las columnas de `public.rescates` (migración `013`, y son éstas y no otras):
 * `id`, `user_id`, `pedido_el`, `vence_el`, `confirmado_el`, `cancelado_el`,
 * `usado_el`, `token_hash`.
 *
 * Escribe **solo con `service_role`**: la 013 no le da a `authenticated` ni
 * insert ni update, y las rutas de pedir, confirmar y cancelar no tienen
 * sesión. El filtro que reemplaza a la RLS es siempre el `user_id` o el `id`
 * que la API ya validó —nunca un dato del cuerpo sin validar—. La única
 * lectura con el token de la persona es la de «Reseteo pendiente» de `/api/yo`,
 * donde la RLS de la 013 la deja ver solo los suyos.
 *
 * Los errores de la base se convierten en un 400 con un texto nuestro: el
 * mensaje de Postgres no sale de la API.
 */
export interface Rescate {
  id: string;
  user_id: string;
  vence_el: string;
  confirmado_el: string | null;
  cancelado_el: string | null;
  usado_el: string | null;
  token_hash: string;
}

const COLUMNAS = 'id, user_id, vence_el, confirmado_el, cancelado_el, usado_el, token_hash';

@Injectable()
export class RescateRepositorio {
  constructor(private readonly supabase: SupabaseService) {}

  /** La persona de un correo, o `null`. `personas.email` está en minúsculas (001). */
  async personaPorCorreo(correo: string): Promise<{ id: string; zona: string | null } | null> {
    const { data, error } = await this.supabase.comoElServicio()
      .from('personas').select('id, zona_horaria').eq('email', correo.toLowerCase()).maybeSingle();
    if (error) throw new BadRequestException('No pudimos pedir el reseteo.');
    return data ? { id: data.id as string, zona: (data.zona_horaria as string | null) ?? null } : null;
  }

  /** La zona horaria de una persona, para escribir la fecha del correo en su hora. */
  async zonaDe(userId: string): Promise<string | null> {
    const { data } = await this.supabase.comoElServicio()
      .from('personas').select('zona_horaria').eq('id', userId).maybeSingle();
    return (data?.zona_horaria as string | null | undefined) ?? null;
  }

  /** El correo de una persona, para mandarle los dos avisos. */
  async correoDe(userId: string): Promise<string | null> {
    const { data } = await this.supabase.comoElServicio()
      .from('personas').select('email').eq('id', userId).maybeSingle();
    return (data?.email as string | null | undefined) ?? null;
  }

  /** ¿Tiene un autenticador? Sin uno, no hay nada que resetear. */
  async tieneAutenticador(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.comoElServicio().auth.admin.mfa.listFactors({ userId });
    if (error) throw new BadRequestException('No pudimos pedir el reseteo.');
    return (data?.factors ?? []).some((f) => f.factor_type === 'totp');
  }

  /** El rescate abierto (sin cancelar ni usar) de una persona, si hay. La 013 deja uno solo. */
  async abiertoDe(userId: string): Promise<Rescate | null> {
    const { data, error } = await this.supabase.comoElServicio()
      .from('rescates').select(COLUMNAS).eq('user_id', userId)
      .is('cancelado_el', null).is('usado_el', null).maybeSingle();
    if (error) throw new BadRequestException('No pudimos leer el reseteo.');
    return (data as Rescate | null) ?? null;
  }

  async porId(id: string): Promise<Rescate | null> {
    const { data, error } = await this.supabase.comoElServicio()
      .from('rescates').select(COLUMNAS).eq('id', id).maybeSingle();
    if (error) throw new BadRequestException('Ese enlace no es válido.');
    return (data as Rescate | null) ?? null;
  }

  async crear(fila: { userId: string; pedido: Date; vence: Date; tokenHash: string }): Promise<string> {
    const { data, error } = await this.supabase.comoElServicio()
      .from('rescates')
      .insert({
        user_id: fila.userId,
        pedido_el: fila.pedido.toISOString(),
        vence_el: fila.vence.toISOString(),
        token_hash: fila.tokenHash,
      })
      .select('id')
      .single();
    if (error || !data) throw new BadRequestException('No pudimos pedir el reseteo.');
    return data.id as string;
  }

  /**
   * Cierra un rescate llenando UNA columna, solo si sigue abierto. Devuelve si
   * cerró algo: si otro pedido lo cerró primero, la condición `is null` hace
   * que la carrera se resuelva en la base y no acá (como al quemar un código
   * de respaldo).
   */
  async cerrar(id: string, columna: 'confirmado_el' | 'cancelado_el' | 'usado_el'): Promise<boolean> {
    let consulta = this.supabase.comoElServicio()
      .from('rescates').update({ [columna]: new Date().toISOString() })
      .eq('id', id).is('cancelado_el', null).is('usado_el', null);
    if (columna === 'confirmado_el') consulta = consulta.is('confirmado_el', null);
    const { data, error } = await consulta.select('id');
    if (error) throw new BadRequestException('No pudimos cerrar el reseteo.');
    return (data ?? []).length > 0;
  }

  /**
   * Lo que hace el reseteo de verdad: borra **todos** los autenticadores de la
   * persona y **todos** sus códigos de respaldo. El anterior deja de valer, y
   * con el factor borrado `decidirReto()` del núcleo la manda a enrolar uno
   * nuevo. Si algo falla, tira **antes** de marcar el rescate como usado: un
   * reseteo a medias se puede reintentar entrando otra vez.
   */
  async borrarAutenticadores(userId: string): Promise<void> {
    const admin = this.supabase.comoElServicio();
    const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
    if (error) throw new BadRequestException('No pudimos resetear tu autenticador.');
    for (const factor of data?.factors ?? []) {
      const borrado = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
      if (borrado.error) throw new BadRequestException('No pudimos resetear tu autenticador.');
    }
    const codigos = await admin.from('totp_backup_codes').delete().eq('user_id', userId);
    if (codigos.error) throw new BadRequestException('No pudimos resetear tu autenticador.');
  }

  /** «Reseteo pendiente» de `/api/yo`: con el token de la persona (la RLS de la 013 le deja ver los suyos). */
  async abiertoComoLaPersona(token: string, userId: string): Promise<Rescate | null> {
    const { data, error } = await this.supabase.comoElUsuario(token)
      .from('rescates').select('id, user_id, vence_el, confirmado_el, cancelado_el, usado_el')
      .eq('user_id', userId).is('cancelado_el', null).is('usado_el', null).maybeSingle();
    if (error) return null;
    return data ? ({ ...data, token_hash: '' } as Rescate) : null;
  }
}
