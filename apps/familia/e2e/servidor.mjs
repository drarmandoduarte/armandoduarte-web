#!/usr/bin/env node
/**
 * El servidor de QA de Mi espacio.
 *
 * ── Por qué hay dos y no uno ────────────────────────────────────────────
 * Es hermano de `apps/web/e2e/servidor.mjs` y hace lo mismo, con **una sola
 * diferencia que es toda la razón de existir**: lee `apps/familia/vercel.json`
 * en vez del de la raíz. Y esa diferencia no se podía resolver con un parámetro
 * sin tocar el servidor de la web pública, que la orden #15 pone en «qué no se
 * toca» — y con motivo: es lo que sostiene el guardián de fidelidad y el de la
 * CSP de la web.
 *
 * Se midió lo que pasa sin esto, y por eso está escrito: las primeras capturas
 * de Mi espacio se tomaron con el servidor de la web, y la consola se llenó de
 *
 *     Connecting to 'https://jrscpjdscgycetyvenco.supabase.co/auth/v1/otp'
 *     violates the following Content Security Policy directive: "connect-src 'self'"
 *
 * porque la política que se estaba sirviendo era la de la web pública, que no
 * conoce a Supabase. El susto fue útil: **probó que la CSP muerde de verdad**.
 * Pero medir la app contra la política de otra app es medir cualquier cosa.
 *
 * ── Qué sirve ───────────────────────────────────────────────────────────
 * El `dist/` de `apps/familia` con las cabeceras de su propio `vercel.json`
 * —leídas, no copiadas: una segunda lista acá sería una segunda verdad— y el
 * `rewrite` de SPA, que es lo que hace que `/mi-espacio` devuelva el
 * `index.html` en vez de un 404. Lo que NO sirve es `/api/*`: esa ruta es una
 * función de Vercel y acá no hay funciones. Un pedido a `/api/` devuelve 501,
 * que es más honesto que un 404 y evita que un test crea que la API contestó.
 *
 *   node e2e/servidor.mjs <carpeta> <puerto>
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const [carpeta, puerto] = process.argv.slice(2);
if (!carpeta || !puerto) {
  console.error('uso: node e2e/servidor.mjs <carpeta> <puerto>');
  process.exit(1);
}
if (!existsSync(carpeta)) {
  console.error(`servidor: no existe ${carpeta}. Sin las dos carpetas no hay nada que comparar.`);
  process.exit(1);
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  /* `.webp` faltaba, y no era cosmético: **la web sirve en WebP casi todas sus
     imágenes** —los dos recortes de Armando y las seis fotografías— y acá salían
     con `application/octet-stream`. Vercel las sirve como `image/webp`, así que
     este servidor no estaba sirviendo lo mismo que la producción, que es su
     única razón de ser. Lo destapó la #12 midiendo Lighthouse: el informe no
     reconocía ninguna imagen de la página y por lo tanto no podía decir cuál era
     el elemento LCP ni qué pesaba de más. */
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Las cabeceras del `vercel.json` de la raíz que aplican a una ruta.
 *
 * El `source` de Vercel es una ruta con comodines (`/(.*)`, `/img/(.*)`), no una
 * expresión regular cualquiera: se traduce anclada a los dos extremos, que es
 * como la aplica la plataforma. Un `source` que no se sepa traducir hace fallar
 * el servidor en el arranque en vez de servir una cabecera de menos: una
 * cabecera que no se aplica no da error, y ése es justo el defecto que la #08
 * pagó.
 */
const VERCEL = join(dirname(fileURLToPath(import.meta.url)), '..', 'vercel.json');
const REGLAS = (JSON.parse(readFileSync(VERCEL, 'utf8')).headers ?? [])
  .filter((r) => !r.has)
  .map((r) => {
    if (!/^\/(\(\.\*\)|[A-Za-z0-9/_-]*(\(\.\*\))?)$/.test(r.source)) {
      console.error(`servidor: no sé traducir el source ${r.source} de vercel.json.`);
      process.exit(1);
    }
    return { re: new RegExp(`^${r.source.replace(/\(\.\*\)/g, '.*')}$`), headers: r.headers };
  });

const cabecerasDe = (ruta) => Object.fromEntries(
  REGLAS.filter((r) => r.re.test(ruta)).flatMap((r) => r.headers.map((h) => [h.key, h.value])),
);

createServer((req, res) => {
  const pedido = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  /* `normalize` y el corte de `..`: sin eso, `/../../etc/passwd` sale de la
     carpeta. Es un servidor de pruebas y aun así no se deja abierto. */
  const limpio = normalize(pedido).replace(/^(\.\.[/\\])+/, '');
  const candidatos = limpio.endsWith('/')
    ? [join(carpeta, limpio, 'index.html')]
    : [join(carpeta, limpio), `${join(carpeta, limpio)}.html`, join(carpeta, limpio, 'index.html')];

  for (const ruta of candidatos) {
    if (existsSync(ruta) && statSync(ruta).isFile()) {
      res.writeHead(200, {
        'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream',
        ...cabecerasDe(limpio),
      });
      createReadStream(ruta).pipe(res);
      return;
    }
  }
  /* `/api/*` es una función de Vercel y acá no hay funciones. **501 y no 404**,
     porque las dos cosas son distintas y confundirlas cuesta caro: un 404 se
     lee como «esa ruta no existe» y haría que un test diera por probado que la
     API rechazó algo, cuando lo que pasó es que nadie contestó. */
  if (limpio === '/api' || limpio.startsWith('/api/')) {
    res.writeHead(501, { 'Content-Type': 'text/plain; charset=utf-8', ...cabecerasDe(limpio) });
    res.end('acá no corre la función de Vercel: este servidor sirve la pantalla, no la API');
    return;
  }

  /* El `rewrite` de SPA del `vercel.json`: cualquier ruta que no sea un archivo
     devuelve el `index.html`, y el navegador decide qué pantalla es. Sin esto,
     `/mi-espacio` da 404 en QA y anda en producción — la peor clase de
     diferencia entre los dos. */
  const indice = join(carpeta, 'index.html');
  if (existsSync(indice)) {
    res.writeHead(200, { 'Content-Type': TIPOS['.html'], ...cabecerasDe(limpio) });
    createReadStream(indice).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`no está: ${limpio}`);
}).listen(Number(puerto), () => console.log(`sirviendo ${carpeta} en http://127.0.0.1:${puerto}`));
