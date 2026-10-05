import { expect, test, type Page } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * El pelo de Armando a la altura de las letras del rótulo — orden #28 (3).
 *
 * La #26 alineó **cajas**: el borde de la imagen con el borde del rótulo. Pero
 * el archivo tiene 38 filas transparentes arriba y el rótulo tiene aire propio
 * dentro de su `line-height`, así que lo que se ve —el pelo y las letras— no
 * quedaba a la misma altura (Germán, smoke del 1/10). Este test mira **lo que
 * se ve**: saca una captura a 1440×900 y 1920×1080 y busca
 *
 *   · en la columna de la foto, la primera fila con un píxel que no es el
 *     fondo de la sección (el pelo);
 *   · en la caja del rótulo, la primera fila con un píxel que no es el fondo
 *     (las letras);
 *
 * y afirma que son la misma fila, ±1 px, en `#quien` y en `#facilitador`.
 *
 * Qué cuenta como «no es el fondo»: un canal que se aparta más de `UMBRAL` del
 * color de fondo, medido en la propia captura (una esquina vacía de la
 * sección). Es el mismo umbral para el pelo y para las letras, así que el
 * antialias pesa igual de los dos lados.
 *
 * La captura se decodifica en un `<canvas>` del propio navegador, en una
 * pestaña en blanco aparte —la CSP del sitio no deja cargar `data:` como
 * imagen, y está bien que no lo deje—: sin dependencias nuevas para leer un PNG.
 *
 * Qué NO mira: debajo de 901 px la foto va apilada y no hay rótulo al lado.
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const LUGARES = [
  ['portada', '/', '#quien'],
  ['taller', '/merida', '#facilitador'],
  /* #38: «Sobre el facilitador» de /matrimonios, con las mismas reglas. */
  ['matrimonios', '/matrimonios', '#facilitador'],
] as const;

const UMBRAL = 40;

type Caja = { x: number; y: number; width: number; height: number };

async function abrir(page: Page, ruta: string) {
  await page.goto(`http://127.0.0.1:${PUERTO_PORT}${ruta}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

/** Primera fila (en coordenadas de la captura) con un píxel que no es el fondo. */
async function primeraFila(lienzo: Page, png: Buffer, caja: Caja, fondo: Caja) {
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
    let pixeles = 0;
    for (let y = 0; y < d.height; y++) {
      for (let x = 0; x < d.width; x++) {
        const i = (y * d.width + x) * 4;
        pixeles++;
        if (Math.abs(d.data[i] - f[0]) > umbral || Math.abs(d.data[i + 1] - f[1]) > umbral || Math.abs(d.data[i + 2] - f[2]) > umbral) {
          return { fila: Math.round(caja.y) + y, pixeles };
        }
      }
    }
    return { fila: -1, pixeles };
  }, { datos: png.toString('base64'), caja, fondo, umbral: UMBRAL });
}

for (const vp of VIEWPORTS) {
  for (const [nombre, ruta, seccion] of LUGARES) {
    test(`${nombre} · ${seccion}: el pelo de Armando a la altura de las letras del rótulo a ${vp.width}×${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await abrir(page, ruta);
      await page.waitForFunction((sel) => {
        const img = document.querySelector(`${sel} .foto--libre img`) as HTMLImageElement | null;
        if (img) img.loading = 'eager';
        return !!img?.complete && img.naturalHeight > 0;
      }, seccion);
      /* El rótulo a 300 px del borde de la pantalla: lejos de la cabecera fija. */
      await page.evaluate(async (sel) => {
        const r = document.querySelector(`${sel} .eyebrow`)!.getBoundingClientRect();
        window.scrollBy({ top: r.top - 300, behavior: 'instant' });
        /* La foto es `loading=lazy` y el `<picture>` elige otra fuente al
           entrar en pantalla: se espera a que la que se pinta esté decodificada. */
        await (document.querySelector(`${sel} .foto--libre img`) as HTMLImageElement).decode();
      }, seccion);
      await page.waitForTimeout(300);

      const m = await page.evaluate((sel) => {
        const caja = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
        const s = document.querySelector(sel)!;
        const img = s.querySelector('.foto--libre img')!.getBoundingClientRect();
        const rotulo = s.querySelector('.grid-2 > div:last-child .eyebrow')!.getBoundingClientRect();
        const sec = s.getBoundingClientRect();
        return {
          /* El pelo: la columna de la foto, desde 60 px arriba del rótulo hasta 80 abajo. */
          foto: { x: img.x, y: rotulo.y - 60, width: img.width, height: 140 },
          /* Las letras: la caja del rótulo, con 60 px de margen arriba. */
          letras: { x: rotulo.x, y: rotulo.y - 60, width: rotulo.width, height: rotulo.height + 60 },
          /* El fondo: una esquina de la sección a la izquierda del contenedor. */
          fondo: { x: Math.max(sec.x + 4, 2), y: rotulo.y - 40, width: 1, height: 1 },
          img: caja(img),
        };
      }, seccion);

      /* EL PISO, PRIMERO: que haya algo que medir. */
      expect(m.img.height, `${nombre}: la imagen mide 0`).toBeGreaterThan(300);
      expect(m.foto.width, `${nombre}: la columna de la foto mide 0`).toBeGreaterThan(200);
      expect(m.letras.width, `${nombre}: el rótulo mide 0`).toBeGreaterThan(40);

      const png = await page.screenshot({ animations: 'disabled' });
      const lienzo = await page.context().newPage();
      const pelo = await primeraFila(lienzo, png, m.foto, m.fondo);
      const letras = await primeraFila(lienzo, png, m.letras, m.fondo);
      await lienzo.close();

      expect(pelo.fila, `${nombre}: no encontré el pelo en ${pelo.pixeles} píxeles`).toBeGreaterThan(0);
      expect(letras.fila, `${nombre}: no encontré las letras en ${letras.pixeles} píxeles`).toBeGreaterThan(0);
      /* Las dos primeras filas no pueden ser el borde de la ventana de búsqueda:
         eso querría decir que la ventana arrancó adentro del pelo o de la letra. */
      expect(pelo.fila, `${nombre}: la ventana del pelo arranca dentro del pelo`).toBeGreaterThan(Math.round(m.foto.y));
      expect(letras.fila, `${nombre}: la ventana de las letras arranca dentro de las letras`).toBeGreaterThan(Math.round(m.letras.y));

      const dif = pelo.fila - letras.fila;
      expect(
        Math.abs(dif),
        `${nombre}: el pelo está ${Math.abs(dif)} px ${dif > 0 ? 'por debajo' : 'por encima'} de las letras (pelo ${pelo.fila}, letras ${letras.fila})`,
      ).toBeLessThanOrEqual(1);
    });
  }
}
