import React from 'react';
import { PanelLateral } from '../feedback/PanelLateral.jsx';
import { HojaInferior } from '../feedback/HojaInferior.jsx';
import { useEsCelular } from '../celular.js';

/* El panel del asistente (concepto del Asistente §7): a la derecha y de 420 px en
   escritorio; en celular, la hoja que sube desde abajo. No es una pieza nueva:
   compone las dos que el kit ya tenía —`PanelLateral` y `HojaInferior`, que
   comparten velo, Escape y toque afuera— y elige una por el ancho de la
   ventana (`useEsCelular`, el corte de 600 px de todo el molde). */
export function Panel({ abierto = false, titulo, descripcion, onCerrar, etiquetaCerrar, children, ...rest }) {
  const celular = useEsCelular();
  const props = { open: abierto, title: titulo, description: descripcion, onClose: onCerrar, closeLabel: etiquetaCerrar, ...rest };
  return celular
    ? React.createElement(HojaInferior, props, children)
    : React.createElement(PanelLateral, { width: 420, ...props }, children);
}
