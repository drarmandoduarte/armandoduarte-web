import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';

/** El correo que queda en `auth.users` y en `personas` (014). `.invalid` no existe: ningún correo sale hacia ahí. */
export const correoBorrado = (id: string) => `borrado+${id}@cuenta-borrada.invalid`;

/** Cien años: el `ban_duration` de Supabase es una duración, no «para siempre». */
const PARA_SIEMPRE = '876000h';

@Injectable()
export class CuentaRepositorio {
  private readonly logger = new Logger(CuentaRepositorio.name);

  constructor(private readonly supabase: SupabaseService) {}

  async tieneAutenticador(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.comoElServicio().auth.admin.mfa.listFactors({ userId });
    if (error) throw new BadRequestException('No pudimos confirmar tu cuenta.');
    return (data?.factors ?? []).some((f) => f.factor_type === 'totp' && f.status === 'verified');
  }

  /** `borrar_mi_cuenta()` (014) con el token de la persona. */
  async anonimizar(token: string): Promise<'hecho' | 'unico-dueno'> {
    const { error } = await this.supabase.comoElUsuario(token).rpc('borrar_mi_cuenta');
    if (!error) return 'hecho';
    if (/UNICO_DUENO/.test(error.message ?? '')) return 'unico-dueno';
    this.logger.warn(`No se pudo borrar la cuenta: ${error.code ?? 'sin código'}`);
    throw new BadRequestException({ message: 'No pudimos borrar tu cuenta.', code: 'DESCONOCIDO' });
  }

  /**
   * Lo que la base no puede hacer: es del esquema `auth` o de las tablas del kit
   * (`totp_backup_codes`, que escribe solo `service_role`, 005). Cada paso
   * filtra por el id que salió del token validado, nunca por uno del cuerpo.
   */
  async cerrarTodo(userId: string, token: string): Promise<void> {
    const admin = this.supabase.comoElServicio();
    const codigos = await admin.from('totp_backup_codes').delete().eq('user_id', userId);
    if (codigos.error) throw new BadRequestException('No pudimos borrar tus códigos de respaldo.');

    const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
    if (error) throw new BadRequestException('No pudimos borrar tus autenticadores.');
    for (const factor of data?.factors ?? []) {
      const borrado = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
      if (borrado.error) throw new BadRequestException('No pudimos borrar tus autenticadores.');
    }

    const usuario = await admin.auth.admin.updateUserById(userId, {
      email: correoBorrado(userId), email_confirm: true, user_metadata: {}, ban_duration: PARA_SIEMPRE,
    });
    if (usuario.error) throw new BadRequestException('No pudimos cerrar tu cuenta.');

    /* `signOut` recibe el JWT de la sesión (no el id): con `global`, cierra todas. */
    const salida = await admin.auth.admin.signOut(token, 'global');
    if (salida.error) this.logger.warn(`No se pudieron cerrar las sesiones: ${salida.error.status ?? 'sin estado'}`);
  }
}
