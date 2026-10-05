import React from 'react';

/* El rótulo y el filete que parten una columna en zonas.

   ── Por qué existe este archivo ────────────────────────────────────────────
   Primero se le pusieron zonas al menú lateral y después al riel de
   Ajustes, **con el mismo patrón**: el rótulo en versalitas 2xs con
   `--tracking-eyebrow`, y un filete de 1 px donde no hay rótulo. Copiarlo
   habría sido dos piezas que se ven iguales hasta el día que alguien toque una
   —«la pieza compartida no se bifurca»—, y son exactamente los dos lugares de
   la app donde una columna de nombres se lee de arriba abajo buscando uno.

   ── El rótulo es un rótulo, no una fila ────────────────────────────────────
   No se toca, no se marca y no ocupa alto de fila. Es la misma cejilla que
   encabeza los bloques de las pantallas, dicha con el token que existe para
   eso.

   ── Y el filete es lo que queda cuando el rótulo no puede estar ────────────
   Dos casos, y los dos son el mismo: el sidebar colapsado —en un riel de 64 px
   no entra una palabra, y una abreviatura sería un jeroglífico— y el grupo del
   final, que no es una zona sino lo que cuelga después de las zonas (la
   Papelera en el menú, el Plan en Ajustes). En los dos, lo que el rótulo hacía
   —la pausa— sobrevive sin él. */

export function RotuloDeZona({ titulo, sangria = '0', style, ...rest }) {
  return React.createElement('p', {
    style: {
      margin: 'var(--space-4) 0 var(--space-1)', padding: '0 ' + sangria,
      fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)',
      letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase',
      color: 'var(--text-3)', lineHeight: 'var(--leading-snug)', ...style,
    }, ...rest,
  }, titulo);
}

export function FileteDeZona({ sangria = '0', style, ...rest }) {
  return React.createElement('span', {
    'aria-hidden': 'true',
    style: {
      display: 'block', height: 1, background: 'var(--border)',
      margin: 'var(--space-4) ' + sangria + ' var(--space-2)', ...style,
    }, ...rest,
  });
}

/* El aire que queda donde estaba el rótulo del menú.

   Dirección sacó del riel los tres rótulos —«Hoy», «{Cuenta}» y
   «Administración»—: encasillan y no ayudan a encontrar nada. Lo que NO se va
   es la pausa, y por eso esto no es «nada»: es **exactamente el alto que el
   rótulo ocupaba**, dicho con los mismos tokens que lo dibujaban.

   El margen es el de `RotuloDeZona` y el alto es el de su renglón
   (`--text-2xs` × `--leading-snug`), así que el aire entre dos grupos mide lo
   mismo que medía con la palabra adentro. La orden lo pide con esas palabras
   —«entre los tres grupos queda el mismo aire que hoy»— y escrito así no hay
   un número nuevo que se pueda desincronizar del rótulo del riel de Ajustes,
   que sigue existiendo.

   `aria-hidden` porque no dice nada: la pausa es del ojo. Para un lector de
   pantalla el menú era ya una sola lista de enlaces —el rótulo era un `<p>`,
   no un encabezado de grupo—, así que sacarlo no le quita ninguna referencia. */

export function AireDeZona({ style, ...rest }) {
  return React.createElement('span', {
    'aria-hidden': 'true',
    style: {
      display: 'block',
      margin: 'var(--space-4) 0 var(--space-1)',
      height: 'calc(var(--text-2xs) * var(--leading-snug))',
      ...style,
    }, ...rest,
  });
}
