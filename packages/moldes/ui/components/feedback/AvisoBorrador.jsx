import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* «Retomaste lo que estabas escribiendo.»

   La cinta que aparece arriba de un formulario cuando se recuperó un borrador
   (regla del molde). Dice qué pasó y ofrece la salida en la misma
   línea, porque las dos cosas se deciden juntas: quien lee esto o sigue
   escribiendo, o quiere la hoja en blanco.

   DISCRETA A PROPÓSITO. el gris informa, y esto informa: no pasó nada malo, no
   hay nada que arreglar y no hay que decidir ya. Un banner de advertencia aquí
   asustaría por una función que existe justamente para que nadie se asuste.

   El botón de descartar es un `button` de texto y no un `Button` del kit: al
   lado de «Guardar» y «Cancelar» del pie, un tercer botón con caja compite por
   la mirada, y este no es una acción del formulario — es una salida de la cinta.

   No lleva icono de basura. Descartar un borrador no destruye nada de la
   cuenta: la ficha guardada sigue donde estaba. */

export function AvisoBorrador({ texto, accionDescartar, onDescartar, style, ...rest }) {
  return React.createElement('div', {
    style: {
      display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap',
      padding: 'var(--space-4) var(--space-5)',
      background: 'var(--info-soft)', borderRadius: 'var(--radius-md)',
      ...style,
    },
    ...rest,
  },
    React.createElement(Icon, {
      key: 'i', name: 'rotate-ccw', size: 14, style: { color: 'var(--info-text)', flex: 'none' },
    }),
    React.createElement('span', {
      key: 't',
      style: {
        flex: '1 1 12rem', minWidth: 0,
        fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-snug)', color: 'var(--info-text)',
      },
    }, texto),
    React.createElement('button', {
      key: 'd', type: 'button', onClick: onDescartar,
      style: {
        flex: 'none', background: 'none', border: 'none', padding: 0,
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
        color: 'var(--info-text)', textDecoration: 'underline', cursor: 'pointer',
      },
    }, accionDescartar),
  );
}
