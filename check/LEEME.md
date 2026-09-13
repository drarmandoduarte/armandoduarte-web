# `check/` — guardianes y plantillas

Nada de esta carpeta se publica: `.vercelignore` la deja fuera del deploy.

## `enlaces.sh` — guardián de enlaces internos (#01)

```sh
sh check/enlaces.sh
```

Falla (sale 1) si algún `href` apunta a un `.html` en vez de a una ruta limpia. Se corre antes de cada commit.

## `og-home.html`, `og-taller.html`, `og-capturar.mjs` — imágenes para compartir (#02)

Las dos imágenes (`img/og-home.jpg` e `img/og.jpg`) **no se hacen a mano**: se generan desde estas plantillas, que usan el mismo `estilo.css` y las mismas fuentes locales que la web. Así, cuando cambie la fecha del taller, se cambia el `<span data-fecha>` de `og-taller.html` y se vuelve a capturar.

Este repo no tiene `package.json` ni `node_modules` a propósito, así que el Playwright se toma prestado de otro proyecto de la casa con la variable `PLAYWRIGHT_MODULE`:

```sh
PLAYWRIGHT_MODULE=/Users/germanfalcioni/Development/Bitacora/node_modules/playwright/index.mjs \
  node check/og-capturar.mjs
```

Desde un proyecto que ya tenga Playwright instalado, la variable no hace falta:

```sh
node check/og-capturar.mjs
```

Salida: `img/og-home.jpg` e `img/og.jpg`, 1200×630, JPEG calidad 88, bastante por debajo de los 150 KB.

## `favicon.svg` — de dónde sale (#02)

La «A» del favicon no es un `<text>`: es el contorno del glifo `A` de Montserrat en peso 500 —el mismo peso de la marca del header— extraído con `fontTools` desde `fuentes/Montserrat-300-600-latin.woff2` y pegado como `<path>`. Así se ve igual aunque quien la mire no tenga la fuente. De ese SVG salen `favicon.ico` (32 px) y `apple-touch-icon.png` (180 px, fondo crema porque iOS no usa transparencia).
