import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

/* Diálogo centrado — la anatomía de la app de origen, copiada.

   ── El cuerpo scrollea, y eso no es un detalle ──────────────────────────────
   Antes esta caja no tenía tope de alto ni barra: el velo es
   `fixed` con `inset: 0`, la caja crecía con su contenido y **lo que sobraba se
   salía por arriba y por abajo sin forma de alcanzarlo**. Una ficha larga
   quedaba con su «Guardar» fuera de la pantalla — no incómodo: imposible. La
   ficha de una persona se topó con eso y la primera cura fue
   mudarla a un panel lateral, que resolvía el scroll y la ponía en un lugar
   donde el origen nunca la puso. Después se la trajo de vuelta al centro y arregló lo
   que estaba roto de verdad, que era esto.

   La anatomía es la del diálogo de alta del origen, pieza por pieza:
   **caja en columna con tope de 90vh · cabecera anclada · cuerpo que scrollea ·
   pie anclado.** Nada de esto se nota en un diálogo que ya entraba —una
   confirmación de cuatro renglones se dibuja exactamente igual que antes—; se
   nota el día que el contenido pasa el alto de la ventana, que es el día que
   antes se rompía.

   El pie va FUERA del formulario y su botón lo alcanza con `form="<id>"`, que es
   HTML de toda la vida: así el pie queda anclado y «Guardar» sigue enviando. Es
   el patrón que el kit ya usaba en sus diálogos de alta. */

/* ── El foco, dentro del diálogo
   Escape ya cerraba. Lo que faltaba era el teclado: al abrir, el foco se quedaba
   en el botón de la pantalla de atrás, Tab paseaba por detrás del velo, y al
   cerrar no volvía a ningún lado. Ahora:
   · al abrir, el foco entra al diálogo (y el próximo Tab, a su primer control);
   · Tab y Mayús+Tab dan la vuelta adentro: el velo es modal y el teclado
     también;
   · al cerrar, el foco vuelve a lo que lo abrió. */
const ENFOCABLES = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function enfocablesDe(caja) {
  return Array.from(caja.querySelectorAll(ENFOCABLES)).filter((el) => el.getClientRects().length > 0 || el.type === 'checkbox');
}

export function Dialog({ open = false, title, description, onClose, closeLabel, footer, width = 480, children, style, ...rest }) {
  const caja = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) { onClose(); return; }
      if (e.key !== 'Tab' || !caja.current) return;
      const lista = enfocablesDe(caja.current);
      if (lista.length === 0) { e.preventDefault(); caja.current.focus(); return; }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const adentro = caja.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === primero || !adentro)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (document.activeElement === ultimo || !adentro)) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  React.useEffect(() => {
    if (!open) return undefined;
    const antes = document.activeElement;
    // El diálogo mismo y no su primer campo: un combo que se abre al recibir el
    // foco desplegaría su lista sin que nadie la pidiera. El lector de pantalla
    // anuncia el diálogo por su nombre y el próximo Tab ya está adentro.
    if (caja.current && !caja.current.contains(document.activeElement)) caja.current.focus();
    return () => { if (antes && typeof antes.focus === 'function' && document.contains(antes)) antes.focus(); };
  }, [open]);
  if (!open) return null;
  return React.createElement('div', {
    role: 'presentation', onClick: onClose,
    style: {
      position: 'fixed', inset: 0, zIndex: 60, background: 'var(--overlay)', backdropFilter: 'blur(var(--overlay-blur))', WebkitBackdropFilter: 'blur(var(--overlay-blur))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)'
    }
  },
    React.createElement('div', {
      role: 'dialog', 'aria-modal': true, 'aria-label': typeof title === 'string' ? title : undefined,
      ref: caja, tabIndex: -1,
      onClick: (e) => e.stopPropagation(),
      style: {
        width: '100%', maxWidth: (typeof width === 'number' ? width + 'px' : width),
        // El tope de alto y la columna son lo que le da al cuerpo contra qué
        // scrollear. Sin `maxHeight` la caja crece sin límite y no hay barra
        // posible; sin la columna, el `flex: 1` del cuerpo no significa nada.
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: 'var(--floating-surface)', color: 'var(--text)',
        border: 'var(--border-w) solid var(--floating-border)', borderRadius: 'var(--radius-tarjeta)',
        boxShadow: 'var(--shadow-dialog)', overflow: 'hidden', outline: 'none', ...style
      }, ...rest
    },
      React.createElement('header', {
        key: 'h', style: { flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)', padding: 'var(--space-12) var(--space-12) var(--space-6)' }
      },
        React.createElement('div', { key: 't', style: { flex: 1, minWidth: 0 } },
          title && React.createElement('h2', { key: 'a', style: { fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' } }, title),
          description && React.createElement('p', { key: 'b', style: { marginTop: 'var(--space-3)', fontSize: 'var(--text-base)', color: 'var(--text-3)', lineHeight: 'var(--leading-normal)' } }, description)
        ),
        onClose && React.createElement(IconButton, { key: 'x', icon: 'x', label: closeLabel, size: 'sm', onClick: onClose })
      ),
      React.createElement('div', {
        key: 'b',
        style: {
          // `minHeight: 0` es obligatorio: un hijo flexible no baja de su alto
          // de contenido sin esto, y la barra no aparecería nunca.
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '0 var(--space-12) var(--space-12)'
        }
      }, children),
      footer && React.createElement('footer', {
        key: 'f',
        style: { flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-5)', padding: 'var(--space-8) var(--space-12)', borderTop: 'var(--border-w) solid var(--border)', background: 'var(--surface-2)' }
      }, footer)
    )
  );
}
