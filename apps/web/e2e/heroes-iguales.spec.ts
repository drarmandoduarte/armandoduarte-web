import { expect, test } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * Los dos héroes son el mismo — orden #23, A.
 *
 * Hasta la #23 la portada tenía el arco de 520 px a 257 del borde y el taller
 * uno de 424 a 371: dos componentes que se fueron separando de a una orden.
 * Desde la #23 son uno solo (`web/comun/Hero.tsx`), y esto afirma lo que se ve:
 * **la misma caja de arco** (x, y, ancho, alto) en las dos páginas, a 1440×900 y
 * a 1920×1080, y además dónde está a 1440×900, que es lo que fija la orden.
 *
 * Desde la #23-ter el arco no apoya en el borde del hero: deja **el mismo aire
 * arriba y abajo**, 48 px desde la cabecera y 48 px hasta el filo de la
 * sección, en los dos héroes y los dos viewports. Y el busto sigue apoyado en
 * el borde de abajo del arco (0 px): el corte del traje es el filo del panel.
 *
 * Qué NO mira, dicho para que el verde no se lea de más: debajo de 900 px el
 * hero apila y el arco va debajo del texto, con su propio alto; ahí la orden no
 * fija caja.
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

async function medir(page: import('@playwright/test').Page, ruta: string) {
  await page.goto(`http://127.0.0.1:${PUERTO_PORT}${ruta}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const img = document.querySelector('.hero .foto--arco img') as HTMLImageElement | null;
    return !!img?.complete && img.naturalWidth > 0;
  });
  return page.evaluate(() => {
    const caja = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), ancho: Math.round(r.width), alto: Math.round(r.height) };
    };
    return {
      arco: caja('.hero .foto--arco'),
      rotulo: caja('.hero .eyebrow'),
      titulo: getComputedStyle(document.querySelector('.hero h1') as Element).fontSize,
      cabecera: Math.round((document.getElementById('hd') as HTMLElement).getBoundingClientRect().bottom),
      hero: caja('.hero'),
      /* Dónde cae la última fila de la foto (el corte del traje), no la caja
         del <img>: la caja llena el arco siempre; lo que se ve depende de
         `object-fit:cover` y del `object-position` vertical. */
      busto: (() => {
        const img = document.querySelector('.hero .foto--arco img') as HTMLImageElement | null;
        if (!img || !img.naturalWidth) return null;
        const r = img.getBoundingClientRect();
        const estilo = getComputedStyle(img);
        const cubre = estilo.objectFit === 'cover';
        const contiene = estilo.objectFit === 'contain';
        const escala = cubre
          ? Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight)
          : contiene ? Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight) : r.height / img.naturalHeight;
        const altoPintado = img.naturalHeight * escala;
        const [, posY = '50%'] = estilo.objectPosition.split(' ');
        const desplazamiento = posY.endsWith('%')
          ? (r.height - altoPintado) * (parseFloat(posY) / 100)
          : parseFloat(posY);
        return { corte: Math.round(r.y + desplazamiento + altoPintado) };
      })(),
    };
  });
}

for (const vp of VIEWPORTS) {
  test(`portada y taller: el mismo arco, el mismo rótulo y el mismo título a ${vp.width}×${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    const portada = await medir(page, '/');
    const taller = await medir(page, '/merida');

    /* EL PISO, PRIMERO: que haya arco en las dos. Dos `null` son iguales. */
    expect(portada.arco, 'la portada no tiene `.hero .foto--arco`').not.toBeNull();
    expect(taller.arco, 'el taller no tiene `.hero .foto--arco`').not.toBeNull();
    expect(portada.arco!.ancho, 'el arco de la portada mide 0 de ancho').toBeGreaterThan(300);

    expect(taller.arco, 'el arco del taller no tiene la misma caja que el de la portada').toEqual(portada.arco);
    expect(taller.rotulo!.y, 'el rótulo del taller no arranca a la misma altura que el de la portada').toBe(portada.rotulo!.y);
    expect(taller.titulo, 'el título del taller no tiene el mismo tamaño que el de la portada').toBe(portada.titulo);

    for (const [nombre, m] of [['portada', portada], ['taller', taller]] as const) {
      /* Lo que fija la orden: el hero mide la pantalla; el arco deja 48 px
         arriba (desde la cabecera) y 48 abajo (hasta el filo del hero), con el
         busto apoyado en su borde de abajo; el rótulo a 72. */
      expect(m.hero!.alto, `${nombre}: el hero no mide la pantalla`).toBe(vp.height);
      const arriba = m.arco!.y - m.cabecera;
      const abajo = m.hero!.y + m.hero!.alto - (m.arco!.y + m.arco!.alto);
      /* Abajo primero: sin el margen de abajo el arco, que va `align-self:end`,
         baja entero y el rojo de «arriba» mentiría sobre la causa. */
      expect(abajo, `${nombre}: el arco no deja 48 px abajo (hasta el filo del hero)`).toBe(48);
      expect(arriba, `${nombre}: el arco no deja 48 px arriba (desde la cabecera)`).toBe(48);
      expect(m.busto, `${nombre}: el arco no tiene busto`).not.toBeNull();
      expect(m.busto!.corte, `${nombre}: el corte del busto no apoya en el borde de abajo del arco`).toBe(m.arco!.y + m.arco!.alto);
      expect(m.rotulo!.y - m.cabecera, `${nombre}: el rótulo no arranca a 72 px de la cabecera`).toBe(72);
    }
  });
}
