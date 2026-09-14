#!/usr/bin/env node
/**
 * Un servidor estático de treinta líneas, para comparar dos sitios.
 *
 * ── Por qué no `vite preview` ─────────────────────────────────────────────
 * Porque `vite preview` no sabe de `cleanUrls`: pedirle `/taller` devuelve el
 * `index.html` de la SPA, no `taller.html`. El guardián de fidelidad estaría
 * comparando la portada contra la página del taller y diría que son distintas,
 * que es verdad y no es lo que pregunta.
 *
 * ── Qué sirve, y por qué es idéntico de los dos lados ────────────────────
 * Las mismas reglas que `vercel.json`: `cleanUrls` —`/taller` → `taller.html`—
 * y `trailingSlash: false`. Los dos sitios se sirven con este mismo archivo, así
 * que ninguna diferencia puede venir del servidor: es la condición para que la
 * comparación signifique algo.
 *
 *   node e2e/servidor.mjs <carpeta> <puerto>
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

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
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

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
      res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
      createReadStream(ruta).pipe(res);
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`no está: ${limpio}`);
}).listen(Number(puerto), () => console.log(`sirviendo ${carpeta} en http://127.0.0.1:${puerto}`));
