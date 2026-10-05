import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Un bloque de formulario que se abre y se cierra.
   Nace de una regla de trabajo, no de una estética: una ficha completa tiene
   cuatro bloques y once apartados, y una carga rápida es el motivo y dos
   líneas. Si todo estuviera desplegado, lo corto costaría lo mismo que lo
   largo. Por eso lo abierto es la excepción y no el estado natural.

   Cerrada muestra su resumen: quien vuelve a la ficha sabe qué hay adentro sin
   abrir. El resumen lo arma la pantalla — el componente no sabe de dominio.

   No es un acordeón: varias pueden estar abiertas a la vez. Cerrar una nunca
   abre otra. */

export function SeccionPlegable({
  titulo, resumen, abiertaInicial = false, abierta, onCambio,
  id, children, style, ...rest
}) {
  const [interna, setInterna] = React.useState(abiertaInicial);
  const controlada = typeof abierta === 'boolean';
  const puesta = controlada ? abierta : interna;
  const auto = React.useId();
  const idCuerpo = (id || auto) + '-cuerpo';

  function alternar() {
    const siguiente = !puesta;
    if (!controlada) setInterna(siguiente);
    if (onCambio) onCambio(siguiente);
  }

  return React.createElement('section', {
    style: { borderTop: 'var(--border-w) solid var(--border)', ...style }, ...rest
  },
    React.createElement('button', {
      key: 'b', type: 'button', onClick: alternar,
      'aria-expanded': puesta, 'aria-controls': idCuerpo,
      style: {
        display: 'flex', alignItems: 'center', gap: 'var(--space-5)', width: '100%',
        padding: 'var(--space-6) 0', border: 'none', background: 'transparent',
        color: 'var(--text)', fontFamily: 'var(--font-ui)', textAlign: 'left',
        cursor: 'pointer'
      }
    },
      React.createElement('span', {
        key: 'i', 'aria-hidden': true,
        style: {
          flex: '0 0 auto', display: 'flex', color: 'var(--text-3)',
          transform: puesta ? 'rotate(90deg)' : 'none',
          transition: 'transform var(--dur-fast) var(--ease-standard)'
        }
      }, React.createElement(Icon, { name: 'chevron-right', size: 16 })),
      React.createElement('span', {
        key: 't',
        style: {
          flex: '0 0 auto', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)'
        }
      }, titulo),
      // El resumen solo tiene sentido con la sección cerrada: abierta, el
      // contenido ya está a la vista y repetirlo es ruido.
      !puesta && resumen && React.createElement('span', {
        key: 'r',
        style: {
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', textAlign: 'right',
          fontSize: 'var(--text-sm)', color: 'var(--text-3)'
        }
      }, resumen)
    ),
    React.createElement('div', {
      key: 'c', id: idCuerpo, hidden: !puesta,
      style: puesta ? { paddingBottom: 'var(--space-8)' } : undefined
    }, children)
  );
}
