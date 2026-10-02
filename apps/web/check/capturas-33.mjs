#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #33 — la web sin «Mi espacio» ni Spotify.
 *
 *     pnpm --filter @codice/web build
 *     node apps/web/e2e/servidor.mjs apps/web/dist 4180 &
 *     node apps/web/check/capturas-33.mjs http://127.0.0.1:4180
 *
 * A 1440×900: la cabecera (sin «Mi espacio →»), el pie (sin «Mi espacio» ni
 * Spotify), el hero de `/merida` (WhatsApp naranja y «Ver el programa») y el
 * contacto de la portada (sin Spotify). Imprime cuántos enlaces a la app y a
 * Spotify quedan en cada página, que es lo que no se ve en una foto.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '33');
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();

async function abrir(ruta) {
  const p = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
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
const contar = (p) => p.evaluate(() => ({
  app: document.querySelectorAll('a[href*="familia.armandoduarte.com"]').length,
  spotify: document.querySelectorAll('a[href*="spotify"]').length,
}));

{
  const p = await abrir('/');
  await p.screenshot({ path: join(SALIDA, 'cabecera-1440.jpg'), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1440, height: 120 } });
  await guardar(p.locator('#contacto'), 'contacto-1440.jpg');
  await guardar(p.locator('footer.ft'), 'pie-1440.jpg');
  console.log('portada:', await contar(p));
  await p.close();
}
{
  const p = await abrir('/merida');
  await p.screenshot({ path: join(SALIDA, 'hero-taller-1440.jpg'), type: 'jpeg', quality: 86 });
  console.log('merida:', await contar(p));
  await p.close();
}
await navegador.close();
