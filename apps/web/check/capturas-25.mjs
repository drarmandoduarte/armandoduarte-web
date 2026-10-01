#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #25.
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-25.mjs http://127.0.0.1:4180
 *
 * A 1440×900 y 375×812: la cabecera (con «Mi espacio →»; a 375, el menú abierto
 * con «Mi espacio» primero), el pie, el hero de `/merida`, su cierre
 * «Reservar» y la banda «AHORA» de la portada. Imprime a dónde va cada enlace
 * a la app, que es lo que no se ve en una foto.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '25');
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
  await p.waitForTimeout(500);
  return p;
}
const guardar = (loc, nombre) => loc.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 86 });

for (const [ancho, alto] of [[1440, 900], [375, 812]]) {
  {
    const p = await abrir('/', ancho, alto);
    await p.screenshot({ path: join(SALIDA, `cabecera-${ancho}.jpg`), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: ancho, height: 120 } });
    if (ancho < 600) {
      await p.click('#abrir');
      await p.waitForTimeout(600);
      await p.screenshot({ path: join(SALIDA, `menu-${ancho}.jpg`), type: 'jpeg', quality: 86 });
      await p.click('#cerrar');
      await p.waitForTimeout(600);
    }
    await guardar(p.locator('#ahora'), `ahora-${ancho}.jpg`);
    await guardar(p.locator('footer.ft'), `pie-${ancho}.jpg`);
    const enlaces = await p.evaluate(() => [...document.querySelectorAll('a[href*="/entrar"]')]
      .map((a) => `${(a.textContent ?? '').trim().replace(/\s+/g, ' ')} → ${a.getAttribute('href')}`));
    console.log(`portada ${ancho}:\n  ${enlaces.join('\n  ')}`);
    await p.close();
  }
  {
    const p = await abrir('/merida', ancho, alto);
    await p.screenshot({ path: join(SALIDA, `hero-taller-${ancho}.jpg`), type: 'jpeg', quality: 86 });
    await guardar(p.locator('#reservar'), `reservar-taller-${ancho}.jpg`);
    const naranjas = await p.evaluate(() => [...document.querySelectorAll('#inicio .btn--naranja, #reservar .btn--naranja')].length);
    console.log(`merida ${ancho}: botones naranja en hero + cierre = ${naranjas} (uno por pantalla)`);
    await p.close();
  }
}
await navegador.close();
