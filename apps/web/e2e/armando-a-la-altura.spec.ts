import { expect, test, type Page } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * Armando a la altura del texto, y la cita a todo el ancho — orden #26.
 *
 * Lo que midió el CEO en producción (2056): en `#quien` la foto arrancaba 30 px
 * por debajo del rótulo y en `#facilitador` el rótulo 10 px por debajo de la
 * foto, porque cada una tenía su alto propio y la fila alineaba abajo. Desde la
 * #26 manda la columna de texto; esto afirma, a 1440×900 y 1920×1080:
 *
 *   · arriba: la figura arranca el aire del rótulo por debajo de la columna
 *     de texto, y la `<img>` las 55 filas de halo por encima de la figura
 *     (orden #28; hasta la #28 las dos arrancaban en el borde del rótulo);
 *   · abajo: terminan donde termina la columna, que es el filo de la sección;
 *   · el ancho no pasa de la columna;
 *   · **Armando entero**: la imagen se pinta a escala, sin recortar
 *     (`naturalHeight × escala` = alto de la figura, y lo mismo el ancho).
 *
 * Qué NO mira: debajo de 901 px la foto va apilada debajo del texto (#12 E) y
 * no hay columna al lado que igualar; eso lo sigue cuidando
 * `armando-al-borde.spec.ts`.
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const LUGARES = [
  ['portada', '/', '#quien'],
  ['taller', '/merida', '#facilitador'],
] as const;

async function abrir(page: Page, ruta: string) {
  await page.goto(`http://127.0.0.1:${PUERTO_PORT}${ruta}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  /* Los bloques entran con un fundido y un `transform`: medir a mitad mide otra cosa. */
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => {
    (e as HTMLElement).style.opacity = '1';
    (e as HTMLElement).style.transform = 'none';
  }));
}

for (const vp of VIEWPORTS) {
  for (const [nombre, ruta, seccion] of LUGARES) {
    test(`${nombre} · ${seccion}: Armando mide lo que mide el texto a ${vp.width}×${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await abrir(page, ruta);
      await page.locator(`${seccion} .foto--libre img`).scrollIntoViewIfNeeded();
      await page.waitForFunction((sel) => {
        const img = document.querySelector(`${sel} .foto--libre img`) as HTMLImageElement | null;
        return !!img?.complete && img.naturalHeight > 0;
      }, seccion);

      const m = await page.evaluate((sel) => {
        const r = (el: Element) => el.getBoundingClientRect();
        const s = document.querySelector(sel)!;
        const figura = s.querySelector('.foto--libre')!;
        const img = figura.querySelector('img') as HTMLImageElement;
        const texto = s.querySelector('.grid-2 > div:last-child')!;
        const rotulo = texto.querySelector('.eyebrow')!;
        const columna = r(figura.parentElement!).width / 2;
        const ri = r(img);
        const escala = Math.min(ri.width / img.naturalWidth, ri.height / img.naturalHeight);
        return {
          figura: r(figura), img: ri, texto: r(texto), rotulo: r(rotulo), seccion: r(s),
          aire: parseFloat(getComputedStyle(s).getPropertyValue('--aire-rotulo')),
          columnaFoto: (getComputedStyle(figura.parentElement!).gridTemplateColumns.split(' ').map(parseFloat)[0]) || columna,
          pintado: { alto: img.naturalHeight * escala, ancho: img.naturalWidth * escala },
        };
      }, seccion);

      /* EL PISO, PRIMERO: que haya algo que medir. */
      expect(m.texto.height, 'la columna de texto mide 0').toBeGreaterThan(300);
      expect(m.img.height, 'la imagen mide 0').toBeGreaterThan(300);

      const px = (n: number) => Math.round(n);
      /* Desde la #28 la figura baja el aire del rótulo (`--aire-rotulo`) y la
         imagen sube por encima de la figura las 55 filas de halo del archivo:
         lo que se alinea es lo que se ve —pelo y letras—, y eso lo mide en
         píxeles `pelo-a-la-altura-del-rotulo.spec.ts`. Acá quedan las cajas. */
      expect(m.figura.top - m.texto.top, `${nombre}: la foto no baja el aire del rótulo`).toBeCloseTo(m.aire, 0);
      expect(m.img.top, `${nombre}: la fila 55 del archivo no cae en el borde de la figura`).toBeCloseTo(m.figura.top - (55 / 2791) * m.img.height, 0);
      expect(px(m.figura.bottom), `${nombre}: la foto no termina donde termina el texto`).toBe(px(m.texto.bottom));
      expect(px(m.img.bottom), `${nombre}: Armando no apoya en el filo de la sección`).toBe(px(m.seccion.bottom));
      expect(m.img.width, `${nombre}: la foto pasa el ancho de su columna`).toBeLessThanOrEqual(m.columnaFoto + 0.5);
      /* Armando entero: lo pintado es la caja, ni más alto (recortado) ni más bajo
         (con aire). Acá, y solo acá, ±1 px: la caja sale de `width:auto` sobre
         el alto y el navegador la redondea al subpíxel (medido: 527 contra
         528). Los cuatro bordes de arriba sí van a ±0, como pide la orden. */
      expect(Math.abs(m.pintado.alto - m.img.height), `${nombre}: la imagen no se pinta a todo el alto (recortada o con aire)`).toBeLessThanOrEqual(1);
      expect(Math.abs(m.pintado.ancho - m.img.width), `${nombre}: el ancho no sale del alto`).toBeLessThanOrEqual(1);
    });
  }
}

test('«¿Te suena?»: la cita ocupa todo el ancho del contenedor a 1440', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrir(page, '/merida');
  const m = await page.evaluate(() => {
    const cita = document.querySelector('.bloque-cita--ancha')!;
    const contenedor = cita.closest('.container')!;
    const estilo = getComputedStyle(contenedor);
    const interior = contenedor.getBoundingClientRect().width - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    return { cita: cita.getBoundingClientRect().width, contenedor: interior, citas: document.querySelectorAll('.bloque-cita--ancha').length };
  });
  expect(m.citas, 'hay una sola `.bloque-cita--ancha` en el sitio y es ésta').toBe(1);
  expect(m.contenedor, 'el contenedor mide 0').toBeGreaterThan(900);
  expect(Math.round(m.cita), 'la cita no ocupa todo el ancho del contenedor').toBe(Math.round(m.contenedor));
});
