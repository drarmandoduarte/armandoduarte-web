import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Badge } from '../core/Badge.jsx';

/* La barra de abajo del modo celular.

   ── Por qué nace una pieza y no se estira el Sidebar ───────────────────────
   Porque no es el mismo riel puesto de costado: cambia el eje, el reparto del
   ancho (un quinto cada una, no el ancho del texto), la anatomía de la entrada
   (icono arriba y nombre abajo, no icono y nombre en línea) y el tamaño mínimo
   de la zona de toque, que en un riel no existe porque nadie toca un riel con
   el pulgar. Un `Sidebar` con un `orientacion="abajo"` habría sido un
   componente con dos dibujos adentro y ninguna línea compartida de verdad.

   Lo que **sí** se comparte es el gesto de la fila activa: el mismo acento con
   el que el riel marca la suya (`--primary-soft` de fondo y
   `--primary-soft-fg` de tinta). Ese par sale de `estiloFila` del Sidebar y
   está escrito aquí con los mismos dos tokens a propósito — si dirección cambia
   el acento de lo activo, se cambia el token y se mueven los dos.

   ── El alto, y por qué la cuenta está partida en dos ───────────────────────
   `ALTO` son los 56 px que se ven y se tocan. El área segura de abajo —la barra
   de gestos del iPhone— va como `paddingBottom` y no sumada al alto: así la
   zona tocable sigue midiendo 56 completos y lo que crece es el colchón de
   abajo, que es lo que `env(safe-area-inset-bottom)` significa. En un
   escritorio esa resta vale 0 y la barra mide exactamente 56.

   En modo celular el `body` deja de reservar ese hueco (ver `index.css`): lo
   reserva esta barra, que es quien está apoyada contra el borde. Reservarlo dos
   veces dejaba 34 px de nada debajo de la barra en un iPhone con notch. */

/** Los 56 px que se ven y se tocan. El área segura va aparte, como relleno. */
export const ALTO_BARRA_INFERIOR = 56;

function EntradaDeBarra({ item, active, onClick }) {
  return React.createElement('button', {
    type: 'button',
    onClick,
    'data-clave': item.id,
    'aria-current': active ? 'page' : undefined,
    style: {
      /* `flex: 1 1 0` con `minWidth: 0` es lo que reparte la pantalla en cinco
         partes iguales: sin el `minWidth`, una entrada con el nombre largo
         —«Tablero del día»— se lleva más ancho que sus cuatro hermanas y la
         quinta queda en un cuarto de la suya. */
      flex: '1 1 0', minWidth: 0,
      /* Los 56 enteros de alto. La zona de toque es el botón, no el icono:
         `44 × 44` es el piso de Apple y aquí sobra por los dos lados —a 390 px
         cada entrada mide 78 de ancho—. */
      height: ALTO_BARRA_INFERIOR,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 2,
      border: 'none', background: 'transparent', cursor: 'pointer',
      padding: '0 var(--space-2)',
      fontFamily: 'var(--font-ui)',
      color: active ? 'var(--primary-soft-fg)' : 'var(--text-2)',
      position: 'relative'
    }
  },
    React.createElement('span', {
      key: 'i',
      style: {
        /* La píldora del acento de lo activo, del tamaño del icono y no de la
           entrada entera: una entrada de 78 × 56 pintada del acento es un bloque,
           no una marca. Es el mismo par de tokens que el riel. */
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 24, borderRadius: 'var(--radius-pill)',
        background: active ? 'var(--primary-soft)' : 'transparent',
        transition: 'background var(--dur-fast) var(--ease-standard)'
      }
    }, React.createElement(Icon, { name: item.icon, size: 18 })),
    React.createElement('span', {
      key: 'n',
      style: {
        /* Una sola línea con elipsis. «Tablero del día» no entra en 78 px y se
           corta; es el mismo nombre que el riel, que es lo que la orden manda.
           Lo que mide y lo que se pierde está escrito en el informe. */
        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 'var(--text-xs)',
        lineHeight: 'var(--leading-tight)',
        fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)'
      }
    }, item.label),
    /* El contador del Centro de alertas no vive en esta barra —el Centro está
       en la hoja, no en las cinco— pero la pieza lo dibuja si se lo dan: es la
       misma promesa que `NavItem`, y una barra que no supiera contar sería una
       barra a la que habría que volver el día que una entrada lo necesite. */
    item.count != null && React.createElement('span', {
      key: 'c', style: { position: 'absolute', top: 2, right: 'calc(50% - 22px)', pointerEvents: 'none' }
    }, React.createElement(Badge, { count: item.count, tone: item.countTone || 'neutral' }))
  );
}

/**
 * La barra de abajo: cinco entradas, un quinto de la pantalla cada una.
 *
 * `items` llega armado por la app —con las etiquetas ya traducidas— por la
 * misma razón que el Sidebar: el design system no sabe de i18n.
 */
export function BarraInferior({ items = [], activeId, onNavigate, etiqueta, style, ...rest }) {
  return React.createElement('nav', {
    'aria-label': etiqueta,
    'data-barra-inferior': 'si',
    style: {
      flex: '0 0 auto',
      display: 'flex', alignItems: 'stretch',
      /* El área segura la reserva la barra, no el `body` — ver la cabecera. */
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'var(--sidebar-bg)',
      /* Contra el contenido sí hay línea, y aquí no es decorativa: el contenido
         scrollea por debajo y sin ella la última fila de una lista se lee como
         parte de la barra. El riel no la necesita porque nada pasa por detrás.

         Va como **sombra y no como borde**, y la razón es una medición: un
         `borderTop` de 1 px suma al alto de la caja y la barra medía 57 donde
         la orden dice 56. La sombra se pinta hacia afuera y no ocupa nada, así
         que los 56 son 56 y la línea sigue estando. */
      boxShadow: '0 calc(-1 * var(--border-w)) 0 var(--border)',
      ...style
    }, ...rest
  }, items.map((it) => React.createElement(EntradaDeBarra, {
    key: it.id, item: it, active: activeId === it.id, onClick: () => onNavigate && onNavigate(it.id)
  })));
}
