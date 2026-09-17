import { expect, test } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';
// @ts-expect-error -- `check/acento.mjs` es JavaScript sin tipos a propósito: es
// una herramienta de consola que además se importa acá. Tiparla obligaría a
// compilarla, y entonces dejaría de poder correrse con `node` a secas.
import { PAGINAS, PERMITIDO, RECOLECTAR } from '../check/acento.mjs';

/**
 * El acento, dentro de la gate — orden Códice #07, y decisión de dirección del
 * 17/9 al aprobarla.
 *
 * ── Por qué esto existe además de `pnpm check:acento` ────────────────────
 * Porque **lo que hay que acordarse de correr no se corre**. La regla del acento
 * —el naranja es del CTA primario y del hover, y de nada más— es de las que se
 * deshacen solas: nadie va a pintar veinte cosas de naranja de un saque; alguien
 * va a poner un número, tres órdenes después otro un filete, y en un año la web
 * vuelve a estar como estaba. Ninguna de esas veces va a verse mal por sí sola.
 *
 * Es el mismo modo de falla que el token duplicado de la #06: no un error, una
 * deriva. Y contra la deriva no sirve una herramienta que hay que recordar
 * correr; sirve un guardián en la gate.
 *
 * ── Un solo barrido, dos puertas ─────────────────────────────────────────
 * La lógica no se copia: se importa de `check/acento.mjs`, que es el mismo
 * archivo que corre por consola. Dos copias de la lista de lo permitido serían
 * dos verdades que un día no coinciden — y entonces el guardián de la gate y el
 * de la consola dirían cosas distintas sobre la misma página.
 *
 * ── Qué agrega en tiempo ─────────────────────────────────────────────────
 * Cuatro páginas, una carga cada una, sin capturas: **~4 segundos** sobre una
 * gate que ya levanta Chromium para el guardián de fidelidad. Es barato porque
 * reusa el servidor y el navegador que la suite ya tenía en pie.
 */
for (const [nombre, ruta, piso] of PAGINAS as [string, string, number][]) {
  test(`${nombre} · el naranja solo donde se decidió`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PUERTO_PORT}${ruta}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    /* Todo revelado y sin transiciones: un bloque a mitad del fundido tiene un
       color que el diseño no tiene, y acá se compara por igualdad exacta. */
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
    await page.waitForTimeout(250);

    const { mirados, hallazgos } = await page.evaluate(RECOLECTAR, { permitido: PERMITIDO });

    /* EL PISO, ANTES DEL CERO: «cero acentos de más» sobre un barrido que no
       recorrió nada se lee igual que sobre una casa en orden. */
    expect(
      mirados,
      `el barrido miró ${mirados} elementos y el piso de ${nombre} es ${piso}: o la página no `
      + 'cargó, o el selector se rompió y esto está mirando la nada',
    ).toBeGreaterThanOrEqual(piso);

    expect(
      hallazgos.map((h: { prop: string; token: string; donde: string; texto: string }) =>
        `${h.prop} ${h.token} en ${h.donde}${h.texto ? ` «${h.texto}»` : ''}`),
      'el acento se usa una vez por pantalla: esto lo usa de más. Va en `--gris`, en `--hair` '
      + 'o en el color del texto.',
    ).toEqual([]);
  });
}
