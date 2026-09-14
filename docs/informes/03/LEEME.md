# Orden Códice #03 · contraste a AA, con el número delante

Qué se midió, qué se movió, qué se dejó como estaba y por qué. Dirección aprueba
**mirando las capturas** de la sección siguiente; los números están para que la
decisión no dependa de la pantalla de nadie.

---

## Lo primero, porque no es contraste: el bloque de contacto estaba invisible

`contacto-1440.jpg` · `contacto-390.jpg`

En la portada, el teléfono de WhatsApp y los enlaces a YouTube, Spotify y
Facebook se dibujaban **tinta sobre tinta**: contraste **1,00:1**. No es un
matiz de accesibilidad, es texto que no está. Solo se veían las rayitas ocre de
los subrayados, que es lo que hace que a simple vista la sección parezca
maquetada a propósito.

Está así **hoy, en producción**, en `armandoduarte.com`, y el port lo heredó
igual de fiel que todo lo demás. La causa es una colisión de especificidad en
`estilo.css`:

```css
.tinta .grande{color:var(--crema)}      /* línea 58 · (0,2,0) */
.contacto .grande{…;color:var(--tinta)}  /* línea 226 · (0,2,0), y va después */
```

Misma especificidad, gana la de abajo. El arreglo más chico es `color:inherit`:
en un fondo claro hereda la tinta del `<body>` y no cambia nada; dentro de la
sección oscura hereda el crema, que es lo que la regla de arriba siempre quiso.

**No lo pedía la orden** —la #03 habla de mover valores de token— y se hizo
igual, por dos razones: aparece en la tabla de la Parte A como el peor par de
las cuatro páginas, y dejar el teléfono de Armando invisible mientras se publica
una orden llamada «contraste a AA» no tiene defensa. Se declara acá, se ve en la
captura, y se revierte con una palabra si dirección prefiere que no.

> El sitio estático sigue con el defecto: Rodolfo no toca `armandoduarte-web`.
> Es una decisión de dirección si se arregla allá también mientras el monorepo
> no sea producción.

---

## A · lo que se midió

`apps/web/check/contraste.mjs`, contra `dist/` servido local:

```sh
node check/contraste.mjs http://127.0.0.1:4180 /tmp/pares.json
```

Recorre **las cuatro páginas a 1440 y a 390 px, con el menú cerrado y abierto**,
y de cada elemento con texto saca el color efectivo, el fondo efectivo (subiendo
por los ancestros y componiendo los translúcidos), el alfa acumulado, el tamaño,
el peso, el umbral que le corresponde y el cociente de contraste.

No sale del CSS leído como texto y es a propósito: `color-mix()`, `var()`, los
`clamp()` de la escala tipográfica y las opacidades heredadas **no se pueden
resolver leyendo el archivo**. Los colores se despejan pintándolos en un lienzo
sobre negro y sobre blanco, que da el color y el alfa exactos sea cual sea la
sintaxis.

**Lo que este barrido no mira, dicho:** `:hover` y `:focus`, texto sobre
fotografías, y pseudo-elementos con texto. Los tres, porque en esta web no
existen; si alguna vez existen, el barrido deja de ser completo y hay que
ampliarlo.

### Antes: 126 pares distintos, **23 por debajo del umbral**

| color | fondo | alfa | px | peso | umbral | ratio | llega | dónde |
|---|---|--:|--:|--:|---|--:|---|---|
| `#2E2B25` | `#2E2B25` | — | 36 | 300 | 3:1 | 1,00 | **NO** | a, p.grande.u-mt-4 |
| `#2E2B25` | `#2E2B25` | — | 24 | 300 | 3:1 | 1,00 | **NO** | a, p.grande.u-mt-4 |
| `#634F35` | `#36332D` | 0,5 | 12 | 500 | 4,5:1 | 1,62 | **NO** | span.eyebrow |
| `#B08A52` | `#33585C` | — | 12 | 500 | 4,5:1 | 2,45 | **NO** | a.link, span.btn-arrow |
| `#E5DBCD` | `#8F6B3D` | 0,8 | 9 | 400 | 4,5:1 | 3,54 | **NO** | small |
| `#AAB7B6` | `#33585C` | 0,6 | 12 | 400 | 4,5:1 | 3,77 | **NO** | span |
| `#B08A52` | `#36332D` | — | 12 | 500 | 4,5:1 | 3,96 | **NO** | a.pr |
| `#7A7267` | `#F3EBDD` | — | 16 | 400 | 4,5:1 | 4,00 | **NO** | p |
| `#8F6B3D` | `#F3EBDD` | — | 12 | 500 | 4,5:1 | 4,09 | **NO** | span.eyebrow, span.n |
| `#8F6B3D` | `#F3EBDD` | — | 20.8 | 400 | 4,5:1 | 4,09 | **NO** | span.btn-arrow |
| `#8F6B3D` | `#F3EBDD` | — | 16 | 400 | 4,5:1 | 4,09 | **NO** | span.btn-arrow |
| `#7A7267` | `#FAF7F1` | — | 21 | 400 | 4,5:1 | 4,43 | **NO** | p.hero-sub |
| `#7A7267` | `#FAF7F1` | — | 12 | 500 | 4,5:1 | 4,43 | **NO** | span, h3 |
| `#7A7267` | `#FAF7F1` | — | 12 | 400 | 4,5:1 | 4,43 | **NO** | span |
| `#7A7267` | `#FAF7F1` | — | 11 | 500 | 4,5:1 | 4,43 | **NO** | span, a |
| `#7A7267` | `#FAF7F1` | — | 18 | 400 | 4,5:1 | 4,43 | **NO** | p.hero-sub, p.lead.u-mt-4 |
| `#7A7267` | `#FAF7F1` | — | 15.5 | 400 | 4,5:1 | 4,43 | **NO** | p |
| `#7A7267` | `#FAF7F1` | — | 16 | 400 | 4,5:1 | 4,43 | **NO** | p |
| `#7A7267` | `#FAF7F1` | — | 20.9 | 400 | 4,5:1 | 4,43 | **NO** | p.lead.u-mt-4 |
| `#7A7267` | `#FAF7F1` | — | 14 | 400 | 4,5:1 | 4,43 | **NO** | p.small.u-mt-6 |
| `#2E2B25` | `#B08A52` | — | 11 | 500 | 4,5:1 | 4,44 | **NO** | span.ahora__pill |
| `#B08A52` | `#2E2B25` | — | 12 | 500 | 4,5:1 | 4,44 | **NO** | span.eyebrow |
| `#2E2B25` | `#B08A52` | — | 13 | 500 | 4,5:1 | 4,44 | **NO** | a.btn.btn--ocre |

### Después: 125 pares distintos, **4 por debajo del umbral**

(Es uno menos porque dos pares que eran distintos se volvieron el mismo.)

| color | fondo | alfa | px | peso | umbral | ratio | llega | dónde |
|---|---|--:|--:|--:|---|--:|---|---|
| `#5E4C33` | `#36332D` | 0,5 | 12 | 500 | 4,5:1 | 1,53 | **NO** | span.eyebrow |
| `#B18C54` | `#33585C` | — | 12 | 500 | 4,5:1 | 2,51 | **NO** | a.link, span.btn-arrow |
| `#E3DACC` | `#866539` | 0,8 | 9 | 400 | 4,5:1 | 3,86 | **NO** | small |
| `#B18C54` | `#36332D` | — | 12 | 500 | 4,5:1 | 4,05 | **NO** | a.pr |
| `#866539` | `#F3EBDD` | — | 12 | 500 | 4,5:1 | 4,51 | sí | span.eyebrow, span.n |
| `#716A60` | `#F3EBDD` | — | 16 | 400 | 4,5:1 | 4,51 | sí | p |
| `#866539` | `#F3EBDD` | — | 20.8 | 400 | 4,5:1 | 4,51 | sí | span.btn-arrow |
| `#866539` | `#F3EBDD` | — | 16 | 400 | 4,5:1 | 4,51 | sí | span.btn-arrow |
| `#BEC7C5` | `#33585C` | 0,7 | 14 | 400 | 4,5:1 | 4,52 | sí | span |
| `#BEC7C5` | `#33585C` | 0,7 | 12 | 400 | 4,5:1 | 4,52 | sí | span |
| `#2E2B25` | `#B18C54` | — | 11 | 500 | 4,5:1 | 4,53 | sí | span.ahora__pill |
| `#B18C54` | `#2E2B25` | — | 12 | 500 | 4,5:1 | 4,53 | sí | span.eyebrow |
| `#2E2B25` | `#B18C54` | — | 13 | 500 | 4,5:1 | 4,53 | sí | a.btn.btn--ocre |
| `#C8CFCC` | `#33585C` | 0,75 | 20.9 | 400 | 4,5:1 | 4,92 | sí | p.lead.u-mt-4 |
| `#C8CFCC` | `#33585C` | 0,75 | 18 | 400 | 4,5:1 | 4,92 | sí | p.lead.u-mt-4 |
| `#866539` | `#FAF7F1` | — | 9 | 400 | 4,5:1 | 4,99 | sí | small |
| `#866539` | `#FAF7F1` | — | 12 | 500 | 4,5:1 | 4,99 | sí | span.eyebrow, small |
| `#716A60` | `#FAF7F1` | — | 21 | 400 | 4,5:1 | 4,99 | sí | p.hero-sub |
| `#FAF7F1` | `#866539` | — | 13 | 500 | 4,5:1 | 4,99 | sí | a.btn.btn--ocre, span.btn-arrow |
| `#716A60` | `#FAF7F1` | — | 12 | 500 | 4,5:1 | 4,99 | sí | span, h3 |
| `#716A60` | `#FAF7F1` | — | 12 | 400 | 4,5:1 | 4,99 | sí | span |
| `#FAF7F1` | `#866539` | — | 14 | 500 | 4,5:1 | 4,99 | sí | b |
| `#716A60` | `#FAF7F1` | — | 11 | 500 | 4,5:1 | 4,99 | sí | span, a |
| `#716A60` | `#FAF7F1` | — | 18 | 400 | 4,5:1 | 4,99 | sí | p.hero-sub, p.lead.u-mt-4 |
| `#716A60` | `#FAF7F1` | — | 15.5 | 400 | 4,5:1 | 4,99 | sí | p |
| `#716A60` | `#FAF7F1` | — | 16 | 400 | 4,5:1 | 4,99 | sí | p |
| `#716A60` | `#FAF7F1` | — | 20.9 | 400 | 4,5:1 | 4,99 | sí | p.lead.u-mt-4 |
| `#716A60` | `#FAF7F1` | — | 14 | 400 | 4,5:1 | 4,99 | sí | p.small.u-mt-6 |
| `#866539` | `#FFFFFF` | — | 12 | 500 | 4,5:1 | 5,34 | sí | span.eyebrow, a.link |
| `#716A60` | `#FFFFFF` | — | 15.5 | 400 | 4,5:1 | 5,34 | sí | p |
| `#716A60` | `#FFFFFF` | — | 11 | 500 | 4,5:1 | 5,34 | sí | span |
| `#716A60` | `#FFFFFF` | — | 16 | 400 | 4,5:1 | 5,34 | sí | p |
| `#716A60` | `#FFFFFF` | — | 14 | 500 | 4,5:1 | 5,34 | sí | small |
| `#716A60` | `#FFFFFF` | — | 15 | 400 | 4,5:1 | 5,34 | sí | p.por, p.garantia |
| `#ACA9A3` | `#36332D` | 0,6 | 12 | 500 | 4,5:1 | 5,37 | sí | span |
| `#AAB7B6` | `#33585C` | 0,6 | 52 | 300 | 3:1 | 3,77 | sí | span.suave |
| `#AAB7B6` | `#33585C` | 0,6 | 30 | 300 | 3:1 | 3,77 | sí | span.suave |
| `#716A60` | `#F3EBDD` | — | 68 | 300 | 3:1 | 4,51 | sí | span.suave |
| `#716A60` | `#F3EBDD` | — | 36 | 300 | 3:1 | 4,51 | sí | span.suave |
| `#716A60` | `#F3EBDD` | — | 52 | 300 | 3:1 | 4,51 | sí | span.suave |
| `#716A60` | `#F3EBDD` | — | 30 | 300 | 3:1 | 4,51 | sí | span.suave |
| `#BCB9B4` | `#2E2B25` | 0,7 | 14 | 400 | 4,5:1 | 7,21 | sí | p.small.u-mt-5 |
| `#BCB9B4` | `#2E2B25` | 0,7 | 20.9 | 400 | 4,5:1 | 7,21 | sí | p.lead |
| `#BCB9B4` | `#2E2B25` | 0,7 | 18 | 400 | 4,5:1 | 7,21 | sí | p.lead |
| `#33585C` | `#FAF7F1` | — | 12 | 500 | 4,5:1 | 7,30 | sí | span |
| `#33585C` | `#FAF7F1` | — | 13 | 500 | 4,5:1 | 7,30 | sí | a.btn.btn--ocre, span.btn-arrow |
| `#FAF7F1` | `#33585C` | — | 13 | 500 | 4,5:1 | 7,30 | sí | a.btn |
| `#FAF7F1` | `#33585C` | — | 16 | 400 | 4,5:1 | 7,30 | sí | span |
| `#FAF7F1` | `#33585C` | — | 20 | 400 | 4,5:1 | 7,30 | sí | p.ahora__t |
| `#FAF7F1` | `#33585C` | — | 20 | 300 | 4,5:1 | 7,30 | sí | blockquote.cita.u-mt-5 |
| `#D1D1D0` | `#2F3A4E` | 0,8 | 9 | 400 | 4,5:1 | 7,48 | sí | small |
| `#716A60` | `#FAF7F1` | — | 52 | 300 | 3:1 | 4,99 | sí | span.suave |
| `#866539` | `#FAF7F1` | — | 30 | 400 | 3:1 | 4,99 | sí | span.script |
| `#716A60` | `#FAF7F1` | — | 30 | 300 | 3:1 | 4,99 | sí | span.suave |
| `#716A60` | `#FAF7F1` | — | 68 | 300 | 3:1 | 4,99 | sí | span.suave |
| `#716A60` | `#FAF7F1` | — | 36 | 300 | 3:1 | 4,99 | sí | span.suave |
| `#716A60` | `#FFFFFF` | — | 68 | 300 | 3:1 | 5,34 | sí | span.suave |
| `#716A60` | `#FFFFFF` | — | 36 | 300 | 3:1 | 5,34 | sí | span.suave |
| `#716A60` | `#FFFFFF` | — | 52 | 300 | 3:1 | 5,34 | sí | span.suave |
| `#716A60` | `#FFFFFF` | — | 30 | 300 | 3:1 | 5,34 | sí | span.suave |
| `#A8A5A0` | `#2E2B25` | 0,6 | 52 | 300 | 3:1 | 5,75 | sí | span.suave |
| `#A8A5A0` | `#2E2B25` | 0,6 | 30 | 300 | 3:1 | 5,75 | sí | span.suave |
| `#FAF7F1` | `#2F3A4E` | — | 14 | 500 | 4,5:1 | 10,70 | sí | b |
| `#33585C` | `#FAF7F1` | — | 80 | 300 | 3:1 | 7,30 | sí | span.acento |
| `#FAF7F1` | `#33585C` | — | 26 | 400 | 3:1 | 7,30 | sí | p.ahora__t |
| `#FAF7F1` | `#33585C` | — | 68 | 300 | 3:1 | 7,30 | sí | h2.display-l.u-mt-4 |
| `#33585C` | `#FAF7F1` | — | 42 | 300 | 3:1 | 7,30 | sí | span.acento |
| `#FAF7F1` | `#33585C` | — | 36 | 300 | 3:1 | 7,30 | sí | h2.display-l.u-mt-4 |
| `#FAF7F1` | `#33585C` | — | 52 | 300 | 3:1 | 7,30 | sí | h2.display-m.u-mt-4 |
| `#FAF7F1` | `#33585C` | — | 26 | 300 | 3:1 | 7,30 | sí | blockquote.cita.u-mt-5 |
| `#FAF7F1` | `#33585C` | — | 30 | 300 | 3:1 | 7,30 | sí | h2.display-m.u-mt-4 |
| `#FAF7F1` | `#36332D` | — | 12 | 500 | 4,5:1 | 11,77 | sí | span, b |
| `#FAF7F1` | `#36332D` | — | 14 | 500 | 4,5:1 | 11,77 | sí | b |
| `#2E2B25` | `#F3EBDD` | — | 17 | 400 | 4,5:1 | 11,92 | sí | p.body.u-mt-4, p.body |
| `#2E2B25` | `#F3EBDD` | — | 20 | 400 | 4,5:1 | 11,92 | sí | h3, a |
| `#2E2B25` | `#F3EBDD` | — | 21 | 300 | 4,5:1 | 11,92 | sí | blockquote.bloque-cita.u-mt-7 |
| `#2E2B25` | `#FAF7F1` | — | 12 | 500 | 4,5:1 | 13,19 | sí | span, b |
| `#2E2B25` | `#FAF7F1` | — | 14 | 500 | 4,5:1 | 13,19 | sí | b |
| `#2E2B25` | `#FAF7F1` | — | 13 | 500 | 4,5:1 | 13,19 | sí | a.btn, span.btn-arrow |
| `#2E2B25` | `#FAF7F1` | — | 17 | 400 | 4,5:1 | 13,19 | sí | p.body.u-mt-4, p.body.u-mt-3 |
| `#2E2B25` | `#FAF7F1` | — | 16 | 400 | 4,5:1 | 13,19 | sí | span, em |
| `#2E2B25` | `#FAF7F1` | — | 16 | 500 | 4,5:1 | 13,19 | sí | b |
| `#2E2B25` | `#FAF7F1` | — | 20 | 300 | 4,5:1 | 13,19 | sí | blockquote.cita.u-mt-5 |
| `#2E2B25` | `#FAF7F1` | — | 23 | 400 | 4,5:1 | 13,19 | sí | h3 |
| `#FAF7F1` | `#2E2B25` | — | 13 | 500 | 4,5:1 | 13,19 | sí | a.btn, span.btn-arrow |
| `#2E2B25` | `#FAF7F1` | — | 19 | 400 | 4,5:1 | 13,19 | sí | h3 |
| `#2E2B25` | `#FAF7F1` | — | 20 | 400 | 4,5:1 | 13,19 | sí | h3 |
| `#2E2B25` | `#FAF7F1` | — | 19 | 300 | 4,5:1 | 13,19 | sí | li |
| `#2E2B25` | `#FAF7F1` | — | 22 | 400 | 4,5:1 | 13,19 | sí | h2.display-s.u-mt-7, h2.display-s.u-mt-6 |
| `#2E2B25` | `#FFFFFF` | — | 20 | 400 | 4,5:1 | 14,11 | sí | h3 |
| `#2E2B25` | `#FFFFFF` | — | 21 | 400 | 4,5:1 | 14,11 | sí | b |
| `#2E2B25` | `#FFFFFF` | — | 17 | 400 | 4,5:1 | 14,11 | sí | p.body.u-mt-4, b |
| `#2E2B25` | `#FFFFFF` | — | 16 | 400 | 4,5:1 | 14,11 | sí | li |
| `#2E2B25` | `#FFFFFF` | — | 15 | 600 | 4,5:1 | 14,11 | sí | b |
| `#2E2B25` | `#FFFFFF` | — | 19 | 300 | 4,5:1 | 14,11 | sí | p |
| `#FAF7F1` | `#36332D` | — | 48 | 300 | 3:1 | 11,77 | sí | a |
| `#FAF7F1` | `#36332D` | — | 27.2 | 300 | 3:1 | 11,77 | sí | a |
| `#2E2B25` | `#F3EBDD` | — | 68 | 300 | 3:1 | 11,92 | sí | h2.display-l.u-mt-4 |
| `#2E2B25` | `#F3EBDD` | — | 26 | 400 | 3:1 | 11,92 | sí | h3, a |
| `#2E2B25` | `#F3EBDD` | — | 52 | 300 | 3:1 | 11,92 | sí | h2.display-m.u-mt-4 |
| `#2E2B25` | `#F3EBDD` | — | 36 | 300 | 3:1 | 11,92 | sí | h2.display-l.u-mt-4 |
| `#2E2B25` | `#F3EBDD` | — | 30 | 300 | 3:1 | 11,92 | sí | h2.display-m.u-mt-4, blockquote.bloque-cita.u-mt-7 |
| `#2E2B25` | `#FAF7F1` | — | 80 | 300 | 3:1 | 13,19 | sí | h1.display-xl.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 52 | 300 | 3:1 | 13,19 | sí | h2.display-m.u-mt-4, h1.display-m.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 26 | 300 | 3:1 | 13,19 | sí | blockquote.cita.u-mt-5 |
| `#FAF7F1` | `#2E2B25` | — | 52 | 300 | 3:1 | 13,19 | sí | h2.display-m.u-mt-4 |
| `#FAF7F1` | `#2E2B25` | — | 36 | 300 | 3:1 | 13,19 | sí | a, p.grande.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 42 | 300 | 3:1 | 13,19 | sí | h1.display-xl.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 30 | 300 | 3:1 | 13,19 | sí | h2.display-m.u-mt-4, h1.display-m.u-mt-4 |
| `#FAF7F1` | `#2E2B25` | — | 30 | 300 | 3:1 | 13,19 | sí | h2.display-m.u-mt-4 |
| `#FAF7F1` | `#2E2B25` | — | 24 | 300 | 3:1 | 13,19 | sí | a, p.grande.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 68 | 300 | 3:1 | 13,19 | sí | h2.display-l.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 25 | 400 | 3:1 | 13,19 | sí | h3 |
| `#2E2B25` | `#FAF7F1` | — | 25 | 300 | 3:1 | 13,19 | sí | li |
| `#FAF7F1` | `#2E2B25` | — | 68 | 300 | 3:1 | 13,19 | sí | h2.display-l.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 36 | 300 | 3:1 | 13,19 | sí | h2.display-l.u-mt-4 |
| `#2E2B25` | `#FAF7F1` | — | 32 | 400 | 3:1 | 13,19 | sí | h2.display-s.u-mt-7, h2.display-s.u-mt-6 |
| `#2E2B25` | `#FFFFFF` | — | 68 | 300 | 3:1 | 14,11 | sí | h2.display-l.u-mt-4 |
| `#2E2B25` | `#FFFFFF` | — | 25 | 400 | 3:1 | 14,11 | sí | h3 |
| `#2E2B25` | `#FFFFFF` | — | 36 | 300 | 3:1 | 14,11 | sí | h2.display-l.u-mt-4 |
| `#2E2B25` | `#FFFFFF` | — | 52 | 300 | 3:1 | 14,11 | sí | h2.display-m.u-mt-4, div.precio.num |
| `#2E2B25` | `#FFFFFF` | — | 26 | 400 | 3:1 | 14,11 | sí | h3 |
| `#2E2B25` | `#FFFFFF` | — | 24 | 300 | 3:1 | 14,11 | sí | p |
| `#2E2B25` | `#FFFFFF` | — | 86.4 | 300 | 3:1 | 14,11 | sí | div.precio.num |
| `#2E2B25` | `#FFFFFF` | — | 30 | 300 | 3:1 | 14,11 | sí | h2.display-m.u-mt-4 |

---

## B · lo que se movió, y por qué ese valor y no otro

Tres tokens y dos reglas. Nada más.

| qué | antes | después | el número que lo obligó |
|---|---|---|---|
| `color.ink.muted` (`--gris`) | `#7A7267` | `#716A60` | sobre `--calido` **4,00 → 4,51** |
| `color.brand.ochre` (`--ocre`) | `#8F6B3D` | `#866539` | sobre `--calido` **4,09 → 4,51** |
| `color.brand.ochre.mid` (`--ocre-medio`) | `#B08A52` | `#B18C54` | sobre `--tinta` **4,44 → 4,53** |
| `.contacto .grande` | `color:var(--tinta)` | `color:inherit` | **1,00 → 13,19** |
| `.oscuro .ficha li span:first-child` | crema 60 % | crema 70 % | sobre `--teal` **3,77 → 4,52** |

Dos cosas que la medición corrigió de la orden:

1. **El fondo que manda no es el crema, es el cálido.** La orden hablaba del
   gris «sobre crema» (4,43). Pero el mismo gris sobre `--calido` (`#F3EBDD`)
   daba **4,00**, y el ocre sobre ese fondo daba **4,09** — un par que la orden
   no mencionaba. Corregir mirando solo el crema habría dejado las dos secciones
   cálidas por debajo de AA y Lighthouse en 96.

2. **Los candidatos de la orden se pasaban.** `#6F675C` da 5,21 sobre crema y
   `#6B6358` da 5,53. El criterio escrito es «el cambio más chico», y el mínimo
   medido es `#716A60`. Mismo razonamiento para el ocre.

### Y una cuarta cosa, que apareció sola

Las cuatro claves de la ficha del facilitador (`Familia`, `Práctica`,
`Formación`, `Obra`) llevaban el crema al 60 % escrito **en un `style=` en
línea**, copiado del sitio estático. La #01 lo portó igual y lo dejó anotado
como redundante, que lo era. Dejó de serlo en cuanto la regla cambió: un
`style=` le gana a cualquier selector, así que esas cuatro se habrían quedado en
3,77 mientras el resto subía, sin que nada se quejara. Se borró el atributo y
manda la regla. **Lo cazó el barrido, no una persona mirando** — que es
exactamente para lo que se escribió.

---

## C · lo que se verificó

**Lighthouse móvil, `dist/` servido local, tres corridas, la peor:**

| página | accesibilidad antes | accesibilidad después | performance | SEO | prácticas |
|---|--:|--:|--:|--:|--:|
| inicio | 96 | **100** | 86 | 100 | 100 |
| taller | 96 | **100** | 92 | 100 | 100 |
| privacidad | 96 | **100** | 99 | 66 | 100 |
| terminos | 95 | **100** | 99 | 66 | 100 |

`color-contrast` era el único audit en rojo de las cuatro páginas y ya no lo es.
Performance, SEO y prácticas recomendadas quedaron **exactamente** como los dejó
la #02 (el 66 de SEO en las legales es el `noindex`, que es deliberado).

**El guardián de fidelidad sigue en cero píxeles.** No se le bajó el umbral ni
se le guardaron capturas: al sitio estático se le inyectan, antes de capturarlo,
las **seis líneas** de `e2e/cambios-visibles.ts`. Lo que el guardián afirma es
más fuerte que antes:

> el port dibuja exactamente el sitio estático **más esas seis líneas**, y nada
> más — con las doce comprobaciones en cero píxeles de diferencia.

Se lo vio fallar: quitando de esa lista la línea del contacto, la portada se va
a **1.689 píxeles** de diferencia y las tres comprobaciones del inicio se ponen
en rojo. Devuelta la línea, verde.

**Un guardián nuevo, en aritmética**, dentro de `packages/ui/tokens.test.mjs`:
ocho pares token-contra-token que tienen que dar ≥ 4,5. Existe porque un hex que
se aclara medio punto dentro de seis meses no rompe nada, no se ve en un diff y
devuelve la web al 96 sin que ninguna comprobación diga una palabra.

---

## Las capturas · dirección aprueba mirando esto

En cada imagen: **izquierda la paleta de hoy, derecha la de esta orden.**

| archivo | qué mirar |
|---|---|
| `contacto-1440.jpg` · `contacto-390.jpg` | el bloque de contacto, que aparece |
| `calida-1440.jpg` | la sección cálida: el fondo que obligó el cambio. Es donde más se mueve el gris, y aun así hay que buscarlo |
| `clara-1440.jpg` · `clara-390.jpg` | el gris del cuerpo y de la ficha sobre crema |
| `ficha-taller-1440.jpg` | las claves del facilitador, de 60 % a 70 % de crema |
| `oscura-1440.jpg` | la sección teal — acá **casi no cambia nada**, y es el punto siguiente |

Si algo no gusta, se borra su línea de `e2e/cambios-visibles.ts` y su valor del
token, y todo vuelve atrás con el guardián exigiendo el estático tal cual.

---

## D · los cuatro pares que NO se tocaron, con su número

Corregirlos no es mover un valor: es cambiar el carácter de la marca o tocar
piezas que la orden no nombró. Van a dirección con la medición hecha.

### 1 · El ocre medio sobre teal — **2,51** (hace falta 4,5)

`.oscuro .eyebrow`, `.oscuro .link` y las flechas `→` de las secciones teal:
`#B18C54` sobre `#33585C`. Es el más visible de los cuatro (20 apariciones) y el
más caro de arreglar: para llegar a 4,5 el ocre medio tendría que ser `#D6C2A4`,
un arena pálido que ya no es el ámbar de la marca. **Es una decisión de paleta,
no de contraste**, y por eso no se tomó abajo. Alternativas posibles, si
dirección quiere abrirlo: aclarar el teal de esas secciones, usar el crema en
vez del ocre para esos rótulos, o aceptarlo y documentarlo.

### 2 · El rótulo del menú al 50 % — **1,53**

`armandoduarte.com` en la cabecera del menú de pantalla completa, con
`opacity:.5` escrito en línea. Solo se ve con el menú abierto. Es el mismo tipo
de defecto que las claves del facilitador —un valor en el marcado en vez de en
la hoja— y arreglarlo es subir la opacidad, que se ve.

### 3 · La flecha de WhatsApp del menú — **4,05**

`.ov__foot .pr`, ocre medio sobre el fondo del overlay. Queda a 0,45 del umbral y
se arregla solo si se resuelve el punto 1.

### 4 · La tapa del libro — **3,86**

El `<small>` «Armando Duarte» de la tapa simulada de *Construyendo Familias
Fuertes*: crema al 80 % sobre ocre, 9 px. El bloque entero lleva
`aria-hidden="true"` —es la representación de una portada, no texto de la
página— y por eso ni axe ni Lighthouse lo cuentan. Se informa igual porque está
en la tabla.

---

## Y una consecuencia que no estaba en la orden: las dos imágenes de compartir

`public/img/og.jpg` y `public/img/og-home.jpg` **se generan** desde
`check/og-*.html`, que usan `var(--gris)` y `var(--ocre)`. Cambiados los tokens,
las imágenes del repo quedaban describiendo una paleta que ya no existe.

Se regeneraron con `node check/og-capturar.mjs`: 45.740 y 51.695 bytes (antes
45.647 y 51.634). El cambio es la línea de texto en gris y la rayita ocre, o sea
lo mismo que se ve —poco— en `calida-1440.jpg`. Si dirección revierte un token,
se vuelve a correr el mismo comando.

---

## Qué queda pendiente fuera de este informe

- **El JSON de Marca (`01 Documentos/Marca/armando-design-system.tokens.json`)**
  venía en **1.0.0** y sin la sección `web`: la #01 actualizó el del repo y no
  ése. Se le aplicaron los tres colores nuevos y su entrada de changelog, pero
  **las dos copias siguen divergiendo** en todo lo demás. Dos documentos que
  dicen ser el mismo design system son dos verdades esperando a no coincidir:
  o el de Marca pasa a ser una exportación del de `packages/ui`, o se declara
  histórico. Es de dirección.
