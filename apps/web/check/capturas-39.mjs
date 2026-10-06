#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #39 — `/matrimonios #dolor`, dos filas espejo.
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-39.mjs http://127.0.0.1:4180
 *
 * `#dolor` a 1440 y a 390, con todo revelado y sin movimiento. Mide además las
 * dos fotos (tienen que ser iguales) y el aire entre el texto y su foto.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const SALIDA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'informes', '39');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();
for (const ancho of [1440, 390]) {
  const p = await navegador.newPage({ viewport: { width: ancho, height: ancho > 900 ? 900 : 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(`${BASE}/matrimonios`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await QUIETAR(p);
  await p.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
    document.querySelectorAll('#dolor img').forEach((i) => { i.loading = 'eager'; });
  });
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  const m = await p.evaluate(() => {
    const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) }; };
    const filas = [...document.querySelectorAll('#dolor .dolor__fila')].map((f) => ({ foto: r(f.querySelector('figure')), texto: r(f.querySelector('div')) }));
    return { seccion: r(document.querySelector('#dolor')), contenedor: r(document.querySelector('#dolor .container')), filas };
  });
  console.log(ancho, JSON.stringify(m));
  /* La cabecera es fija: en una captura de elemento quedaría flotando encima. */
  await p.evaluate(() => { document.getElementById('hd').style.visibility = 'hidden'; });
  await p.locator('#dolor').screenshot({ path: join(SALIDA, `dolor-${ancho}.jpg`), type: 'jpeg', quality: 86 });
  await p.close();
}
await navegador.close();
