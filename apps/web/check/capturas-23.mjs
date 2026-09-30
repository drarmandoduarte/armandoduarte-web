#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #23 (E).
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-23.mjs http://127.0.0.1:4180
 *
 *   · `A-heroes-1440x900.jpg`: portada y taller lado a lado, con dos reglas
 *     horizontales: el borde de arriba del arco y el del rótulo.
 *   · `B-hechos-y-suena-1440.jpg`: la banda de hechos entre el hero y «¿Te
 *     suena?»; `B-suena-375x812.jpg`: «¿Te suena?» en el teléfono, con la cara
 *     detrás del título (lo que el CEO pidió confirmar al cerrar el #33).
 *   · `C-armando-{quien,facilitador}-{1440,375}-{cabeza,pies}.jpg`: zoom arriba
 *     y al borde de abajo del recorte `de-pie`.
 *   · `D-nucleos-1440-junto-a-512.jpg` (necesita red: saca «Cuatro etapas» de
 *     512.com.uy al mismo ancho) y `D-nucleos-375.jpg`.
 *   · `E-portada-1440.jpg` y `E-merida-1440.jpg`: las dos páginas enteras.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '23');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();

/** Una página quieta: fuentes, sin fundidos y con todas las fotos bajadas. */
async function abrir(ruta, ancho, alto) {
  const p = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(`${BASE}${ruta}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await QUIETAR(p);
  await p.evaluate(async () => {
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
    for (const i of document.images) {
      i.loading = 'eager';
      if (!i.complete) await new Promise((r) => { i.onload = r; i.onerror = r; });
    }
  });
  await p.waitForTimeout(700);
  return p;
}
const guardar = (p, nombre, extra = {}) => p.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 84, ...extra });

/* ── A · los dos héroes lado a lado ─────────────────────────────────────── */
{
  const tomas = [];
  for (const ruta of ['/', '/merida']) {
    const p = await abrir(ruta, 1440, 900);
    const ys = await p.evaluate(() => {
      const arco = document.querySelector('.hero .foto--arco').getBoundingClientRect();
      const rotulo = document.querySelector('.hero .eyebrow').getBoundingClientRect();
      return { arco: Math.round(arco.top), rotulo: Math.round(rotulo.top) };
    });
    tomas.push({ ruta, ys, png: (await p.screenshot({ type: 'png' })).toString('base64') });
    await p.close();
  }
  const [a, b] = tomas;
  const regla = (y, color, texto) => `<div style="position:absolute;left:0;right:0;top:${y + 60}px;height:0;border-top:2px dashed ${color}"><span style="position:absolute;right:8px;top:-22px;background:${color};color:white;padding:2px 6px">${texto}</span></div>`;
  const lamina = await navegador.newPage({ viewport: { width: 1440 * 2 + 40, height: 960 }, deviceScaleFactor: 1 });
  await lamina.setContent(`<body style="margin:0;background:gray;font:600 16px system-ui;color:white;position:relative">
    <div style="display:flex;gap:40px">
      <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">/ · portada</figcaption><img width="1440" height="900" src="data:image/png;base64,${a.png}"></figure>
      <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">/merida · taller</figcaption><img width="1440" height="900" src="data:image/png;base64,${b.png}"></figure>
    </div>
    ${regla(a.ys.arco, 'crimson', `arco y=${a.ys.arco} · ${b.ys.arco}`)}
    ${regla(a.ys.rotulo, 'royalblue', `rótulo y=${a.ys.rotulo} · ${b.ys.rotulo}`)}
  </body>`);
  await guardar(lamina, 'A-heroes-1440x900.jpg');
  await lamina.close();
  console.log(`A: arco ${a.ys.arco}/${b.ys.arco} · rótulo ${a.ys.rotulo}/${b.ys.rotulo}`);
}

/* ── B · la banda de hechos y «¿Te suena?» ──────────────────────────────── */
{
  const p = await abrir('/merida', 1440, 900);
  const y = await p.evaluate(() => Math.round(document.getElementById('hechos').getBoundingClientRect().top + window.scrollY) - 200);
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await p.waitForTimeout(200);
  await guardar(p, 'B-hechos-y-suena-1440.jpg');
  await p.close();

  const q = await abrir('/merida', 375, 812);
  await q.evaluate(() => {
    const s = document.getElementById('suena');
    window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
  });
  await q.waitForTimeout(200);
  const m = await q.evaluate(() => {
    const s = document.getElementById('suena');
    const f = s.querySelector('.fondo-foto--suena');
    const h2 = s.querySelector('h2').getBoundingClientRect();
    return { foto: f.offsetHeight, h2: Math.round(h2.top - s.getBoundingClientRect().top) };
  });
  console.log(`B: a 375 la foto mide ${m.foto} y el título arranca a ${m.h2} px del borde de la sección`);
  await guardar(q, 'B-suena-375x812.jpg');
  await q.close();
}

/* ── C · Armando, cabeza y pies ─────────────────────────────────────────── */
for (const [ruta, id] of [['/', 'quien'], ['/merida', 'facilitador']]) {
  for (const ancho of [1440, 375]) {
    const p = await abrir(ruta, ancho, 900);
    await p.evaluate(() => { document.getElementById('hd').style.visibility = 'hidden'; });
    const caja = await p.evaluate((id) => {
      const img = document.querySelector(`#${id} .foto--libre img`);
      img.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = img.getBoundingClientRect();
      const s = document.getElementById(id).getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, fondo: s.bottom };
    }, id);
    const alto = Math.min(260, caja.h / 2);
    const x = Math.max(0, caja.x - 20);
    const w = Math.min(ancho - x, caja.w + 40);
    await guardar(p, `C-armando-${id}-${ancho}-cabeza.jpg`, { clip: { x, y: Math.max(0, caja.y - 40), width: w, height: alto } });
    await guardar(p, `C-armando-${id}-${ancho}-pies.jpg`, { clip: { x, y: caja.y + caja.h - alto + 40, width: w, height: alto } });
    console.log(`C: #${id} @${ancho} · recorte ${Math.round(caja.w)}×${Math.round(caja.h)}, borde de abajo a ${Math.round(caja.fondo - caja.y - caja.h)} px del de la sección`);
    await p.close();
  }
}

/* ── D · los núcleos, al lado de «Cuatro etapas» de 512 ─────────────────── */
{
  const p = await abrir('/merida', 1440, 900);
  const nuestra = (await p.locator('#programa').screenshot({ type: 'png' })).toString('base64');
  await p.close();
  let suya = '';
  try {
    const q = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await q.goto('https://512.com.uy', { waitUntil: 'networkidle', timeout: 45000 });
    await q.evaluate(() => document.getElementById('proceso').scrollIntoView());
    await q.waitForTimeout(1500);
    suya = (await q.locator('#proceso').screenshot({ type: 'png' })).toString('base64');
    await q.close();
  } catch (e) {
    console.log(`D: 512.com.uy no respondió (${e.message.split('\n')[0]}); la lámina sale sin la suya`);
  }
  const lamina = await navegador.newPage({ viewport: { width: 1440 * 2 + 40, height: 1100 }, deviceScaleFactor: 1 });
  await lamina.setContent(`<body style="margin:0;background:gray;display:flex;gap:40px;align-items:flex-start;font:600 16px system-ui;color:white">
    <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">512.com.uy · «Cuatro etapas» (1440)</figcaption>${suya ? `<img width="1440" src="data:image/png;base64,${suya}">` : ''}</figure>
    <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">/merida #programa · esta rama (1440)</figcaption><img width="1440" src="data:image/png;base64,${nuestra}"></figure>
  </body>`);
  await guardar(lamina, 'D-nucleos-1440-junto-a-512.jpg', { fullPage: true });
  await lamina.close();

  const q = await abrir('/merida', 375, 900);
  await guardar(q, 'D-nucleos-375.jpg', { clip: await q.locator('#programa').boundingBox() , fullPage: true });
  await q.close();
}

/* ── E · las dos páginas enteras a 1440 ─────────────────────────────────── */
for (const [ruta, nombre] of [['/', 'E-portada-1440.jpg'], ['/merida', 'E-merida-1440.jpg']]) {
  const p = await abrir(ruta, 1440, 900);
  await guardar(p, nombre, { fullPage: true, quality: 70 });
  await p.close();
}

await navegador.close();
console.log('capturas-23: listo en docs/informes/23/');
