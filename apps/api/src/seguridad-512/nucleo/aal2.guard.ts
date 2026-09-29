import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SIN_SEGUNDO_PASO_KEY } from './sin-segundo-paso.decorator';
import { PASO_RECIENTE_CODE, PASO_RECIENTE_KEY } from './paso-reciente.decorator';
import { VERIFICADOR_DE_TOKEN, type VerificadorDeToken } from './verificador-de-token';
import { usuarioDelPedido } from './usuario-del-pedido';
import { esEquipo } from './roles';

/**
 * KIT DE SEGURIDAD 512 · NÚCLEO (S3) — NO se edita en una app.
 *
 * Una mejora acá se hace en el kit, sube la versión y se regeneran las huellas.
 * Lo específico de cada app entra por dos puertas y solo por esas dos: el
 * `VERIFICADOR_DE_TOKEN` (quién valida el token) y `seguridad-512.config.ts`
 * (cómo se llama la app y qué es cada rol).
 */

export const AAL2_REQUIRED_CODE = 'AAL2_REQUIRED';
export { PASO_RECIENTE_CODE };

/**
 * Antigüedad máxima (segundos) de la última verificación 2FA antes de re-pedir
 * el step-up. Backstop SERVER-SIDE: un token `aal2` robado NO vale para siempre
 * — a lo sumo esta ventana, porque el atacante no tiene el TOTP para
 * re-verificar. El re-challenge del cliente (30 min de inactividad) refresca el
 * `amr`, así que a un usuario activo casi nunca le salta. Config; default 12 h.
 */
const AAL2_MAX_AGE_SECONDS = Math.max(60, (Number(process.env.AAL2_MAX_AGE_MINUTES) || 720) * 60);

interface AalJwtPayload {
  aal?: unknown;
  amr?: unknown;
}

/**
 * Exige `aal === 'aal2'` (2FA verificado) Y que esa verificación sea RECIENTE
 * (no confiar solo en el marcador local del frontend).
 *
 * **Guard GLOBAL** (`APP_GUARD` en `app.module.ts`, Kit de Seguridad 512 · S3):
 * cubre TODAS las rutas por defecto — ya no depende de que quien escriba un
 * controlador nuevo se acuerde de ponerlo. La única salida es declarar la ruta
 * con `@SinSegundoPaso('razón')`, y esa lista se testea en
 * `aal2-cobertura.spec.ts`. Antes de esto, `team` (invitar / cambiar rol),
 * `integrations/tera` y `properties` quedaban solo con `SupabaseAuthGuard`: con
 * una contraseña robada y sin el celular se podía llamar la API directo.
 *
 * Seguridad: `aal`/`amr` se leen SOLO de un token cuya autenticidad ya verificó
 * el proveedor de identidad (`getUserFromToken` valida firma + expiración). Un
 * JWT forjado no pasa: primero se ancla al proveedor, recién después se confía
 * en sus claims.
 */
@Injectable()
export class Aal2Guard implements CanActivate {
  private readonly logger = new Logger(Aal2Guard.name);

  constructor(
    @Inject(VERIFICADOR_DE_TOKEN) private readonly verificador: VerificadorDeToken,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 0) Excepción declarada (`@SinSegundoPaso`): handler primero, después la
    // clase. La razón vacía NO exime — el decorador ya la rechaza, y acá va el
    // segundo freno por si alguien setea la metadata a mano.
    if (readExemptionReason(this.reflector, context) !== undefined) return true;

    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();

    // 0.b) S0 — el segundo paso es obligatorio para las cuentas de EQUIPO (las
    // que ven datos de otras personas). Si un guard anterior ya resolvió el
    // perfil y su rol está clasificado como `cliente`, esta ruta no le exige el
    // segundo paso. Falla CERRADO: sin perfil resuelto, o con un rol que nadie
    // clasificó, se sigue exigiendo. En Cenit los dos roles son equipo, así que
    // hoy esto nunca cambia nada — el camino queda hecho para un portal del
    // propietario, que sería una cuenta de cliente.
    const rol = leerRolDelPedido(request);
    if (rol !== undefined && !esEquipo(rol)) return true;

    const header = pickHeader(request.headers?.authorization);
    const token = header?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Falta el token de acceso.');
    }

    // 1) Autenticidad del token (firma + expiración) contra el proveedor.
    // `usuarioDelPedido` memoriza el resultado EN ESTE pedido para que el guard
    // de sesión de la app no lo vuelva a validar contra la red.
    await usuarioDelPedido(request, token, this.verificador);

    // 2) Recién ahora confiamos en los claims del mismo token verificado.
    const aal = readAalClaim(token);
    if (aal !== 'aal2') {
      this.logger.debug(`aal2-guard: rechazado con aal=${String(aal)}`);
      throw this.aal2Required();
    }

    // 3) Freshness server-side: la verificación 2FA (amr) tiene que ser reciente.
    // Fail-OPEN si no se puede leer el timestamp (formato inesperado del amr): no
    // trancamos a todos por un cambio del proveedor; solo rechazamos si SABEMOS
    // que está vencido. Así un token aal2 robado deja de servir tras la ventana.
    const verifiedAt = readMfaTimestamp(token);
    if (verifiedAt !== undefined) {
      const ageSeconds = Math.floor(Date.now() / 1000) - verifiedAt;
      if (ageSeconds > AAL2_MAX_AGE_SECONDS) {
        this.logger.debug(`aal2-guard: 2FA vencido (age=${ageSeconds}s) — re-challenge`);
        throw this.aal2Required();
      }
    }

    // 4) S6 — código RECIENTE para las acciones que de verdad duelen. Reutiliza
    // el `amr` que ya leímos arriba: ni un guard más, ni un parseo más. Acá NO
    // se falla-open: si la ruta pidió un código reciente y no se puede probar
    // que lo haya, se pide de nuevo. Una re-verificación de más no rompe nada;
    // un CSV de cierres que se va sin código, sí.
    const minutos = readPasoRecienteMinutos(this.reflector, context);
    if (minutos !== undefined) {
      const edad =
        verifiedAt === undefined ? undefined : Math.floor(Date.now() / 1000) - verifiedAt;
      if (edad === undefined || edad > minutos * 60) {
        this.logger.debug(`aal2-guard: paso reciente requerido (${minutos} min)`);
        throw this.pasoRecienteRequerido(minutos);
      }
    }

    return true;
  }

  private aal2Required(): ForbiddenException {
    return new ForbiddenException({
      message: 'Se requiere verificación en dos pasos para esto.',
      code: AAL2_REQUIRED_CODE,
    });
  }

  private pasoRecienteRequerido(minutos: number): ForbiddenException {
    return new ForbiddenException({
      message: 'Volvé a ingresar el código de tu autenticador para hacer esto.',
      code: PASO_RECIENTE_CODE,
      minutos,
    });
  }
}

/**
 * Minutos de frescura que pide la ruta con `@PasoReciente(n)` (handler primero,
 * después la clase), o `undefined` si no pide nada. Exportada para que el test
 * guardián recorra el inventario con la MISMA lógica que el guard.
 */
export function readPasoRecienteMinutos(
  reflector: Reflector,
  context: ExecutionContext,
): number | undefined {
  const targets = [
    typeof context.getHandler === 'function' ? context.getHandler() : undefined,
    typeof context.getClass === 'function' ? context.getClass() : undefined,
  ].filter((t): t is NonNullable<typeof t> => Boolean(t));
  if (targets.length === 0) return undefined;
  const raw = reflector.getAllAndOverride<unknown>(PASO_RECIENTE_KEY, targets);
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return undefined;
  return raw;
}

/**
 * Razón declarada con `@SinSegundoPaso` para esta ruta (handler o controlador),
 * o `undefined` si la ruta exige el segundo paso. Una razón en blanco se trata
 * como "sin excepción". Exportada para que el test guardián recorra el
 * inventario con la MISMA lógica que el guard, no con una copia.
 */
export function readExemptionReason(
  reflector: Reflector,
  context: ExecutionContext,
): string | undefined {
  // Contextos armados a mano en tests pueden no traer handler/clase: se filtran
  // en vez de reventar (un contexto sin ruta nunca es una excepción).
  const targets = [
    typeof context.getHandler === 'function' ? context.getHandler() : undefined,
    typeof context.getClass === 'function' ? context.getClass() : undefined,
  ].filter((t): t is NonNullable<typeof t> => Boolean(t));
  if (targets.length === 0) return undefined;
  const raw = reflector.getAllAndOverride<unknown>(SIN_SEGUNDO_PASO_KEY, targets);
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  return raw.trim();
}

/**
 * Rol del perfil que un guard anterior haya dejado en el pedido, si lo hay.
 * Lectura defensiva y sin tipos de la app: el núcleo no conoce el `Profile` de
 * nadie. `undefined` = todavía no se sabe → se exige el segundo paso.
 */
function leerRolDelPedido(request: unknown): string | undefined {
  if (typeof request !== 'object' || request === null) return undefined;
  const perfil = (request as { profile?: unknown }).profile;
  if (typeof perfil !== 'object' || perfil === null) return undefined;
  const rol = (perfil as { role?: unknown }).role;
  return typeof rol === 'string' ? rol : undefined;
}

function pickHeader(raw: string | string[] | undefined): string | undefined {
  if (!raw) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Lee el claim `aal` del payload de un JWT. DEBE llamarse solo sobre un token
 * cuya autenticidad ya se verificó. Robusto a tokens malformados.
 */
export function readAalClaim(token: string): string | undefined {
  const payload = decodePayload(token);
  return typeof payload?.aal === 'string' ? payload.aal : undefined;
}

/**
 * Timestamp (unix segundos) de la ÚLTIMA verificación 2FA según el `amr` del
 * JWT (`[{ method, timestamp }]`). Devuelve el máximo entre los métodos MFA
 * (totp/mfa). `undefined` si no hay ninguno o el formato no es el esperado —
 * el guard interpreta eso como "no sé", y falla-open en el chequeo de frescura.
 */
export function readMfaTimestamp(token: string): number | undefined {
  const payload = decodePayload(token);
  if (!payload || !Array.isArray(payload.amr)) return undefined;
  let latest: number | undefined;
  for (const entry of payload.amr as unknown[]) {
    if (!entry || typeof entry !== 'object') continue;
    const method = (entry as { method?: unknown }).method;
    const timestamp = (entry as { timestamp?: unknown }).timestamp;
    if (typeof method !== 'string' || typeof timestamp !== 'number') continue;
    if (!/totp|mfa/i.test(method)) continue;
    if (latest === undefined || timestamp > latest) latest = timestamp;
  }
  return latest;
}

/** Decodifica el payload de un JWT ya verificado. Robusto a tokens malformados. */
function decodePayload(token: string): AalJwtPayload | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as AalJwtPayload;
  } catch {
    return undefined;
  }
}
