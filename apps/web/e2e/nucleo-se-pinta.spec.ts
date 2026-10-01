import { expect, test } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * El núcleo se pinta al pasar el mouse — orden #23-bis.
 *
 * En reposo el círculo es teal (borde y glifo) sobre crema; con el mouse en
 * cualquier parte de la columna, se rellena de `--naranja`, el borde pasa a
 * naranja, el glifo a `--crema` y la línea al núcleo siguiente también se
 * pinta. Los colores se leen de las variables del documento y no se escriben
 * acá: un hex en un test es un segundo lugar donde vive un color.
 *
 * `reducedMotion: 'reduce'` es lo que deja leer el color final sin esperar la
 * transición de 420 ms: con esa preferencia la hoja la apaga (y eso también es
 * parte de la orden).
 */
test.use({ reducedMotion: 'reduce' });

test('el núcleo 3 se rellena de naranja con el mouse encima, y en reposo es teal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${PUERTO_PORT}/merida`, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));

  const colores = () => page.evaluate(() => {
    /* Un color de variable pasado por el motor, para comparar con lo computado. */
    const resolver = (v: string) => {
      const d = document.createElement('div');
      d.style.color = `var(${v})`;
      document.body.append(d);
      const c = getComputedStyle(d).color;
      d.remove();
      return c;
    };
    const nucleos = [...document.querySelectorAll('#programa .nucleo')];
    const circulo = nucleos[2]?.querySelector('.nucleo__circulo');
    const linea = nucleos[2]?.querySelector('.nucleo__linea');
    const otro = nucleos[0]?.querySelector('.nucleo__circulo');
    return {
      cuantos: nucleos.length,
      naranja: resolver('--naranja'),
      crema: resolver('--crema'),
      teal: resolver('--teal'),
      fondo: circulo ? getComputedStyle(circulo).backgroundColor : '',
      borde: circulo ? getComputedStyle(circulo).borderTopColor : '',
      glifo: circulo ? getComputedStyle(circulo).color : '',
      linea: linea ? getComputedStyle(linea).backgroundColor : '',
      otroFondo: otro ? getComputedStyle(otro).backgroundColor : '',
    };
  });

  const reposo = await colores();
  /* EL PISO, PRIMERO: que haya cinco núcleos y que las variables resuelvan. */
  expect(reposo.cuantos, 'no están los cinco núcleos de #programa').toBe(5);
  expect(reposo.naranja, '`--naranja` no resolvió a un color').toMatch(/^rgb/);

  expect(reposo.fondo, 'en reposo el círculo ya está relleno de naranja').not.toBe(reposo.naranja);
  expect(reposo.borde, 'en reposo el borde del círculo no es teal').toBe(reposo.teal);
  expect(reposo.glifo, 'en reposo el glifo no es teal').toBe(reposo.teal);

  /* Por el texto de la columna, no por el círculo: se pinta pasando por
     cualquier parte, como en 512. */
  await page.locator('#programa .nucleo').nth(2).locator('p').hover();
  const encima = await colores();
  expect(encima.fondo, 'con el mouse encima, el círculo no se rellena de --naranja').toBe(encima.naranja);
  expect(encima.borde, 'con el mouse encima, el borde no pasa a --naranja').toBe(encima.naranja);
  expect(encima.glifo, 'con el mouse encima, el glifo no pasa a --crema').toBe(encima.crema);
  expect(encima.linea, 'con el mouse encima, la línea al núcleo siguiente no se pinta').toBe(encima.naranja);
  expect(encima.otroFondo, 'se pintó un núcleo que no tiene el mouse encima').not.toBe(encima.naranja);
});
