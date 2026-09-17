# Informe · Orden Códice #09 — El CSS en dos hojas

Rama `web/09-css-en-dos`. Los números de Lighthouse y el cierre del pendiente
están en `docs/tareas.md` § 5b; acá va lo que no entra ahí: **la cascada, el
mecanismo, y las mutaciones con las que se vio fallar cada guardián**.

---

## A · La división

`@codice/ui` pasa a dos entradas:

| entrada | archivo | qué trae | bytes en `dist` |
|---|---|---|--:|
| `@codice/ui/fuentes` | `fuentes/fonts.css` | los ocho `@font-face` | **2.711** |
| `@codice/ui/styles` | `styles.css` → `codice-tokens.css` | los tokens | **28.642** |

Las dos sumadas dan **31.353 bytes** contra los **31.352** de la hoja única que
reemplazan: un byte. La orden no vino a bajar peso y no lo bajó.

### Por qué la hoja de fuentes se compila aparte

El build principal **no puede** emitir dos hojas, y no es una opinión: son dos
errores de Vite 6 que se chocaron al intentarlo.

- Con `cssCodeSplit: false` —que es lo que hoy saca el CSS afuera del JavaScript
  en vez de inyectarlo con un `<style>`— todo el CSS del build va a una sola
  hoja. Pasarle la hoja de fuentes como segunda entrada da:
  «When "build.cssCodeSplit: false" is set, "rollupOptions.input" should not
  include CSS files».
- Con `cssCodeSplit: true` y dos entradas: «Invalid value for option
  "output.inlineDynamicImports" — multiple inputs are not supported». Lo obliga
  el `format: 'iife'` de la #02, que es lo que permite pedir el script con
  `defer` en vez de como módulo.

Así que la hoja de fuentes sale de **su propio build**
(`apps/web/scripts/hoja-de-fuentes.mjs`), donde es la única entrada y no tiene
con qué fusionarse. El pipeline de CSS de Vite se conserva entero, y eso importa
por algo que se midió: **`OpenSans-600-latin.woff2` y `OpenSans-400-latin.woff2`
son el mismo archivo byte por byte** —Open Sans es variable— y Vite lo nota y
emite **uno solo** para los dos `@font-face`. `dist/fuentes/` tiene seis
archivos, no ocho. El sitio estático de `qa/referencia/` trae los ocho y baja
73 KB de más; copiar `fonts.css` a `public/` habría copiado ese defecto.

También se descartó un `import '@codice/ui/fuentes?url'` en
`entrada-navegador.ts`: **se poda**. Sin una variable que lo use, Rollup borra el
módulo y la hoja no se emite — comprobado, el build sale verde y sin el archivo.

---

## B · Lo que se probó, que es el mecanismo

### B.1 · Las dos se piden en paralelo

Portada, enlace estrangulado en los 1,6 Mbit/s y 150 ms de Lighthouse móvil.
`pide` y `llega` son milisegundos desde el primer pedido:

**`main` — una hoja**

```
recurso                            prioridad      pide    llega    bytes
/                                  VeryHigh        0ms    237ms    16350
/assets/style-<hash>.css           VeryHigh      181ms    680ms    31535
/img/armando/medio-cuerpo-900.webp High          187ms    905ms    71755
/assets/comportamiento-<hash>.js   Low           238ms    433ms     2625
/fuentes/OpenSans-400-latin.woff2  VeryHigh      694ms   1639ms    43134
/fuentes/Montserrat-300-600.woff2  VeryHigh      697ms   1558ms    35678
/fuentes/GreatVibes-400-latin.wof  VeryHigh      699ms   1468ms    29766
```

**`#09` — dos hojas**

```
recurso                            prioridad      pide    llega    bytes
/                                  VeryHigh        0ms    232ms    16410
/assets/fuentes-<hash>.css         VeryHigh      172ms    360ms     2893
/assets/style-<hash>.css           VeryHigh      172ms    651ms    28825
/img/armando/medio-cuerpo-900.webp High          179ms    989ms    71755
/assets/comportamiento-<hash>.js   Low           232ms    427ms     2625
/fuentes/OpenSans-400-latin.woff2  VeryHigh      658ms   1627ms    43134
/fuentes/Montserrat-300-600.woff2  VeryHigh      661ms   1544ms    35678
/fuentes/GreatVibes-400-latin.wof  VeryHigh      664ms   1461ms    29766
```

Las dos hojas se piden en **el mismo milisegundo** (172 ms) y la chica llega
**291 ms antes** que la grande (360 contra 651). Ése es el efecto que la orden
compró: los `@font-face` quedan declarados temprano, y las tipografías salen a
pedirse **36 ms antes** (658 contra 694).

### B.2 · Prioridades

Las dos hojas en `VeryHigh`, la foto del hero en `High` —se lo da el
`fetchpriority="high"`, sin el cual sería `Low`—. Se lee por CDP porque la
prioridad **no está en la API de Playwright**: es `request.initialPriority` de
`Network.requestWillBeSent`.

### B.3 · CLS — no se movió, y no era cero

La orden pedía comprobar que «CLS sigue en 0». Lo medido:

| página | Lighthouse `main` | Lighthouse `#09` | PerformanceObserver `main` | PerformanceObserver `#09` |
|---|--:|--:|--:|--:|
| inicio | 0,0008 | 0,0008 | 0,0007819740195530026 | 0,0007819740195530026 |
| taller | 0,0002 | 0,0002 | 0,00015047154443538312 | 0,00015047154443538312 |
| privacidad | 0,0531 | 0,0531 | 0,004878 | 0,004878 |
| terminos | 0,0068 | 0,0068 | 0,00003486632496678317 | 0,00003486632496678317 |

Cinco corridas de cada lado en Lighthouse, tres en Playwright: **idénticos, hasta
el último dígito**. O sea que el criterio de la orden se cumple — la división no
movió el CLS ni un milímetro. Lo que no era cierto era la premisa: las cuatro
páginas ya tenían un salto de texto al cambiar la tipografía del sistema por la
buena, y es anterior a esta orden. **Queda abierto como pendiente 5c**, con el
arreglo estándar anotado (`size-adjust` en los `@font-face`), porque es una
decisión sobre el design system.

### B.4 · El guardián de fidelidad estaba ciego al `<link>` nuevo

La orden lo anticipaba y tenía razón: la #09 le agregó un `<link
rel="stylesheet">` al `<head>` de las cuatro páginas y **las doce comprobaciones
siguieron en verde**, porque la lista de `cabeza()` no miraba las hojas. Ahora
las mira —en orden, con el hash normalizado a `<hash>` para que la captura no se
reescriba en cada build— y **las cuatro `*-cabeza.json` están actualizadas por
esta orden**, que es la frase que el guardián exige en el PR.

---

## C · Ver fallar cada guardián

Siete mutaciones, cada mitad rota por separado.

| # | mutación | qué se pone rojo |
|---|---|---|
| M1 | vuelve el `@import "./fuentes/fonts.css"` a `packages/ui/styles.css` | **nada, antes de esta orden.** Ver abajo |
| M2 | se saca `node scripts/hoja-de-fuentes.mjs` del build | el prerender mata el build: «esperaba exactamente un `fuentes-*.css` y hay 0» |
| M3 | las dos hojas al revés en el `<head>` | el test (3) de `el-css-va-en-dos-hojas`, el piso de `dos-hojas.spec`, **y las cuatro capturas del guardián de fidelidad** |
| M4 | la hoja de fuentes al final del `<body>` | el piso y el de prioridades. **No** los del salto de texto |
| M5 | la hoja de fuentes sin bloquear (`media="print" onload="this.media='all'"`) | el de prioridades: baja a `Low` |
| M6 | `--lectura` de `system-ui` a `Georgia,serif` | el salto de texto de inicio (×20), privacidad y terminos (×200) |
| M7 | `--display` de `system-ui` a `Georgia,serif` | el salto de texto de inicio y **taller** |

### M1 es la que justifica cuatro tests nuevos

Devolver el `@import` a `styles.css` es **el modo exacto en que esta decisión se
deshace**, y el build salía **verde**: el prerender seguía viendo dos hojas y el
guardián de fidelidad seguía viendo dos `<link>`. Pero los ocho `@font-face`
viajaban **dos veces**, una en cada hoja, y cada visitante bajaba 2,7 KB de más
en lo único que bloquea el dibujo — o sea la web quedaba **peor que antes de la
orden**, callada.

Por eso existe `apps/web/src/el-css-va-en-dos-hojas.test.ts`: cuatro tests que no
miran cuántos archivos hay —eso ya lo mata el prerender— sino **qué hay adentro
de cada uno**. Con el guardián puesto, M1 da:

```
× (1) la hoja de estilos no declara ni un @font-face
  AssertionError: los @font-face volvieron a la hoja de estilos … expected 8 to be +0
```

### M4 y M7 son las que hay que leer con cuidado

**M4 no rompe los tests del salto de texto**, y se anota porque es más útil que
las que sí: mover la hoja de fuentes al final del `<body>` la deja igual de
temprana —el preload scanner la encuentra— y llega antes del primer cuadro. O
sea que esos cuatro tests vigilan **cuánto salta el texto**, no dónde está
escrito el `<link>`; para eso están los otros tres. La afirmación contraria
estuvo escrita en el docblock del spec hasta que la mutación la desmintió.

**M6 sola dejaba `taller` en verde**, porque el salto de `/merida` a 390 px es
del rótulo de la cabecera y no del cuerpo. Hizo falta M7 para verlo rojo. Es la
regla de la casa aplicada: se prueba rompiendo cada mitad por separado, y un test
que sobrevive porque otro lo sostiene no está sosteniendo nada.

### Y de paso: el guardián de la #02, que casi se pierde

Al escribir el guardián de las dos hojas, la comprobación de la #02 —«ningún
otro `.js` en `dist/assets`»— quedó **reemplazada en vez de acompañada**. Se
devolvió y se volvió a probar con una sonda (un `.js` de más copiado a `dist`):

```
prerender: dist/assets tiene 1 archivo(s) .js de más: intruso-abc123.js.
La web pública sirve UN script y no se hidrata; más de uno significa que algo
volvió a compilar la app.
```

---

## D · Lo que no se tocó

Ningún color, texto, espacio ni componente — las doce capturas de píxeles del
guardián de fidelidad no se movieron. El contenido de los `@font-face`. Las otras
apps del monorepo. El `vercel.json`, que la orden prohibía tocar — y de ahí sale
el pendiente 5d.

## E · Lo que necesita decisión de dirección

1. **El punto que la orden perseguía ya no existía** (pendiente 5b): el «86
   contra 87» es de antes de la #05, que subió la portada a 95. Hoy los cuatro
   puntajes son idénticos de los dos lados. La división se mergea porque el
   mecanismo es correcto, no porque haya movido el número — y se dice así.
2. **El punto de `terminos` sigue perdido.** Partir la hoja por página era lo que
   la orden dejaba afuera; si dirección lo quiere, es su propia orden.
3. **Pendiente 5c** — el salto de texto de las cuatro páginas, anterior a esta
   orden. `/privacidad` es el peor (0,053 contra el umbral 0,1).
4. **Pendiente 5d** — `/assets/` no tiene `Cache-Control` en `vercel.json`. Es la
   mitad que le falta al argumento de esta orden: separar lo que casi nunca
   cambia sirve **si el navegador después puede guardarlo**. Un renglón, y lo
   vigilarían las doce comprobaciones que la #08 ya escribió.
