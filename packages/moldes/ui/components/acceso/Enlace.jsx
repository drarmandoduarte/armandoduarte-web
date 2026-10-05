import React from 'react';

/* El enlace secundario de las pantallas del molde (guion §2): subrayado, en el
   acento el primero y en la tinta apagada el segundo. Con `href` es un `<a>`;
   sin `href`, un `<button>` con cara de enlace (una acción que no navega, como
   «Reenviar código»). */
export function Enlace({ tono = 'acento', href, children, style, type = 'button', ...rest }) {
  const estilo = {
    padding: 0, border: 0, background: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
    color: tono === 'apagado' ? 'var(--text-3)' : 'var(--primary-text)',
    textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationThickness: '1px',
    ...style,
  };
  if (href) return React.createElement('a', { href, style: estilo, ...rest }, children);
  return React.createElement('button', { type, style: estilo, ...rest }, children);
}
