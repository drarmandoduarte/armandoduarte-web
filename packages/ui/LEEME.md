# `@codice/ui` — el design system de Códice

Lo que este paquete da hoy se consume **por CSS**, no por JavaScript: un solo
`@import "@codice/ui/styles.css"` y el producto tiene la marca.

```
styles.css            la puerta: importa los tres de abajo y nada más
├── fuentes/fonts.css los ocho @font-face, locales, nunca CDN
├── codice-tokens.css los tokens como variables CSS
└── tipografia.css    cómo se parten los renglones (orden #16)
codice-tokens.json    el documento fuente de los tokens
components/           vacío a propósito — ver su LEEME.md
index.js              no exporta componentes, y no es un olvido
```

`index.js` y `components/LEEME.md` explican por qué no hay componentes todavía.
Lo de abajo es lo que sí hay que saber antes de tocar el CSS.

## La fuente de verdad de los tokens es el JSON (D28)

`codice-tokens.json` es el documento; `codice-tokens.css` es su forma ejecutable.
**Si un valor cambia, cambia en el JSON primero.** El design system histórico de
`01 Documentos/Marca/` no es canon: lo dice el `LEEME.md` de esa carpeta.

**Ningún hex vive fuera de este paquete.** Lo vigila `scripts/check-tokens.mjs`
sobre `apps/` y `packages/ui/components`, y los pares de contraste están en
aritmética en `tokens.test.mjs`, cada uno con su número al lado — porque un hex
que se aclara medio punto no se ve en un diff de color.

## `tipografia.css` — el comportamiento tipográfico vive acá (orden #16)

**Decisión de dirección del 29/9/2026** (orden Códice #16, pie 1). Es la única
hoja del paquete que dicta comportamiento en vez de valores, y está acá y no en
`apps/web/src/index.css` porque un titular que se parte mal es el mismo defecto
en los cuatro productos: la web, el consultorio, la academia y el asistente.
`apps/familia` lo hereda sin volver a escribirlo.

Lo que declara son dos reglas, y cada una hace un trabajo distinto:

| regla | a qué se aplica | qué hace |
|---|---|---|
| `text-wrap: balance` | `h1`, `h2`, `h3` | reparte las palabras entre los renglones en vez de llenar el primero |
| `text-wrap: pretty` | `.lead`, `.hero-sub` | evita que el último renglón de una bajada quede con una palabra suelta |

**La regla de la casa que esto sostiene**, y que dirección sacó del hero de
`/merida` en la #16: *ningún título termina ni se parte en un renglón de una o
dos palabras cortas, a ningún ancho.* La hoja la favorece; lo que la **comprueba**
es `apps/web/check/renglones.mjs`, que corre en la gate a cuatro anchos y cae
nombrando el título y el ancho. Las dos cosas hacen falta: `balance` es una
preferencia que el navegador puede ignorar, el guardián es una afirmación.

**Los títulos van por elemento y las bajadas por clase**, y la diferencia es
deuda declarada: `.lead` y `.hero-sub` son clases de `apps/web`, así que acá hay
una hoja del design system nombrando clases de un producto. La alternativa era
inventar una clase propia del paquete y ponerla en el markup de cada párrafo de
bajada de cada página. Dirección eligió la lista de dos nombres en un archivo. El
día que un tercer producto traiga un cuarto nombre, se unifica el nombre en el
design system y la lista vuelve a uno. Está escrito también dentro del archivo.

Ninguna de las dos reglas lleva `!important`, y su especificidad es la mínima
(0-0-1 / 0-1-0): un producto que necesite otra cosa gana sin pelear, y ese día la
excepción se ve en el diff del producto y no acá.

## Que la cadena de `@import` esté entera lo vigila un test

`apps/web/src/el-css-publicado-trae-lo-suyo.test.ts` mira **la hoja que se
publica** —`dist/assets/*.css`— y comprueba que traiga los ocho `@font-face`, los
tokens definidos y el CSS de la web. Existe porque se cortó el `@import` de este
paquete a propósito y **el build salió verde**: nada miraba qué hay adentro de la
hoja publicada. Se habría visto en las capturas de fidelidad, pero como un rojo
de píxeles que no dice la causa.

## Las fuentes son locales, siempre

`fuentes/` trae los `.woff2` y `fonts.css` sus ocho `@font-face` —tres familias,
`latin` y `latin-ext` de cada peso—. **Nunca un CDN**: lo pide `CLAUDE.md` y lo
sostiene la CSP de la #10, que no tiene `font-src` de terceros.

Son ocho `@font-face` y **seis** archivos en `dist/fuentes/`: `OpenSans-600-latin`
y `OpenSans-400-latin` son el mismo archivo byte por byte —Open Sans es
variable— y Vite emite uno solo para los dos.

## Lo que este paquete NO resuelve todavía

El **salto de texto al cargar la tipografía** (`size-adjust` / `@font-face`
`ascent-override`) es el pendiente § 5c de `docs/tareas.md`, que dirección
**cerró sin abrir** el 17/9/2026. El arreglo viviría acá. Y hay un dato medido en
la #16 que conviene tener escrito el día que se reabra: en `/merida` a 1024 px la
bajada del hero (`.hero-sub`, con `max-width:40ch`) cambia de un renglón a dos
cuando entra Montserrat, y eso **solo** es un CLS de 0,14. La unidad `ch` depende
de la fuente, así que el ancho máximo de la bajada cambia con el swap. Está en
`docs/informes/16/LEEME.md` con la traza.
