# Orden Códice #06 — El cromo, a nivel 512: menú, header, foco y pie

Rama `web/06-cromo` sobre `main`. Solo cromo: nada de contenido, nada de
funciones nuevas.

La referencia es el motor de 512 —`tema-cero/inc/universal/header.css`, bloque
`.tema-overlay*`— y el sitio vivo, capturado el 17/9 con Playwright igual que
los nuestros.

---

## Lo primero: había un defecto en producción, y no era de esta orden

**Entre el merge de la #05 y el de la #06, el header quedó ilegible sobre el
teal.** Medido en producción antes de tocar nada:

```
/merida · sección «Sobre el facilitador»  rgb(0, 87, 97)
  header con clase .claro : false
  color del wordmark      : rgb(46, 43, 37)   ← tinta
  contraste               : 1,70:1
```

`comportamiento.ts` decidía si una sección era oscura consultando un `Set` con
dos cadenas —el teal y la tinta en el formato que devuelve `getComputedStyle`— y
la #05 cambió el teal de la web sin tocar ese `Set`.

**Había un test para exactamente esto y siguió en verde.** Recalculaba los dos
valores desde los tokens y comparaba; leía `color.brand.teal`, que la #05 dejó
intacto a propósito para la app, mientras la web pasaba a `color.cff.tealDark`.
El test no estaba mal escrito: estaba **vigilando la copia equivocada**.

Se arregló quitando la copia: `esOscuro()` mide la luminancia del fondo que el
navegador pintó. No hay lista que mantener y un color nuevo funciona sin tocar
el archivo. Queda anotado como **pendiente 14** en `docs/tareas.md`, con la
lección: si se puede medir en vez de copiar, se mide.

---

## A · El telón es grafito, no la tinta de la marca

`--grafito #16181C` en `codice-tokens.css` y en el JSON (**1.2.1**, changelog
«grafito del overlay, #06»), bajo `color.chrome`, con la regla escrita al lado:

> **D25** — el cromo (header, overlay, pie) no lleva color de marca salvo en
> hover/activo. La marca vive en el contenido.

El telón va al 96 % con `blur(40px) saturate(140%)`, los dos del motor. Crema
sobre grafito: **16,62:1**.

En esta misma orden D25 saca el naranja de la marquita del pie y del anillo de
foco de toda la web.

## B · La escala: 24 px, peso 500, columna de 1200

Era `clamp(1.7rem, 3.6vw, 3rem)` a peso 300 en una columna de 1400: a 1440 daban
48 px finitos, tamaño de titular con peso de pie de foto.

El ítem de la página actual va en ámbar (`.activo` + `aria-current="page"`), y
**solo puede ser `/merida`**: los otros cinco destinos son anclas de la portada,
no páginas. Marcar «Quién soy» como activo estando en la portada sería decir
dónde uno va a saltar, no dónde está.

En móvil los ítems **no se achican** —el motor tampoco los achica y 24 px es el
tamaño al que se tocan cómodo—; lo que se achica es el aire de los costados.

## C · Arriba, una sola cosa: CERRAR

Había tres piezas y a 375 px se pisaban: se leía `CERRARARMANDO DUARTEARMANDOD…`
cortado por el borde. Ahora hay una. **No es una regla de responsive que tapa el
choque: es que el choque no existe.**

El `✕` pasó a SVG de 22 × 22 con `stroke: currentColor`. El motivo está en
`IconoCerrar.tsx`: `✕` (U+2715) es un glifo que Montserrat no trae, así que el
navegador caía a una fuente del sistema y la cruz llegaba con otro grosor y otra
alineación en cada sistema operativo.

El header se aparta con el menú abierto (`.ov-abierto .hd`). **Con
`visibility:hidden` además de `opacity:0`**, y eso no es decoración: con solo la
opacidad el header sigue en el orden de tabulación. Medido — los dos primeros
`Tab` caían en el wordmark y en el botón de WhatsApp, invisibles debajo del
telón, antes de llegar a «Cerrar». Un foco que aterriza en algo que no se ve es
peor que un header que se transparenta.

## D · El pie del menú: tres zonas, un tono

`MÉRIDA · YUCATÁN` · (hueco del idioma) · `ESCRIBIR POR WHATSAPP →`, todo en
crema al 65 %, el ámbar solo en hover. El del medio va vacío y con `aria-hidden`
a propósito: cuando entren EN y PT (D13) ahí va el selector, y dejándolo puesto
la izquierda y la derecha ya quedan donde van a quedar.

`comun.menu.lugar` es texto que ya existía en el bloque de contacto, sin la coma.

## E · El foco: del color del texto, solo con teclado

```css
:focus-visible{outline:2px solid currentColor;outline-offset:3px}
:focus:not(:focus-visible){outline:0}
a,button{-webkit-tap-highlight-color:transparent}
```

En `foco-tab-1440.jpg` se ve lo que la orden pedía comprobar: el anillo **sigue
el radio de la píldora**, no es un rectángulo alrededor de ella, y toma el teal
del botón en vez del naranja.

## F · El header: wordmark solo, teñido del fondo que pisa

Se fue el tagline de 9 px. No se pierde: sigue en el pie, en Great Vibes a 30 px,
que es donde una firma se lee.

**El wordmark no se centraba solo, como la orden daba por hecho.** Medido: 1,10 px
bajo del centro a 1440 y 3,10 px a 390. El `.marca` es un `inline-flex` dentro de
un bloque, así que se apoyaba en la línea base de una caja de línea cuyo alto lo
fija el `line-height:1.7` del `<body>`. Con las tres columnas del header en
`display:flex` queda **0,00 px** en los dos anchos, exactamente en
`(header-h − alto) / 2`.

**El botón de WhatsApp sobre oscuro tampoco «ya estaba así».** Tomaba
`--hd-acento`, que sobre oscuro es el ámbar, para el texto y para el borde:
**2,81:1 sobre el teal**. Pasó a crema con borde al 50 %.

### Las cuatro tintas, medidas con lienzo

| tinta | `.claro` | wordmark | menú | WA texto | WA borde | hairline |
|---|---|--:|--:|--:|--:|---|
| crema | no | 13,19 | 13,19 | 7,74 | 7,74 | 1 px, op .10 |
| cálido | no | 11,92 | 11,92 | 6,99 | 6,99 | 1 px, op .10 |
| tinta | sí | 13,08 | 13,08 | 13,17 | 4,44 | 1 px, op .10 |
| teal | sí | **7,61** | 7,61 | 7,60 | **3,10** | 1 px, op .10 |

El wordmark sobre teal venía de **1,70**. Umbral 4,5 para texto y 3 para el
borde: los doce números pasan.

## G · El pie de la página

La marquita de la hairline pasó de naranja a `--gris` (D25). Y
`WhatsApp · +52 462 199 3143` ya no se parte en dos líneas a 375 px
(`pie-375.jpg`).

---

## H · Contraste y accesibilidad

**El telón**, medido con el menú abierto sobre la página real (el fondo efectivo
es `#1F2124`: grafito al 96 % sobre lo que hay detrás):

| | ratio | umbral | |
|---|--:|--:|---|
| «Cerrar», crema 12 px | **15,09** | 4,5 | ✓ |
| ítems, crema 24 px / 500 | **15,09** | 3 | ✓ |
| pie del menú, crema al 65 % | **7,13** | 4,5 | ✓ |
| ítem activo / hover, ámbar 24 px | **5,47** | 3 | ✓ |

Contra el grafito puro: crema 16,62 y ámbar 6,03, que son los que afirma
`tokens.test.mjs`.

**El barrido completo** (`check/contraste.mjs`, ahora con la clase `ov-abierto`
puesta) pasó de **4 pares en rojo a 2**, y los dos que quedan son contenido:

```
✗ #DA8100 sobre #005761   2,81   ámbar sobre teal · pendiente 4c · lo mira la #07
✗ #EED2C2 sobre #BF3F06   3,72   la tapa del libro · lo mira la #07
```

Los dos que se fueron son los que esta orden sacó de la página: el rótulo del
menú al 50 % (1,46) y el ámbar del pie del menú (4,27). **Pendiente 4c se
achicó a un solo par y el cromo ya no aporta ninguno.**

**axe** (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`), con las transiciones
apagadas antes de revelar —sin eso mide los bloques a mitad del fundido e
informa treinta pares que el diseño no tiene—:

```
/ · cerrado          3 nodos   los dos pares de arriba
/ · menú ABIERTO     3 nodos   los mismos tres · el overlay no aporta ninguno
/merida · cerrado    2 nodos   el ámbar sobre teal
/privacidad          ✓ sin violaciones
/terminos            ✓ sin violaciones
```

**Lighthouse 13.4.1**, móvil, local sobre `dist/`, tres corridas, la peor:

| página | performance | accesibilidad | b. prácticas | SEO |
|---|---|---|---|---|
| inicio | 95 → **95** = | **100** | 100 | 100 |
| /merida | 95 → **95** = | **100** | 100 | 100 |
| privacidad | 98 → **98** = | **100** | 100 | 66 |
| terminos | 98 → **98** = | **100** | 100 | 66 |

Accesibilidad 100 en las cuatro y performance sin mover un punto: la pasada de
cromo no costó nada.

**Teclado**: con el menú abierto el `Tab` recorre cierre → seis ítems → WhatsApp
(ocho pasos, medidos) **y vuelve a «Cerrar»**; `Shift+Tab` desde «Cerrar» va al
último. `Escape` cierra y devuelve el foco al botón «Menú» — y solo si el foco
estaba adentro, para no robárselo a nadie.

La vuelta es la **trampa de foco**, que no existía y que dirección mandó hacer al
aprobar la orden, resolviendo la contradicción que se había subido: un overlay a
pantalla completa que deja escapar el `Tab` al contenido de atrás no es una
función que falta, es la accesibilidad del menú a medio terminar. Sin ella —
medido— después del octavo `Tab` el foco salía al «Ver el taller en Mérida» del
hero, un botón tapado por el telón que quien navega con teclado recorría a
ciegas.

Son tres casos y el tercero es el normal, no el defensivo: al abrir con el mouse
el foco se queda en el botón «Menú», que está **fuera** del overlay, y sin esa
rama el primer `Tab` se iría al header oculto en vez de a «Cerrar». La lista de
enfocables se recalcula en cada pulsación en vez de cachearse al abrir: una lista
cacheada es una copia, y esta orden ya pagó una vez por eso.

---

## I · La comparación, que es el criterio de cierre

- `referencia-512-{1440,390}.jpg` — el overlay de `512.com.uy`.
- `armando-overlay-{1440,390}.jpg` — el nuestro.
- `montaje-512-armando-{1440,390}.jpg` — lado a lado.
- `header-{crema,calido,tinta,teal}-1440.jpg` — las cuatro tintas.
- `foco-tab-1440.jpg` · `pie-375.jpg`.

### Lo que coincide al número

| | valor | |
|---|---|---|
| ítem · `font-size` | 24px | ✓ |
| ítem · `font-weight` | 500 | ✓ |
| ítem · `padding` | 18px 0px | ✓ |
| ítem · `gap` | 16px | ✓ |
| ítem · filete inferior | crema al **12 %** | ✓ |
| contenedor · `max-width` | 1200px | ✓ |
| contenedor · `gap` | 80px | ✓ |
| cierre · `position` | fixed | ✓ |
| cierre · `gap` | 14px | ✓ |
| cierre · `height` | 76px = `--header-h` | ✓ |
| pie · `padding-top` | 20px | ✓ |
| pie · filete superior | crema al **14 %** | ✓ |
| foco | 2px / currentColor / offset 3px | ✓ |

Están afirmados en `e2e/comportamiento.spec.ts`, no solo medidos a mano.

### Lo que NO coincide, y se declara

Tipografía (Montserrat, no la de 512) · tono del texto (crema, no hueso) ·
acento de hover (ámbar) · `line-height` de los ítems (1,2 contra 1,4 del motor,
que es lo que la orden fijó para Montserrat).

---

## Las mutaciones — y una que no mordió

| se rompió a propósito | quién se puso rojo |
|---|---|
| el `font-size` de los ítems, de vuelta al `clamp()` | el test de medidas **y** la captura del overlay: **32.737 píxeles** |
| el foco, de vuelta a `1px solid var(--naranja)` | «el anillo no es del color del texto»: esperaba `rgb(0, 87, 97)`, recibió `rgb(223, 73, 7)` |
| la trampa de foco, desactivada | «el Tab después del último ítem tiene que volver a "Cerrar", no escaparse» |

**La primera no mordió la primera vez, y eso fue el hallazgo.** Dio **cero
capturas en rojo**: las doce del guardián de fidelidad son de la página con el
menú **cerrado**, y cerrado el overlay es `visibility:hidden`. El rediseño entero
del menú —telón, escala, barra de arriba, pie— no tenía nada que lo vigilara.

Por eso se agregaron tres tests: dos capturas del overlay (1440 y 390) y uno que
mide sus números con `getComputedStyle`. Recién con eso la mutación que la orden
propone hace lo que la orden dice que hace.

---

## Desvíos declarados

Dos cosas de la sección F que **no se hicieron**, aprobadas por dirección al dar
el PASA. Ninguna se revierte; van escritas porque un desvío que no se declara es
un desvío que alguien descubre en tres meses.

### F.1 · el header sigue siendo transparente en reposo

La orden pedía que el header **siempre** tuviera fondo sobre sección oscura. Se
mantuvo el comportamiento de hoy: transparente en reposo, toma el color de la
sección al desplazar y vuelve a transparente al detenerse.

Dirección confirmó que la orden estaba mal en este punto: **el header
transparente que toma color al scrollear es una decisión cerrada del 11/9**, y
sigue vigente. Lo que la #06 arregló no es cuándo se tiñe sino **de qué color**:
antes sobre las secciones oscuras salía un beige sucio, ahora sale el color de la
sección.

### F.4 · no se comprobó que ninguna sección sea más baja que 2 × `--header-h`

La regla existía para evitar que una sección corta quedara entera debajo del
header. No se implementó como comprobación, y dirección aprobó que no esté
—porque con el header opaco al desplazar, el texto en crema y el
`scroll-padding-top` el defecto ya no aparece—. Medido, para que la afirmación
tenga número y no solo argumento:

| | umbral | sección más baja | por debajo |
|---|--:|---|---|
| `/` a 1440 | 152px | `ahora` **141px** | 1 |
| `/` a 390 | 128px | `ahora` 241px | ninguna |
| `/merida` a 1440 | 152px | `footer` 638px | ninguna |
| `/merida` a 390 | 128px | `reservar` 854px | ninguna |

**Una sola sección en toda la web incumple la regla, por 11 px, en un solo
ancho.** Y en su peor posición de scroll —el header justo sobre el final de la
franja— lo que se ve no es texto tapado: el header está teñido del **mismo teal
de la franja**, con el velo al 100 % y el texto en crema, así que la banda se lee
continua. El defecto que F.4 quería evitar no se produce ni en el único caso que
podría producirlo.

## Piso de tests

93 declarados, 0 saltados. `@codice/ui` 27 → **30**, `@codice/web` 9 → **17**,
`@codice/navegador` 14 → **20**. El detalle de cada grupo, en
`qa/piso-de-tests.md`.

## Lo que esta orden NO tocó

Los textos de los ítems. Los botones, los eyebrows, los números, las hairlines de
las secciones, el bloque de contacto y todo `/merida`: **es la #07**.
