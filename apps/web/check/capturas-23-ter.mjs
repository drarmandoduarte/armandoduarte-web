#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #23-ter.
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-23-ter.mjs http://127.0.0.1:4180
 *
 * `heroes-{1440x900,1920x1080}.jpg`: portada y taller lado a lado, con las dos
 * medidas marcadas sobre cada uno: el aire de arriba (de la cabecera al arco) y
 * el de abajo (del arco al filo del hero).
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '23-ter');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();

for (const [ancho, alto] of [[1440, 900], [1920, 1080]]) {
  const tomas = [];
  for (const ruta of ['/', '/merida']) {
    const p = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await p.goto(`${BASE}${ruta}`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await QUIETAR(p);
    await p.waitForFunction(() => {
      const i = document.querySelector('.hero .foto--arco img');
      return !!i?.complete && i.naturalWidth > 0;
    });
    await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const arco = document.querySelector('.hero .foto--arco').getBoundingClientRect();
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const cabecera = document.getElementById('hd').getBoundingClientRect().bottom;
      return {
        x: Math.round(arco.left + arco.width / 2),
        cabecera: Math.round(cabecera),
        arcoArriba: Math.round(arco.top),
        arcoAbajo: Math.round(arco.bottom),
        heroAbajo: Math.round(hero.bottom),
      };
    });
    tomas.push({ ruta, m, png: (await p.screenshot({ type: 'png' })).toString('base64') });
    await p.close();
  }
  /* Una cota vertical: una barra entre dos alturas con su número al lado. */
  const cota = (x, y1, y2, color) => `
    <div style="position:absolute;left:${x}px;top:${y1}px;height:${y2 - y1}px;width:0;border-left:3px solid ${color}"></div>
    <div style="position:absolute;left:${x - 14}px;top:${y1}px;width:31px;border-top:3px solid ${color}"></div>
    <div style="position:absolute;left:${x - 14}px;top:${y2 - 3}px;width:31px;border-top:3px solid ${color}"></div>
    <span style="position:absolute;left:${x + 12}px;top:${(y1 + y2) / 2 - 12}px;background:${color};color:white;padding:2px 8px">${y2 - y1} px</span>`;
  const figura = ({ ruta, m, png }, desplazamiento) => `
    <figure style="margin:0;position:relative;width:${ancho}px">
      <figcaption style="height:60px;line-height:60px;padding-left:12px">${ruta === '/' ? '/ · portada' : '/merida · taller'} · ${ancho}×${alto}</figcaption>
      <img width="${ancho}" height="${alto}" src="data:image/png;base64,${png}" style="display:block">
      ${cota(m.x, 60 + m.cabecera, 60 + m.arcoArriba, 'crimson')}
      ${cota(m.x, 60 + m.arcoAbajo, 60 + m.heroAbajo, 'crimson')}
    </figure>`;
  const lamina = await navegador.newPage({ viewport: { width: ancho * 2 + 40, height: alto + 60 }, deviceScaleFactor: 1 });
  await lamina.setContent(`<body style="margin:0;background:gray;font:600 18px system-ui;color:white">
    <div style="display:flex;gap:40px">${figura(tomas[0])}${figura(tomas[1])}</div></body>`);
  await lamina.screenshot({ path: join(SALIDA, `heroes-${ancho}x${alto}.jpg`), type: 'jpeg', quality: 84 });
  await lamina.close();
  for (const { ruta, m } of tomas) {
    console.log(`${ancho}×${alto} ${ruta}: arriba ${m.arcoArriba - m.cabecera} · abajo ${m.heroAbajo - m.arcoAbajo} · arco ${m.arcoAbajo - m.arcoArriba} de alto`);
  }
}
await navegador.close();
