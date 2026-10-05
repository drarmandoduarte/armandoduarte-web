import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* El selector de idioma de arriba a la derecha (guion §2): el globo y
   `ES · EN · PT`, el activo en la tinta y en negrita, los otros apagados. Cambia
   en el momento: llama a `onCambiar` y la app decide dónde lo guarda (en el
   aparato antes de entrar, en el perfil después).

   Los códigos no se traducen: son códigos. El nombre accesible del grupo sí, y
   llega por `etiqueta`. */
export function Idioma({ valor = 'es', idiomas = ['es', 'en', 'pt'], onCambiar, etiqueta, style, ...rest }) {
  return React.createElement('div', {
    role: 'group', 'aria-label': etiqueta,
    style: { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)', color: 'var(--text-3)', ...style },
    ...rest,
  },
  React.createElement(Icon, { name: 'globe', size: 16, 'aria-hidden': true }),
  idiomas.flatMap((codigo, i) => {
    const activo = codigo === valor;
    const boton = React.createElement('button', {
      key: codigo, type: 'button', lang: codigo, 'aria-pressed': activo,
      onClick: () => { if (!activo && onCambiar) onCambiar(codigo); },
      style: {
        padding: '2px', border: 0, background: 'none', cursor: activo ? 'default' : 'pointer',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-rotulo)',
        textTransform: 'uppercase', fontWeight: activo ? 'var(--weight-semibold)' : 'var(--weight-regular)',
        color: activo ? 'var(--text-2)' : 'var(--text-3)', opacity: activo ? 1 : 0.7,
      },
    }, codigo);
    return i === 0 ? [boton] : [React.createElement('span', { key: codigo + '-punto', 'aria-hidden': 'true', style: { opacity: 0.6 } }, '·'), boton];
  }));
}
