import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

/* La hoja que sube desde abajo.

   ── Por qué nace una pieza, dicho con las dos que ya había ────────────────
   `Dialog` se abre en el centro y `PanelLateral` contra el borde derecho. Las
   dos sirven en un escritorio y ninguna sirve aquí, y no es una cuestión de
   gusto: en un teléfono lo que se abre desde el pulgar se lee como continuación
   del pulgar. La orden lo dice con todas las letras —«una hoja desde abajo, no
   un menú flotante»— porque un menú flotante colgado de la quinta entrada de la
   barra pondría doce filas en el aire, arriba del dedo que las abrió.

   Hereda de sus dos hermanas todo lo que ya estaba decidido y no se vuelve a
   decidir: el velo con blur —el ÚNICO gesto glass del sistema—,
   el cierre con Escape y con el toque afuera, el tope de alto con el cuerpo
   scrolleando adentro. Lo único propio es de dónde sale y una cosa que las
   otras dos no hacen, abajo.

   ── El fondo no se desplaza, y eso ninguna de las dos hacía ───────────────
   Con la hoja abierta, `body` queda en `overflow: hidden`. En un escritorio un
   velo que no bloquea el scroll es un detalle; en un teléfono es el defecto
   entero: el dedo que arrastra la hoja arrastra la lista de atrás, la hoja se
   queda quieta y lo que se mueve es lo que no se está mirando.

   Se restaura el valor que había, no se pone `''` a ciegas: si mañana la app
   bloquea el scroll por otra razón, salir de aquí no tiene por qué
   desbloqueárselo.

   ── El agarre de arriba ───────────────────────────────────────────────────
   La rayita de 36 × 4 no es decoración: es lo que dice «esto vino de abajo». No
   arrastra —la hoja se cierra tocando afuera, con la X o con Escape—, y por eso
   es un `div` y no un control: prometer un arrastre que no existe es peor que
   no dibujar nada. */

export function HojaInferior({
  open = false, title, description, onClose, closeLabel,
  children, style, ...rest
}) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = antes;
    };
  }, [open, onClose]);

  if (!open) return null;

  return React.createElement('div', {
    role: 'presentation', onClick: onClose,
    style: {
      position: 'fixed', inset: 0, zIndex: 60, background: 'var(--overlay)',
      backdropFilter: 'blur(var(--overlay-blur))',
      WebkitBackdropFilter: 'blur(var(--overlay-blur))',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }
  },
    React.createElement('div', {
      role: 'dialog', 'aria-modal': true,
      'aria-label': typeof title === 'string' ? title : undefined,
      'data-hoja-inferior': 'si',
      onClick: (e) => e.stopPropagation(),
      style: {
        width: '100%',
        /* 85vh y no 90 como el diálogo: una hoja que llega casi al techo deja
           de leerse como una hoja y se lee como una pantalla — y lo que asoma
           arriba es lo que dice de dónde salió y adónde se vuelve. */
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        background: 'var(--floating-surface)', color: 'var(--text)',
        borderTop: 'var(--border-w) solid var(--floating-border)',
        /* Redondeada arriba y recta abajo: está apoyada contra el borde. */
        borderTopLeftRadius: 'var(--radius-tarjeta)', borderTopRightRadius: 'var(--radius-tarjeta)',
        boxShadow: 'var(--shadow-dialog)', overflow: 'hidden',
        /* El área segura de abajo, otra vez: la hoja tapa la barra, así que el
           colchón que la barra reservaba lo reserva ahora ella. */
        paddingBottom: 'env(safe-area-inset-bottom)',
        ...style
      }, ...rest
    },
      React.createElement('div', {
        key: 'agarre',
        style: {
          flexShrink: 0, display: 'flex', justifyContent: 'center',
          padding: 'var(--space-5) 0 0'
        }
      }, React.createElement('div', {
        style: { width: 36, height: 4, borderRadius: 'var(--radius-pill)', background: 'var(--border)' }
      })),
      React.createElement('header', {
        key: 'h',
        style: {
          flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)',
          padding: 'var(--space-6) var(--space-10) var(--space-5)'
        }
      },
        React.createElement('div', { key: 't', style: { flex: 1, minWidth: 0 } },
          title && React.createElement('h2', {
            key: 'a',
            style: { fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }
          }, title),
          description && React.createElement('p', {
            key: 'b',
            style: {
              marginTop: 'var(--space-3)', fontSize: 'var(--text-base)',
              color: 'var(--text-3)', lineHeight: 'var(--leading-normal)'
            }
          }, description)
        ),
        onClose && React.createElement(IconButton, {
          key: 'x', icon: 'x', label: closeLabel, size: 'sm', onClick: onClose
        })
      ),
      React.createElement('div', {
        key: 'c',
        style: {
          // `minHeight: 0`, por lo mismo que en `Dialog`: sin él un hijo
          // flexible no baja de su alto de contenido y la barra no aparece.
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '0 var(--space-10) var(--space-10)'
        }
      }, children)
    )
  );
}
