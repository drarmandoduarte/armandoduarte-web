#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #21 (D).
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-21.mjs http://127.0.0.1:4180
 *
 *   · `B-te-suena-1377x980-junto-a-lucia.jpg`: «¿Te suena?» al tamaño exacto
 *     de la captura de Lucía, a la derecha de la suya. Es la prueba de B.
 *   · `C-que-hago-1440x900.jpg`: «Qué hago» a escritorio, en dos columnas.
 *   · `D-te-suena-375x812.jpg`: «¿Te suena?» en el teléfono (auditoría del
 *     #33, 2), y `-alternativa` con la foto anclada al título, sin aplicar.
 *   · `A-huellas-en-dist.txt`: las líneas de `dist/merida.html` con `img/`,
 *     para ver las `?v=` sin abrir el HTML.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..', '..');
const SALIDA = join(RAIZ, 'docs', 'informes', '21');
const LUCIA = join(RAIZ, '..', '..', '03 Producto', 'web', 'insumos', '2026-09-28-taller-merida', 'lucia-te-suena.jpg');
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch();

async function seccion(ruta, id, ancho, alto) {
  const p = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(`${BASE}${ruta}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await QUIETAR(p);
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  await p.evaluate(async (sel) => {
    const s = document.querySelector(sel);
    for (const i of s.querySelectorAll('img')) { i.loading = 'eager'; if (!i.complete) await new Promise((r) => { i.onload = r; i.onerror = r; }); }
    window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
  }, `#${id}`);
  await p.waitForTimeout(300);
  return p;
}

/* ── B · «¿Te suena?» a 1377×980, al lado de la de Lucía ──────────────── */
{
  const p = await seccion('/merida', 'suena', 1377, 980);
  /* Lucía encuadró desde el rótulo: se deja la franja de hechos fuera, como
     en su captura, bajando hasta el `grid-2`. */
  const y = await p.evaluate(() => {
    const g = document.querySelector('#suena .grid-2');
    return Math.round(g.getBoundingClientRect().top + window.scrollY - 72);
  });
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  /* Y sin la cabecera fija: la captura de Lucía no la tiene, y encima de la
     sección tapa el rótulo. Se oculta solo para la foto; está declarado. */
  await p.evaluate(() => { document.getElementById('hd').style.visibility = 'hidden'; });
  await p.waitForTimeout(200);
  const nuestra = (await p.screenshot({ type: 'png' })).toString('base64');
  const lucia = readFileSync(LUCIA).toString('base64');
  await p.close();
  /* La lámina va en una pestaña limpia: la de la web trae su CSP, que no deja
     cargar imágenes `data:` ni estilos en línea (medido: salía en blanco). */
  const lamina = await navegador.newPage({ viewport: { width: 1377 * 2 + 40, height: 980 + 60 }, deviceScaleFactor: 1 });
  await lamina.setContent(`<body style="margin:0;background:gray;display:flex;gap:40px;font:600 16px system-ui;color:white">
    <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">Lucía · 28/9 (lucia-te-suena.jpg)</figcaption><img width="1377" height="980" src="data:image/jpeg;base64,${lucia}"></figure>
    <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">/merida · esta rama (sin la cabecera fija, como la de Lucía)</figcaption><img width="1377" height="980" src="data:image/png;base64,${nuestra}"></figure>
  </body>`);
  await lamina.screenshot({ path: join(SALIDA, 'B-te-suena-1377x980-junto-a-lucia.jpg'), type: 'jpeg', quality: 84 });
  await lamina.close();
}

/* ── Auditoría del #33 (2) · «¿Te suena?» en el teléfono, 375×812 ───────
   La sección desde su borde de arriba: la foto vertical ocupa esa primera
   pantalla. `D-te-suena-375x812-alternativa.jpg` es la misma sección con la
   foto anclada al título en vez de al borde, **no aplicada**: es para que
   dirección compare (ver el LEEME). */
for (const [nombre, alTitulo] of [['D-te-suena-375x812.jpg', false], ['D-te-suena-375x812-alternativa.jpg', true]]) {
  const p = await seccion('/merida', 'suena', 375, 812);
  const y = await p.evaluate((alTitulo) => {
    const s = document.getElementById('suena');
    if (!alTitulo) return Math.round(s.getBoundingClientRect().top + window.scrollY);
    const g = s.querySelector('.grid-2');
    const arriba = Math.round(g.getBoundingClientRect().top - s.getBoundingClientRect().top) - 72;
    s.querySelector('.fondo-foto--suena').style.top = `${arriba}px`;
    return Math.round(s.getBoundingClientRect().top + window.scrollY + arriba);
  }, alTitulo);
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await p.waitForTimeout(200);
  const medida = await p.evaluate(() => {
    const s = document.getElementById('suena');
    const f = s.querySelector('.fondo-foto--suena');
    return { seccion: s.offsetHeight, foto: f.offsetHeight, src: f.querySelector('img').currentSrc.split('/').pop() };
  });
  console.log(`${nombre}: sección ${medida.seccion} px, foto ${medida.foto} px, ${medida.src}`);
  await p.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 86 });
  await p.close();
}

/* ── C · «Qué hago» a 1440×900 ────────────────────────────────────────── */
{
  const p = await seccion('/', 'hago', 1440, 900);
  /* La sección arriba de todo y sin la cabecera fija encima, para que se vea
     entera: mide 748 de alto, así que entra en los 900 con lo que sigue. */
  await p.evaluate(() => {
    document.getElementById('hd').style.visibility = 'hidden';
    document.getElementById('hago').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await p.waitForTimeout(200);
  const caja = await p.evaluate(() => { const r = document.getElementById('hago').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; });
  console.log(`#hago: top ${caja[0]} px, alto ${caja[1]} px`);
  await p.screenshot({ path: join(SALIDA, 'C-que-hago-1440x900.jpg'), type: 'jpeg', quality: 86 });
  await p.close();
}

await navegador.close();

/* ── A · las huellas, en el HTML de `dist` ────────────────────────────── */
const html = readFileSync(join(AQUI, '..', 'dist', 'merida.html'), 'utf8');
const lineas = [...html.matchAll(/[^\s"'<>]*img\/[^\s"'<>]+/g)].map((m) => m[0]);
writeFileSync(join(SALIDA, 'A-huellas-en-dist.txt'),
  `# dist/merida.html · las ${lineas.length} URLs de imagen, tal como salen del prerender\n\n${lineas.join('\n')}\n`);
console.log(`capturas-21: listo en docs/informes/21/ (${lineas.length} URLs con huella en merida.html)`);
