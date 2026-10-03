import { rutaInternaSegura, slugDeMeAnoto } from '@codice/core';
import { LUGARES_CON_SESION, RUTAS } from '../rutas';
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
 * ── Y desde la #24 B, a dónde quería ir (`?ir=`) ─────────────────────────
 *   · sin sesión en `/me-anoto/<slug>` → `/entrar?ir=/me-anoto/<slug>`: quien
 *     llega desde «Reservar mi lugar» no pierde el taller por tener que entrar;
 *   · con sesión y `pasar`, si hay un destino guardado (el `?ir=` de `/entrar`,
 *     que sobrevive al ida y vuelta de Google) → ahí, y no a `/mi-espacio`.
 *     Solo si `rutaInternaSegura()` lo acepta: cualquier otra cosa se ignora y
 *     se sigue como siempre. Y nunca `/entrar`, que con sesión sería un rulo;
 *   · `/me-anoto/<slug>` con sesión es un lugar: ahí se queda, como `/equipo`.
 *
 * ── Y desde la #29, la barra lateral y la primera entrada ───────────────
 *   · `/talleres`, `/mis-talleres` y `/mis-datos` son lugares, como
 *     `/mi-espacio`;
 *   · si a la ficha le falta nombre, apellido o WhatsApp (`faltanDatos`,
 *     que decide `necesitaEmpezar()` de `core`), **primero `/empezar`**, antes
 *     que cualquier otra ruta y antes que el destino guardado — que no se usa
 *     ni se olvida: espera ahí y es adonde se va al terminar;
 *   · con los datos completos, `/empezar` no es un lugar: va a Inicio (o al
 *     destino guardado, si hay).
 *
 * ── Y desde la #34, Ajustes ─────────────────────────────────────────────
 *   · las secciones de `/ajustes/*` son lugares; `/ajustes` a secas va a
 *     Perfil, como «Tus preferencias» de Bitácora;
 *   · `/ajustes/seguridad` es del equipo, como `/equipo`: un cliente va a Inicio;
 *   · `/mis-datos` ya no existe: va a `/ajustes/perfil` (en Vercel es un 308;
 *     esto cubre el «atrás» y los enlaces que navegan sin recargar).
 *
 * ── Y desde la #35, las direcciones del guion v1 del Kit 512 ─────────────
 * Las pantallas de acceso siguen siendo **estados** de la sesión, pero el guion
 * les da dirección (§4), así que la URL ahora **acompaña** a la decisión del
 * núcleo —nunca al revés—:
 *   · sin sesión → `/login` (P1); `/login/codigo` (P2) es suya también;
 *     `/entrar` de antes va a `/login` con su `?ir=`;
 *   · `reto` → `/auth/2fa` (P3), y desde ahí `/auth/2fa/recuperar` (P6) y
 *     `/auth/2fa/reseteo` (P6b) son suyas; cualquier otra → P3;
 *   · `enrolar` → `/auth/2fa/activar` (P4);
 *   · los diez códigos en pantalla → `/auth/2fa/respaldo` (P5), antes que todo;
 *   · con `pasar`, ninguna de ésas es un lugar: a Mi espacio (o al destino).
 * Escribir `/auth/2fa` a mano con la sesión en `pasar` no muestra nada: va a
 * Inicio. Y escribirlo sin sesión va a `/login`.
 *
 * Devuelve la ruta a la que hay que ir, o `null` si la actual ya está bien.
 */
export function rutaQueCorresponde(estado: {
  cargando: boolean;
  haySesion: boolean;
  hayYo: boolean;
  decision: DecisionDePantalla | null;
  rutaActual: string;
  /** Si quien entró es del equipo. Sin `yo`, falso. */
  esEquipo?: boolean;
  /** El `?ir=` que se guardó al llegar a `/entrar` (#24 B). Se vuelve a validar acá. */
  destinoGuardado?: string | null;
  /** #29 C: a la ficha le falta nombre, apellido o WhatsApp (`necesitaEmpezar()`). */
  faltanDatos?: boolean;
  /** #35: los diez códigos de respaldo están en pantalla (P5). */
  mostrandoCodigos?: boolean;
  /** #35: el `?…` de la URL actual, para llevar el `?ir=` de `/entrar` a `/login`. */
  busqueda?: string;
}): string | null {
  if (estado.cargando) return null;
  const enMeAnoto = slugDeMeAnoto(estado.rutaActual) !== null;
  const ir = (destino: string) => (destino === estado.rutaActual ? null : destino);

  if (!estado.haySesion) {
    if (enMeAnoto) return `${RUTAS.login}?ir=${encodeURIComponent(estado.rutaActual)}`;
    if (estado.rutaActual === RUTAS.entrar) return `${RUTAS.login}${estado.busqueda ?? ''}`;
    if (estado.rutaActual === RUTAS.login || estado.rutaActual === RUTAS.loginCodigo) return null;
    return RUTAS.login;
  }
  /* P5 antes que nada: se ven una sola vez. */
  if (estado.mostrandoCodigos) return ir(RUTAS.respaldo);
  if (estado.decision === 'reto') {
    return ([RUTAS.reto, RUTAS.recuperar, RUTAS.reseteo] as string[]).includes(estado.rutaActual) ? null : RUTAS.reto;
  }
  if (estado.decision === 'enrolar') return ir(RUTAS.activar);
  if (!estado.hayYo || estado.decision !== 'pasar') return null;

  /* #29 C: antes que nada, completar los datos. El destino guardado se queda
     esperando (lo cuida `App.tsx`, que no lo olvida mientras falten). */
  if (estado.faltanDatos === true) {
    return estado.rutaActual === RUTAS.empezar ? null : RUTAS.empezar;
  }

  const guardado = rutaInternaSegura(estado.destinoGuardado);
  const caminoGuardado = guardado?.split(/[?#]/)[0] ?? null;
  if (guardado && caminoGuardado !== RUTAS.entrar && caminoGuardado !== RUTAS.login) {
    return caminoGuardado === estado.rutaActual ? null : guardado;
  }

  /* `/equipo` es un lugar para el equipo (#24 A): ahí se queda. A un cliente
     que escribe `/equipo` se lo lleva a Mi espacio, sin error. Y
     `/me-anoto/<slug>` es un lugar para cualquiera con sesión (#24 B). */
  if (enMeAnoto) return null;
  if (LUGARES_CON_SESION.includes(estado.rutaActual)) return null;
  if (estado.rutaActual === RUTAS.ajustes || estado.rutaActual === RUTAS.misDatos) return RUTAS.ajustesPerfil;
  const soloEquipo = estado.rutaActual === RUTAS.equipo || estado.rutaActual === RUTAS.ajustesSeguridad;
  const sePuedeQuedar = soloEquipo && estado.esEquipo === true;
  const destino = sePuedeQuedar ? estado.rutaActual : RUTAS.miEspacio;
  return destino !== estado.rutaActual ? destino : null;
}
