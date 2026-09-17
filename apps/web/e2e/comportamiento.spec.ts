import { expect, test, type Page } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * Los tres comportamientos — orden Códice #02, B; sin el sitio estático desde
 * la #05 (D24).
 *
 * ── Por qué no alcanza con el guardián de fidelidad ───────────────────────
 * Porque aquel mide la página **quieta**: cuatro páginas, tres anchos, el texto,
 * los `href`, el `<head>` y los píxeles en reposo. La #02 le sacó React al
 * navegador, y lo único que React hacía en el navegador era **moverse**: abrir
 * el menú, teñir la cabecera y revelar los bloques. Las doce comprobaciones de
 * fidelidad seguirían en verde con los tres comportamientos muertos.
 *
 * ── Qué se retiró acá, y qué NO ───────────────────────────────────────────
 * Hasta la #04 cada estado se medía de los dos lados —el port y el sitio
 * estático— y además de afirmarse contra un número, se comparaban entre sí.
 * **Retirados por D24: la referencia del port cumplió su propósito en la #04.**
 * El sitio estático es historia y comparar contra él era vigilar contra algo que
 * ya no es verdad.
 *
 * Lo que se fue es **la mitad comparativa**: la segunda pestaña y los
 * `toEqual(estatica)`. Lo que queda es la mitad que de verdad cuidaba algo, y
 * que ya estaba escrita: **cada estado se afirma contra su valor literal**. El
 * menú cerrado se ve cerrado (`opacidad '0'`, `visibilidad 'hidden'`,
 * `aria-expanded 'false'`), abierto se ve abierto, la cabecera enciende el velo
 * en `'1'` y lo apaga en `'0'`, y todos los bloques con `.reveal` terminan
 * revelados.
 *
 * No es menos vigilancia que antes: dos páginas rotas igual se parecen
 * muchísimo —`{opacidad:'0'} === {opacidad:'0'}` pasa en verde— así que el
 * `toEqual` nunca fue lo que cazaba un menú muerto. Lo cazaban los literales.
 *
 * ── Los números que aparecen acá salen del código, no del aire ────────────
 * 600 px de desplazamiento porque el tinte se enciende pasados 24. Los 350 ms de
 * espera antes de mirar el velo y los 1100 después son la suma de dos cosas que
 * están escritas en dos archivos distintos:
 *
 *   · `comportamiento.ts` saca la clase `scrolled` **650 ms** después del último
 *     desplazamiento —el `setTimeout` que portó la #01 sin tocarlo—, y
 *   · `index.css` hace que el velo entre en **200 ms** (`.hd.scrolled::before`)
 *     y salga en **600** (`.hd::before`).
 *
 * O sea: encendido del todo a los 200 ms, y apagado del todo recién a los
 * 650 + 600 = **1250**. La orden #02 escribió «800 ms» para lo segundo; medido,
 * a los 800 el velo todavía está bajando. Se usa 350 + 1100 = 1450, que deja
 * 200 ms de margen de los dos lados y permite afirmar el `0` y el `1` exactos en
 * vez de un «cerca de».
 *
 * Y el `reducedMotion: 'reduce'` de la config **no** apaga esta transición,
 * aunque la hoja tenga `*{transition:none!important}`: `*` no alcanza a los
 * pseudo-elementos, y el velo es un `::before`. Está medido —la primera corrida
 * leyó `0.906714`— y por eso los tiempos son de verdad y no de adorno.
 */

const url = (puerto: number, ruta: string) => `http://127.0.0.1:${puerto}${ruta}`;

/** Abre la página al ancho pedido y espera a que las fuentes estén. */
async function abrir(page: Page, ruta: string, ancho: number) {
  await page.setViewportSize({ width: ancho, height: 900 });
  await page.goto(url(PUERTO_PORT, ruta), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Lo que se ve del menú: si está abierto, y si el botón lo dice. */
const estadoDelMenu = (p: Page) => p.evaluate(() => {
  const ov = document.getElementById('ov');
  const abrir = document.getElementById('abrir');
  const estilo = ov ? getComputedStyle(ov) : null;
  return {
    clase: ov?.classList.contains('open') ?? null,
    opacidad: estilo?.opacity ?? null,
    visibilidad: estilo?.visibility ?? null,
    expandido: abrir?.getAttribute('aria-expanded') ?? null,
    scrollDelFondo: document.body.style.overflow,
  };
});

/** El velo de la cabecera: la opacidad real del `::before`, y las dos clases. */
const estadoDeLaCabecera = (p: Page) => p.evaluate(() => {
  const hd = document.getElementById('hd');
  return {
    velo: hd ? getComputedStyle(hd, '::before').opacity : null,
    scrolled: hd?.classList.contains('scrolled') ?? null,
    claro: hd?.classList.contains('claro') ?? null,
  };
});

/** Cuántos bloques hay para revelar y cuántos se revelaron. */
const estadoDelFundido = (p: Page) => p.evaluate(() => ({
  total: document.querySelectorAll('.reveal').length,
  revelados: document.querySelectorAll('.reveal.in').length,
}));

/** Desplaza sin animación —`smooth` haría de esto una medición de suerte— y espera. */
const desplazar = (p: Page, y: number, esperar: number) => p.evaluate(async ([hasta, ms]) => {
  window.scrollTo({ top: hasta, behavior: 'instant' });
  await new Promise((r) => setTimeout(r, ms));
}, [y, esperar] as const);

test.describe('los tres comportamientos siguen vivos sin React', () => {
  test('390px · el menú abre con el botón y cierra con la ✕ y con Escape', async ({ page }) => {
    const port = await abrir(page, '/', 390);

    /* EL PISO: cerrado se tiene que ver cerrado. Sin esto, un menú que no existe
       daría `{clase:false}` y todo lo de abajo hablaría de la nada. */
    expect(await estadoDelMenu(port), 'el menú no arranca cerrado').toMatchObject({
      clase: false, opacidad: '0', visibilidad: 'hidden', expandido: 'false',
    });

    const abrirlo = async (p: Page) => {
      await p.click('#abrir');
      await p.waitForTimeout(600);
      return estadoDelMenu(p);
    };
    expect(await abrirlo(port), 'el menú no se abrió').toMatchObject({
      clase: true, opacidad: '1', visibilidad: 'visible', expandido: 'true', scrollDelFondo: 'hidden',
    });

    const conLaEquis = async (p: Page) => {
      await p.click('#cerrar');
      await p.waitForTimeout(600);
      return estadoDelMenu(p);
    };
    expect(await conLaEquis(port), 'la ✕ no cerró el menú').toMatchObject({
      clase: false, visibilidad: 'hidden', expandido: 'false', scrollDelFondo: '',
    });

    const conEscape = async (p: Page) => {
      await p.click('#abrir');
      await p.waitForTimeout(600);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(600);
      return estadoDelMenu(p);
    };
    expect(await conEscape(port), 'Escape no cerró el menú').toMatchObject({
      clase: false, visibilidad: 'hidden', expandido: 'false', scrollDelFondo: '',
    });
  });

  test('1440px · la cabecera se tiñe al desplazar, se apaga al detenerse, y los bloques se revelan', async ({ page }) => {
    const port = await abrir(page, '/', 1440);

    /* En reposo: el velo apagado. */
    expect(await estadoDeLaCabecera(port), 'la cabecera no arranca transparente')
      .toMatchObject({ velo: '0', scrolled: false });

    /* A 600 px y dentro de los 650 ms de quietud: encendido. */
    await desplazar(port, 600, 350);
    expect(await estadoDeLaCabecera(port), 'la cabecera no tomó el color de la sección')
      .toMatchObject({ velo: '1', scrolled: true });

    /* Quieto: la clase se va a los 650 y el velo tarda 600 más en apagarse. */
    await port.waitForTimeout(1100);
    expect(await estadoDeLaCabecera(port), 'la cabecera no volvió a transparente al detenerse')
      .toMatchObject({ velo: '0', scrolled: false });

    /* Y el fundido: recorrer la página entera revela todos los bloques. */
    const recorrer = async (p: Page) => {
      await p.evaluate(async () => {
        for (let y = 0; y <= document.body.scrollHeight; y += 400) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 60));
        }
      });
      await p.waitForTimeout(600);
      return estadoDelFundido(p);
    };
    const fundido = await recorrer(port);
    expect(fundido.total, 'no hay bloques con .reveal: no hay nada que revelar').toBeGreaterThan(5);
    expect(fundido.revelados, 'quedaron bloques sin revelar').toBe(fundido.total);
  });
});
