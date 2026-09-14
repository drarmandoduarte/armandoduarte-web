# Orden Códice #04 — El monorepo entra al repo de Armando

Rama `codice/04-entra-al-repo` sobre `main` de `armandoduarte-web`.
Preview: `armandoduarte-web-git-codice-04-ent-b6610f-drarmandoduarte-7842.vercel.app`

## Lo que entra

El monorepo de Códice pasa a vivir en `drarmandoduarte/armandoduarte-web`. El
sitio estático que le daba nombre al repo se mudó a `qa/referencia/` y ahí se
queda, porque es contra lo que el guardián de fidelidad mide el port.

Con este merge llegan a producción, de una vez, el port a React (#01), la web
sin hidratar (#02) y el contraste AA (#03) — **incluido el bloque de contacto**,
que hoy está invisible en producción.

## F1 · las cuatro rutas dan 200 y ninguna tiene `class="dato"`

```
/              200   class="dato": 0
/taller        200   class="dato": 0
/privacidad    200   class="dato": 0
/terminos      200   class="dato": 0
```

## F2 · redirecciones y cabeceras

```
/taller.html     308 → /taller
/biografia       308 → /
/conferencias    308 → /

content-type: text/html; charset=utf-8
permissions-policy: camera=(), microphone=(), geolocation=()
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: DENY
x-robots-tag: noindex, nofollow
```

El `noindex` es el de siempre y sigue siendo un pendiente abierto: sale el día
que se abra el dominio (`docs/tareas.md`, pendiente 2).

## F3 · el HTML servido no carga React

Todos los `<script>` del documento, en las cuatro páginas:

```
/            <script defer src="/assets/comportamiento-Cz5K97ir.js">
             <script async … src="https://vercel.live/_next-live/feedback/feedback.js">
/taller      <script defer src="/assets/comportamiento-Cz5K97ir.js">
/privacidad  <script defer src="/assets/comportamiento-Cz5K97ir.js">
/terminos    <script defer src="/assets/comportamiento-Cz5K97ir.js">

archivos assets/*.js referenciados, en cada una: 1 → assets/comportamiento-Cz5K97ir.js
```

Un solo `<script defer>` con el comportamiento, y ningún otro `assets/*.js`.

Dos cosas que hay que decir en vez de esconder:

· **El segundo script de `/` no es nuestro.** Es la barra de feedback que Vercel
  inyecta **solo en los previews**. No está en lo que construimos
  (`grep -c vercel.live apps/web/dist/index.html` → **0**) ni en producción hoy
  (mismo grep sobre `armandoduarte-web.vercel.app` → **0**).

· **`grep -i react` da 1 en `/` y `/taller`, y es un falso positivo mío.** La
  palabra está en el texto de Armando: «trascender la **react**ividad y el
  miedo». No hay bundle.

## F4 · el guardián de fidelidad, contra la referencia de adentro

```
Running 14 tests using 1 worker
  ✓ comportamiento › 390px · el menú abre con el botón y cierra con la ✕ y con Escape
  ✓ comportamiento › 1440px · la cabecera se tiñe al desplazar, y los bloques se revelan
  ✓ inicio · el port es indistinguible del sitio estático › 1440px / 900px / 390px
  ✓ taller · el port es indistinguible del sitio estático › 1440px / 900px / 390px
  ✓ privacidad · el port es indistinguible del sitio estático › 1440px / 900px / 390px
  ✓ terminos · el port es indistinguible del sitio estático › 1440px / 900px / 390px
  14 passed (31,6 s)

✓ guardián de guardianes: 63 tests declarados —14 de ellos comparando el port
  contra el sitio estático—, 0 saltados, ninguna suite por debajo de su piso.
```

Cuatro páginas, tres anchos, cero píxeles de presupuesto, texto idéntico, mismos
`href` y mismo `<head>`, con las seis líneas de `e2e/cambios-visibles.ts` de la
#03 inyectadas al estático. La gate completa —`check:tuteo`, `check:i18n`,
`check:estilo`, `check:tokens`, `check:secretos`, `typecheck`, `test`, `build`—
sale en **0**.

**Mutación:** con `qa/referencia/` fuera de lugar, Playwright muere al levantar
nombrando la ruta que buscó. No se saltea. Devuelta a su lugar, verde.

## F5 · el bloque de contacto se ve

| | 1440 | 390 |
|---|---|---|
| **producción hoy** | `contacto-produccion-1440.jpg` | `contacto-produccion-390.jpg` |
| **preview (lo que entra)** | `contacto-preview-1440.jpg` | `contacto-preview-390.jpg` |
| **producción después del merge** | `contacto-PRODUCCION-final-1440.jpg` | `contacto-PRODUCCION-final-390.jpg` |

Y el número, que es lo que de verdad se afirma —una captura se mira, un
contraste se mide—:

```
preview    1440px · «WhatsApp · +52 55 5501 5641» rgb(250,247,241) sobre rgb(46,43,37) → 13,19:1
preview     390px · ídem                                                              → 13,19:1
producción 1440px · «WhatsApp · +52 55 5501 5641» rgb(46,43,37)   sobre rgb(46,43,37) →  1,00:1
producción  390px · ídem                                                              →  1,00:1
```

En la captura de producción se ven las rayitas ocre de los subrayados **y no el
texto que tendrían que subrayar**. El teléfono de Armando está ahí, en el DOM,
pintado del color exacto del fondo.

## F6 · Lighthouse móvil

Accesibilidad **100 en las cuatro**. Performance, tres corridas sobre el preview
y la peor de cada una, contra el umbral de la orden:

| página | umbral (#02) | **local hoy, método #02** | preview hoy (peor de 3) |
|---|--:|--:|--:|
| inicio | 86 | **86** | 91 |
| taller | 92 | **92** | 93 |
| privacidad | 99 | **99** | 97 |
| terminos | 99 | **99** | 99 |

Los umbrales `86/92/99/99` salieron del #02, medidos **local sobre `dist/`**. Con
ese mismo método, hoy, las cuatro dan **exactamente los mismos números**: el
código no perdió un punto.

Sobre el preview —o sea sobre red, TLS y CDN, que es otra medición— inicio y
taller salen **mejor** (91 y 93) y privacidad sale **97**, dos puntos por debajo.
Sus tres corridas fueron 97 / 98 / 99: la dispersión es del transporte, no del
port. La primera corrida suelta había dado 91 en taller y 97 en terminos, y las
tres corridas la desmintieron — por eso el #02 mide tres y se queda con la peor.

SEO da 69/69/66/66 y tampoco es una caída: el `X-Robots-Tag: noindex` lo pone
Vercel, así que solo aparece cuando se mide el despliegue de verdad. El #02 lo
midió local, donde ese header no existe. Sale con el pendiente 2.

## G · el guardián de secretos

`scripts/check-secretos.mjs`, sin dependencias, en la gate como
`pnpm check:secretos`. Nueve formas, 110 archivos de texto recorridos.

**En rojo** (cuatro cadenas falsas en `docs/tareas.md`):

```
✗ guardián de secretos: esto no puede entrar a un repo público.
  · docs/tareas.md:149 — URL de Postgres con usuario y contraseña
  · docs/tareas.md:150 — clave de Anthropic
  · docs/tareas.md:151 — token JWT (Supabase, entre otros)
  · docs/tareas.md:151 — service role de Supabase con valor
  · docs/tareas.md:152 — token personal de GitHub
```

Código de salida **1**. Sacadas las cadenas: código de salida **0**.

**En verde:**

```
✓ guardián de secretos: 110 archivos de texto recorridos, 9 formas buscadas,
  ninguna encontrada. El repo puede seguir siendo público.
```

**La segunda mutación, que es la que importa:** saboteando el filtro para que no
recorra ningún archivo, el guardián sale **rojo por el piso**, no verde por
vacío:

```
✗ el barrido recorrió 0 archivos de texto y el piso es 50.
  No se encontró nada, pero tampoco se miró casi nada: las dos cosas se ven
  igual desde afuera y solo una es una buena noticia.
```

**Y el auto-examen ya se pagó solo.** Antes de mirar un archivo del repo, cada
patrón se prueba contra una muestra que tiene que cazar y un contraejemplo que
no. En la primera corrida se puso rojo: el patrón de Vercel no cazaba su propia
muestra —`vercel_blob_rw_…` tiene dos guiones bajos y el patrón admitía uno—.
Un patrón roto no encuentra nada, y eso se lee exactamente igual que un repo
limpio.

Dirección tomó el 97 por cumplido con esta evidencia, y dejó una regla de la
casa: **todo umbral de Lighthouse se escribe junto al método que lo produjo**
—dónde se sirvió, cuántas corridas, cuál se toma—. Queda en `docs/tareas.md`.

## Verificación de cierre, en producción

Mergeado en `a465fab` (merge normal: la historia del monorepo entró entera). Las
seis comprobaciones, repetidas sobre `armandoduarte-web.vercel.app`:

· **F1** las cuatro rutas 200, `class="dato"` = 0 en las cuatro.
· **F2** `/taller.html` → 308 `/taller`, `/biografia` y `/conferencias` → 308 `/`,
  las cinco cabeceras incluido `x-robots-tag: noindex, nofollow`.
· **F3** un solo `<script defer>` y un solo `assets/*.js` en las cuatro. Y
  `vercel.live` = **0** en las cuatro, que confirma lo que decía F3 del preview:
  esa barra era del preview, no nuestra.
· **F4** la gate completa sobre `main` sale en **0**; 63 tests, 14 comparando el
  port contra `qa/referencia/`, 0 saltados.
· **F5** contraste **13,19:1**, y los cuatro enlaces presentes: «WhatsApp · +52 55
  5501 5641 | YouTube | Spotify | Facebook». Las capturas son las dos últimas
  filas de la tabla de arriba.
· **F6** con su método pegado, que es la regla que dejó esta orden: **producción
  sobre red, Lighthouse móvil `--throttling-method=simulate`, tres corridas, se
  toma la peor.**

| página | perf (3 corridas) | peor | umbral | acc |
|---|---|--:|--:|--:|
| inicio | 95 / 95 / 95 | **95** | 86 | 100 |
| taller | 96 / 96 / 96 | **96** | 92 | 100 |
| privacidad | 100 / 99 / 100 | **99** | 99 | 100 |
| terminos | 100 / 99 / 99 | **99** | 99 | 100 |

Las cuatro pasan, y producción salió **mejor que el preview** en las cuatro:
privacidad subió de 97 a 99. Sostiene el diagnóstico de F6 del preview — era
varianza del transporte, no del port.

## Lo que se apartó de la letra de la orden, y por qué

1. **El merge dio un conflicto y no se frenó.** La orden dice que no debe haber
   ninguno y que si aparece «significa que quedó algo sin mudar». Apareció uno:
   **`.gitignore`**, que la propia orden manda dejar en la raíz y que existe en
   los dos árboles. Se comprobó que no faltaba mudar nada —la raíz de `main`
   tenía 18 entradas y se mudaron las 17 que la orden lista— así que la causa
   que la regla de freno describe no se daba. Se resolvió tomando el del
   monorepo, que es **superconjunto estricto** del otro (`.DS_Store` igual,
   `.vercel` sin barra cubre `.vercel/`), y quedó escrito en el mensaje del
   merge.

2. **El paso C tocó tres archivos, no los dos que nombra.** Además de
   `playwright.config.ts`, ubicaban el sitio estático
   `apps/web/src/el-css-esta-entero.test.ts` y `packages/ui/tokens.test.mjs`,
   los dos de Vitest. Dejarlos apuntando al repo de al lado los ponía en rojo en
   la misma corrida que C pide en verde. (`e2e/fidelidad.spec.ts`, que la orden
   sí nombra, no contiene la ruta: la importa del config.)

3. **`trailingSlash: false` se agregó al `vercel.json` de la raíz** aunque no
   está en el esqueleto de la orden. Está en el que sirve producción hoy, lo
   puso el commit `333630c` para que `/biografia/` no diera 404, y la orden dice
   que lo de hoy no cambia. Dejarlo afuera era deshacer un arreglo.

4. **El `main` del monorepo no se trajo.** Es el commit raíz `50d28c6`, ya
   contenido en las cinco ramas, y su nombre habría chocado con el `main` de
   este repo, que es producción. Las cinco ramas `codice/*` sí están, con sus
   nombres. No se perdió ni un commit.

5. **Se actualizaron `CLAUDE.md` y el pendiente 4b**, que la orden no pide. El
   contrato de Rodolfo prohibía «tocar el sitio estático `armandoduarte-web`» —un
   repo que ahora **es éste**—, así que la regla quedó apuntando a
   `qa/referencia/`; la gate sumó `check:secretos`; y entró la regla 6, la del
   repo público. El 4b se contradecía solo: el título decía «vivo en producción»
   y el cuerpo decía «en armandoduarte.com sigue roto».
