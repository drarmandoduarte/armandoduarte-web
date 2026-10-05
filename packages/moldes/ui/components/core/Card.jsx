import React from 'react';

/* ── Es una columna flexible, y su cuerpo es el tramo elástico ────
   Sin altura impuesta no se nota: una columna flexible cuyo cuerpo crece lo que
   quiere mide exactamente lo mismo que el bloque de siempre, y ninguna de las
   pantallas que ya la usan cambió un píxel.

   Se nota cuando quien la usa le impone un alto —la rejilla de Inicio le da
   240 px a cada celda—: ahí el cuerpo absorbe el sobrante, el PIE queda pegado
   abajo en vez de flotando a media tarjeta, y lo que no entra se recorta contra
   el `overflow: hidden` que esta pieza ya tenía. Es el mismo mecanismo que
   `CabeceraDeColumna` usa con su ayuda, y por la misma razón.

   Sin `minHeight: 0`, un cuerpo con contenido más alto que la tarjeta se niega a
   encogerse —el mínimo automático de un ítem flexible es su contenido— y
   empujaría el pie fuera de la tarjeta. */

export function Card({ title, subtitle, actions, footer, padding, tone = 'surface', children, style, ...rest }) {
  const bg = tone === 'sunken' ? 'var(--surface-sunken)' : tone === 'quiet' ? 'transparent' : 'var(--surface)';
  const pad = padding != null ? (typeof padding === 'number' ? padding + 'px' : padding) : 'var(--card-p)';
  return React.createElement('section', {
    style: {
      background: bg, border: 'var(--border-w) solid var(--card-border)',
      borderRadius: 'var(--radius-tarjeta)', color: 'var(--text)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      /* Tercer eslabón: dentro de una columna angosta, una tarjeta
         en `min-width: auto` reclama el ancho de su contenido y se sale. Con 0
         cede, y lo que cede adentro es el texto — que es el orden correcto. */
      minWidth: 0,
      ...style
    }, ...rest
  },
    (title || actions) && React.createElement('header', {
      key: 'h',
      style: {
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 'var(--space-6)', padding: pad, paddingBottom: subtitle ? 'var(--space-6)' : 'var(--space-5)'
      }
    },
      React.createElement('div', { key: 't' },
        title && React.createElement('h3', { key: 'a', style: { fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-normal)' } }, title),
        subtitle && React.createElement('p', { key: 'b', style: { marginTop: '4px', fontSize: 'var(--text-base)', color: 'var(--text-3)', lineHeight: 'var(--leading-normal)' } }, subtitle)
      ),
      actions && React.createElement('div', { key: 'x', style: { display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: '0 0 auto' } }, actions)
    ),
    React.createElement('div', {
      key: 'b',
      style: {
        flex: '1 1 auto', minHeight: 0,
        padding: pad, paddingTop: (title || actions) ? 0 : pad,
      /* Y el cuarto: el contenido de la tarjeta. La cadena se corta en el
         primer eslabón que falte. */
      minWidth: 0
      }
    }, children),
    footer && React.createElement('footer', {
      key: 'f',
      style: { borderTop: 'var(--border-w) solid var(--border)', padding: 'var(--space-6) ' + 'var(--space-12)', background: 'var(--surface-2)' }
    }, footer)
  );
}
