import React from 'react';

/* Envoltorio de etiqueta / ayuda / error compartido por los controles de formulario. */
export function Field({ label, hint, error, required, htmlFor, children, style, ...rest }) {
  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 0, ...style }, ...rest
  },
    label && React.createElement('label', {
      key: 'l', htmlFor,
      style: { fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-2)', lineHeight: 'var(--leading-snug)' }
    }, label, required && React.createElement('span', { key: 'r', style: { color: 'var(--danger-text)', marginLeft: '3px' } }, '*')),
    children,
    (error || hint) && React.createElement('p', {
      key: 'h',
      style: { fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)', color: error ? 'var(--danger-text)' : 'var(--text-3)' }
    }, error || hint)
  );
}
