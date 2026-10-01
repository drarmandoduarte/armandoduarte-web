#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #28 (PR A · web).
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-28.mjs http://127.0.0.1:4180
 *
 *   · `taller-portada-1440.jpg`: la tarjeta del taller en la portada, con
 *     «Reservar mi lugar →» y «Ver el programa →».
 *   · `programa-entrada-{1..6}.jpg`: la entrada escalonada de los núcleos, con
 *     movimiento, a 0 / 150 / 300 / 500 / 800 / 1400 ms de que la sección entra.
 *   · `programa-hover-1440.jpg`: el núcleo 3 con el mouse encima.
 *   · `{quien,facilitador}-{1440,1920}-borde.png`: zoom ×3 al borde de arriba
 *     —pelo y rótulo— con una línea horizontal en el borde de la figura (donde
 *     cae la fila 55 del archivo, el pelo), cruzando los dos.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '28');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();

async function abrir(ruta, ancho, alto, { movimiento = false, escala = 1 } = {}) {
  const p = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: escala, reducedMotion: movimiento ? 'no-preference' : 'reduce' });
  await p.goto(`${BASE}${ruta}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  /* Quieta, salvo cuando lo que se captura es justamente el movimiento. */
  if (!movimiento) await QUIETAR(p);
  await p.evaluate(async () => {
    for (const i of document.images) {
      i.loading = 'eager';
      if (!i.complete) await new Promise((r) => { i.onload = r; i.onerror = r; });
    }
  });
  await p.evaluate(() => { document.getElementById('hd').style.visibility = 'hidden'; });
  await p.waitForTimeout(1300);
  return p;
}

/* 1 · La tarjeta del taller en la portada. */
{
  const p = await abrir('/', 1440, 900);
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  await p.waitForTimeout(400);
  await p.locator('#taller').screenshot({ path: join(SALIDA, 'taller-portada-1440.jpg'), type: 'jpeg', quality: 84 });
  await p.close();
}

/* 2 · La entrada escalonada, cuadro a cuadro, y el hover. */
{
  const p = await abrir('/merida', 1440, 900, { movimiento: true });
  const caja = await p.evaluate(() => {
    const s = document.querySelector('#programa .nucleos');
    s.scrollIntoView({ behavior: 'instant', block: 'center' });
    const r = s.getBoundingClientRect();
    return { x: r.x - 20, y: r.y - 40, width: r.width + 40, height: r.height + 80 };
  });
  const t0 = Date.now();
  let n = 1;
  for (const t of [0, 150, 300, 500, 800, 1400]) {
    const falta = t - (Date.now() - t0);
    if (falta > 0) await p.waitForTimeout(falta);
    await p.screenshot({ path: join(SALIDA, `programa-entrada-${n++}.jpg`), type: 'jpeg', quality: 84, clip: caja });
  }
  await p.locator('#programa .nucleo').nth(2).hover();
  await p.waitForTimeout(700);
  await p.screenshot({ path: join(SALIDA, 'programa-hover-1440.jpg'), type: 'jpeg', quality: 84, clip: caja });
  await p.close();
}

/* 3 · El borde de arriba: pelo y letras, con zoom. */
for (const [ruta, sel, nombre] of [['/', '#quien', 'quien'], ['/merida', '#facilitador', 'facilitador']]) {
  for (const [ancho, alto] of [[1440, 900], [1920, 1080]]) {
    const p = await abrir(ruta, ancho, alto, { escala: 3 });
    await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
    const m = await p.evaluate((sel) => {
      const s = document.querySelector(sel);
      const rotulo = s.querySelector('.grid-2 > div:last-child .eyebrow');
      window.scrollBy({ top: rotulo.getBoundingClientRect().top - 300, behavior: 'instant' });
      const r = rotulo.getBoundingClientRect();
      const img = s.querySelector('.foto--libre img').getBoundingClientRect();
      const fig = s.querySelector('.foto--libre').getBoundingClientRect();
      return { x: img.x, ancho: r.right - img.x, rotulo: r.y + window.scrollY, figura: fig.y + window.scrollY, scroll: window.scrollY };
    }, sel);
    await p.waitForTimeout(400);
    /* La línea en el borde de la figura, que es donde cae la fila 55 del
       archivo (donde arranca el pelo). */
    await p.evaluate(({ y }) => {
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', left: '0', right: '0', top: `${y}px`, height: '0', borderTop: '1px solid crimson', zIndex: '9999' });
      document.body.appendChild(d);
    }, { y: m.figura });
    await p.screenshot({
      path: join(SALIDA, `${nombre}-${ancho}-borde.png`),
      clip: { x: m.x, y: m.rotulo - m.scroll - 30, width: m.ancho, height: 90 },
    });
    console.log(`${nombre} ${ancho}: rótulo y=${m.rotulo.toFixed(1)} · figura (fila 55 del pelo) y=${m.figura.toFixed(1)}`);
    await p.close();
  }
}
await navegador.close();
