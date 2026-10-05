import React from 'react';
import { FileteDeZona, RotuloDeZona } from './zonas.jsx';

/* Riel de secciones de una pantalla de ajustes — el de la Configuración de
   la app de origen, esta vez sin interpretar: texto puro, sin iconos, y la sección
   activa marcada con una barra vertical a la izquierda del ítem.

   Por qué barra y no píldora (la primera versión de esto usaba la píldora del
   Sidebar): el riel no es navegación de la app, es un índice DENTRO de una
   pantalla. La píldora es la marca de "estoy en esta sección del producto" y
   usarla aquí hacía competir dos jerarquías en la misma pantalla. La barra
   señala sin gritar, que es lo que un índice tiene que hacer.

   Los iconos se fueron por lo mismo: cinco iconos en una columna de cinco
   palabras es ruido: la palabra ya dice todo.

   El riel es SIEMPRE una columna. Que se apile arriba del panel en pantallas
   chicas es decisión del layout que lo usa, no del componente: aquí no hay
   media queries porque los componentes de este paquete se estilan con tokens
   en línea.

   ── Las zonas ─────────────────────────────────────────────────────────────
   Un ítem puede traer `grupo`, y el riel corta cada vez que ese valor cambia
   —**comparando con el de arriba, no agrupando la lista**, igual que el
   sidebar—: así el orden lo sigue mandando quien pasa los ítems y el riel no
   reordena nada por su cuenta. Un ítem sin `grupo` **después** de otros con
   grupo abre un filete sin rótulo: es lo que cuelga después de las zonas, como
   la Papelera en el menú.

   Trece nombres en orden alfabético eran trece cosas que hay que recorrer.
   Peor: la mitad te cambia la app solo a ti y la otra mitad se la cambia a toda la
   cuenta, **y las dos se veían igual**. Cortarlo en dos bloques es lo que
   convierte esa diferencia en algo que se ve sin abrir nada. */

function RailItem({ item, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return React.createElement('button', {
    type: 'button', onClick,
    onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    role: 'tab', 'aria-selected': active ? 'true' : 'false',
    style: {
      display: 'block', width: '100%', textAlign: 'left',
      padding: 'var(--space-4) var(--space-6)',
      border: 'none',
      /* La barra es un borde, no un pseudo-elemento: así ocupa su lugar
         también cuando está apagada y el texto no se corre al seleccionar. */
      borderLeft: 'var(--border-w-strong) solid ' + (active ? 'var(--primary)' : 'transparent'),
      borderRadius: 'var(--radius-md)',
      background: active ? 'var(--surface-2)' : hover ? 'var(--surface-2)' : 'transparent',
      color: active ? 'var(--text)' : 'var(--text-2)',
      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
      fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
    }
  }, item.label);
}

export function SettingsRail({ items = [], activeId, onSelect, label, style, ...rest }) {
  return React.createElement('nav', {
    role: 'tablist', 'aria-orientation': 'vertical', 'aria-label': label,
    style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style },
    ...rest
  }, items.flatMap((it, i) => {
    const fila = React.createElement(RailItem, {
      key: it.id,
      item: it,
      active: it.id === activeId,
      onClick: () => { if (onSelect) onSelect(it.id); }
    });
    // El primero abre su zona si la tiene; después, solo cuando cambia.
    const cambiaDeZona = i === 0 ? Boolean(it.grupo) : it.grupo !== items[i - 1].grupo;
    if (!cambiaDeZona) return [fila];
    return [
      it.grupo
        ? React.createElement(RotuloDeZona, { key: 'z-' + it.id, titulo: it.grupo, sangria: 'var(--space-6)' })
        : React.createElement(FileteDeZona, { key: 'z-' + it.id, sangria: 'var(--space-6)' }),
      fila,
    ];
  }));
}
