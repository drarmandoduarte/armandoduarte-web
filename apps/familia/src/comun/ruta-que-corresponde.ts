import { RUTAS } from '../rutas';
import type { DecisionDePantalla } from './decision-de-pantalla';

/**
 * En qué URL tiene que estar la persona — orden Códice #18, F.
 *
 * ── El caso, de la quinta F.4 (30/9/2026) ───────────────────────────────
 * Después de entrar, Mi espacio se veía pero la barra seguía diciendo
 * `/entrar`. Un «atrás» del navegador, un recargar o un enlace copiado llevaban
 * a una dirección que no decía dónde estaba la persona. `/mi-espacio` ya
 * existía en `rutas.ts` y nadie navegaba hacia ahí.
 *
 * ── La regla, entera ────────────────────────────────────────────────────
 *   · sin sesión → `/entrar`, venga de donde venga;
 *   · con sesión, con rol y con la decisión en `pasar` → `/mi-espacio`
 *     (así `/entrar` con sesión redirige solo);
 *   · en cualquier estado intermedio —cargando, esperando a `/api/yo`, el
 *     reto, enrolar, un error— **no se toca la URL**: no son lugares, son
 *     estados de la misma sesión (lo explica `App.tsx`), y moverla ahí sería
 *     inventarles una dirección.
 *
 * Devuelve la ruta a la que hay que ir, o `null` si la actual ya está bien.
 */
export function rutaQueCorresponde(estado: {
  cargando: boolean;
  haySesion: boolean;
  hayYo: boolean;
  decision: DecisionDePantalla | null;
  rutaActual: string;
}): string | null {
  if (estado.cargando) return null;
  const destino = !estado.haySesion
    ? RUTAS.entrar
    : estado.hayYo && estado.decision === 'pasar'
      ? RUTAS.miEspacio
      : null;
  return destino && destino !== estado.rutaActual ? destino : null;
}
