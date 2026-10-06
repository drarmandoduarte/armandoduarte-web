import { BadRequestException, Body, Controller, Get, Logger, Post, Req } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../acceso/nucleo/usuario-del-pedido';
import { esEquipo } from '../acceso/nucleo/roles';
import { PerfilDto } from './yo.dto';
import { RescateRepositorio } from '../rescate/rescate.repositorio';

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
  private readonly logger = new Logger(YoController.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly rescates: RescateRepositorio,
  ) {}

  @Get()
  async yo(@Req() pedido: unknown) {
    const token = tokenDelPedido(pedido);
    /* El mismo helper del núcleo: si el guard ya validó este token en este
       pedido, acá no hay segundo viaje de red. */
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const rol = await this.supabase.rolDe(token, usuario.id);
    const persona = await this.supabase.personaDe(token, usuario.id);
    /* #34 A.3: el rol de la barra dice el territorio («Equipo · México»). */
    const territorio = esEquipo(rol) ? await this.supabase.territorioDe(token, usuario.id) : null;
    /* #37 PR 2 · «Reseteo pendiente» de Cuenta y seguridad (fase-2 §8,
       `valores.reseteoPendiente`). La regla es `reseteoPendiente()` de
       `@codice/core`: uno abierto que todavía puede terminar en un autenticador
       nuevo (un pedido sin confirmar que ya venció, no). Si la lectura falla, no
       hay reseteo que mostrar y `/api/yo` sigue: no se traba la entrada. */
    const rescate = await this.rescates.abiertoComoLaPersona(token, usuario.id);
    const caducado = rescate !== null && !rescate.confirmado_el && new Date(rescate.vence_el).getTime() <= Date.now();
    const reseteoPendiente = rescate && !caducado
      ? { vence: new Date(rescate.vence_el).toISOString(), confirmado: rescate.confirmado_el !== null }
      : null;

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
            /* #27 D: el perfil, todo opcional. */
            ciudad: persona.ciudad,
            anio_nacimiento: persona.anio_nacimiento,
            nivel_educativo: persona.nivel_educativo,
            /* #34 B.3: Ajustes → Notificaciones. */
            avisos_por_correo: persona.avisos_por_correo,
          }
        : null,
      rol,
      territorio,
      tipo: esEquipo(rol) ? ('equipo' as const) : ('cliente' as const),
      reseteoPendiente,
    };
  }

  /**
   * `POST /api/yo` — guardar «Tus datos» (orden #27 D.2). La orden lo nombra
   * `PATCH /api/yo`; es `POST` porque `api()` de la pantalla habla `GET` y
   * `POST`, como el resto de esta API.
   *
   * Con el token de la persona: lo deja `personas_edito_la_mia` (001) y nada
   * más. Solo se tocan los campos que vinieron; `null` borra el dato.
   */
  @Post()
  async guardar(@Req() pedido: unknown, @Body() cuerpo: PerfilDto) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    if (typeof cuerpo.anio_nacimiento === 'number' && cuerpo.anio_nacimiento > new Date().getFullYear() - 14) {
      throw new BadRequestException({ message: 'El año no es válido.', code: 'NO_VALIDO' });
    }
    const cambios: Record<string, string | number | boolean | null> = {};
    for (const campo of ['nombre', 'apellido', 'whatsapp', 'pais', 'ciudad', 'anio_nacimiento', 'nivel_educativo'] as const) {
      const valor = cuerpo[campo];
      if (valor === undefined) continue;
      cambios[campo] = typeof valor === 'string' ? (valor.trim() === '' ? null : valor.trim()) : valor;
    }
    /* #34 B.3: sí o no, nunca nulo (la 012 es `not null`). */
    if (typeof cuerpo.avisos_por_correo === 'boolean') cambios.avisos_por_correo = cuerpo.avisos_por_correo;
    if (Object.keys(cambios).length > 0) {
      const { data, error } = await this.supabase.comoElUsuario(token)
        .from('personas').update(cambios).eq('id', usuario.id).select('id');
      if (error || (data ?? []).length === 0) {
        this.logger.warn(`No se pudo guardar el perfil: ${error?.code ?? 'sin filas'}`);
        throw new BadRequestException({ message: 'No pudimos guardar tus datos.', code: error?.code === '23514' ? 'NO_VALIDO' : 'DESCONOCIDO' });
      }
    }
    return { ok: true };
  }
}
