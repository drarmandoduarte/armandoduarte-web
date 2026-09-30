#!/usr/bin/env node
/**
 * Las capturas de la orden Códice #20-bis — las tres decisiones de A.5.
 *
 *     node check/capturas-20-bis.mjs http://127.0.0.1:4180
 *
 * Cada sección **entera** a 1440×900, recortada por su propia caja y no por la
 * ventana: si una sección sobra, la captura mide más de 900 de alto y se ve. Al
 * lado se imprime el alto medido, que es el mismo número que da `check:altura`
 * porque la preparación es la misma (`PREPARAR` se importa, no se copia).
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREPARAR } from './altura.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '20');
mkdirSync(SALIDA, { recursive: true });

const SECCIONES = [
  ['/', 'quien'],
  ['/merida', 'programa'],
  ['/merida', 'llevas'],
  ['/merida', 'facilitador'],
];

const navegador = await chromium.launch();
const page = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const [ruta, id] of SECCIONES) {
  await PREPARAR(page, `${BASE}${ruta}`);
  const caja = await page.evaluate((id) => {
    const r = document.getElementById(id).getBoundingClientRect();
    return { x: 0, y: r.top + window.scrollY, width: r.width, height: r.height };
  }, id);
  const nombre = `bis-${id}-1440x900.jpg`;
  await page.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 86, fullPage: true, clip: caja });
  console.log(`  ${nombre} · #${id} mide ${Math.round(caja.height)} px (pantalla 900)`);
}

await navegador.close();
console.log('\ncapturas-20-bis: listas en docs/informes/20/');
