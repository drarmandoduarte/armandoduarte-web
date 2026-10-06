import { Controller, Post, Req } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../acceso/nucleo/usuario-del-pedido';

/**
 * Cerrar las otras sesiones.
 *
 * Sin `@SinSegundoPaso`: exige el segundo paso como todo lo demás, y está bien
 * que lo exija — es la acción de «me di cuenta de que dejé la sesión abierta en
 * otro lado», y quien la pide ya está adentro.
 *
 * Es el **único** lugar de la API que usa `service_role`, y el motivo es que no
 * hay otro: revocar sesiones es `auth.admin`, y `auth.admin` no existe con la
 * clave anónima. La llamada se hace sobre el `id` que salió del token validado,
 * nunca sobre uno que venga en el cuerpo del pedido.
 */
@Controller('sesiones')
export class SesionesController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post('cerrar-las-otras')
  async cerrarLasOtras(@Req() pedido: unknown) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    await this.supabase.cerrarOtrasSesiones(usuario.id);
    return { ok: true };
  }
}
