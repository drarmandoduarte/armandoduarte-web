# `check/` — guardianes y plantillas

Nada de esta carpeta se publica: `.vercelignore` la deja fuera del deploy.

## `og-home.html`, `og-taller.html`, `og-capturar.mjs` — imágenes para compartir

Las dos imágenes (`public/img/og-home.jpg` e `public/img/og.jpg`) **no se hacen a mano**: se generan desde estas plantillas, que usan los mismos tokens, el mismo CSS y las mismas fuentes locales que la web. Así, el día que haya fecha del taller, se agrega a la línea `.og__linea` de `og-taller.html` y se vuelve a capturar.

Se corre **desde `apps/web`**:

```sh
node check/og-capturar.mjs
```

Salida: `public/img/og-home.jpg` e `public/img/og.jpg`, 1200×630, JPEG calidad 88, bastante por debajo de los 150 KB. De ahí Vite las copia a `dist/img/`, que es donde el `og:image` del `<head>` las nombra.

### Lo que la orden #02 cambió, y lo que comprobó

Las plantillas venían del sitio estático con sus rutas relativas intactas (`../estilo.css`, `../fuentes/local.css`, `../img/…`), o sea describiendo la anatomía de `armandoduarte-web`: se podían leer, no correr. Ahora apuntan a donde las cosas viven acá —`packages/ui/fuentes/fonts.css`, `packages/ui/codice-tokens.css`, `apps/web/src/index.css` y `public/img/`— y el Chromium sale de `@playwright/test`, que este paquete ya tiene.

`fonts.css` y el `local.css` del sitio estático son **el mismo archivo** (`diff` vacío), y las tres hojas de acá son `estilo.css` partido en tres. Por eso la comprobación pudo ser la dura: se regeneraron las dos imágenes y salieron **idénticas byte a byte** a las que estaban —mismo `sha256`, 45.647 y 51.634 bytes—. No se parecen: son las mismas.

## `favicon.svg` — de dónde sale (#02)

La «A» del favicon no es un `<text>`: es el contorno del glifo `A` de Montserrat en peso 500 —el mismo peso de la marca del header— extraído con `fontTools` desde `fuentes/Montserrat-300-600-latin.woff2` y pegado como `<path>`. Así se ve igual aunque quien la mire no tenga la fuente. De ese SVG salen `favicon.ico` (32 px) y `apple-touch-icon.png` (180 px, fondo crema porque iOS no usa transparencia).
