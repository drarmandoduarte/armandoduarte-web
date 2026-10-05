import React from 'react';

/* La línea con un círculo en el medio que separa Google del correo (guion P1).
   Sin texto («o»): la captura de referencia dibuja un círculo, y un círculo no
   hay que traducirlo. */
export function Separador({ style, ...rest }) {
  const linea = { flex: 1, height: 0, borderTop: 'var(--border-w) solid var(--border)' };
  return React.createElement('div', {
    role: 'separator',
    style: { display: 'flex', alignItems: 'center', gap: 'var(--space-16)', width: '100%', ...style },
    ...rest,
  },
  React.createElement('span', { style: linea }),
  React.createElement('span', { 'aria-hidden': 'true', style: { width: 10, height: 10, borderRadius: 'var(--radius-pill)', border: 'var(--border-w) solid var(--text-3)' } }),
  React.createElement('span', { style: linea }));
}
