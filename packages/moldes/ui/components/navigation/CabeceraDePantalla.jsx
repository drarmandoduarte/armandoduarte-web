import React from 'react';

/* La cabecera de una pantalla de la app: la FRASE y una LÍNEA de contexto.

   Existe por lo mismo que existe
   `CabeceraDeColumna`: hasta ahora las once pantallas del menú dibujaban su
   encabezado a mano, cada una en su archivo, con los mismos valores copiados.
   Once copias son once oportunidades de que una se corra un píxel — y a las
   tres semanas la casa deja de leerse como una sola.

   ── Dos piezas, no cinco ────────────────────────────────────────────────────
   Antes de esta orden una cabecera podía tener cinco renglones: una etiqueta en
   versalitas, el titular, un conteo, un párrafo de dos líneas y una fila de
   controles. **Aquí hay dos**: el titular —con el dato al lado, no debajo— y una
   línea de contexto. Lo que se toca cuelga aparte, en `children`.

   La etiqueta chica de arriba no existe y no vuelve: repetía la palabra que ya
   dicen la barra y el menú, y costaba 28 px de alto —16 de texto más 12 de
   aire— en el renglón más caro de la pantalla, que es el primero: lo que gasta
   arriba empuja todo lo de abajo fuera de la ventana.

   ── El DATO va en la línea del titular ──────────────────────────────────────
   «5 cosas para mirar», «12 personas», «Todo el estante · 12 de 240» son dato y
   se quedan; lo que no se quedan es el renglón propio. Alineados por la línea de
   base del titular y en gris: **el contador informa, solo la urgencia alarma**,
   igual que en `CabeceraDeColumna`.

   Se envuelve (`flexWrap`) porque en una ventana angosta o en francés el dato
   no entra al lado del titular, y bajar es preferible a estrujar.

   ── El CONTEXTO es una línea, y es responsabilidad de quien escribe ─────────
   El componente no la corta ni la abrevia: cortar texto es esconder texto, y en
   cuatro idiomas el que se corta siempre es el mismo. Lo que hace es fijar la
   medida de lectura —`--measure-cabecera`, 48 rem— para que el ancho no dependa
   de la pantalla; que entre en una línea lo decide el string, y en castellano eso
   son unos 90 caracteres. En francés y portugués crece ~35% y puede tomar dos:
   es el precio conocido de los cuatro idiomas, y es preferible a un texto
   recortado con puntos suspensivos.

   ── Lo que NO hace ──────────────────────────────────────────────────────────
   No dibuja pestañas, ni buscadores, ni conmutadores. Todo eso entra por
   `children` y lo compone cada pantalla con su propio aire: son controles de esa
   pantalla, no de la cabecera, y meterlos aquí habría obligado a una prop por
   caso — que es una bifurcación con otro nombre. */

export function CabeceraDePantalla({ titulo, dato, contexto, acciones, children, style, ...rest }) {
  return React.createElement('header', {
    style: { marginBottom: 'var(--space-16)', ...style }, ...rest
  },
    React.createElement('div', {
      key: 'fila',
      style: {
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 'var(--space-8)'
      }
    },
      React.createElement('div', {
        key: 'texto',
        /* `minWidth: 0` es lo que deja que el bloque de texto encoja en vez de
           empujar las acciones fuera de la pantalla: sin eso, un titular largo
           en francés hace crecer la fila y el botón se va de viaje. */
        style: { minWidth: 0, maxWidth: 'var(--measure-cabecera)' }
      },
        React.createElement('div', {
          key: 'titular',
          style: {
            display: 'flex', flexWrap: 'wrap', alignItems: 'baseline',
            columnGap: 'var(--space-8)', rowGap: 'var(--space-1)'
          }
        },
          /* El titular se escribe entero aquí y no se hereda de `base.css`
             —aunque los valores son EXACTAMENTE los que las once pantallas
             venían dibujando— porque una pieza del design system que depende de
             una hoja de la app no es una pieza: es media. `--tracking-tight` y
             no `--tracking-display` a propósito: es lo que un h1 tiene hoy en
             toda la casa, y esta orden mueve el alto de la cabecera, no el
             dibujo de sus letras. */
          React.createElement('h1', {
            key: 'h',
            style: {
              margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)',
              fontWeight: 'var(--weight-display)', lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)'
            }
          }, titulo),
          dato ? React.createElement('span', {
            key: 'd',
            style: {
              fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums',
              color: 'var(--text-3)'
            }
          }, dato) : null
        ),
        contexto ? React.createElement('p', {
          key: 'c',
          style: {
            margin: 'var(--space-6) 0 0', fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-relaxed)', color: 'var(--text-2)'
          }
        }, contexto) : null
      ),
      acciones ?? null
    ),

    children ? React.createElement('div', {
      key: 'debajo', style: { marginTop: 'var(--space-12)' }
    }, children) : null
  );
}
