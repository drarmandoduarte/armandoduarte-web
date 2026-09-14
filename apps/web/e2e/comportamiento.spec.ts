import { expect, test, type Page } from '@playwright/test';
import { PUERTO_ESTATICO, PUERTO_PORT } from '../playwright.config';

/**
 * Los tres comportamientos, comparados contra el sitio estático — orden
 * Códice #02, B.
 *
 * ── Por qué no alcanza con el guardián de fidelidad ───────────────────────
 * Porque aquel mide la página **quieta**: cuatro páginas, tres anchos, el texto,
 * los `href`, el `<head>` y los píxeles en reposo. Esta orden le sacó React al
 * navegador, y lo único que React hacía en el navegador era **moverse**: abrir
 * el menú, teñir la cabecera y revelar los bloques. Las doce comprobaciones de
 * fidelidad seguirían en verde con los tres comportamientos muertos.
 *
 * ── Contra el estático, y también contra un número ────────────────────────
 * Cada estado se mide de los dos lados y se comparan. Pero dos páginas rotas
 * igual también se parecen —`{opacidad:'0'} === {opacidad:'0'}` pasa en verde—,
 * así que antes de comparar se afirma lo que tiene que valer: el menú cerrado se
 * ve cerrado, abierto se ve abierto, y la cabecera se enciende y se apaga. Es el
 * mismo piso que el resto de la casa, puesto antes de la afirmación que sostiene.
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

/** Abre la misma página en los dos sitios, al mismo ancho. */
async function losDos(page: Page, ruta: string, ancho: number) {
  const estatica = await page.context().newPage();
  for (const [p, puerto] of [[page, PUERTO_PORT], [estatica, PUERTO_ESTATICO]] as const) {
    await p.setViewportSize({ width: ancho, height: 900 });
    await p.goto(url(puerto, ruta), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
  }
  return { port: page, estatica };
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
    const { port, estatica } = await losDos(page, '/', 390);

    const cerradoInicial = await Promise.all([estadoDelMenu(port), estadoDelMenu(estatica)]);

    /* EL PISO: cerrado se tiene que ver cerrado. Sin esto, un menú que no existe
       daría `{clase:false}` de los dos lados y la comparación pasaría. */
    expect(cerradoInicial[0], 'el menú del port no arranca cerrado').toMatchObject({
      clase: false, opacidad: '0', visibilidad: 'hidden', expandido: 'false',
    });
    expect(cerradoInicial[1], 'el menú del estático no arranca cerrado').toMatchObject({
      clase: false, opacidad: '0', visibilidad: 'hidden',
    });

    const abrirlo = async (p: Page) => {
      await p.click('#abrir');
      await p.waitForTimeout(600);
      return estadoDelMenu(p);
    };
    const abierto = await Promise.all([abrirlo(port), abrirlo(estatica)]);
    expect(abierto[0], 'el menú del port no se abrió').toMatchObject({
      clase: true, opacidad: '1', visibilidad: 'visible', expandido: 'true', scrollDelFondo: 'hidden',
    });
    expect(abierto[0], 'el menú abierto no se comporta igual que en el sitio estático').toEqual(abierto[1]);

    const conLaEquis = async (p: Page) => {
      await p.click('#cerrar');
      await p.waitForTimeout(600);
      return estadoDelMenu(p);
    };
    const cerradoConLaEquis = await Promise.all([conLaEquis(port), conLaEquis(estatica)]);
    expect(cerradoConLaEquis[0], 'la ✕ no cerró el menú del port').toMatchObject({
      clase: false, visibilidad: 'hidden', expandido: 'false', scrollDelFondo: '',
    });
    expect(cerradoConLaEquis[0], 'cerrar con la ✕ no se comporta igual que en el sitio estático')
      .toEqual(cerradoConLaEquis[1]);

    const conEscape = async (p: Page) => {
      await p.click('#abrir');
      await p.waitForTimeout(600);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(600);
      return estadoDelMenu(p);
    };
    const cerradoConEscape = await Promise.all([conEscape(port), conEscape(estatica)]);
    expect(cerradoConEscape[0], 'Escape no cerró el menú del port').toMatchObject({
      clase: false, visibilidad: 'hidden', expandido: 'false', scrollDelFondo: '',
    });
    expect(cerradoConEscape[0], 'cerrar con Escape no se comporta igual que en el sitio estático')
      .toEqual(cerradoConEscape[1]);

    await estatica.close();
  });

  test('1440px · la cabecera se tiñe al desplazar, se apaga al detenerse, y los bloques se revelan', async ({ page }) => {
    const { port, estatica } = await losDos(page, '/', 1440);

    /* En reposo: el velo apagado, de los dos lados. */
    const reposo = await Promise.all([estadoDeLaCabecera(port), estadoDeLaCabecera(estatica)]);
    expect(reposo[0], 'la cabecera del port no arranca transparente').toMatchObject({ velo: '0', scrolled: false });
    expect(reposo[0], 'la cabecera en reposo no coincide con la del sitio estático').toEqual(reposo[1]);

    /* A 600 px y dentro de los 650 ms de quietud: encendido. */
    await Promise.all([desplazar(port, 600, 350), desplazar(estatica, 600, 350)]);
    const teñida = await Promise.all([estadoDeLaCabecera(port), estadoDeLaCabecera(estatica)]);
    expect(teñida[0], 'la cabecera del port no tomó el color de la sección').toMatchObject({ velo: '1', scrolled: true });
    expect(teñida[0], 'la cabecera teñida no coincide con la del sitio estático').toEqual(teñida[1]);

    /* Quieto: la clase se va a los 650 y el velo tarda 600 más en apagarse. */
    await Promise.all([port.waitForTimeout(1100), estatica.waitForTimeout(1100)]);
    const quieta = await Promise.all([estadoDeLaCabecera(port), estadoDeLaCabecera(estatica)]);
    expect(quieta[0], 'la cabecera del port no volvió a transparente al detenerse').toMatchObject({ velo: '0', scrolled: false });
    expect(quieta[0], 'la cabecera quieta no coincide con la del sitio estático').toEqual(quieta[1]);

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
    const fundido = await Promise.all([recorrer(port), recorrer(estatica)]);
    expect(fundido[0].total, 'el port no tiene bloques con .reveal: no hay nada que revelar').toBeGreaterThan(5);
    expect(fundido[0].revelados, 'quedaron bloques sin revelar en el port').toBe(fundido[0].total);
    expect(fundido[0], 'el fundido de entrada no coincide con el del sitio estático').toEqual(fundido[1]);

    await estatica.close();
  });
});
