import { expect, test } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * Armando apoyado en la orilla — orden Códice #19, B · la mitad del navegador.
 *
 * ── Por qué son DOS comprobaciones en dos archivos ──────────────────────
 * Lucía pidió que la orilla del recorte tocara la orilla del bloque. Eso se
 * rompe de dos maneras distintas y **ninguna de las dos alcanza sola**:
 *
 *   · el archivo puede terminar en un degradado a transparente —lo que pasó: el
 *     `de-pie` publicado tenía ~300 px de aire abajo— y entonces la caja toca el
 *     borde pero lo que se ve flota. De eso se ocupa
 *     `src/armando-no-flota.test.ts`, que lee los píxeles del PNG;
 *   · o la caja puede quedar colgada a 40 px del borde, y entonces el archivo
 *     más opaco del mundo sigue flotando. De eso se ocupa este archivo.
 *
 * Van separadas a propósito, que es la regla de la casa: **un piso que sobrevive
 * porque la otra mitad lo sostiene no está sosteniendo nada.** La #12 (E) midió
 * sólo la segunda, le dio 0 px a tres anchos —cierto— y publicó a Armando
 * flotando igual.
 *
 * ── Los dos lugares, porque es el mismo recorte ─────────────────────────
 * `/merida#facilitador` y `/#quien` usan el mismo `<Retrato cual="de-pie">`. Un
 * arreglo que sólo mire el taller deja la portada rota en silencio, y la portada
 * es la que ve todo el mundo.
 */
const LUGARES = [
  ['taller', '/merida', '#facilitador'],
  ['portada', '/', '#quien'],
] as const;

/* 1440 y 375, que son los de la orden. A 900 la maqueta apila y la figura pasa
   debajo del texto con el padding en 0 (#12 E): sigue apoyada, pero el `bottom`
   de la sección ya no es el de la figura sino el del `padding` de la sección, y
   medir eso sería medir otra cosa. Queda declarado en vez de disimulado. */
const ANCHOS = [1440, 375] as const;

for (const [nombre, ruta, seccion] of LUGARES) {
  test(`${nombre} · el recorte de Armando llega a la orilla de abajo`, async ({ page }) => {
    const hallazgos: string[] = [];

    for (const ancho of ANCHOS) {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto(`http://127.0.0.1:${PUERTO_PORT}${ruta}`, { waitUntil: 'networkidle' });
      /* Los bloques entran con un fundido de 600 ms: medir a mitad del fundido
         da posiciones que el diseño no tiene. */
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => {
        (e as HTMLElement).style.opacity = '1';
        (e as HTMLElement).style.transform = 'none';
      }));
      await page.locator(`${seccion} .foto--libre img`).first().scrollIntoViewIfNeeded();
      /* La foto es `loading="lazy"`: sin esperar a que decodifique, su caja mide
         el hueco reservado y no la imagen — y el hueco sí llega al borde. */
      await page.waitForFunction((sel) => {
        const img = document.querySelector(`${sel} .foto--libre img`) as HTMLImageElement | null;
        return !!img?.complete && img.naturalHeight > 0;
      }, seccion);

      const medida = await page.evaluate((sel) => {
        const sec = document.querySelector(sel) as HTMLElement;
        const img = document.querySelector(`${sel} .foto--libre img`) as HTMLImageElement;
        const s = sec.getBoundingClientRect();
        const i = img.getBoundingClientRect();
        return { separacion: s.bottom - i.bottom, alto: Math.round(i.height), archivo: img.currentSrc };
      }, seccion);

      if (Math.abs(medida.separacion) > 1) {
        hallazgos.push(
          `${ancho}px: quedan ${medida.separacion.toFixed(1)} px entre el pie de la imagen y el de `
          + `la sección (${medida.archivo.split('/').pop()})`,
        );
      }

      /* Y el piso, primero en intención aunque se lea segundo: una imagen de
         cero de alto tiene su `bottom` donde uno quiera. */
      if (medida.alto < 200) {
        hallazgos.push(`${ancho}px: la imagen mide ${medida.alto} px de alto — no se dibujó, así que el 0 px de arriba no dice nada`);
      }
    }

    expect(
      hallazgos,
      'Lucía pidió que la orilla del recorte tocara la orilla del bloque. Esto mide la CAJA; que lo '
      + 'que hay dentro de la caja llegue al borde lo mide `src/armando-no-flota.test.ts`, sobre los '
      + 'píxeles del archivo. Las dos, o Armando flota igual.',
    ).toEqual([]);
  });
}
