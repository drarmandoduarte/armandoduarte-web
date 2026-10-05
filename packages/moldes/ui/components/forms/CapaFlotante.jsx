import React from 'react';
import { createPortal } from 'react-dom';
import { MARGEN, ubicarPanel } from './flotar.js';

/* Una capa que flota colgada de un campo, fuera de la caja que scrollea.

   ── Por qué existe como pieza ──────────────────────────────────────────────
   Es el mecanismo que el `Selector` estrenó cuando se resolvió el freno de la
   el calendario de campo: un `Dialog` del kit recorta lo que se le sale —`overflow:
   hidden` en la caja, `overflowY: auto` en el cuerpo—, así que una capa
   `position: absolute` abierta cerca del pie queda ATRAPADA adentro en vez de
   flotar sobre el diálogo. La cura es un portal a `document.body` con
   `position: fixed`, y lo que eso cuesta es que la capa deja de saber dónde
   está: hay que medirla contra el campo y volver a medirla cuando el campo se
   mueve.

   El calendario tiene el mismo problema y la misma cura —vive en dieciséis
   pantallas, y ocho de ellas son diálogos—, así que el mecanismo se nombra una
   vez en vez de copiarse. **`Selector` todavía tiene su copia en línea**: su PR
   estaba en revisión cuando esto se escribió y reescribirlo desde otra orden
   sería tocar lo que dirección está mirando. Queda anotado: unificarlo es un PR
   de una línea larga y ninguna decisión nueva.

   ── Lo que esta pieza NO decide ────────────────────────────────────────────
   Ni qué se dibuja adentro ni cuándo se abre o se cierra. Solo dónde va la
   caja, cuánto puede medir y por encima de qué. Cerrar al hacer clic afuera es
   de quien la abre, porque «afuera» incluye su propio disparador y eso solo lo
   sabe él. */

/* La escalera de capas de la casa, que no tiene tokens y por eso se escribe:
   40 es lo que flota anclado a su campo, 50 el tooltip, 60 el velo del diálogo.
   Una capa portada tiene que quedar POR ENCIMA del velo: ya no es hija del
   diálogo, así que con 40 se dibujaría debajo de la cortina. */
export const CAPA_FLOTANTE = 70;

/* En el servidor no hay medidas que tomar, y `useLayoutEffect` avisa por
   consola si se lo llama ahí. Los guardianes de esta casa dibujan con
   `react-dom/server`, así que la advertencia sería de todos los días. */
const efectoDeMedida = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export function CapaFlotante({ abierta, ancla, alto, ancho, children, style, ...rest }) {
  /* `null` mientras no se midió: la capa no se dibuja sin medida, porque
     dibujarla en 0,0 y corregirla después es un salto que se ve. */
  const [ubicacion, setUbicacion] = React.useState(null);

  const medir = React.useCallback(() => {
    const nodo = ancla && ancla.current;
    if (!nodo || typeof window === 'undefined') return;
    const r = nodo.getBoundingClientRect();
    const donde = ubicarPanel({
      arribaDelCampo: r.top, abajoDelCampo: r.bottom, altoDeVentana: window.innerHeight,
      ...(alto ? { alto } : {}),
    });
    setUbicacion({
      ...donde, izquierda: r.left, ancho: r.width,
      arriba: r.top, abajo: r.bottom, altoDeVentana: window.innerHeight,
    });
  }, [ancla, alto]);

  /* Mientras está abierta hay que volver a medir, y el `scroll` va en CAPTURA a
     propósito: lo que mueve el campo dentro de un diálogo es el scroll del
     cuerpo del diálogo, que es un `div` y no la ventana — un `scroll` sin
     captura en `window` no se entera de ese. */
  efectoDeMedida(() => {
    if (!abierta) { setUbicacion(null); return undefined; }
    medir();
    window.addEventListener('scroll', medir, true);
    window.addEventListener('resize', medir);
    return () => {
      window.removeEventListener('scroll', medir, true);
      window.removeEventListener('resize', medir);
    };
  }, [abierta, medir]);

  if (!abierta || !ubicacion || typeof document === 'undefined') return null;

  /* Con `ancho`, la capa mide lo suyo y no lo del campo —un calendario necesita
     siete columnas aunque el campo sea angosto— y ahí aparece el desborde
     LATERAL, que `ubicarPanel` no mira porque es una cuenta de otra clase: si
     el campo está contra el borde derecho, una capa más ancha que él se sale de
     la ventana. Se resuelve donde se puede resolver sin medir dos veces, que es
     en CSS: `min` la trae de vuelta contra el borde y `max` no la deja pasarse
     del izquierdo. Sin `ancho`, la capa se estira con su contenido y el ancla
     es solo el borde izquierdo. */
  const izquierda = ancho
    ? `max(${MARGEN}px, min(${ubicacion.izquierda}px, calc(100vw - ${ancho + MARGEN}px)))`
    : `${ubicacion.izquierda}px`;

  /* El aire contra el campo sigue siendo `--space-2`: se pega dentro de un
     `calc`, porque el token no se reemplaza por un número solo por haber pasado
     a píxeles de ventana. */
  return createPortal(React.createElement('div', {
    style: {
      position: 'fixed',
      left: izquierda,
      width: ancho ? `${ancho}px` : undefined,
      top: ubicacion.hacia === 'abajo'
        ? `calc(${ubicacion.abajo}px + var(--space-2))` : undefined,
      bottom: ubicacion.hacia === 'arriba'
        ? `calc(${ubicacion.altoDeVentana - ubicacion.arriba}px + var(--space-2))` : undefined,
      zIndex: CAPA_FLOTANTE, maxHeight: `${ubicacion.alto}px`, overflowY: 'auto',
      background: 'var(--floating-surface)',
      border: 'var(--border-w) solid var(--floating-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-pop)',
      ...style,
    },
    ...rest,
  }, children), document.body);
}
