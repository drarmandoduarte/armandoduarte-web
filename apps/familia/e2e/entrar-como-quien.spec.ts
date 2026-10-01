import { expect, test, type Page } from '@playwright/test';
import { PUERTO } from '../playwright.config';

/**
 * `/entrar` como «Quién soy» — orden #31 (reemplaza al panel de la #30).
 *
 * A 1440×900 y 1920×1080 afirma:
 *
 *   · **ningún fondo cálido**: ningún elemento pinta `--calido` puro, y ninguno
 *     con un fondo que no sea crema cubre más del 15 % de la pantalla (eso
 *     deja pasar los campos —cálido al 60 %, chicos— y caza un panel);
 *   · la rejilla al ancho de la cabecera: Armando arranca en su borde
 *     izquierdo y el formulario termina en su borde derecho;
 *   · el formulario (la firma) a 96 px de la línea de la cabecera;
 *   · **por píxeles**: la primera fila que no es fondo del pelo = la primera
 *     fila que no es fondo de las letras de la firma, ±1 (como
 *     `apps/web/e2e/pelo-a-la-altura-del-rotulo.spec.ts`);
 *   · el corte del archivo apoyado en la línea del pie, ±1.
 *
 * La captura se decodifica en un `<canvas>` de una pestaña en blanco: la CSP
 * de la app no deja cargar `data:` como imagen. Sin dependencias nuevas.
 *
 * Qué NO mira: `/empezar` (mismo molde, necesita sesión simulada: lo muestra
 * `check/capturas-29.mjs`) y debajo de 1100 px, donde no hay foto (lo prueba
 * `la-entrada-a-la-altura.test.tsx`).
 *
 * No corre en la gate (pendiente 16 de `docs/tareas.md`). A mano, contra el build:
 *
 *   VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=x pnpm --filter @codice/familia build
 *   pnpm --filter @codice/familia test:e2e e2e/entrar-como-quien.spec.ts
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const UMBRAL = 40;
type Caja = { x: number; y: number; width: number; height: number };

/** Primera fila (en coordenadas de la captura) con un píxel que se aparta del fondo. */
async function primeraFila(lienzo: Page, png: Buffer, caja: Caja, fondo: { x: number; y: number }) {
  return lienzo.evaluate(async ({ datos, caja, fondo, umbral }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${datos}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const f = ctx.getImageData(Math.round(fondo.x), Math.round(fondo.y), 1, 1).data;
    const d = ctx.getImageData(Math.round(caja.x), Math.round(caja.y), Math.round(caja.width), Math.round(caja.height));
    for (let y = 0; y < d.height; y++) {
      for (let x = 0; x < d.width; x++) {
        const i = (y * d.width + x) * 4;
        if (Math.abs(d.data[i] - f[0]) > umbral || Math.abs(d.data[i + 1] - f[1]) > umbral || Math.abs(d.data[i + 2] - f[2]) > umbral) {
          return Math.round(caja.y) + y;
        }
      }
    }
    return -1;
  }, { datos: png.toString('base64'), caja, fondo, umbral: UMBRAL });
}

for (const vp of VIEWPORTS) {
  test(`/entrar a ${vp.width}×${vp.height}: como «Quién soy», sin fondo, el pelo a la altura de la firma`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto(`http://127.0.0.1:${PUERTO}/entrar`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const img = document.querySelector('.de-pie img') as HTMLImageElement | null;
      return !!img?.complete && img.naturalHeight > 0;
    });
    await page.waitForTimeout(200);

    const m = await page.evaluate(() => {
      const caja = (sel: string) => {
        const r = document.querySelector(sel)!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height, x: r.x, y: r.y };
      };
      /* Los fondos: `--calido` resuelto por el navegador, y la crema. */
      const muestra = document.createElement('div');
      document.body.appendChild(muestra);
      muestra.style.background = 'var(--calido)';
      const calido = getComputedStyle(muestra).backgroundColor;
      muestra.style.background = 'var(--crema)';
      const crema = getComputedStyle(muestra).backgroundColor;
      muestra.remove();
      const area = window.innerWidth * window.innerHeight;
      const todos = [...document.querySelectorAll('body *')];
      const pintanCalido = todos.filter((e) => getComputedStyle(e).backgroundColor === calido).map((e) => `${e.tagName.toLowerCase()}.${e.className}`);
      const grandes = todos.filter((e) => {
        const bg = getComputedStyle(e).backgroundColor;
        if (bg === crema || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return false;
        const r = e.getBoundingClientRect();
        return r.width * r.height > 0.15 * area;
      }).map((e) => `${e.tagName.toLowerCase()}.${e.className}`);
      const img = document.querySelector('.de-pie img') as HTMLImageElement;
      const ri = img.getBoundingClientRect();
      const escala = Math.min(ri.width / img.naturalWidth, ri.height / img.naturalHeight);
      return {
        mirados: todos.length, pintanCalido, grandes,
        cabecera: caja('.cab__dentro'), pie: caja('.pie__dentro'), columna: caja('.columna'),
        firma: caja('.firma'), figura: caja('.de-pie'), img: caja('.de-pie img'),
        pintado: { ancho: img.naturalWidth * escala, alto: img.naturalHeight * escala },
      };
    });

    /* EL PISO, PRIMERO: que haya qué mirar. */
    expect(m.mirados, 'el barrido de fondos no vio la página').toBeGreaterThan(30);
    expect(m.img.height, 'Armando no se pinta').toBeGreaterThan(300);
    expect(m.columna.width, 'no hay columna del formulario').toBeGreaterThan(400);

    /* Lo que busca: fondos exactamente `--calido`, o no-crema de más del 15 %
       de la pantalla, en todo `body`. No busca imágenes de fondo ni degradados. */
    expect(m.pintanCalido, 'hay fondo cálido en la pantalla').toEqual([]);
    expect(m.grandes, 'hay un fondo que no es crema cubriendo un pedazo grande de la pantalla').toEqual([]);

    expect(Math.abs(m.img.left - m.cabecera.left), `Armando no arranca en el borde izquierdo de la cabecera (${m.img.left.toFixed(1)} contra ${m.cabecera.left.toFixed(1)})`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.columna.right - m.cabecera.right), `el formulario no termina en el borde derecho de la cabecera (${m.columna.right.toFixed(1)} contra ${m.cabecera.right.toFixed(1)})`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.columna.width - m.figura.width), 'las dos columnas no son iguales').toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.columna.left - m.figura.right - 80), 'entre las columnas no hay 80 px').toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.firma.top - (m.cabecera.bottom + 96)), `el formulario arranca ${(m.firma.top - m.cabecera.bottom).toFixed(1)} px bajo la cabecera (96)`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.img.bottom - m.pie.top), `el corte del archivo no apoya en la línea del pie (${m.img.bottom.toFixed(1)} contra ${m.pie.top.toFixed(1)})`).toBeLessThanOrEqual(1);
    expect(Math.abs(m.pintado.alto - m.img.height), 'Armando no se pinta entero a su caja (el tope del 100 % mandó)').toBeLessThanOrEqual(1);

    /* Por píxeles. Si la página se desplaza, el rótulo a 300 px del borde. */
    await page.evaluate((y) => window.scrollBy({ top: y - 300, behavior: 'instant' }), m.firma.top);
    await page.waitForTimeout(150);
    const v = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      return { firma: r('.firma'), img: r('.de-pie img'), cab: r('.cab__dentro') };
    });
    const png = await page.screenshot({ animations: 'disabled' });
    const lienzo = await page.context().newPage();
    const fondo = { x: v.cab.left + 4, y: v.firma.top - 40 };
    const letras = await primeraFila(lienzo, png, { x: v.firma.left, y: v.firma.top - 60, width: v.firma.width, height: v.firma.height + 60 }, fondo);
    const pelo = await primeraFila(lienzo, png, { x: v.img.left, y: v.firma.top - 60, width: v.img.width, height: 160 }, fondo);
    await lienzo.close();

    expect(letras, 'no encontré las letras de la firma').toBeGreaterThan(Math.round(v.firma.top - 60));
    expect(pelo, 'no encontré el pelo').toBeGreaterThan(Math.round(v.firma.top - 60));
    const dif = pelo - letras;
    expect(Math.abs(dif), `el pelo está ${Math.abs(dif)} px ${dif > 0 ? 'por debajo' : 'por encima'} de las letras de la firma (pelo ${pelo}, letras ${letras})`).toBeLessThanOrEqual(1);

    console.log(`${vp.width}: columnas ${m.figura.width.toFixed(0)} + 80 + ${m.columna.width.toFixed(0)} · Armando ${m.img.width.toFixed(0)}×${m.img.height.toFixed(0)} · firma a ${(m.firma.top - m.cabecera.bottom).toFixed(0)} · corte ${m.img.bottom.toFixed(1)} / línea ${m.pie.top.toFixed(1)} · pelo ${pelo} / letras ${letras}`);
  });
}
