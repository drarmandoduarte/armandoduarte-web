import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Chip de filtro: se toca y se queda puesto. «Con convenio (7)», «Datos incompletos».

   NO es un Tag. Un Tag describe —convenio, alergia— y no se toca; esto es
   un control de dos estados que cambia lo que se ve debajo. De ahí que sea
   píldora (en el molde lo que se toca usa el radio del botón, lo que informa es
   recto-redondeado) y que declare `aria-pressed`: para quien navega con lector
   de pantalla, la diferencia entre «hay siete fichas» y «estoy viendo solo
   fichas» es toda la diferencia.

   El contador va adentro del chip y en tabular-nums: son cifras comparables
   —siete fichas contra cuatro fichas— y con la tipografía proporcional los
   números bailan de ancho entre un chip y el de al lado.

   Puesto usa el acento suave, que es el color de lo que ACTÚA. Sin puesto es
   Papel con borde: presente, silencioso, y sin competir con la acción primaria
   de la pantalla.

   APAGADO (`disabled`): el filtro que hoy no deja ver nada se muestra
   y no se toca. No se esconde, y esa es la decisión: «Cuidados 0» dice que ese
   tipo existe y que hoy está limpio, mientras que una fila de chips que cambia
   de largo según el día es una fila en la que no se puede confiar — se busca con
   la vista donde estaba ayer y no está. Apagado y no clicable porque llevaría a
   un tablero vacío que el propio contador ya anunció. */

export function ChipFiltro({ activo = false, cuantos, icon, disabled = false, children, style, ...rest }) {
  return React.createElement('button', {
    type: 'button',
    disabled,
    'aria-pressed': activo,
    style: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px',
      background: activo ? 'var(--primary-soft)' : 'var(--surface)',
      border: 'var(--border-w) solid ' + (activo ? 'var(--primary)' : disabled ? 'var(--border)' : 'var(--border-strong)'),
      borderRadius: 'var(--radius-boton)',
      color: activo ? 'var(--primary-text)' : 'var(--text-2)',
      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
      fontWeight: activo ? 'var(--weight-semibold)' : 'var(--weight-medium)',
      cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto',
      /* Apagado: se lee, no se toca. El borde baja al suave y el conjunto pierde
         peso sin desaparecer — es información, no un control roto. */
      opacity: disabled ? 0.45 : 1,
      transition: 'background-color .15s, border-color .15s, color .15s',
      ...style
    }, ...rest
  },
    icon && React.createElement(Icon, { key: 'i', name: icon, size: 12 }),
    React.createElement('span', { key: 't' }, children),
    cuantos !== undefined && React.createElement('span', {
      key: 'n',
      style: { fontVariantNumeric: 'tabular-nums', opacity: activo ? 0.85 : 0.7 }
    }, cuantos)
  );
}
