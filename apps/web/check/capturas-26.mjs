#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #26.
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-26.mjs http://127.0.0.1:4180
 *
 *   · `{quien,facilitador}-{1440,1920}.jpg`: la sección entera, con una línea
 *     en el borde de arriba del rótulo y otra en el de la foto (tienen que
 *     coincidir) y una en el filo de abajo de la sección.
 *   · `suena-1440.jpg`: la cita de «¿Te suena?», con dos líneas verticales en
 *     los bordes del contenedor.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '26');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();

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
  /* La cabecera es fija: en una captura de sección tapa justo el rótulo que
     se quiere mostrar. Se esconde solo acá, en la foto (por JS: la CSP de la
     web no deja inyectar un `<style>`, y hace bien). */
  await p.evaluate(() => { document.getElementById('hd').style.visibility = 'hidden'; });
  await p.waitForTimeout(600);
  return p;
}

/** Dibuja líneas sobre la página (en coordenadas del documento) y captura la sección. */
async function marcarYCapturar(p, selector, archivo, lineas) {
  await p.evaluate(({ lineas }) => {
    for (const l of lineas) {
      const d = document.createElement('div');
      d.setAttribute('data-marca', '');
      Object.assign(d.style, l.vertical
        ? { position: 'absolute', top: `${l.desde}px`, height: `${l.hasta - l.desde}px`, left: `${l.x}px`, width: '0', borderLeft: `2px dashed ${l.color}`, zIndex: '9999' }
        : { position: 'absolute', left: '0', right: '0', top: `${l.y}px`, height: '0', borderTop: `2px dashed ${l.color}`, zIndex: '9999' });
      const e = document.createElement('span');
      e.textContent = l.texto;
      Object.assign(e.style, { position: 'absolute', right: l.vertical || l.izquierda ? 'auto' : '12px', left: l.vertical ? '6px' : l.izquierda ? '12px' : 'auto', top: '-22px', background: l.color, color: 'white', font: '600 13px system-ui', padding: '2px 6px' });
      d.appendChild(e);
      document.body.appendChild(d);
    }
  }, { lineas });
  await p.locator(selector).screenshot({ path: join(SALIDA, archivo), type: 'jpeg', quality: 84 });
}

for (const [ruta, sel, nombre] of [['/', '#quien', 'quien'], ['/merida', '#facilitador', 'facilitador']]) {
  for (const [ancho, alto] of [[1440, 900], [1920, 1080]]) {
    const p = await abrir(ruta, ancho, alto);
    const m = await p.evaluate((sel) => {
      const y = (el) => Math.round(el.getBoundingClientRect().top + window.scrollY);
      const s = document.querySelector(sel);
      const img = s.querySelector('.foto--libre img');
      return {
        rotulo: y(s.querySelector('.eyebrow')),
        foto: y(img),
        fondo: Math.round(s.getBoundingClientRect().bottom + window.scrollY),
        pie: Math.round(img.getBoundingClientRect().bottom + window.scrollY),
      };
    }, sel);
    await marcarYCapturar(p, sel, `${nombre}-${ancho}.jpg`, [
      { y: m.rotulo, color: 'royalblue', texto: `rótulo y=${m.rotulo}`, izquierda: true },
      { y: m.foto, color: 'crimson', texto: `foto y=${m.foto}` },
      { y: m.fondo - 2, color: 'seagreen', texto: `filo de la sección y=${m.fondo} · pies y=${m.pie}` },
    ]);
    console.log(`${nombre} ${ancho}: rótulo ${m.rotulo} · foto ${m.foto} · pies ${m.pie} · filo ${m.fondo}`);
    await p.close();
  }
}

{
  const p = await abrir('/merida', 1440, 900);
  const m = await p.evaluate(() => {
    const cita = document.querySelector('.bloque-cita--ancha');
    const c = cita.closest('.container').getBoundingClientRect();
    const r = cita.getBoundingClientRect();
    return { izq: Math.round(c.left), der: Math.round(c.right), desde: Math.round(r.top + window.scrollY) - 40, hasta: Math.round(r.bottom + window.scrollY) + 40, cita: Math.round(r.width), contenedor: Math.round(c.width) };
  });
  await marcarYCapturar(p, '#suena', 'suena-1440.jpg', [
    { vertical: true, x: m.izq, desde: m.desde, hasta: m.hasta, color: 'crimson', texto: 'contenedor' },
    { vertical: true, x: m.der - 2, desde: m.desde, hasta: m.hasta, color: 'crimson', texto: `${m.contenedor} px` },
  ]);
  console.log(`suena 1440: cita ${m.cita} de ${m.contenedor}`);
  await p.close();
}
await navegador.close();
