import { expect, test } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';
// @ts-expect-error -- `check/altura.mjs` es JavaScript sin tipos a propósito,
// igual que `acento.mjs` y `renglones.mjs`: es una herramienta de consola que
// además se importa acá. Tiparla obligaría a compilarla, y entonces dejaría de
// poder correrse con `node` a secas.
import { JUZGAR, PREPARAR, RECOLECTAR, RUTAS, VIEWPORTS } from '../check/altura.mjs';

/**
 * Los héroes miden la pantalla y ninguna sección pasa de 1,6 — orden #23.
 *
 * ── Por qué esto existe además de `pnpm check:altura` ────────────────────
 * Por lo de siempre: **lo que hay que acordarse de correr no se corre.** Una
 * orden agrega un párrafo, otra un ítem a una lista, y en tres meses una
 * sección mide dos pantallas. Ninguna de esas veces se ve en un diff.
 *
 * ── Un solo barrido, dos puertas ─────────────────────────────────────────
 * La lógica no se copia: se importa de `check/altura.mjs`, **incluido el
 * juicio** (`JUZGAR`), con su piso adentro. Dos copias serían dos verdades que
 * un día no coinciden.
 *
 * ── Y el test de «ninguna excepción sobra» se fue con la #23 ─────────────
 * Vigilaba que una fila de `PENDIENTES` que ya no excusaba nada se borrara, y
 * su propio mensaje decía que el día que la lista quedara vacía el test se
 * borraba. La #23 la vació.
 */
for (const [nombre, ruta] of RUTAS as [string, string][]) {
  test(`${nombre} · el hero mide la pantalla y ninguna sección pasa de 1,6`, async ({ page }) => {
    const hallazgos: string[] = [];
    const mirados: string[] = [];

    for (const { ancho, alto } of VIEWPORTS as { ancho: number; alto: number }[]) {
      await page.setViewportSize({ width: ancho, height: alto });
      await PREPARAR(page, `http://127.0.0.1:${PUERTO_PORT}${ruta}`);
      const r = await page.evaluate(RECOLECTAR);
      mirados.push(`${ancho}×${alto}: ${r.mirados}`);
      hallazgos.push(...(JUZGAR(nombre, ancho, r) as string[]));
    }

    expect(
      hallazgos,
      `secciones miradas — ${mirados.join(' · ')}.\n`
      + 'Un hero mide la pantalla, exactamente. Una sección que pasa el tope no se aprieta: se '
      + 'declara en `PENDIENTES` de `check/altura.mjs` con su número y lo decide dirección (#23).',
    ).toEqual([]);
  });
}
