import React from 'react';
import { Antetitulo } from '../acceso/Antetitulo.jsx';

/* Un bloque de una sección de Ajustes (guion de Ajustes §2): antetítulo
   `§ · PALABRA` y debajo las filas, separadas por una línea fina — no por
   tarjetas. Un bloque, una cosa. Las líneas entre filas las pone el bloque, así
   ninguna fila tiene que saber si es la primera o la última. */
export function Bloque({ antetitulo, children, style, ...rest }) {
  const filas = React.Children.toArray(children).filter(Boolean);
  return React.createElement('section', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', ...style }, ...rest },
    antetitulo ? React.createElement(Antetitulo, { texto: antetitulo }) : null,
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
      filas.map((fila, i) => React.createElement('div', {
        key: fila.key ?? i,
        style: { borderTop: i === 0 ? 'none' : 'var(--border-w) solid var(--border)' },
      }, fila))));
}
