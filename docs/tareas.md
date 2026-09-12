# Tareas y cola de órdenes — armandoduarte-web

Las órdenes viven fuera del repo, en `03 Producto/web/ordenes/` del proyecto. Acá queda solo el estado y lo que va quedando pendiente.

## Cola de órdenes

| # | Qué | Estado |
|---|---|---|
| #01 | El repo nace limpio, y `vercel.json` | PASA de dirección; PR abierto, espera los `curl` del preview |
| #05 | Cortina | en curso (rama `web/05-cortina`, apilada sobre `infra/01-vercel-json`) |
| #02 | Completar la web (los `<span class="dato">` punteados) | pendiente |
| #03 | Verificación | pendiente |
| #04 | Tokens web | pendiente |

## Pendientes abiertos

### 1. Content-Security-Policy (sale de la #01, punto D)

No se puso CSP en la #01 a propósito: el header pegajoso usa un `<script>` en línea y una CSP mal calibrada rompe la única pieza de JavaScript que tiene la página. Cuando se haga, hay que decidir antes si el script en línea se mueve a un archivo o se le pone un hash/nonce.

### 2. La lista de redirecciones del sitio viejo (sale de la #01, punto C)

`vercel.json` no puede llevar comentarios: el esquema de Vercel valida con `additionalProperties: false` arriba y dentro de cada `redirect`, así que una clave `_comment` hace fallar el deploy. La lista vive acá.

URLs del Divi viejo que Google conoce, todas a `/` con 301 (`"permanent": true`):

- `/biografia` — ya está en `vercel.json`
- `/conferencias` — ya está en `vercel.json`

Para agregar una: una línea más en el array `redirects` de `vercel.json`, con el mismo formato, y una línea más en esta lista.

Falta que Germán abra Search Console del dominio y pase las URLs que aparezcan ahí o en el sitio viejo.

### 3. `preview_*.html` en el README

El cuerpo del `README.md` (heredado del `LEEME-v1.md`) todavía menciona los `preview_*.html` como si estuvieran en el repo. No están: quedaron en `_historico/` del proyecto. La #01 no reescribe el cuerpo del README, solo le agrega el bloque de arriba; corregir esa frase cuando se toque el README de nuevo.

### 4. Enlaces de privacidad y términos

Los dos enlaces del pie apuntan a `#`. Es la #02 / un pendiente legal (aviso de privacidad mexicano, LFPDPPP), no de infraestructura.
