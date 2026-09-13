# Tareas y cola de órdenes — armandoduarte-web

Las órdenes viven fuera del repo, en `03 Producto/web/ordenes/` del proyecto. Acá queda solo el estado y lo que va quedando pendiente.

## Cola de órdenes

| # | Qué | Estado |
|---|---|---|
| #01 | El repo nace limpio, y `vercel.json` | cerrada 12/9 |
| #05 | Cortina | **en pausa** (dirección 12/9): no se usa mientras la web viva solo en `armandoduarte-web.vercel.app`. PR #2 abierto, rama `web/05-cortina` sin borrar. |
| #02 | Completar la web · Parte 1 (legales, og, favicon, sitemap) | en curso (rama `web/02-parte-1`) |
| #02 | Completar la web · Parte 2 (los `<span class="dato">` punteados) | en curso (rama `web/02-parte-2`) — dirección 12/9: lo que Armando no escribió se elimina, no se rellena |
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

### 4. El correo público de Armando para el aviso de privacidad

El aviso de privacidad y los derechos ARCO necesitan un canal de contacto **de cara al público**, que no puede ser `development@armandoduarte.com` (es la cuenta operativa). El correo público no existe todavía, así que en la #02 Parte 2 las dos frases de `privacidad.html` pasaron al único canal que Armando dio: el WhatsApp +52 55 5501 5641. Ya no hay nada punteado y la página se publica. El día que exista el correo, se agrega ahí como segundo canal.

### 5. Restituir el JSON-LD del `Event` en `taller.html` cuando haya fecha

Se quitó entero en la #02 Parte 2 porque `startDate`, `endDate` y `location.name` no tenían dato real, y un `Event` con fecha inventada o con placeholders es peor que no tenerlo. Cuando Armando dé la fecha y el lugar, vuelve al `<head>` de `taller.html` (justo antes de `</head>`) con: `startDate` y `endDate` con huso **-06:00** (Mérida = `America/Merida`, no -05:00 como quedó en el borrador) y `location.name` real. Tal como estaba, para no reescribirlo de memoria:

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Event","name":"El arte de amar a tu adolescente · taller para padres","description":"Taller presencial de 4 horas y media para padres de adolescentes, con Armando Duarte.","eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode","eventStatus":"https://schema.org/EventScheduled","startDate":"2026-__-__T09:00:00-05:00","endDate":"2026-__-__T13:30:00-05:00","location":{"@type":"Place","name":"[Auditorio]","address":{"@type":"PostalAddress","addressLocality":"Mérida","addressRegion":"Yucatán","addressCountry":"MX"}},"organizer":{"@type":"Person","name":"Armando Duarte","url":"https://armandoduarte.com/"},"performer":{"@type":"Person","name":"Armando Duarte"},"offers":{"@type":"Offer","price":"1170","priceCurrency":"MXN","availability":"https://schema.org/LimitedAvailability","url":"https://armandoduarte.com/taller"}}
</script>
```

### 6. Lo que se eliminó por falta de dato (#02 Parte 2)

Nada de esto se rellenó con «por confirmar»: se sacó el elemento. Cuando Armando dé el dato, vuelve.

- **Fecha del taller**: la franja «Ahora» y la ficha del home, el eyebrow y la franja de hechos de `/taller` (que pasó de 4 a 3 columnas en `.hechos`), y la línea de `check/og-taller.html` que genera `img/og.jpg`.
- **Auditorio**: «Lugar» y «Dónde» dicen solo `Mérida`.
- **Instagram**: no dio cuenta. Se quitó el punto 04 de la lista de canales del home (la lista quedó 01–03, sin renumerar) y el enlace del pie de las cuatro páginas.
