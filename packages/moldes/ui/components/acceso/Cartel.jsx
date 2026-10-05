import React from 'react';
import { Antetitulo } from './Antetitulo.jsx';
import { Titulo } from './Titulo.jsx';
import { Boton } from './Boton.jsx';

/* La pantalla centrada de un solo mensaje y una sola salida (guion P7 «Cerramos
   tu sesión», P9 «Pasó un tiempo»): antetítulo, título, una frase y un botón.
   Nada más. Ocupa el alto de la pantalla y centra su columna. */
export function Cartel({ antetitulo, titulo, texto, accion, style, ...rest }) {
  return React.createElement('main', {
    style: { minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)', ...style },
    ...rest,
  },
  React.createElement('div', { className: 'molde-columna', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-12)', textAlign: 'center' } },
    antetitulo ? React.createElement(Antetitulo, { texto: antetitulo }) : null,
    React.createElement(Titulo, { texto: titulo, alineado: 'centro' }),
    texto ? React.createElement('p', { style: { fontSize: 'var(--text-lg)', color: 'var(--text-3)', maxWidth: '36ch' } }, texto) : null,
    accion ? React.createElement(Boton, { ancho: 'completo', onClick: accion.onClick, style: { marginTop: 'var(--space-8)' } }, accion.texto) : null));
}
