// Captura las plantillas og a JPG de 1200x630, reproducible.
//
// Se corre desde `apps/web` (orden #02, D):
//
//     node check/og-capturar.mjs
//
// El Chromium sale de `@playwright/test`, que este paquete ya tiene porque lo
// usa el guardián de fidelidad. En el sitio estático esto no se podía —aquel
// repo no tiene `package.json` a propósito y el navegador se tomaba prestado de
// otro proyecto con `PLAYWRIGHT_MODULE`—; la variable sigue funcionando como
// escape, pero ya no hace falta.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..');
/* Salen a `public/img/`, que es de donde Vite las copia a `dist/img/` y de donde
   el `og:image` de `cabeza.ts` las nombra. */
const piezas = [
  { plantilla: 'og-home.html',   salida: 'public/img/og-home.jpg' },
  { plantilla: 'og-taller.html', salida: 'public/img/og.jpg' },
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
