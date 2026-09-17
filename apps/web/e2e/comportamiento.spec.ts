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

  /*
   * ── El foco (orden #06, E y H) ─────────────────────────────────────────
   * Tres cosas que no se ven en una captura y que son la mitad de lo que hace
   * que una web se sienta cuidada cuando se la usa con teclado.
   */
  test('1440px · el anillo de foco es del color del texto, y solo con teclado', async ({ page }) => {
    await abrir(page, '/', 1440);

    /* ── (a) Con el mouse, nada ─────────────────────────────────────────
       Va primero y sobre una página recién cargada, y las dos cosas importan:
       una vez que el teclado encendió `:focus-visible` en un elemento, el
       navegador **se lo deja puesto** aunque después se lo clickee. Haciendo el
       clic al final, el test pasaría en verde midiendo el anillo del Tab
       anterior. Está medido: así lo escribí primero y así falló.

       Sobre el botón «Menú» y no sobre el de WhatsApp porque el segundo es un
       `<a target="_blank">` y el clic abriría una pestaña; y porque el
       `<button>` es justamente el elemento donde los navegadores más difieren
       en si dejan o no el anillo al clickear. */
    const menu = page.locator('#abrir');
    await menu.click();
    await page.waitForTimeout(300);
    expect(
      await menu.evaluate((el) => getComputedStyle(el).outlineStyle),
      'el clic con el mouse no tiene que dejar anillo',
    ).toBe('none');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    /* ── (b) Con `Tab`, el anillo existe y es del color del texto ────────
       Antes era `1px solid var(--naranja)`: el rectángulo naranja que dirección
       señaló en el bloque de contacto, igual en cada botón de la web.

       Se tabula hasta llegar en vez de contar los Tab: la cuenta exacta depende
       de cuántos elementos tenga el header —hoy tres— y fijarla haría que el
       test se ponga rojo el día que se agregue un enlace, que no es un defecto.
       Lo que importa, y lo que se afirma, es que se llega con el teclado. */
    const wa = page.locator('#hd .hd__wa');
    for (let i = 0; i < 8 && !(await wa.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(wa, 'no se llega al botón de WhatsApp del header con el teclado').toBeFocused();

    const anillo = await wa.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, outlineColor: cs.outlineColor, ancho: cs.outlineWidth, estilo: cs.outlineStyle, offset: cs.outlineOffset };
    });
    expect(anillo.outlineColor, 'el anillo no es del color del texto').toBe(anillo.color);
    expect(anillo.ancho).toBe('2px');
    expect(anillo.estilo).toBe('solid');
    expect(anillo.offset).toBe('3px');
  });

  test('390px · con el menú abierto el Tab recorre cierre → ítems → WhatsApp', async ({ page }) => {
    await abrir(page, '/', 390);
    await page.click('#abrir');
    await page.waitForTimeout(500);

    /* Quién tiene el foco, y si está dentro del overlay. Lo segundo importa
       tanto como lo primero: hasta esta orden los dos primeros `Tab` caían en
       el header —invisible debajo del telón pero todavía tabulable— antes de
       llegar a «Cerrar». */
    const recorrido: string[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      recorrido.push(await page.evaluate(() => {
        const e = document.activeElement as HTMLElement | null;
        const dentro = !!e && document.getElementById('ov')!.contains(e);
        return `${dentro ? 'ov' : 'FUERA'}:${(e?.textContent ?? '').trim()}`;
      }));
    }

    expect(recorrido[0], 'el primer Tab tiene que caer en «Cerrar», no en el header oculto').toBe('ov:Cerrar');
    expect(
      recorrido.every((x) => x.startsWith('ov:')),
      `el recorrido se salió del menú: ${recorrido.join(' → ')}`,
    ).toBe(true);
    expect(recorrido[7], 'el último del recorrido es el WhatsApp del pie del menú')
      .toContain('Escribir por WhatsApp');
  });

  test('390px · Escape cierra y devuelve el foco al botón «Menú»', async ({ page }) => {
    await abrir(page, '/', 390);
    await page.focus('#abrir');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.getElementById('ov')!.classList.contains('open'))).toBe(true);

    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('cerrar');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.getElementById('ov')!.classList.contains('open'))).toBe(false);
    expect(
      await page.evaluate(() => document.activeElement?.id),
      'al cerrar con Escape el foco vuelve al botón que abrió el menú; si se queda en el body, '
      + 'el siguiente Tab empieza de nuevo desde arriba de la página',
    ).toBe('abrir');
  });

  /*
   * ── El menú abierto, medido y fotografiado (orden #06, I.3 e I.5) ───────
   *
   * Hacía falta descubrirlo para escribirlo: **el guardián de fidelidad no ve
   * el overlay.** Sus doce capturas son de la página con el menú cerrado, y
   * cerrado el overlay es `visibility:hidden`, así que no aporta un píxel. La
   * mutación que la orden propone —devolver el `font-size` de los ítems al
   * `clamp()` viejo— se corrió y dio **cero capturas en rojo**: el rediseño
   * entero del menú no tenía nada que lo vigilara.
   *
   * Así que acá van las dos mitades que faltaban, y son distintas a propósito:
   *
   *   · **los números**, con `getComputedStyle`, que es lo que la orden pide
   *     comparar contra el motor de 512. Un número se lee en el diff del PR;
   *     una captura, no.
   *   · **la imagen**, que caza lo que ningún número enumerado caza: el ítem
   *     que se descolocó, el telón que cambió de tono, la pieza que se fue.
   */
  test('1440px · el menú abierto mide lo que el motor de 512 mide', async ({ page }) => {
    await abrir(page, '/', 1440);
    await page.click('#abrir');
    await page.waitForTimeout(700);

    const m = await page.evaluate(() => {
      const q = (s: string) => document.querySelector(s)!;
      const cs = getComputedStyle;
      const item = cs(q('.ov__list a'));
      const inner = cs(q('.ov__inner'));
      const cierre = cs(q('.ov__close'));
      return {
        itemFontSize: item.fontSize,
        itemFontWeight: item.fontWeight,
        itemPadding: `${item.paddingTop} ${item.paddingRight}`,
        itemGap: item.columnGap,
        innerMaxWidth: inner.maxWidth,
        innerGap: inner.rowGap,
        cierrePosition: cierre.position,
        cierreGap: cierre.columnGap,
        cierreHeight: cierre.height,
        headerH: cs(document.documentElement).getPropertyValue('--header-h').trim(),
        piePaddingTop: cs(q('.ov__foot')).paddingTop,
      };
    });

    /* EL PISO: si el overlay no está abierto, todo lo de abajo mide un elemento
       escondido y varias de estas propiedades salen igual de todos modos. */
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('ov')!).visibility))
      .toBe('visible');

    expect(m.itemFontSize, 'los ítems son de 24 px, como en el motor').toBe('24px');
    expect(m.itemFontWeight).toBe('500');
    expect(m.itemPadding).toBe('18px 0px');
    expect(m.itemGap).toBe('16px');
    expect(m.innerMaxWidth, 'la columna es de 1200').toBe('1200px');
    expect(m.innerGap, 'la lista y el pie están a 80 px').toBe('80px');
    expect(m.cierrePosition).toBe('fixed');
    expect(m.cierreGap).toBe('14px');
    expect(m.cierreHeight, 'el cierre mide lo que mide el header').toBe(m.headerH);
    expect(m.piePaddingTop).toBe('20px');

    /* Y los dos filetes, al 12 % y al 14 % de crema. `getComputedStyle` los
       devuelve en `oklab(... / alfa)`, así que se compara el alfa, que es lo
       que la orden fija. */
    const alfas = await page.evaluate(() => {
      const alfa = (c: string) => Number((c.match(/\/\s*([\d.]+)\s*\)/) ?? [])[1] ?? 1);
      return {
        item: alfa(getComputedStyle(document.querySelector('.ov__list a')!).borderBottomColor),
        pie: alfa(getComputedStyle(document.querySelector('.ov__foot')!).borderTopColor),
      };
    });
    expect(alfas.item, 'el filete de los ítems va al 12 %').toBeCloseTo(0.12, 2);
    expect(alfas.pie, 'el del pie, al 14 %').toBeCloseTo(0.14, 2);
  });

  for (const ancho of [1440, 390] as const) {
    test(`${ancho}px · el menú abierto dibuja lo que la última versión aprobada dibujaba`, async ({ page }) => {
      await abrir(page, '/', ancho);
      await page.click('#abrir');
      await page.waitForTimeout(700);
      await expect(page).toHaveScreenshot(`overlay-${ancho}.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0,
        threshold: 0.05,
      });
    });
  }
});