#!/usr/bin/env node
/**
 * El prerender — orden Códice #01, C1.
 *
 * ── Por qué existe ────────────────────────────────────────────────────────
 * Porque la web es **pública** y necesita HTML de verdad, no un `<div
 * id="root">` vacío. Un buscador que entra a `/taller` tiene que encontrar el
 * programa del taller escrito; una vista previa de WhatsApp tiene que encontrar
 * el `<title>` y el `og:image`; y alguien con la conexión lenta tiene que poder
 * leer antes de que baje el JavaScript. El sitio estático daba las tres cosas
 * gratis, y el port no puede perderlas: sería la única diferencia visible entre
 * las dos versiones, y de las que no se ven mirando la pantalla.
 *
 * ── Cómo ─────────────────────────────────────────────────────────────────
 * Corre después de `vite build`, que ya dejó `dist/index.html` con el `<script>`
 * y el `<link>` del CSS puestos. Esa es **la plantilla**: por cada ruta se
 * dibuja el árbol con `renderToString` sobre un router estático, se mete el HTML
 * donde está `<!--app-->` y el `<head>` de esa página donde está `<!--cabeza-->`,
 * y se escribe `dist/<archivo>`.
 *
 * En el cliente, `main.tsx` hace `hydrateRoot` sobre ese HTML.
 *
 * ── Sin framework, y por eso se lee ──────────────────────────────────────
 * React y `react-dom/server` alcanzan. La única pieza prestada es el propio
 * Vite, en modo SSR, para poder importar TypeScript y JSX sin un segundo build:
 * `ssrLoadModule` es la misma puerta que usa cualquier servidor de SSR en
 * desarrollo.
 *
 * ── El piso ──────────────────────────────────────────────────────────────
 * Si una página sale con menos de 2 KB de HTML, algo se rompió y nadie se
 * enteraría: un `renderToString` que devuelve vacío escribe un archivo válido,
 * chiquito y mudo. Se falla ahí, con el nombre de la ruta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const DIST = join(RAIZ, 'dist');
const PISO_DE_BYTES = 2048;

const plantilla = readFileSync(join(DIST, 'index.html'), 'utf8');
for (const marca of ['<!--app-->', '<!--cabeza-->']) {
  if (!plantilla.includes(marca)) {
    console.error(`prerender: la plantilla de dist/index.html no tiene ${marca}. Sin eso no hay dónde inyectar.`);
    process.exit(1);
  }
}

const vite = await createServer({
  root: RAIZ,
  logLevel: 'warn',
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { RUTAS } = await vite.ssrLoadModule('/src/rutas.ts');
  const { dibujar } = await vite.ssrLoadModule('/src/entrada-servidor.tsx');

  for (const { ruta, archivo, pagina } of RUTAS) {
    const { app, cabeza } = dibujar(ruta, pagina);
    const html = plantilla.replace('<!--cabeza-->', cabeza).replace('<!--app-->', app);

    if (Buffer.byteLength(html, 'utf8') < PISO_DE_BYTES) {
      console.error(
        `prerender: ${ruta} salió en ${Buffer.byteLength(html, 'utf8')} bytes y el piso es ${PISO_DE_BYTES}. `
        + 'Un render vacío escribe un archivo válido y mudo: no se publica.',
      );
      process.exit(1);
    }

    writeFileSync(join(DIST, archivo), html);
    console.log(`prerender: ${archivo.padEnd(16)} ${ruta.padEnd(12)} ${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB`);
  }
} finally {
  await vite.close();
}
