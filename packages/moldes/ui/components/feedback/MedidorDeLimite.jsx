import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Cuánto se lleva usado de un tope.

   ── La anatomía, que es lo que cambió ──────────────────────────────────────
   Un renglón, de izquierda a derecha: **el nombre con su reinicio debajo · la
   barra, fina y a todo el ancho libre · el porcentaje, alineado a la derecha.**

   Antes era `BarraDeUso`, que apilaba cuatro renglones —rótulo con el
   porcentaje, la cifra, la barra, la nota—. Se leía bien de a uno y mal de a
   tres: con los tres apilados, las tres barras quedaban a tres alturas
   distintas y **no había ninguna columna que se pudiera recorrer con el ojo**.
   Un panel de límites se lee para comparar, y comparar es leer hacia abajo.
   Alineado a la derecha, el porcentaje forma esa columna.

   ── Los tres estados, y el tercero es la razón de existir de esta pieza ────
   1. **Con tope** — barra y porcentaje.
   2. **Sin tope** — ni barra ni porcentaje: solo el nombre y lo usado. Una
      proporción de un tope que no existe es una proporción de la nada, y una
      barra al 80 % de un límite inventado asusta de verdad.
   3. **No se pudo leer** — ni barra ni cifra: el renglón lo dice. Es la regla
      que ya rige en Inicio, aquí: **una barra en cero y una barra que
      no se pudo leer se ven igual, y una de las dos miente.** Sin este estado,
      el mes que la lectura se cae el panel informa «0» de algo con la misma
      cara con la que informaría un mes sin dictar.

   ── El color por umbral ────────────────────────────────────────────────────
   el acento mientras hay margen, el aviso cuando hay que avisar — el reparto de
   roles del molde. **el error no aparece**: quedarse sin espacio no es una
   urgencia, y gastar el rojo aquí es no tenerlo el día que pasa
   algo grave. Son dos intensidades del mismo aviso y no dos colores.

   ── A 360 px ───────────────────────────────────────────────────────────────
   La barra baja a su propio renglón, a todo el ancho, y el porcentaje sube a la
   derecha del nombre. **Nunca tres cosas apretadas en una línea.** Se resuelve
   con `flex-wrap` y un ancho mínimo en la barra, sin media query: la pieza no
   sabe en qué pantalla está y no tiene por qué saberlo. */

/** El color del tramo, por dónde va la proporción. Puro, para poder probarlo. */
export function colorDeBarra(proporcion) {
  if (proporcion > 0.9) return 'var(--warning-text)';
  if (proporcion >= 0.75) return 'var(--warning)';
  return 'var(--primary)';
}

const SECUNDARIO = {
  fontSize: 'var(--text-sm)', color: 'var(--text-3)',
  lineHeight: 'var(--leading-snug)',
};

export function MedidorDeLimite({
  titulo, reinicio, usado, limite, proporcion, noSePudoLeer = false,
  style, ...rest
}) {
  const conBarra = !noSePudoLeer && typeof proporcion === 'number';
  const pct = conBarra ? Math.round(proporcion * 100) : null;

  return React.createElement('div', {
    style: {
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: 'var(--space-4) var(--space-8)', ...style,
    }, ...rest,
  },
    /* El nombre y, debajo, cuándo se reinicia. Ancho fijo para que las tres
       barras arranquen en la misma columna: sin eso, «Dictado por voz» y
       «Almacenamiento» dejarían las barras a dos alturas y dos sangrías. */
    React.createElement('div', {
      key: 'n', style: { flex: '0 0 auto', width: '11rem', minWidth: 0 },
    },
      React.createElement('p', {
        style: { fontSize: 'var(--text-md)', color: 'var(--text)', lineHeight: 'var(--leading-snug)' },
      }, titulo),
      reinicio && React.createElement('p', { style: SECUNDARIO }, reinicio),
    ),

    /* La barra, o lo que va en su lugar. Ocupa el ancho libre y es lo primero
       que baja de renglón cuando no hay. */
    React.createElement('div', {
      key: 'b', style: { flex: '1 1 8rem', minWidth: '8rem' },
    },
      conBarra
        ? React.createElement('div', {
          role: 'progressbar',
          'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct,
          'aria-label': typeof titulo === 'string' ? titulo : undefined,
          style: {
            height: 6, borderRadius: 'var(--radius-pill)',
            background: 'var(--surface-2)', overflow: 'hidden',
          },
        },
          React.createElement('div', {
            style: {
              width: `${Math.max(0, Math.min(1, proporcion)) * 100}%`, height: '100%',
              background: colorDeBarra(proporcion), borderRadius: 'var(--radius-pill)',
              transition: 'width var(--dur-slow) var(--ease-standard)',
            },
          }),
        )
        /* Sin barra, el hueco lo ocupa la cifra —lo usado, o el aviso de que no
           se pudo leer—. No queda vacío: un renglón con un nombre y nada más se
           lee como una fila rota. */
        : React.createElement('p', {
          style: {
            ...SECUNDARIO, fontVariantNumeric: 'tabular-nums',
            color: noSePudoLeer ? 'var(--warning-text)' : 'var(--text-3)',
          },
        }, usado),
    ),

    /* El porcentaje, a la derecha y alineado a la derecha: es la columna que se
       recorre con el ojo. Con tope se dice el porcentaje y debajo la cifra
       cruda, que es el dato que alguien compara. */
    React.createElement('div', {
      key: 'p',
      style: {
        flex: '0 0 auto', width: '7rem', textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      },
    },
      conBarra && React.createElement('p', {
        style: { fontSize: 'var(--text-md)', color: 'var(--text)', lineHeight: 'var(--leading-snug)' },
      }, `${pct} %`),
      conBarra && React.createElement('p', { style: SECUNDARIO }, `${usado} / ${limite}`),
    ),
  );
}

/* Un recuadro para un estado temporal.

   El borde tenue con el icono a la izquierda. **Es uno solo para cualquier
   estado temporal**, no uno por mensaje: dos maneras de decir «esto es así por
   ahora» son peor que una fea, que es lo que quedó escrito sobre el
   renglón de Inicio.

   Va en el aviso —el color que avisa— y sin relleno sólido: el sólido es de la
   urgencia. Lo que dice adentro lo pone quien lo usa, traducido. */
export function Aviso({ children, icono = 'info', style, ...rest }) {
  return React.createElement('div', {
    role: 'note',
    style: {
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)',
      padding: 'var(--space-6) var(--space-7)',
      border: 'var(--border-w) solid var(--warning-linea)',
      borderRadius: 'var(--radius-xl)',
      color: 'var(--text-2)', fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)', ...style,
    }, ...rest,
  },
    React.createElement('span', {
      key: 'i', style: { color: 'var(--warning-text)', flex: '0 0 auto', marginTop: 1 },
    }, React.createElement(Icon, { name: icono, size: 16 })),
    React.createElement('div', { key: 'c', style: { minWidth: 0 } }, children),
  );
}
