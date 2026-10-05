import React from 'react';

/* Un globo: lo que se abre al tocar algo chico, y trae texto que se puede leer
   y enlaces que se pueden tocar.

   ── POR QUÉ EXISTE, que es lo primero ──────────────────────────────────────
   La casa tenía cuatro maneras de mostrar algo flotante y ninguna servía para
   esto:

   · `Tooltip` es de hover y tiene `pointerEvents: 'none'` — no se puede tocar
     lo que hay adentro, así que no puede llevar un enlace.
   · `MenuAcciones` es una lista de acciones detrás de tres puntos: su
     disparador es un icono fijo y sus renglones ejecutan, no informan.
   · `Dialog` trae el velo con blur y ocupa la pantalla. Para un gesto de 13 px
     en la barra superior es desproporcionado: el único gesto glass de la casa
     no se gasta en decir cuántos grados hace.
   · `PanelLateral` es una pantalla al costado.

   El caso que lo manda es el cielo: el gesto del clima se
   toca, y lo que se abre tiene que poder decir la temperatura **y** llevar la
   atribución de Apple, que es un enlace. La regla del molde dice qué hacer cuando una
   pantalla necesita algo que no existe: entra al design system primero.

   ── Lo que hace y lo que no ────────────────────────────────────────────────
   Informa. No confirma, no decide, no tiene botones primarios. Si lo que se
   abre pide una decisión, eso es un `Dialog` y no esto.

   Cierra con Escape y **devuelve el foco al disparador** —la parte que casi
   todos se olvidan, y la que hace que recorrer la barra con el teclado no
   termine en el `body`—, y cierra cuando el foco se va del conjunto. Nunca
   cierra por `blur` del disparador solo: el clic sobre un enlace de adentro
   llegaría después del cierre y no pasaría nada. */

export function Globo({ label, children, disparador, alineado = 'derecha', style, ...rest }) {
  const [abierto, setAbierto] = React.useState(false);
  const caja = React.useRef(null);
  const autoId = React.useId();

  const cerrar = (devolverFoco) => {
    setAbierto(false);
    if (!devolverFoco || !caja.current) return;
    const suyo = caja.current.querySelector('button');
    if (suyo) suyo.focus();
  };

  /* El foco se fue del disparador Y del globo: recién ahí se cierra. Sin mirar
     a dónde fue, el `blur` cerraría antes de que el clic llegara al enlace. */
  const salir = (e) => {
    const destino = e.relatedTarget;
    if (destino && caja.current && caja.current.contains(destino)) return;
    setAbierto(false);
  };

  return React.createElement('div', {
    ref: caja,
    onKeyDown: (e) => { if (e.key === 'Escape') { e.preventDefault(); cerrar(true); } },
    onBlur: salir,
    style: { position: 'relative', display: 'inline-flex', ...style },
    ...rest,
  },
    React.createElement('button', {
      type: 'button',
      'aria-label': label,
      'aria-expanded': abierto ? 'true' : 'false',
      'aria-controls': autoId,
      onClick: () => setAbierto((v) => !v),
      style: {
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
        background: 'none', border: 'none', padding: 0, margin: 0,
        font: 'inherit', color: 'inherit', cursor: 'pointer',
      },
    }, disparador),

    abierto && React.createElement('div', {
      id: autoId,
      role: 'group',
      'aria-label': label,
      style: {
        position: 'absolute', top: 'calc(100% + var(--space-2))', zIndex: 40,
        [alineado === 'derecha' ? 'right' : 'left']: 0,
        minWidth: '13rem', maxWidth: '18rem',
        padding: 'var(--space-6)',
        background: 'var(--floating-surface)',
        border: 'var(--border-w) solid var(--floating-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-pop)',
        textAlign: 'left',
      },
    }, children),
  );
}
