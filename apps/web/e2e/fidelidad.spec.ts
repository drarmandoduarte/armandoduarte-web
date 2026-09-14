import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PUERTO_ESTATICO, PUERTO_PORT } from '../playwright.config';
import { CAMBIOS_VISIBLES_03 } from './cambios-visibles';

/**
 * «Indistinguible o no se cierra» — orden Códice #01, C3.
 *
 * ── Qué mide, y por qué cuatro cosas y no una ─────────────────────────────
 * La orden pide que la versión React sea indistinguible de la estática, y
 * «indistinguible» tiene cuatro caras que se rompen por separado:
 *
 *   a · **el texto visible**, comparado con igualdad estricta. Caza una palabra
 *       perdida en una clave de i18n, que ninguna captura al 0,3 % vería;
 *   b · **los píxeles**, página completa. Caza el espacio, el color y la fuente:
 *       lo que un texto idéntico puede seguir dibujando mal;
 *   c · **los `href`, en orden**, con sus `text=` de WhatsApp. Caza el botón que
 *       quedó apuntando al mensaje equivocado —invisible en la captura, y lo que
 *       le llega a Armando por teléfono;
 *   d · **el `<head>`**. Caza lo que solo se ve en Google y en la vista previa de
 *       WhatsApp: título, descripción, canónica e imagen de compartir.
 *
 * Ninguna de las cuatro sobra: cada una caza algo que las otras tres dejan pasar.
 *
 * ── Desde la #03: la referencia es «el estático MÁS el delta declarado» ───
 * La orden del contraste cambió tres tokens y dos reglas, así que el estático y
 * el port ya no dibujan lo mismo. En vez de bajar el umbral o guardar capturas
 * en el repo, al sitio estático se le inyecta `CAMBIOS_VISIBLES_03` antes de
 * capturarlo. La referencia se sigue generando en vivo, el presupuesto sigue
 * siendo **cero píxeles**, y lo que el guardián afirma es más fuerte: que la
 * única diferencia entre las dos versiones es esa lista de cinco líneas.
 *
 * El texto, los `href` y el `<head>` se comparan **sin** el delta, porque el
 * delta no los toca: si alguno se moviera, es un defecto y tiene que verse.
 *
 * ── Cómo se compara una captura contra otra página ────────────────────────
 * `toHaveScreenshot` compara contra un archivo de referencia, no contra otra
 * pestaña. Así que primero se abre el sitio estático, se captura, y **esa
 * captura se escribe como referencia**; después se le pide al port que coincida.
 * El resultado es el que pide la orden —diferencia contra el estático, no contra
 * una imagen guardada en el repo— y de yapa, cuando falla, Playwright deja el
 * diff en `test-results/` con los píxeles marcados en rojo.
 *
 * Las referencias no se versionan: se regeneran en cada corrida desde el sitio
 * estático, que es la fuente. Una captura guardada en el repo envejece.
 *
 * Desde la orden #04 ese sitio estático es `qa/referencia/` de este mismo repo
 * —no un repo de al lado—: la fuente está versionada y no depende de una ruta
 * externa. La ruta la resuelve `playwright.config.ts`.
 *
 * ── El piso ──────────────────────────────────────────────────────────────
 * Antes de comparar se afirma que las dos páginas **trajeron algo**: más de 500
 * caracteres de texto visible cada una. Sin eso, dos páginas rotas se parecen
 * muchísimo — `'' === ''` es verdadero y pasaría en verde. Es el mismo piso que
 * el resto de la casa, puesto antes de la afirmación que sostiene.
 */

const PAGINAS = [
  { nombre: 'inicio', ruta: '/' },
  { nombre: 'taller', ruta: '/taller' },
  { nombre: 'privacidad', ruta: '/privacidad' },
  { nombre: 'terminos', ruta: '/terminos' },
] as const;

const ANCHOS = [1440, 900, 390] as const;

const PISO_DE_TEXTO = 500;

/**
 * Cero píxeles de diferencia, y no el 0,3 % que la orden puso de presupuesto.
 *
 * ── Por qué se bajó ──────────────────────────────────────────────────────
 * Porque el 0,3 % **no caza nada a esta escala**, y está medido. La mutación de
 * control de esta orden —cambiar `var(--ocre)` por `var(--teal)` en `.eyebrow`,
 * o sea que el rótulo «LEGAL» de la página de privacidad cambie de color—
 * mueve **43 píxeles** sobre más de tres millones. Con el umbral en 0,3 % las
 * tres comprobaciones salieron **verdes** con la palabra pintada de otro color
 * en el navegador. Un guardián que aprueba eso no es un guardián: es un
 * presupuesto.
 *
 * El 0,3 % era razonable como presupuesto antes de medir. Medido, el port
 * dibuja **exactamente los mismos píxeles que el sitio estático**: con
 * `threshold: 0` y `maxDiffPixelRatio: 0` —o sea, ni un píxel puede diferir en
 * nada— las doce comprobaciones pasan. No hay nada que presupuestar.
 *
 * Queda el `threshold` por píxel que trae Playwright (0,2 en YIQ), que tolera
 * el antialias de una máquina a otra sin tolerar un color distinto. Si algún día
 * este número tiene que subir, sube con la medición al lado.
 */
const DIFERENCIA_MAXIMA = 0;

const url = (puerto: number, ruta: string) => `http://127.0.0.1:${puerto}${ruta}`;

/** Deja la página quieta y con todo revelado, lista para medir. */
async function asentar(page: Page, ruta: string, puerto: number, ancho: number, delta?: string) {
  await page.setViewportSize({ width: ancho, height: 900 });
  await page.goto(url(puerto, ruta), { waitUntil: 'load' });
  if (delta) await page.addStyleTag({ content: delta });
  await page.evaluate(() => document.fonts.ready);
  /* Hasta el final y de vuelta arriba: el sitio estático revela con un
     IntersectionObserver, y aunque `reducedMotion` ya deja todo opaco, el
     recorrido dispara el mismo trabajo de layout de los dos lados. Volver
     arriba deja el header en su estado de reposo, que es donde se lo mide. */
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 120));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

/** El texto que se ve, con los espacios normalizados. */
const textoVisible = (page: Page) =>
  page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());

/** Todos los `href`, en el orden del documento. */
const enlaces = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? ''));

/** Las cuatro etiquetas del `<head>` que se ven fuera de la página. */
const cabeza = (page: Page) => page.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
  ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null,
}));

for (const { nombre, ruta } of PAGINAS) {
  test.describe(`${nombre} · el port es indistinguible del sitio estático`, () => {
    for (const ancho of ANCHOS) {
      test(`${ancho}px`, async ({ page }, info) => {
        const estatica = await page.context().newPage();

        await asentar(estatica, ruta, PUERTO_ESTATICO, ancho, CAMBIOS_VISIBLES_03);
        await asentar(page, ruta, PUERTO_PORT, ancho);

        const [textoEstatico, textoPort] = [await textoVisible(estatica), await textoVisible(page)];

        /* EL PISO, PRIMERO: dos páginas vacías son idénticas. */
        expect(textoEstatico.length, `el sitio estático no trajo texto en ${ruta}`).toBeGreaterThan(PISO_DE_TEXTO);
        expect(textoPort.length, `el port no trajo texto en ${ruta}`).toBeGreaterThan(PISO_DE_TEXTO);

        // (a) el texto visible
        expect(textoPort, 'el texto visible no es idéntico').toBe(textoEstatico);

        // (c) los enlaces, en orden
        expect(await enlaces(page), 'los href no son los mismos, o no en el mismo orden')
          .toEqual(await enlaces(estatica));

        // (d) el head
        expect(await cabeza(page), 'el <head> no coincide').toEqual(await cabeza(estatica));

        // (b) los píxeles: la captura del estático se vuelve la referencia
        const referencia = info.snapshotPath(`${nombre}-${ancho}.png`);
        mkdirSync(dirname(referencia), { recursive: true });
        writeFileSync(referencia, await estatica.screenshot({ fullPage: true, animations: 'disabled' }));
        await estatica.close();

        await expect(page).toHaveScreenshot(`${nombre}-${ancho}.png`, {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: DIFERENCIA_MAXIMA,
        });
      });
    }
  });
}
