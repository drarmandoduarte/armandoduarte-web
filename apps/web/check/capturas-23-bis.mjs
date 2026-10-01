#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #23-bis: `#programa` a 1440, en reposo y con
 * el mouse sobre el núcleo 3.
 *
 *     node apps/web/check/capturas-23-bis.mjs http://127.0.0.1:4180
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const SALIDA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'informes', '23-bis');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();
const p = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await p.goto(`${BASE}/merida`, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => {
  document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
  document.getElementById('hd').style.visibility = 'hidden';
});
const seccion = p.locator('#programa');
await seccion.scrollIntoViewIfNeeded();
await p.waitForTimeout(700);
await seccion.screenshot({ path: join(SALIDA, 'antes-reposo-1440.jpg'), type: 'jpeg', quality: 86 });
await p.locator('#programa .nucleo').nth(2).locator('p').hover();
await p.waitForTimeout(200);
await seccion.screenshot({ path: join(SALIDA, 'despues-mouse-en-nucleo-3-1440.jpg'), type: 'jpeg', quality: 86 });
await navegador.close();
console.log('capturas-23-bis: listo en docs/informes/23-bis/');
