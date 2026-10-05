import React from 'react';

/* La barra de progreso del molde (Uso de IA, almacenamiento): riel suave, relleno
   del acento, y una marca opcional —el aviso al 80 %— con su rótulo encima.
   `valor` va de 0 a 1; lo que se pase de 1 se dibuja lleno (la barra no se
   sale de su caja). Es `role="progressbar"` con su valor, así un lector de
   pantalla la lee como número y no como dibujo. */
export function Barra({ valor = 0, marca, etiquetaMarca, etiqueta, alto = 10, tono = 'acento', style, ...rest }) {
  const v = Math.max(0, Math.min(1, Number(valor) || 0));
  const relleno = tono === 'peligro' ? 'var(--danger)' : tono === 'aviso' ? 'var(--warning)' : 'var(--primary)';
  return React.createElement('div', {
    role: 'progressbar', 'aria-label': etiqueta, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(v * 100),
    style: {
      position: 'relative', height: alto, borderRadius: 'var(--radius-pill)',
      background: 'color-mix(in srgb, var(--text) 12%, var(--surface))', marginTop: etiquetaMarca ? 'var(--space-10)' : 0,
      ...style,
    },
    ...rest,
  },
  React.createElement('div', { style: { height: '100%', width: (v * 100) + '%', borderRadius: 'var(--radius-pill)', background: relleno, transition: 'width var(--dur-slow) var(--ease-standard)' } }),
  typeof marca === 'number' ? React.createElement('div', {
    'aria-hidden': true,
    style: { position: 'absolute', top: -6, bottom: -6, left: (marca * 100) + '%', width: 1, background: 'var(--text-3)', opacity: 0.6 },
  }, etiquetaMarca ? React.createElement('span', {
    style: {
      position: 'absolute', bottom: '100%', left: 0, transform: 'translateX(-50%)', paddingBottom: 2,
      fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap',
    },
  }, etiquetaMarca) : null) : null);
}
