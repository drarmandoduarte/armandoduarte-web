import React from 'react';

/* «Continuar con Google» (guion P1): ancho completo, borde del color del texto,
   la G y el texto en la tinta. La G va en una sola tinta (`currentColor`) y no
   en los cuatro colores de Google: el molde no trae colores propios, y la
   captura de referencia la muestra así. El texto llega por `children`. */

const G = 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z';

export function BotonGoogle({ children, disabled = false, type = 'button', style, ...rest }) {
  const [encima, setEncima] = React.useState(false);
  return React.createElement('button', {
    type, disabled,
    onMouseEnter: () => setEncima(true), onMouseLeave: () => setEncima(false),
    style: {
      display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-8)',
      minHeight: 56, padding: '0 var(--space-12)',
      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-regular)',
      color: 'var(--text)', background: encima && !disabled ? 'var(--surface-2)' : 'transparent',
      border: 'var(--border-w) solid var(--text)', borderRadius: 'var(--radius-campo)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style,
    },
    ...rest,
  },
  React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': 'true', style: { flex: 'none' } },
    React.createElement('path', { d: G, fill: 'currentColor' })),
  children);
}
