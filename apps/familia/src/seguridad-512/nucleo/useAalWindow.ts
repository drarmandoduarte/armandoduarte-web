import { useCallback, useEffect, useState } from 'react';
import { clave } from './nombres';

/**
 * KIT DE SEGURIDAD 512 · NÚCLEO (S4) — NO se edita en una app.
 *
 * Las claves de almacenamiento salían escritas a mano con el nombre de la app
 * (`cenit.aal2_verified_at`). Ahora salen de `clave()`, que las arma con el
 * `app` de `seguridad-512.config.ts`: el archivo queda neutro y en cada app las
 * claves siguen llevando su prefijo (nada se pisa si dos apps del kit comparten
 * origen en un entorno de prueba).
 */

const VERIFIED_KEY = clave('aal2_verified_at');
const ACTIVITY_KEY = clave('last_activity_at');
/** Marca (por pestaña) de que la sesión se cerró por inactividad → cartel en login. */
const INACTIVITY_LOGOUT_KEY = clave('inactivity_logout');
/**
 * Marca (por pestaña) de que la sesión se cerró al recuperar el 2FA con un
 * código de respaldo → cartel en login. Borrar un factor TOTP verificado cierra
 * las sesiones activas del usuario (Supabase), así que a veces el refresh de
 * sesión no sobrevive a la recuperación y hay que volver a entrar.
 */
const RECOVERY_LOGOUT_KEY = clave('recovery_logout');
/**
 * Huella de "acá hubo una sesión". Vive en `localStorage` (no por pestaña) y
 * NO la borra `clearAalWindow`: solo la borra una salida deliberada
 * (`marcarSalidaDeliberada`). Si aparece en la pantalla de entrada sin ninguna
 * otra explicación, la sesión se cayó sola y se lo decimos con honestidad.
 */
const SESION_VISTA_KEY = clave('sesion_vista');

const INACTIVITY_MS = 30 * 60 * 1000; // 30 min sin actividad → se cierra la sesión.
const ACTIVITY_THROTTLE_MS = 60_000;
const REEVALUATION_MS = 60_000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['click', 'keydown', 'pointermove', 'scroll'];

export interface UseAalWindowResult {
  /** true = pasaron 30 min sin actividad (o no hay marcador) → cerrar sesión. */
  expired: boolean;
  markVerified: () => void;
  clearWindow: () => void;
}

/**
 * ¿La ventana de inactividad venció? Vence a los 30 min sin actividad (o si no
 * hay marcador de verificación). El cruce de día calendario ya NO cuenta: cerrar
 * a un usuario activo a medianoche era molesto y la política central es la
 * inactividad. Cuando vence, `RequireAal2` CIERRA la sesión (no re-pide el TOTP).
 */
export function isAalWindowExpired(now: Date = new Date()): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const verifiedRaw = window.localStorage.getItem(VERIFIED_KEY);
    if (!verifiedRaw) return true;
    const verified = new Date(verifiedRaw);
    if (Number.isNaN(verified.getTime())) return true;

    const activityRaw = window.localStorage.getItem(ACTIVITY_KEY);
    const activity = activityRaw ? Number(activityRaw) : verified.getTime();
    if (!Number.isFinite(activity)) return true;
    if (now.getTime() - activity > INACTIVITY_MS) return true;

    return false;
  } catch {
    return true;
  }
}

export function markAalWindowVerified(): void {
  if (typeof window === 'undefined') return;
  try {
    const now = new Date();
    window.localStorage.setItem(VERIFIED_KEY, now.toISOString());
    window.localStorage.setItem(ACTIVITY_KEY, String(now.getTime()));
    // Desde acá sabemos que hubo una sesión de verdad en este aparato.
    window.localStorage.setItem(SESION_VISTA_KEY, '1');
  } catch {
    // localStorage no disponible: la ventana simplemente nunca se considera vigente.
  }
}

export function clearAalWindow(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(VERIFIED_KEY);
    window.localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // ignore
  }
}

/** Marca que la sesión se cerró por inactividad (para el cartel del login). */
export function markInactivityLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(INACTIVITY_LOGOUT_KEY, '1');
  } catch {
    // ignore
  }
}

/** Lee y limpia la marca de logout por inactividad (una sola vez, en el login). */
export function consumeInactivityLogout(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const flagged = window.sessionStorage.getItem(INACTIVITY_LOGOUT_KEY) === '1';
    if (flagged) window.sessionStorage.removeItem(INACTIVITY_LOGOUT_KEY);
    return flagged;
  } catch {
    return false;
  }
}

/** Marca que la sesión se cerró al recuperar el 2FA (para el cartel del login). */
export function markRecoveryLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(RECOVERY_LOGOUT_KEY, '1');
  } catch {
    // ignore
  }
}

/** Lee y limpia la marca de logout por recuperación (una sola vez, en el login). */
export function consumeRecoveryLogout(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const flagged = window.sessionStorage.getItem(RECOVERY_LOGOUT_KEY) === '1';
    if (flagged) window.sessionStorage.removeItem(RECOVERY_LOGOUT_KEY);
    return flagged;
  } catch {
    return false;
  }
}

/**
 * La persona se fue a propósito (botón de cerrar sesión, inactividad,
 * recuperación). Borra la huella para que la pantalla de entrada NO diga que la
 * sesión se cayó sola: se cerró porque alguien la cerró.
 */
export function marcarSalidaDeliberada(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESION_VISTA_KEY);
  } catch {
    // ignore
  }
}

/**
 * ¿La sesión desapareció sin que nadie la cerrara? Es el caso del iPhone con la
 * app instalada: si pasan siete días sin abrirla, el sistema le borra el
 * almacenamiento y la sesión se evapora. También pasa cuando el refresh token
 * vence o lo revocan. No es un error y no se muestra como error.
 *
 * Límite honesto: esto se detecta porque queda la huella `sesion_vista`. Si el
 * sistema borró TODO el almacenamiento, la huella se fue con el resto y no hay
 * nada que leer — ahí la pantalla de entrada se ve normal, sin cartel. Cubre los
 * casos en que el almacenamiento sobrevivió y la sesión no, que son la mayoría.
 */
export function consumeSesionDesaparecida(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const huella = window.localStorage.getItem(SESION_VISTA_KEY) === '1';
    if (huella) window.localStorage.removeItem(SESION_VISTA_KEY);
    return huella;
  } catch {
    return false;
  }
}

/**
 * Ventana de inactividad client-side. `expired` es true cuando pasaron 30 min sin
 * actividad (o no hay marcador). Se sincroniza entre pestañas por `storage`.
 * `markVerified` lo llaman `TotpChallenge`/`ForceEnroll` tras un verify exitoso.
 * El tracking de actividad (click/keydown/pointermove/scroll) refresca el reloj.
 *
 * Celular: el temporizador de 60 s NO corre con la pantalla apagada ni con la
 * app en segundo plano. Por eso el cálculo nunca se apoya en el temporizador —
 * se apoya en la HORA GUARDADA— y además se re-evalúa al volver a primer plano
 * (`visibilitychange`) y al volver del caché de páginas de iOS (`pageshow`). Sin
 * eso, alguien podía dejar el teléfono una hora bloqueado y encontrar la app
 * abierta al volver, con la sesión que debería haberse cerrado.
 */
export function useAalWindow(): UseAalWindowResult {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const markVerified = useCallback(() => {
    markAalWindowVerified();
    rerender();
  }, [rerender]);

  const clearWindow = useCallback(() => {
    clearAalWindow();
    rerender();
  }, [rerender]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastWrite = 0;
    function refreshActivity() {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_THROTTLE_MS) return;
      lastWrite = now;
      try {
        window.localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        // ignore
      }
    }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, refreshActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, refreshActivity));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onStorage(e: StorageEvent) {
      if (e.key === VERIFIED_KEY || e.key === ACTIVITY_KEY) rerender();
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [rerender]);

  // Volver a primer plano: se recalcula CONTRA LA HORA GUARDADA, no contra el
  // temporizador (que estuvo dormido). `visibilitychange` cubre desbloquear el
  // teléfono o cambiar de app; `pageshow` cubre el caché de páginas de iOS, que
  // restaura la pantalla tal cual estaba sin volver a montar nada.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function alVolver() {
      if (typeof document === 'undefined' || document.visibilityState !== 'hidden') rerender();
    }
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('pageshow', alVolver);
    window.addEventListener('focus', alVolver);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('pageshow', alVolver);
      window.removeEventListener('focus', alVolver);
    };
  }, [rerender]);

  useEffect(() => {
    const id = setInterval(rerender, REEVALUATION_MS);
    return () => clearInterval(id);
  }, [rerender]);

  return { expired: isAalWindowExpired(), markVerified, clearWindow };
}
