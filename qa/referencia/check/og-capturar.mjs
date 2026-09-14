// Captura las plantillas og a JPG de 1200x630, reproducible.
//
// Este repo no tiene package.json ni node_modules a propósito, así que el
// Playwright se toma prestado de otro proyecto de la casa mediante la variable
// PLAYWRIGHT_MODULE. Cómo se corre: ver check/LEEME.md
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..');
const piezas = [
  { plantilla: 'og-home.html',   salida: 'img/og-home.jpg' },
  { plantilla: 'og-taller.html', salida: 'img/og.jpg' },
];

const navegador = await chromium.launch();
for (const { plantilla, salida } of piezas) {
  const pagina = await navegador.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await pagina.goto('file://' + join(aqui, plantilla));
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: join(raiz, salida), type: 'jpeg', quality: 88 });
  await pagina.close();
  console.log(salida, 'capturada');
}
await navegador.close();
