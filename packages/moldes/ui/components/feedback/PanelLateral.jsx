import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

/* Panel lateral — el hermano del diálogo para lo que se ajusta MIENTRAS se mira.

   La diferencia con `Dialog` no es de forma, es de propósito: un diálogo
   interrumpe y pide una decisión —guardar, confirmar, cancelar—; un panel
   acompaña. Se abre al costado, la pantalla sigue ahí detrás, y lo que se toca
   adentro ya quedó hecho. Por eso no tiene PIE: no hay una franja fija abajo
   con los botones, y no la va a haber.

   ── La vuelta que se dio, y por qué se revirtió ─────────────────────────────
   Una vez se trajo aquí la ficha de una persona con un argumento razonable:
   `Dialog` no llevaba scroll, el cuerpo se desbordaba del velo y «Guardar»
   quedaba fuera de la pantalla. El diagnóstico era correcto y la cura estaba
   equivocada de lugar — **el origen nunca puso esa ficha al costado**. Después se la
   devolvió al centro y arregló lo que estaba roto de verdad: ahora `Dialog`
   tiene tope de alto, cabecera anclada, cuerpo que scrollea y pie anclado. De
   ahí sale la regla: el molde de origen manda en la anatomía.

   Así que la doctrina de arriba vuelve entera: **una ficha va al centro; esto es
   para lo que se ajusta mientras se mira.** Si lo que estás por poner aquí tiene
   un «Guardar», es un diálogo. La pieza no lo impide —dibuja lo que le den—,
   pero el sitio ya está decidido y no se decide dos veces.

   Comparte con el diálogo el velo con blur, que es el ÚNICO gesto glass del
   sistema, y el cierre con Escape. No comparte la animación de
   entrada porque el diálogo tampoco la tiene: en el molde lo que aparece, aparece.

   Pegado al borde derecho y de alto completo. En el teléfono ocupa el ancho
   entero — 320 px al costado de 375 dejarían 55 px de pantalla detrás, que no
   es «acompañar», es tapar mal. */

export function PanelLateral({
  open = false, title, description, onClose, closeLabel,
  width = 380, children, style, ...rest
}) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return React.createElement('div', {
    role: 'presentation', onClick: onClose,
    style: {
      position: 'fixed', inset: 0, zIndex: 60, background: 'var(--overlay)',
      backdropFilter: 'blur(var(--overlay-blur))',
      WebkitBackdropFilter: 'blur(var(--overlay-blur))',
      display: 'flex', justifyContent: 'flex-end'
    }
  },
    React.createElement('aside', {
      role: 'dialog', 'aria-modal': true,
      'aria-label': typeof title === 'string' ? title : undefined,
      onClick: (e) => e.stopPropagation(),
      style: {
        width: '100%', maxWidth: (typeof width === 'number' ? width + 'px' : width),
        height: '100%', display: 'flex', flexDirection: 'column',
        background: 'var(--floating-surface)', color: 'var(--text)',
        borderLeft: 'var(--border-w) solid var(--floating-border)',
        boxShadow: 'var(--shadow-dialog)', ...style
      }, ...rest
    },
      React.createElement('header', {
        key: 'h',
        style: {
          display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)',
          padding: 'var(--space-12)', paddingBottom: 'var(--space-6)'
        }
      },
        React.createElement('div', { key: 't', style: { flex: 1, minWidth: 0 } },
          title && React.createElement('h2', {
            key: 'a',
            style: {
              fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-display)',
              fontSize: 'var(--text-2xl)', letterSpacing: 'var(--tracking-display)',
              lineHeight: 'var(--leading-display)'
            }
          }, title),
          description && React.createElement('p', {
            key: 'b',
            style: {
              marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)',
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
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '0 var(--space-12) var(--space-12)'
        }
      }, children)
    )
  );
}
