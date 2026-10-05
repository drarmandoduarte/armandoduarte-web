import React from 'react';

/* Elección entre pocas opciones excluyentes, en fila de píldoras (tema,
   idioma, densidad). Es un radiogroup: se navega con flechas y se anuncia como
   tal, aunque a la vista sean botones.

   La opción activa va en el acento SOFT, no en relleno sólido: el único relleno
   sólido del producto es la urgencia, y en una pantalla ya hay una acción
   el acento que opera (el botón de guardar). Dos acentos sólidos compitiendo
   rompen la regla de "600 opera / 700 posa, nunca ambos". */

function Opcion({ opcion, active, disabled, onSelect, onKeyDown, refItem }) {
  const [hover, setHover] = React.useState(false);
  return React.createElement('button', {
    type: 'button',
    role: 'radio',
    'aria-checked': active ? 'true' : 'false',
    tabIndex: active ? 0 : -1,
    disabled,
    ref: refItem,
    onClick: () => { if (!disabled) onSelect(opcion.value); },
    onKeyDown,
    onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    style: {
      height: 32, padding: '0 16px',
      borderRadius: 'var(--radius-boton)',
      border: 'var(--border-w) solid ' + (active ? 'var(--primary)' : 'var(--border)'),
      background: active ? 'var(--primary-soft)' : hover && !disabled ? 'var(--surface-2)' : 'transparent',
      color: active ? 'var(--primary-soft-fg)' : 'var(--text-2)',
      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
      fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
      whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
    }
  }, opcion.label);
}

export function SegmentedControl({ options = [], value, onChange, label, disabled = false, style, ...rest }) {
  const refs = React.useRef([]);
  const select = (v) => { if (v !== value && onChange) onChange(v); };

  // Flechas dentro del grupo: mueven el foco Y la selección, que es lo que
  // espera un radiogroup. Envuelve en los extremos.
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
    role: 'radiogroup', 'aria-label': label,
    style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', ...style },
    ...rest
  }, options.map((op, i) => React.createElement(Opcion, {
    key: op.value,
    opcion: op,
    active: op.value === value,
    disabled: disabled || op.disabled,
    onSelect: select,
    onKeyDown: teclado(i),
    refItem: (n) => { refs.current[i] = n; }
  })));
}
