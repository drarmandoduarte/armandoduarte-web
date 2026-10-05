import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';

/* Las acciones de una fila, detrás de los tres puntos.

   EL CASO QUE LO MANDA: la vista de lista de la agenda. Cada renglón tiene
   cuatro cosas que se le pueden hacer —abrirlo, editarlo, cobrarlo,
   eliminarlo— y ponerlas a la vista serían cuatro botones por fila: veinte
   turnos son ochenta botones, y el ojo deja de ver los datos.

   LO DESTRUCTIVO VA ÚLTIMO Y SEPARADO. `danger` lo pinta en el error y le pone una
   línea encima: en un menú de cuatro renglones, el que borra no puede estar
   pegado al que abre. No confirma nada por su cuenta —eso es de quien lo usa—,
   pero avisa antes de que el dedo llegue.

   El menú es de teclado completo: flechas para recorrer, Enter para ejecutar,
   Escape para salir sin tocar nada, y el foco vuelve al botón que lo abrió. Esa
   última parte es la que casi todos los menús se olvidan, y es la que hace que
   navegar una lista con el teclado no termine con el foco en el body. */

export function MenuAcciones({ label, items = [], disabled = false, style, ...rest }) {
  const [abierto, setAbierto] = React.useState(false);
  const [activo, setActivo] = React.useState(0);
  const caja = React.useRef(null);
  const autoId = React.useId();

  /* El foco vuelve al botón que abrió el menú, que es la parte que casi todos
     los menús se olvidan: sin esto, cerrar con Escape deja el foco en el body y
     recorrer una lista con el teclado se termina ahí. Se lo busca en el DOM en
     vez de pasarle una `ref` a `IconButton`, para no depender de que un
     componente del sistema reenvíe la suya. */
  const cerrar = (devolverFoco) => {
    setAbierto(false);
    if (!devolverFoco || !caja.current) return;
    const suyo = caja.current.querySelector('button');
    if (suyo) suyo.focus();
  };

  const ejecutar = (item) => {
    cerrar(true);
    if (item && item.onSelect) item.onSelect();
  };

  const teclado = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); cerrar(true); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) { setAbierto(true); setActivo(0); return; }
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      if (items.length === 0) return;
      setActivo((i) => (i + paso + items.length) % items.length);
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && abierto) {
      e.preventDefault();
      ejecutar(items[activo]);
    }
  };

  /* El foco se fue del botón Y del menú: recién ahí se cierra. Sin mirar a dónde
     fue, el `blur` del botón cerraría el menú antes de que el clic llegara al
     renglón. */
  const salir = (e) => {
    const destino = e.relatedTarget;
    if (destino && caja.current && caja.current.contains(destino)) return;
    setAbierto(false);
  };

  return React.createElement('div', {
    ref: caja,
    onKeyDown: teclado,
    onBlur: salir,
    style: { position: 'relative', display: 'inline-flex', ...style },
    ...rest,
  },
    React.createElement(IconButton, {
      icon: 'ellipsis',
      label,
      size: 'sm',
      disabled,
      'aria-haspopup': 'menu',
      'aria-expanded': abierto ? 'true' : 'false',
      'aria-controls': autoId,
      onClick: () => { setAbierto((v) => !v); setActivo(0); },
    }),

    abierto && React.createElement('div', {
      id: autoId, role: 'menu', 'aria-label': label,
      style: {
        position: 'absolute', top: 'calc(100% + var(--space-2))', right: 0,
        zIndex: 40, minWidth: '12rem',
        background: 'var(--floating-surface)',
        border: 'var(--border-w) solid var(--floating-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-pop)',
        padding: 'var(--space-2)',
      },
    }, items.map((item, i) => React.createElement('button', {
      key: item.id || i,
      type: 'button',
      role: 'menuitem',
      tabIndex: -1,
      disabled: item.disabled,
      onMouseEnter: () => setActivo(i),
      onClick: () => ejecutar(item),
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
        padding: 'var(--space-3) var(--space-4)', border: 'none',
        borderRadius: 'var(--radius-sm)',
        // Lo destructivo, separado de lo demás por una línea. Solo la lleva el
        // primero que sea `danger`: dos seguidos son un bloque, no dos bloques.
        borderTop: item.danger && !(items[i - 1] || {}).danger
          ? 'var(--border-w) solid var(--border)' : undefined,
        marginTop: item.danger && !(items[i - 1] || {}).danger ? 'var(--space-2)' : undefined,
        paddingTop: item.danger && !(items[i - 1] || {}).danger ? 'var(--space-4)' : undefined,
        background: i === activo && !item.disabled
          ? (item.danger ? 'var(--danger-soft)' : 'var(--surface-2)') : 'transparent',
        color: item.disabled ? 'var(--text-3)'
          : item.danger ? 'var(--danger-text)' : 'var(--text)',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
        cursor: item.disabled ? 'not-allowed' : 'pointer',
      },
    },
      item.icon && React.createElement(Icon, { key: 'i', name: item.icon, size: 14 }),
      React.createElement('span', { key: 't' }, item.label),
    ))),
  );
}
