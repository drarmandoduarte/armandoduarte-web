#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #33 ter — la sede vuelve a «Fiesta Inn Mérida».
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-33-ter.mjs http://127.0.0.1:4180
 *
 * A 1440×900: la ficha del taller en la portada y los hechos de `/merida`.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '33-ter');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();

async function abrir(ruta) {
  const p = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(`${BASE}${ruta}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await QUIETAR(p);
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  await p.waitForTimeout(500);
  return p;
}
const guardar = (loc, nombre) => loc.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 86 });

{
  const p = await abrir('/');
  await guardar(p.locator('#taller .ficha'), 'ficha-portada-1440.jpg');
  await p.close();
}
{
  const p = await abrir('/merida');
  await guardar(p.locator('.hechos').first(), 'hechos-merida-1440.jpg');
  await p.close();
}
await navegador.close();
