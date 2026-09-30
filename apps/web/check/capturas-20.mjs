#!/usr/bin/env node
/**
 * Las capturas del informe de la orden #20 (F), reproducibles.
 *
 * ── Por qué es un script y no un puñado de capturas a mano ───────────────
 * Porque el punto F pide cosas **medidas**: los dos héroes «a 1440×900 y
 * 1920×1080 exactos, la sección entera dentro del viewport, y el arco tocando el
 * cambio de color, con zoom al borde». Una captura a mano no puede prometer el
 * viewport exacto, y la del zoom al borde es un recorte de coordenadas que nadie
 * acierta arrastrando el mouse. Con esto, quien revise el PR en tres meses las
 * vuelve a generar iguales:
 *
 *     node check/capturas-20.mjs http://127.0.0.1:4180
 *
 * Salen a `docs/informes/20/`. No entran a `public/` ni a la gate: son del
 * informe, no del sitio.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIETAR } from './renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '20');
mkdirSync(SALIDA, { recursive: true });

const VIEWPORTS = [
  { ancho: 1440, alto: 900 },
  { ancho: 1920, alto: 1080 },
];

const navegador = await chromium.launch();
const page = await navegador.newPage({ deviceScaleFactor: 1 });

/** La página quieta, revelada y con la tipografía puesta. */
async function preparar(ruta) {
  await page.goto(`${BASE}${ruta}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await QUIETAR(page);
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  await page.waitForTimeout(250);
}

const guardar = async (nombre, opciones) => {
  await page.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 86, ...opciones });
  console.log(`  ${nombre}`);
};

/* ── A y B · los dos héroes, con el viewport exacto y el zoom al borde ───── */
for (const [pagina, ruta] of [['portada', '/'], ['merida', '/merida']]) {
  for (const { ancho, alto } of VIEWPORTS) {
    await page.setViewportSize({ width: ancho, height: alto });
    await preparar(ruta);

    /* La ventana entera: es lo que prueba que el hero mida la pantalla y que
       debajo no asome ninguna franja de la sección siguiente. */
    await guardar(`AB-hero-${pagina}-${ancho}x${alto}.jpg`);

    /* Y el zoom al borde: una banda de 160 px centrada en el cambio de color,
       que es donde apoya el arco. Las coordenadas salen de la medición, no del
       ojo. */
    const caja = await page.evaluate(() => {
      const sec = document.querySelector('section.hero');
      const arco = document.querySelector('.hero .foto--arco');
      const s = sec.getBoundingClientRect();
      const a = arco.getBoundingClientRect();
      return {
        y: Math.max(0, Math.round(s.bottom) - 110),
        x: Math.max(0, Math.round(a.left) - 40),
        w: Math.round(a.width) + 80,
        separacion: +(s.bottom - a.bottom).toFixed(1),
      };
    });
    await guardar(`B-borde-${pagina}-${ancho}x${alto}.jpg`, {
      clip: { x: caja.x, y: caja.y, width: caja.w, height: 160 },
    });
    console.log(`     separación arco↔sección: ${caja.separacion} px`);
  }
}

/* ── C · el hover del contacto ──────────────────────────────────────────── */
await page.setViewportSize({ width: 1440, height: 900 });
await preparar('/');
const enlace = page.locator('#contacto .grande a').first();
await enlace.scrollIntoViewIfNeeded();
await enlace.hover();
await page.waitForTimeout(500);
const cajaContacto = await page.locator('#contacto').boundingBox();
await guardar('C-contacto-hover.jpg', {
  clip: {
    x: cajaContacto.x, y: Math.max(0, cajaContacto.y), width: cajaContacto.width, height: Math.min(520, cajaContacto.height),
  },
});
const borde = await enlace.evaluate((el) => getComputedStyle(el).borderBottomColor);
console.log(`     borde del enlace en hover: ${borde}`);

/* ── D · el pie ──────────────────────────────────────────────────────────── */
await preparar('/');
const pie = page.locator('footer.ft');
await pie.scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await guardar('D-pie.jpg', { clip: await pie.boundingBox() });

/* ── E · la franja de hechos con el enlace al mapa ────────────────────────── */
await preparar('/merida');
const hechos = page.locator('#suena .hechos');
await hechos.scrollIntoViewIfNeeded();
await page.locator('#suena .hechos a').first().hover();
await page.waitForTimeout(400);
await guardar('E-hechos-mapa.jpg', { clip: await hechos.boundingBox() });
const destino = await page.locator('#suena .hechos a').first().getAttribute('href');
console.log(`     el enlace del lugar apunta a: ${destino}`);

/* ── Y «Lo que te llevas» fresco ─────────────────────────────────────────
   La orden lo pide para desmentir una captura de dirección que muestra una mujer
   meditando: las fotos publicadas son las de Lucía del 28/9 —padre e hijo en la
   playa y padre e hijo en la cama—, así que la captura era vieja o de caché. Acá
   no se toca nada: se muestra lo que hay. Vivía dentro de `#programa`; desde la
   #20-bis es su propia sección, `#llevas`. */
await preparar('/merida');
const llevas = page.locator('#llevas .tres');
await llevas.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await guardar('F-lo-que-te-llevas-1440.jpg', { clip: await llevas.boundingBox() });
const fotos = await page.locator('#llevas .tres img').evaluateAll(
  (els) => els.map((e) => (e.currentSrc || e.src).split('/').pop()));
console.log(`     las tres fotos publicadas: ${fotos.join(', ')}`);

await navegador.close();
console.log(`\ncapturas-20: listas en docs/informes/20/`);
