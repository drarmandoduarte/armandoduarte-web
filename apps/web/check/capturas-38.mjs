#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #38 — la landing de matrimonios.
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-38.mjs http://127.0.0.1:4180 [carpeta]
 *
 * `/matrimonios` completa a 1440 (una imagen larga) y a 390, y la banda AHORA
 * de la portada a 1440 y a 390. Con todo revelado y sin movimiento.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = process.argv[3] || join(AQUI, '..', '..', '..', 'docs', 'informes', '38');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();

async function abrir(ruta, ancho) {
  const p = await navegador.newPage({ viewport: { width: ancho, height: ancho > 900 ? 900 : 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(`${BASE}${ruta}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await QUIETAR(p);
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  /* Las fotos son `lazy`: se las fuerza a bajar antes de la captura larga. */
  await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(600);
  return p;
}
const guardar = (loc, nombre, opciones = {}) => loc.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 82, ...opciones });

for (const ancho of [1440, 390]) {
  const p = await abrir('/matrimonios', ancho);
  await guardar(p, `matrimonios-${ancho}.jpg`, { fullPage: true });
  await p.close();
  const q = await abrir('/', ancho);
  await guardar(q.locator('#ahora'), `ahora-portada-${ancho}.jpg`);
  await q.close();
}
await navegador.close();
