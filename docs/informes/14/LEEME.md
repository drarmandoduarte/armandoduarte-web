# Orden Códice #14 — «Talleres» tiene su columna en el pie

Rama `web/14-talleres-en-el-pie`, desde `main` con la #12 ya mergeada (PR #22,
`4b592d2`).

## Las tres capturas

| archivo | ancho | qué muestra |
|---|---|---|
| `pie-1440.png` | 1440 | las cuatro columnas: Explorar · Talleres · Legal · Canales |
| `pie-900.png` | 900 | dos columnas: Explorar+Talleres arriba, Legal+Canales abajo |
| `pie-375.png` | 375 | una columna, las cuatro secciones apiladas en orden |

Son del pie de `/merida`, que es la única página donde el WhatsApp de «Canales»
lleva el número de Mérida; en las otras tres el pie es idéntico salvo ese
renglón.

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
| `/merida` | 96 | **100** | 100 | 100 |

Sin cambios respecto de lo esperado: el pie suma tres enlaces de texto y ninguna
imagen ni script. La accesibilidad sigue en 100, que era la condición.

## Una nota de la corrida, que vale guardar

La primera versión del script de captura apagaba el fundido de entrada con
`page.addStyleTag()`. **La CSP lo bloqueó** (`style-src 'self'`), y el script
murió. Es la orden #10 funcionando: la política muerde también contra las
herramientas de la casa. Se dejó que la animación terminara sola en vez de
apagarla.
