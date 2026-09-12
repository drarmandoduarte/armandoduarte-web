# Tareas y cola de órdenes — armandoduarte-web

Las órdenes viven fuera del repo, en `03 Producto/web/ordenes/` del proyecto. Acá queda solo el estado y lo que va quedando pendiente.

## Cola de órdenes

| # | Qué | Estado |
|---|---|---|
| #01 | El repo nace limpio, y `vercel.json` | cerrada 12/9 |
| #05 | Cortina | **en pausa** (dirección 12/9): no se usa mientras la web viva solo en `armandoduarte-web.vercel.app`. PR #2 abierto, rama `web/05-cortina` sin borrar. |
| #02 | Completar la web (los `<span class="dato">` punteados) | pendiente |
| #03 | Verificación | pendiente |
| #04 | Tokens web | pendiente |

## Pendientes abiertos

### 1. Quitar `X-Robots-Tag: noindex` de `vercel.json` en la apertura (#06)

Va junto con el `robots.txt` / `sitemap.xml` de la #02. Está puesto porque la web vive un tiempo en la URL `.vercel.app` antes de que Armando la apruebe, y no debe aparecer en Google. El día que se abre el dominio hay que sacarlo: si no, la web abre invisible para los buscadores.

### 2. Content-Security-Policy (sale de la #01, punto D)

No se puso CSP en la #01 a propósito: el header pegajoso usa un `<script>` en línea y una CSP mal calibrada rompe la única pieza de JavaScript que tiene la página. Cuando se haga, hay que decidir antes si el script en línea se mueve a un archivo o se le pone un hash/nonce.

### 3. La lista de redirecciones del sitio viejo (sale de la #01, punto C)

`vercel.json` no puede llevar comentarios: el esquema de Vercel valida con `additionalProperties: false` arriba y dentro de cada `redirect`, así que una clave `_comment` hace fallar el deploy. La lista vive acá.

URLs del Divi viejo que Google conoce, todas a `/` con 301 (`"permanent": true`):

- `/biografia` — ya está en `vercel.json`
- `/conferencias` — ya está en `vercel.json`

Para agregar una: una línea más en el array `redirects` de `vercel.json`, con el mismo formato, y una línea más en esta lista. No hace falta agregar la variante con barra final: `"trailingSlash": false` la normaliza (308) antes de aplicar el redirect.

Dos cosas que se verificaron sobre el preview y conviene no volver a descubrir: `"permanent": true` en Vercel devuelve **308**, no 301 (301 exigiría `statusCode`, que el esquema marca privado); y `cleanUrls` por sí solo **no** normaliza la barra final — sin `trailingSlash` explícito, `/biografia/` daba 404.

Falta que Germán abra Search Console del dominio y pase las URLs que aparezcan ahí o en el sitio viejo.

### 4. Enlaces de privacidad y términos

Los dos enlaces del pie apuntan a `#`. Es la #02 / un pendiente legal (aviso de privacidad mexicano, LFPDPPP), no de infraestructura.
