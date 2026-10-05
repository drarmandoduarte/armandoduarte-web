import React from 'react';

/* La cita del asistente (concepto del Asistente §7): un chip `[Rivera 1234]` que
   dice de qué registro sale lo que dijo, y lo abre. Monoespaciado y entre
   corchetes para que se lea como referencia y no como texto. `tipo` e `id`
   viajan al `onAbrir`: la app sabe a qué ruta lleva cada tipo; el chip no. */
export function Cita({ tipo, id, etiqueta, onAbrir, style, ...rest }) {
  const [encima, setEncima] = React.useState(false);
  return React.createElement('button', {
    type: 'button', 'data-tipo': tipo, 'data-id': id,
    onClick: () => onAbrir && onAbrir({ tipo, id }),
    onMouseEnter: () => setEncima(true), onMouseLeave: () => setEncima(false),
    style: {
      display: 'inline-flex', alignItems: 'center', padding: '1px var(--space-3)', margin: '0 1px',
      fontFamily: 'var(--font-mono)', fontSize: '0.85em', lineHeight: 'var(--leading-snug)',
      color: 'var(--primary-text)', background: encima ? 'var(--primary-soft-2)' : 'var(--primary-soft)',
      border: 'var(--border-w) solid var(--primary-linea)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
      verticalAlign: 'baseline', ...style,
    },
    ...rest,
  }, '[', etiqueta, ']');
}
