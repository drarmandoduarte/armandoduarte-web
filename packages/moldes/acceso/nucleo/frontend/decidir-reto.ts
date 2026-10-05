import { esEquipo } from './roles';

/**
 * KIT DE ACCESO · NÚCLEO (S2-S4) — NO se edita en una app.
 *
 * LA decisión del gate, sola y sin React: dada una sesión, ¿qué corresponde
 * mostrar? Estaba enredada dentro del componente, que además hace efectos,
 * llamadas y pintura. Separada es una función pura: se testea con una tabla y
 * se copia igual a las otras apps.
 */

export interface EstadoDeLaSesion {
  /** Nivel que la sesión TIENE ahora (`aal1` recién logueada, `aal2` verificada). */
  nivelActual: 'aal1' | 'aal2';
  /** Nivel al que la sesión PUEDE llegar. `aal1` = la persona no tiene factor. */
  nivelPosible: 'aal1' | 'aal2';
  /** Rol del perfil, para saber si es una cuenta de equipo (S0). */
  rol?: string | null;
  /** ¿Venció la ventana de inactividad (30 min)? */
  ventanaVencida: boolean;
}

export type Decision =
  /** No hay factor: enrolamiento obligatorio, sin salida más que cerrar sesión. */
  | 'enrolar'
  /** Hay factor pero la sesión está en aal1: pedir el código del autenticador. */
  | 'reto'
  /** Ventana vencida: se CIERRA la sesión (no se re-pide el código). */
  | 'cerrar-sesion'
  /** Todo en orden: pasa. */
  | 'pasar';

/**
 * Orden de las reglas, y por qué ese orden:
 *  1. Cuenta que NO es de equipo (S0) → pasa. El segundo paso obligatorio es
 *     para quien ve datos de otras personas. Falla cerrado: un rol sin
 *     clasificar cuenta como equipo.
 *  2. Sin factor → enrolar. Va antes que la inactividad: de nada sirve cerrarle
 *     la sesión a alguien que todavía no configuró nada.
 *  3. Sesión en aal1 → reto. También antes que la inactividad, por lo mismo: la
 *     ventana ni siquiera empezó a correr.
 *  4. Ventana vencida → cerrar sesión.
 *  5. Si no, pasa.
 */
export function decidirReto(estado: EstadoDeLaSesion): Decision {
  if (!esEquipo(estado.rol)) return 'pasar';
  if (estado.nivelPosible === 'aal1') return 'enrolar';
  if (estado.nivelActual !== 'aal2') return 'reto';
  if (estado.ventanaVencida) return 'cerrar-sesion';
  return 'pasar';
}
