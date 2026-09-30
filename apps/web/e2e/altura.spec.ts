import { expect, test } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';
// @ts-expect-error -- `check/altura.mjs` es JavaScript sin tipos a propósito,
// igual que `acento.mjs` y `renglones.mjs`: es una herramienta de consola que
// además se importa acá. Tiparla obligaría a compilarla, y entonces dejaría de
// poder correrse con `node` a secas.
import {
  CONTAR, EXCEPCIONES, PENDIENTES, PISO, PREPARAR, RECOLECTAR, RUTAS, TOPE_DE, VIEWPORTS,
} from '../check/altura.mjs';

/**
 * Ninguna sección más alta que la pantalla, dentro de la gate — orden #20, A.4.
 *
 * ── Por qué esto existe además de `pnpm check:altura` ────────────────────
 * Por lo de siempre: **lo que hay que acordarse de correr no se corre.** Y ésta
 * es de las reglas que se deshacen solas, más todavía que la de los renglones:
 * nadie va a estirar una sección de golpe, pero una orden agrega un párrafo,
 * otra un ítem a una lista, y en tres meses la portada vuelve a tener una
 * sección de página y media. Ninguna de esas veces se ve en un diff.
 *
 * ── Un solo barrido, dos puertas ─────────────────────────────────────────
 * La lógica no se copia: se importa de `check/altura.mjs`, incluidas las **dos
 * listas de excepciones**. Dos copias serían dos verdades que un día no
 * coinciden, y entonces la gate y la consola dirían cosas distintas de la misma
 * página. Es el modo de falla que la #06 pagó con el token duplicado.
 *
 * ── Dos tests por ruta y no cuatro ───────────────────────────────────────
 * Los dos viewports se miden dentro de una sola navegación por ruta, como hace
 * `renglones.spec.ts` y por el mismo motivo: el precio. Lo que se pierde es el
 * nombre del viewport en la lista de tests; lo que no se pierde es cuál falló,
 * porque cada hallazgo lo dice entero —ruta, viewport, sección, altura y cuánto
 * sobra— y las mediciones se acumulan antes de comparar, así que un rojo muestra
 * **todos** los viewports que fallaron y no solo el primero.
 */
for (const [nombre, ruta] of RUTAS as [string, string][]) {
  test(`${nombre} · ninguna sección es más alta que la pantalla`, async ({ page }) => {
    const altas: string[] = [];
    const mirados: string[] = [];

    for (const { ancho, alto } of VIEWPORTS as { ancho: number; alto: number }[]) {
      await page.setViewportSize({ width: ancho, height: alto });
      await PREPARAR(page, `http://127.0.0.1:${PUERTO_PORT}${ruta}`);

      const r = await page.evaluate(RECOLECTAR);
      mirados.push(`${ancho}×${alto}: ${r.mirados}`);

      /* EL PISO, ANTES DEL CERO: «ninguna sección sobra» sobre un barrido que
         no encontró ninguna sección se lee igual que sobre una página en orden.
         Si el selector se rompe o la página no carga, el rojo lo dice acá y no
         tres afirmaciones más abajo hablando de otra cosa. */
      if (r.mirados < (PISO as Record<string, number>)[nombre]) {
        altas.push(`${nombre} @${ancho}×${alto} · PISO: miró ${r.mirados} secciones y el piso es `
          + `${(PISO as Record<string, number>)[nombre]} — o la página no cargó, o el selector se rompió`);
      }

      for (const m of r.medidas as { id: string; alto: number; sobra: number }[]) {
        if (m.sobra > TOPE_DE(nombre, m.id)) altas.push(CONTAR(nombre, ancho, r.alto, m));
      }
    }

    expect(
      altas,
      `secciones miradas — ${mirados.join(' · ')}.\n`
      + 'Se achica en este orden y sin sacar contenido: paddings verticales, `gap` de grillas, '
      + 'tamaño de título dentro de la sección que sobra. Si no entra, no se inventa: se declara '
      + 'cuánto sobra en `PENDIENTES` de `check/altura.mjs` y lo decide dirección (orden #20, A.5).',
    ).toEqual([]);
  });
}

test('y ninguna excepción sobra: la que ya entra se borra de la lista', async ({ page }) => {
  /* La otra mitad, que es la que se olvida: **sobra tan rojo como falta.** Una
     fila de `PENDIENTES` que ya no excusa nada es una mentira con formato de
     tabla, y sin este test se quedaría ahí para siempre diciendo que hay un
     problema resuelto. Es la misma forma que `qa/skips-permitidos.md` y que la
     lista de migraciones pendientes de `@codice/db`.

     Se mide contra el **tope declarado**, no contra cero: una fila cuyo sobrante
     bajó de 134 a 12 px sigue excusando algo y sigue haciendo falta. La que cae
     es la que ya no excusa nada en ninguno de los cuatro cortes. */
  const usadas = new Set<string>();

  for (const [nombre, ruta] of RUTAS as [string, string][]) {
    for (const { ancho, alto } of VIEWPORTS as { ancho: number; alto: number }[]) {
      await page.setViewportSize({ width: ancho, height: alto });
      await PREPARAR(page, `http://127.0.0.1:${PUERTO_PORT}${ruta}`);
      const r = await page.evaluate(RECOLECTAR);
      for (const m of r.medidas as { id: string; sobra: number }[]) {
        if (m.sobra > 0) usadas.add(`${nombre}/${m.id}`);
      }
    }
  }

  /* EL PISO, PRIMERO: si el barrido no midió nada, «ninguna excepción sobra»
     se cumple solo. */
  expect(
    (EXCEPCIONES as unknown[]).length,
    'la lista de excepciones está vacía: o se resolvieron todas —y entonces este test se borra— '
    + 'o el import se rompió',
  ).toBeGreaterThan(0);

  const sobran = (PENDIENTES as [string, string, string, number][])
    .filter(([ruta, id]) => !usadas.has(`${ruta}/${id}`))
    .map(([ruta, id]) => `${ruta}#${id}`);

  expect(
    sobran,
    'estas secciones ya entran en la pantalla y siguen declaradas como pendientes: se borra su '
    + 'fila de `PENDIENTES` en `check/altura.mjs`. Una lista de excepciones que no se limpia se '
    + 'convierte en una lista de mentiras.',
  ).toEqual([]);
});
