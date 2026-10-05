import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Cómo se mira una lista: en filas o en tarjetas. Dos iconos, sin etiqueta, al
   borde derecho de la fila del buscador — la anatomía fija de toda pantalla de
   listado del molde.

   Es un radiogroup, no dos botones sueltos: son opciones excluyentes de una
   misma pregunta, y quien navega con teclado espera flechas. Misma gramática
   que `SegmentedControl`, del que este es el hermano sin texto.

   LA ACTIVA VA EN FOREST SOFT, NO EN RELLENO SÓLIDO. La referencia de
   El origen la mostraba sólida, pero aquí el único relleno sólido del producto es
   la urgencia, y en una pantalla de listado ya hay una acción el acento que opera
   (el botón «Nuevo X» de arriba a la derecha). Dos acentos sólidos compitiendo
   rompen «600 opera / 700 posa, nunca ambos». Lo que la referencia pide de
   verdad —que se vea de un vistazo cuál está puesta— lo da igual el contraste
   entre relleno soft con borde y el otro apagado sin fondo.

   Sin etiqueta visible por diseño: el icono es el idioma universal de esto y
   dos palabras al lado de un buscador compiten con el buscador. El nombre viaja
   en `aria-label` y en el `title`, que es el tooltip nativo — y por eso las dos
   etiquetas son obligatorias y están traducidas. */

function Boton({ opcion, activa, onSelect, onKeyDown, refItem }) {
  const [hover, setHover] = React.useState(false);
  return React.createElement('button', {
    type: 'button',
    role: 'radio',
    'aria-checked': activa ? 'true' : 'false',
    'aria-label': opcion.label,
    title: opcion.label,
    tabIndex: activa ? 0 : -1,
    ref: refItem,
    onClick: () => onSelect(opcion.value),
    onKeyDown,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 'var(--control-h)', height: 'var(--control-h)', padding: 0,
      borderRadius: 'var(--radius-boton)',
      border: 'var(--border-w) solid ' + (activa ? 'var(--primary)' : 'transparent'),
      background: activa ? 'var(--primary-soft)' : hover ? 'var(--surface-2)' : 'transparent',
      color: activa ? 'var(--primary-soft-fg)' : 'var(--text-3)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
    }
  }, React.createElement(Icon, { name: opcion.icon, size: 16 }));
}

export function ConmutadorVista({ options = [], value, onChange, label, style, ...rest }) {
  const refs = React.useRef([]);
  const select = (v) => { if (v !== value && onChange) onChange(v); };

  // Flechas dentro del grupo: mueven foco y selección, y envuelven en los
  // extremos. Es lo que un radiogroup promete al anunciarse como tal.
  const teclado = (i) => (e) => {
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const siguiente = (i + paso + options.length) % options.length;
    select(options[siguiente].value);
    const nodo = refs.current[siguiente];
    if (nodo) nodo.focus();
  };

  return React.createElement('div', {
    role: 'radiogroup',
    'aria-label': label,
    style: { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', ...style },
    ...rest
  }, options.map((op, i) => React.createElement(Boton, {
    key: op.value,
    opcion: op,
    activa: op.value === value,
    onSelect: select,
    onKeyDown: teclado(i),
    refItem: (n) => { refs.current[i] = n; }
  })));
}
