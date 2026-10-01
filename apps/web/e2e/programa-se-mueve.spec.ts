import { expect, test, type Page } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * «Modelo orientado a la madurez» con el movimiento de 512 — orden #28 (2).
 *
 * Lo que afirma, en `/merida #programa`:
 *
 *   · **entrada escalonada**: los cinco núcleos tienen `transition-delay`
 *     0 / .12 / .24 / .36 / .48 s, y antes de entrar están 16 px abajo;
 *   · **la línea se dibuja**: antes de entrar está en `scaleX(0)` con
 *     `transform-origin` a la izquierda, después entera; debajo de 1100 px,
 *     `scaleY` desde arriba;
 *   · **al pasar el mouse** el núcleo 3 se levanta 4 px (`translateY(-4px)` en
 *     su matriz);
 *   · con `prefers-reduced-motion: reduce` nada se desplaza ni se dibuja, y el
 *     mouse no levanta nada.
 *
 * La configuración general corre con `reducedMotion: 'reduce'` (las capturas
 * de fidelidad tienen que ser deterministas); acá se pide movimiento a
 * propósito, salvo en el último bloque.
 *
 * Qué NO mira: la curva ni la duración pintadas cuadro a cuadro —se leen del
 * estilo computado—, ni el umbral del `IntersectionObserver`, que es el de toda
 * la web (`comportamiento.ts`).
 */
const RUTA = `http://127.0.0.1:${PUERTO_PORT}/merida`;

async function abrir(page: Page) {
  await page.goto(RUTA, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  /* El estado «antes de entrar» también se alcanza con una transición: la clase
     `js` se pone en el `<html>` después del primer cálculo de estilo, así que
     los núcleos —fuera de pantalla— pasan de `none` a 16 px y de `scaleX(1)` a
     `scaleX(0)` con su retraso (medido: `0px 15.92px` a los pocos ms). Se
     espera a que asiente: 480 ms del último + 700 de la transición. */
  await page.waitForTimeout(1300);
}

async function entrar(page: Page) {
  await page.evaluate(() => document.querySelector('#programa .nucleos')!.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForFunction(() => document.querySelectorAll('#programa .nucleo.reveal.in').length === 5);
  /* 480 ms de retraso del último + 700 de la entrada, con margen. */
  await page.waitForTimeout(1400);
}

test.describe('con movimiento', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a 1440: los cinco núcleos entran escalonados y la línea se dibuja desde la izquierda', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrir(page);

    const antes = await page.evaluate(() => [...document.querySelectorAll('#programa .nucleo')].map((n) => {
      const cs = getComputedStyle(n);
      const linea = n.querySelector('.nucleo__linea')!;
      return {
        entro: n.classList.contains('in'),
        retraso: cs.transitionDelay.split(',').map((v) => v.trim()),
        propiedades: cs.transitionProperty.split(',').map((v) => v.trim()),
        translate: cs.translate,
        linea: getComputedStyle(linea).transform,
        origen: getComputedStyle(linea).transformOrigin,
        lineaVisible: getComputedStyle(linea).display !== 'none',
      };
    }));

    /* EL PISO, PRIMERO: cinco núcleos, cuatro líneas, y todavía no entraron. */
    expect(antes.length, 'no encontré los cinco núcleos').toBe(5);
    expect(antes.filter((n) => n.lineaVisible).length, 'tiene que haber cuatro líneas').toBe(4);
    expect(antes.every((n) => !n.entro), 'los núcleos ya habían entrado al cargar: la medida de «antes» no mide nada').toBe(true);

    const retrasoDe = (n: (typeof antes)[number], prop: string) => n.retraso[n.propiedades.indexOf(prop)];
    expect(antes.map((n) => retrasoDe(n, 'opacity')), 'el retraso de la entrada').toEqual(['0s', '0.12s', '0.24s', '0.36s', '0.48s']);
    expect(antes.map((n) => retrasoDe(n, 'translate')), 'el retraso del desplazamiento').toEqual(['0s', '0.12s', '0.24s', '0.36s', '0.48s']);
    expect(antes.map((n) => retrasoDe(n, 'transform')), 'el levantarse no espera la entrada').toEqual(['0s', '0s', '0s', '0s', '0s']);
    expect(antes.map((n) => n.translate), 'antes de entrar, 16 px abajo').toEqual(Array(5).fill('0px 16px'));
    for (const n of antes.filter((x) => x.lineaVisible)) {
      expect(n.linea, 'antes de entrar la línea no está dibujada').toBe('matrix(0, 0, 0, 1, 0, 0)');
      expect(n.origen.split(' ')[0], 'la línea se dibuja desde la izquierda').toBe('0px');
    }

    await entrar(page);
    const despues = await page.evaluate(() => [...document.querySelectorAll('#programa .nucleo')].map((n) => ({
      translate: getComputedStyle(n).translate,
      opacidad: getComputedStyle(n).opacity,
      linea: getComputedStyle(n.querySelector('.nucleo__linea')!).transform,
    })));
    expect(despues.map((n) => n.translate), 'después de entrar, en su lugar').toEqual(Array(5).fill('none'));
    expect(despues.map((n) => n.opacidad)).toEqual(Array(5).fill('1'));
    expect(despues.slice(0, 4).map((n) => n.linea), 'después de entrar, las cuatro líneas enteras').toEqual(Array(4).fill('none'));
  });

  test('a 1440: al pasar el mouse el núcleo 3 se levanta 4 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrir(page);
    await entrar(page);
    const tercero = page.locator('#programa .nucleo').nth(2);
    const reposo = await tercero.evaluate((n) => getComputedStyle(n).transform);
    expect(reposo, 'en reposo no está levantado').toBe('none');
    await tercero.hover();
    await page.waitForTimeout(700);
    const m = await tercero.evaluate((n) => getComputedStyle(n).transform);
    expect(m, 'al pasar el mouse el núcleo 3 no se levanta 4 px').toBe('matrix(1, 0, 0, 1, 0, -4)');
    const vecino = await page.locator('#programa .nucleo').nth(1).evaluate((n) => getComputedStyle(n).transform);
    expect(vecino, 'se levanta solo el que tiene el mouse').toBe('none');
  });

  test('a 900 (vertical): la línea se dibuja hacia abajo y el mouse no levanta', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await abrir(page);
    const antes = await page.evaluate(() => {
      const linea = document.querySelector('#programa .nucleo .nucleo__linea')!;
      return { transform: getComputedStyle(linea).transform, origen: getComputedStyle(linea).transformOrigin };
    });
    expect(antes.transform, 'antes de entrar la línea vertical no está dibujada').toBe('matrix(1, 0, 0, 0, 0, 0)');
    expect(antes.origen.split(' ')[1], 'la línea vertical se dibuja desde arriba').toBe('0px');
    await entrar(page);
    const tercero = page.locator('#programa .nucleo').nth(2);
    await tercero.hover();
    await page.waitForTimeout(700);
    expect(await tercero.evaluate((n) => getComputedStyle(n).transform), 'en vertical no hay levantarse').toBe('none');
  });
});

test.describe('con prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a 1440: todo en su lugar desde el principio y sin levantarse', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrir(page);
    const m = await page.evaluate(() => [...document.querySelectorAll('#programa .nucleo')].map((n) => ({
      translate: getComputedStyle(n).translate,
      opacidad: getComputedStyle(n).opacity,
      linea: getComputedStyle(n.querySelector('.nucleo__linea')!).transform,
      entro: n.classList.contains('in'),
    })));
    expect(m.length, 'no encontré los cinco núcleos').toBe(5);
    expect(m.every((n) => !n.entro), 'los núcleos ya habían entrado: esto no mide el estado inicial').toBe(true);
    expect(m.map((n) => n.translate)).toEqual(Array(5).fill('none'));
    expect(m.map((n) => n.opacidad)).toEqual(Array(5).fill('1'));
    expect(m.map((n) => n.linea)).toEqual(Array(5).fill('none'));
    await page.evaluate(() => document.querySelector('#programa .nucleos')!.scrollIntoView({ behavior: 'instant', block: 'center' }));
    const tercero = page.locator('#programa .nucleo').nth(2);
    await tercero.hover();
    expect(await tercero.evaluate((n) => getComputedStyle(n).transform), 'con reduced-motion no hay levantarse').toBe('none');
  });
});
