import React from 'react';

/* El botón de las pantallas del molde (guion §2): CONTORNO, nunca relleno, texto
   en mayúsculas espaciadas, flecha `→` cuando lleva a otra pantalla. El radio es
   el del botón de la app (de cuadrado a píldora).

   No reemplaza a `Button`: `Button` es el botón de trabajo de la app (relleno,
   sentence case, tres tamaños). `Boton` es el de las pantallas del molde —acceso,
   ajustes, asistente—, que son iguales en todas las apps.

   `tamano="chico"` (40 px) es el de las filas de Ajustes: el control de una
   fila no puede ser más alto que el nombre y la explicación que acompaña.

   `cargando` no gira (el molde no tiene spinners): tres puntos que laten en el
   lugar del texto, sin cambiar el ancho del botón. */

const TONOS = {
  primario: { color: 'var(--primary-text)', borde: 'var(--primary)', hover: 'var(--primary-soft)' },
  secundario: { color: 'var(--text-2)', borde: 'var(--border-strong)', hover: 'var(--surface-2)' },
  peligro: { color: 'var(--danger-text)', borde: 'var(--danger)', hover: 'var(--danger-soft)' },
};

function Puntos() {
  const punto = { width: 4, height: 4, borderRadius: 'var(--radius-pill)', background: 'currentColor', display: 'inline-block' };
  return React.createElement('span', { className: 'molde-carga', 'aria-hidden': 'true', style: { display: 'inline-flex', gap: 4 } },
    React.createElement('span', { style: punto }), React.createElement('span', { style: punto }), React.createElement('span', { style: punto }));
}

export function Boton({
  variante = 'primario', flecha = false, ancho = 'texto', cargando = false, tamano = 'normal',
  disabled = false, type = 'button', children, style, onMouseEnter, onMouseLeave, ...rest
}) {
  const [encima, setEncima] = React.useState(false);
  const t = TONOS[variante] || TONOS.primario;
  const apagado = disabled || cargando;
  return React.createElement('button', {
    type, disabled: apagado, 'aria-busy': cargando || undefined,
    onMouseEnter: (e) => { setEncima(true); onMouseEnter && onMouseEnter(e); },
    onMouseLeave: (e) => { setEncima(false); onMouseLeave && onMouseLeave(e); },
    style: {
      position: 'relative',
      display: ancho === 'completo' ? 'flex' : 'inline-flex', width: ancho === 'completo' ? '100%' : undefined,
      alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)',
      minHeight: tamano === 'chico' ? 40 : 52, padding: tamano === 'chico' ? '0 var(--space-10)' : '0 var(--space-16)',
      fontFamily: 'var(--font-ui)', fontSize: tamano === 'chico' ? 'var(--text-xs)' : 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
      letterSpacing: 'var(--tracking-rotulo)', textTransform: 'uppercase', whiteSpace: 'nowrap',
      color: t.color, background: encima && !apagado ? t.hover : 'transparent',
      border: 'var(--border-w) solid ' + t.borde, borderRadius: 'var(--radius-boton)',
      cursor: apagado ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style,
    },
    ...rest,
  },
  React.createElement('span', { style: { visibility: cargando ? 'hidden' : 'visible', display: 'inline-flex', gap: 'var(--space-6)', alignItems: 'center' } },
    children, flecha ? React.createElement('span', { 'aria-hidden': 'true' }, '→') : null),
  cargando ? React.createElement('span', { style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' } }, React.createElement(Puntos)) : null);
}
