import { ConflictException, Controller, ForbiddenException, Logger, Post, Req } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../acceso/nucleo/usuario-del-pedido';
import { esEquipo } from '../acceso/nucleo/roles';
import { PasoReciente, PASO_RECIENTE_CODE } from '../acceso/nucleo/paso-reciente.decorator';
import { CuentaRepositorio } from './cuenta.repositorio';
import { codigoReciente } from './codigo-reciente';

/** Los minutos que vale el código para borrar la cuenta: los mismos que generar códigos de respaldo. */
export const MINUTOS_PARA_BORRAR = 5;

/**
 * `POST /api/cuenta/borrar` — borrar la cuenta (orden #37, PR 3, §6).
 *
 * El molde no trae el servidor (fase-2 §13): esto es de Mi espacio. La pantalla
 * es la zona peligrosa del molde (Privacidad y datos): la palabra y el código,
 * obligatorios.
 *
 * ── El código, y por qué no alcanza con `@PasoReciente` ─────────────────
 * Para el **equipo**, `@PasoReciente(5)` lo resuelve el guard del núcleo: aal2 y
 * un código del autenticador de hace cinco minutos como mucho. Pero el guard
 * **deja pasar a los clientes antes de mirar nada** (S0: el segundo paso no se
 * le impone a un cliente), así que para ellos el decorador no protege nada. Lo
 * mira esta ruta, con la misma vara:
 *   · un cliente **con** autenticador: un código del autenticador de hace 5 min;
 *   · un cliente **sin** autenticador: el código que le llegó al correo, de hace
 *     5 min (el `amr` de la sesión dice `otp` con su hora).
 * Sin eso, `403 PASO_RECIENTE_REQUERIDO`, como el kit.
 *
 * ── Qué hace ────────────────────────────────────────────────────────────
 * 1. `borrar_mi_cuenta()` (014), con el token de la persona: anonimiza la ficha,
 *    conserva inscripciones y libro, la saca del equipo si estaba. Un dueño que
 *    es el único dueño activo recibe `409 UNICO_DUENO`.
 * 2. Con `service_role`, lo que es del esquema `auth` o de las tablas del kit:
 *    sus códigos de respaldo, sus autenticadores, el correo de `auth.users`
 *    (al mismo `borrado+<id>@…`, así nadie entra con el viejo y puede volver a
 *    crearse una cuenta nueva con él) y todas sus sesiones.
 * Si el paso 2 falla a medias, el 1 ya está hecho —la ficha no tiene datos— y se
 * anota en el log para terminarlo a mano; la persona recibe un error y puede
 * reintentar (`borrar_mi_cuenta()` es idempotente).
 */
@Controller('cuenta')
export class CuentaController {
  private readonly logger = new Logger(CuentaController.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly cuentas: CuentaRepositorio,
  ) {}

  @Post('borrar')
  @PasoReciente(MINUTOS_PARA_BORRAR)
  async borrar(@Req() pedido: unknown) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const rol = await this.supabase.rolDe(token, usuario.id);

    if (!esEquipo(rol)) {
      const conAutenticador = await this.cuentas.tieneAutenticador(usuario.id);
      if (!codigoReciente(token, conAutenticador ? 'autenticador' : 'correo', MINUTOS_PARA_BORRAR)) {
        throw new ForbiddenException({ message: 'Hace falta un código reciente.', code: PASO_RECIENTE_CODE, minutos: MINUTOS_PARA_BORRAR });
      }
    }

    const resultado = await this.cuentas.anonimizar(token);
    if (resultado === 'unico-dueno') {
      throw new ConflictException({ message: 'Eres el único dueño: suma a otra persona como dueña antes de borrar tu cuenta.', code: 'UNICO_DUENO' });
    }

    try {
      await this.cuentas.cerrarTodo(usuario.id, token);
    } catch (fallo) {
      this.logger.error(`La ficha quedó anonimizada pero no se pudo cerrar todo en auth: ${fallo instanceof Error ? fallo.message : 'sin detalle'}`);
      throw fallo;
    }
    return { ok: true };
  }
}
