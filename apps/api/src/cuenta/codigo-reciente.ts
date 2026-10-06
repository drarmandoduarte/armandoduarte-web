import { readMfaTimestamp } from '../acceso/nucleo/aal2.guard';

/**
 * ¿Trae esta sesión un código de hace `minutos` como mucho?
 *
 *   · `autenticador`: el del autenticador (`totp`/`mfa` en el `amr`), con la
 *     misma lectura que el guard del núcleo (`readMfaTimestamp`) y además `aal2`;
 *   · `correo`: el código por correo (`otp` en el `amr`).
 *
 * Lee los claims de un token **que ya se verificó** (`usuarioDelPedido`): acá no
 * se valida la firma. A diferencia del guard, ante la duda dice que no: un
 * `amr` que no se puede leer no es un código reciente.
 */
export function codigoReciente(token: string, cual: 'autenticador' | 'correo', minutos: number, ahora: number = Date.now()): boolean {
  const payload = leer(token);
  if (!payload) return false;
  let hora: number | undefined;
  if (cual === 'autenticador') {
    if (payload.aal !== 'aal2') return false;
    hora = readMfaTimestamp(token);
  } else if (Array.isArray(payload.amr)) {
    for (const x of payload.amr as unknown[]) {
      const metodo = (x as { method?: unknown } | null)?.method;
      const momento = (x as { timestamp?: unknown } | null)?.timestamp;
      if (metodo === 'otp' && typeof momento === 'number' && (hora === undefined || momento > hora)) hora = momento;
    }
  }
  if (hora === undefined) return false;
  const edad = Math.floor(ahora / 1000) - hora;
  return edad >= 0 && edad <= minutos * 60;
}

function leer(token: string): { aal?: unknown; amr?: unknown } | null {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const b64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(b64 + '='.repeat((4 - (b64.length % 4)) % 4), 'base64').toString('utf8')) as { aal?: unknown; amr?: unknown };
  } catch {
    return null;
  }
}
