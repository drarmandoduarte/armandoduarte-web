# Orden Códice #14 — «Talleres» tiene su columna en el pie

Rama `web/14-talleres-en-el-pie`, desde `main` con la #12 ya mergeada (PR #22,
`4b592d2`).

## Las capturas

| archivo | ancho | qué muestra |
|---|---|---|
| `pie-1440.png` | 1440 | las cuatro columnas: Explorar · Talleres · Legal · Canales |
| `pie-900.png` | 900 | dos columnas: Explorar+Talleres arriba, Legal+Canales abajo |
| `pie-375.png` | 375 | una columna, las cuatro secciones apiladas en orden |
| `porque-fondo-antes-1200.png` | 1440 | el recorte de la foto de «¿Te suena?» servida desde el archivo de 1200 |
| `porque-fondo-despues-1800.png` | 1440 | el mismo recorte, desde el de 1800 |

Las tres del pie son de `/merida`, que es la única página donde el WhatsApp de
«Canales» lleva el número de Mérida; en las otras tres el pie es idéntico salvo
ese renglón. Los dos recortes de la foto son del mismo rincón, a la misma escala
y con el mismo `deviceScaleFactor`: lo único que cambia entre ellos es de qué
archivo salió el píxel.

## Los quiebres, y el que se movió

La orden pedía 4 columnas ≥ 1100, 2 entre 700 y 1100, y 1 debajo de 700. El pie
tenía su quiebre a dos columnas en **900**, no en 1100, así que se movió:

- `.ft__grid` base pasa de `repeat(3,1fr)` a `repeat(4,1fr)`;
- el `1fr 1fr` se fue del bloque `@media (max-width:900px)` al de `1100px`;
- el bloque `@media (max-width:700px)` suma `1fr`.

Medido: con cuatro columnas a 1100 px, «El arte de amar a tu hijo adolescente ·
Mérida» no entra en un cuarto del ancho. A 1440 entra en dos renglones, que es lo
que se ve en `pie-1440.png` y se dio por bueno.

## Lo que midieron los guardianes

- `check:i18n` · 1 namespace, **300 claves** en `es` (eran 296).
- `check:tuteo` · 58 archivos, sin voseo.
- `check:estilo` · 72 archivos, el voseo solo en `packages/prompts`.
- `check:tokens` · 59 archivos, ningún hex fuera de `codice-tokens.css`.
- `check:secretos` · 162 archivos, 9 formas buscadas, ninguna encontrada.
- `check/contraste.mjs` · **137 pares distintos, 0 por debajo del umbral.**
- `check/acento.mjs` · 814 elementos en las cuatro páginas, ningún naranja nuevo.
- `pnpm test` · **136 tests declarados**, 29 de ellos en Chromium, 0 saltados,
  ninguna suite bajo su piso.
- `pnpm lint` y `pnpm typecheck` · en verde.

## Lighthouse móvil

Sobre `dist/` servido por `e2e/servidor.mjs`, Lighthouse 13.5.0, emulación móvil.

| ruta | rendimiento | accesibilidad | prácticas | SEO |
|---|--:|--:|--:|--:|
| `/` | 96 | **100** | 100 | 100 |
| `/merida` | 95–96 | **100** | 100 | 100 |

La accesibilidad sigue en **100**, que era la condición. El rendimiento de
`/merida` oscila entre 95 y 96 **entre corridas del mismo build**; en móvil no
cambió ni el peso servido de la foto (74.021 B las dos veces) ni el LCP (2,6 s).
El detalle, en la sección D.

## D · La foto de «¿Te suena?» a 1800 px

Entró `porque-fondo-1800` (1800×2700, la **misma** foto: Pexels 6345445, Karola
G), desde `03 Producto/web/insumos/2026-09-29-porque-fondo-1800/`.
`docs/creditos.md` no cambia — mismo autor, misma foto.

### El corte va por `media`, no por `sizes`, y eso es la decisión

La orden pide 1200 hasta 1100 px de ancho de pantalla y 1800 por encima, con el
móvil sin bajar un byte de más. **Un `srcset` con `sizes` no lo cumple**: elige
multiplicando el ancho de presentación por el DPR, así que un teléfono de 375 px
con pantalla 3× pide el equivalente a 1125 px y se lleva la de 1800. La `media` de
un `<source>` mira el **ancho de ventana** y nada más.

El corte quedó en `min-width: 1101px`, que es el mismo quiebre que ya usa el pie
de esta orden; un número propio sería un tercero que mantener.

Y de paso: el `<img>` de respaldo pasó del `.webp` al `.jpg` de 1200. Hasta acá el
`src` era el WebP, así que un navegador sin WebP no veía ninguna foto —el JPG
estaba en el repo sin que nadie lo pidiera—.

### El peso servido, medido sobre `dist/`

| ancho de ventana | DPR | archivo servido | bytes |
|---|--:|---|--:|
| 1440 · antes | 1 | `porque-fondo.webp` | 73.380 |
| **1440 · después** | 1 | **`porque-fondo-1800.webp`** | **166.788** |
| 375 · antes | 3 | `porque-fondo.webp` | 73.380 |
| **375 · después** | 3 | **`porque-fondo.webp`** | **73.380** |

**El móvil no bajó un byte más**, que era la condición. Escritorio sube 93.408 B.

### El LCP de `/merida`, antes y después

Siete corridas por ancho, con contexto y caché nuevos en cada una. Se informa
mediana y rango porque **una sola medida en un servidor local es ruido**: en las
primeras pasadas el mismo escenario dio entre 48 y 224 ms.

| ancho | antes | después | elemento LCP |
|---|---|---|---|
| 1440 | **64 ms** (48–104) | **52 ms** (52–104) | `<IMG> medio-cuerpo-900.webp` |
| 375 · DPR 3 | **76 ms** (64–80) | **68 ms** (64–76) | `<IMG> medio-cuerpo-1400.webp` |

Los rangos se superponen: **no hay diferencia atribuible al cambio**, ni para
mejor ni para peor. Y hay una razón estructural, que vale más que los números:
**el elemento LCP no es esta foto** en ninguno de los dos anchos — es el retrato
del hero. `porque-fondo` va `loading="lazy"` y debajo del pliegue, así que por
construcción no puede ser el LCP.

Confirmado con una segunda herramienta, Lighthouse móvil sobre `/merida`:

| | perf | LCP | peso total | foto servida |
|---|--:|---|---|---|
| antes | 96 | 2,6 s | 310 KiB | `porque-fondo.webp` 74.021 B |
| después | 95–96 | 2,6 s | 311 KiB | `porque-fondo.webp` 74.021 B |

Misma foto, mismo LCP. El punto de rendimiento oscila entre 95 y 96 entre
corridas del mismo build (medido tres veces: 96 · 95 · 96), y el KiB de más es el
`<source>` que se agregó al HTML.

### Lo que el guardián de fidelidad dijo, que es la mejor prueba del corte

**Una sola captura en rojo: `taller-1440`**, con 32.458 píxeles distintos.
`taller-900` y `taller-390` siguieron en verde, y las nueve de las otras tres
rutas también. O sea: la foto grande entra exactamente a un ancho de una ruta, que
es donde la orden la quería. Actualizada con `--update-snapshots`.

### El presupuesto de 180 KB

`porque-fondo-1800.webp` pesa 163 KB y su JPG **367 KB**, que pasa el presupuesto
al doble. La excepción está escrita en `apps/web/public/img/fotos/LEEME.md` con
sus tres motivos; el que manda: **ese JPG no lo baja nadie en un teléfono, y quien
no entiende WebP se lleva el de 1200**. El presupuesto no se bajó: sigue valiendo
para toda foto que se sirva a todos los anchos.

## Una nota de la corrida, que vale guardar

La primera versión del script de captura apagaba el fundido de entrada con
`page.addStyleTag()`. **La CSP lo bloqueó** (`style-src 'self'`), y el script
murió. Es la orden #10 funcionando: la política muerde también contra las
herramientas de la casa. Se dejó que la animación terminara sola en vez de
apagarla.
