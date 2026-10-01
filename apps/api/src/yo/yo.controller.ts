import { Controller, Get, Req } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../seguridad-512/nucleo/usuario-del-pedido';
import { esEquipo } from '../seguridad-512/nucleo/roles';

/**
 * `GET /api/yo` — quién es el que está del otro lado.
 *
 * Es la primera llamada que hace la pantalla después de entrar, y de su
 * respuesta salen las dos decisiones del flujo: si hay que mandar a enrolar y
 * qué mostrar en Mi espacio.
 *
 * ── Por qué NO lleva `@SinSegundoPaso` ──────────────────────────────────
 * Porque el guard global ya hace exactamente lo que hace falta, y hacerlo de
 * nuevo acá sería peor: un **cliente** llega con `aal1` y el guard lo deja
 * pasar solo —lee el rol del pedido y `esEquipo('cliente')` es falso—, mientras
 * que un **equipo** sin `aal2` recibe `AAL2_REQUIRED` y la pantalla lo manda a
 * enrolar o al reto. Eximir esta ruta le daría a una cuenta de equipo una
 * respuesta completa antes del segundo paso.
 *
 * Para que eso funcione, el rol tiene que estar resuelto **antes** de que corra
 * el guard: lo hace `RolMiddleware`, que deja `request.profile.role` donde el
 * núcleo lo busca.
 */
@Controller('yo')
export class YoController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async yo(@Req() pedido: unknown) {
    const token = tokenDelPedido(pedido);
    /* El mismo helper del núcleo: si el guard ya validó este token en este
       pedido, acá no hay segundo viaje de red. */
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const rol = await this.supabase.rolDe(token, usuario.id);
    const persona = await this.supabase.personaDe(token, usuario.id);

    return {
      persona: persona
        ? {
            id: persona.id,
            nombre: persona.nombre,
            apellido: persona.apellido,
            whatsapp: persona.whatsapp,
            pais: persona.pais,
            /* #24 B: la fecha de un taller se escribe en la zona de la
               edición y, si la persona vive en otra, también en la suya (D15). */
            zona_horaria: persona.zona_horaria,
          }
        : null,
      rol,
      tipo: esEquipo(rol) ? ('equipo' as const) : ('cliente' as const),
    };
  }
}
