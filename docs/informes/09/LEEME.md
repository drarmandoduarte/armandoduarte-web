# Informe · Orden Códice #09 — El CSS en dos hojas

> **VEREDICTO: no se mergeó.** Se construyó entero, pasó la gate y se midió dos
> veces. El punto de Lighthouse que perseguía **ya no existía** y el beneficio de
> caché **no paga el costo**. Dirección cerró el PR #16 sin mergear; lo que valía
> se rescató en `web/09b-rescate`. El cierre está en `docs/tareas.md` § 5b.
>
> Este informe se conserva porque **el diagnóstico es el entregable**: dice qué se
> midió, cómo, y qué resultó falso de lo que se creía. Un pendiente cerrado con
> «se midió y no convenía» vale tanto como uno cerrado con código.

## El veredicto, en una tabla

| | main (una hoja) | con la división |
|---|--:|--:|
| Lighthouse móvil, peor de 5, ×2 tandas | 95 / 95 / 98 / 98 | **igual** |
| LCP de la portada | 2.554 ms | **+72 a +148 ms** |
| LCP de `/merida` | 2.556 ms | **+74 a +146 ms** |
| LCP de las dos legales | 1.803 / 1.953 ms | = / −150 ms |
| bytes en la 2.ª visita tras un deploy de CSS | 32.200 | **29.490** (−2.710) |
| LCP de la 2.ª visita | 528 ms | **508 ms** (−20) |

**Veinte milisegundos, y sólo para alguien que vuelve después de un deploy que
tocó el CSS, contra 72–148 ms en cada primera visita a las dos páginas con
foto.** Para un sitio al que se llega desde Google, las primeras visitas son casi
todas.

## Las dos cosas que se creían y resultaron falsas

**1 · «Al inicio le falta un punto».** El «86 contra 87» era de **antes de la
#05**, que subió la portada a 95 cambiando las fotos. El pendiente viajó con el
número viejo y nadie lo revisó — la misma falla que la regla de la casa persigue
desde la #04, pero al revés: ahí un umbral perdió su método, acá un diagnóstico
perdió su fecha.

**2 · «Los bytes de delante retrasan la foto».** Si fuera por bytes, partir la
hoja no cambiaría nada: son los mismos 31.353 contra 31.352. Y sin embargo la
foto llega **más tarde**. Lo que la retrasa es **cuántos pedidos `VeryHigh` hay
antes que ella**, no cuánto pesan: pasan de uno a dos y la imagen —que es
`High`— espera detrás de los dos. Se ve en la cascada de la sección B.1.

Del FCP no se dice nada, y es a propósito: la primera tanda lo mostró mejorando y
la segunda empeorando, en los mismos valores cuantizados. Era ruido, y el informe
anterior lo había dado por bueno.

---

# El trabajo, tal como se hizo

Rama `web/09-css-en-dos`, cerrada sin mergear. Acá va **la cascada, el
mecanismo, y las siete mutaciones con las que se vio fallar cada guardián**.

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

## E · Lo que decidió dirección

1. **No se mergea.** «Mi regla de *si el mecanismo está bien se mergea igual* la
   escribí pensando en *neutro*, no en *empeora*. La corrijo: un mecanismo
   correcto no justifica un costo medido sin un beneficio medido.»
2. **El 5d se arregló primero** — `/assets/` se servía con `max-age=0,
   must-revalidate`, confirmado sobre producción. Es la **orden #11**, ya en
   `main` y verificada. Sólo después de eso la pregunta de la #09 tenía sentido,
   y se volvió a medir encima.
3. **El rescate** va en `web/09b-rescate`: el guardián de fidelidad pasa a mirar
   las hojas enlazadas, y entra `el-css-publicado-trae-lo-suyo.test.ts`. Los
   tests de paralelo y prioridades no se rescatan —no tienen sentido con una hoja
   sola— y los del salto de texto tampoco: son del **5c**, que va en su propia
   orden porque el `size-adjust` toca el design system.
4. **El guardián de la #02 no hacía falta rescatarlo**: en `main` nunca se
   rompió. Se rompió y se restauró dentro de esta rama, que no entra.
5. **El punto de `terminos` sigue abierto.** Partir por página era lo que esta
   orden dejaba afuera, y ahora se sabe que partir por frecuencia de cambio no lo
   arregla.
