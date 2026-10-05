import React from 'react';
import { conAcento } from '../acento.js';

/* El título del molde: sans, con la palabra que se quiere decir despacio en la
   serif de la app, cursiva y del color del acento, y punto final en la tinta
   (guion de pantallas §2: «Verifica tu *identidad*.»).

   Tres tamaños y no un número: `portada` es el de la pantalla de entrada (crece
   con la ventana), `pantalla` el de las demás de acceso y de cada sección, y
   `bloque` el de un bloque dentro de una sección. La palabra acentuada la pinta
   `.molde-display em`; este componente solo la marca. */

const TAMANOS = {
  portada: 'var(--text-portada)',
  pantalla: 'var(--text-5xl)',
  bloque: 'var(--text-2xl)',
};

export function Titulo({ texto, tamano = 'pantalla', como = 'h1', alineado = 'inicio', style, ...rest }) {
  return React.createElement(como, {
    className: 'molde-display',
    style: {
      fontSize: TAMANOS[tamano] || TAMANOS.pantalla,
      color: 'var(--text)',
      textAlign: alineado === 'centro' ? 'center' : 'start',
      textWrap: 'balance',
      ...style,
    },
    ...rest,
  }, conAcento(texto));
}
