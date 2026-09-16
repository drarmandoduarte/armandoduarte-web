import { expect, test, type Page } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * El guardián de fidelidad — orden Códice #01 (C3), con referencia nueva desde
 * la #05 (D24).
 *
 * ── Qué mide, y por qué cuatro cosas y no una ─────────────────────────────
 * «Indistinguible» tiene cuatro caras que se rompen por separado:
 *
 *   a · **el texto visible**, comparado con igualdad estricta. Caza una palabra
 *       perdida en una clave de i18n, que ninguna captura al 0,3 % vería;
 *   b · **los píxeles**, página completa. Caza el espacio, el color y la fuente:
 *       lo que un texto idéntico puede seguir dibujando mal;
 *   c · **los `href`, en orden**, con sus `text=` de WhatsApp. Caza el botón que
 *       quedó apuntando al mensaje —o al teléfono— equivocado: invisible en la
 *       captura, y lo que le llega a alguien por teléfono;
 *   d · **el `<head>`**. Caza lo que solo se ve en Google y en la vista previa de
 *       WhatsApp: título, descripción, canónica e imagen de compartir.
 *
 * Ninguna de las cuatro sobra: cada una caza algo que las otras tres dejan pasar.
 *
 * ── Contra qué compara, y por qué cambió (orden #05, G · D24) ─────────────
 * Hasta la #04 comparaba contra **el sitio estático en vivo**, servido desde
 * `qa/referencia/`, a cero píxeles. Su trabajo era probar que el port de la #01
 * era fiel, y lo probó: doce comprobaciones en verde con `threshold: 0`.
 *
 * La #05 es la primera orden que cambia la web **a pedido del cliente** —la
 * paleta entera, ocho íconos, seis fotografías, dos teléfonos y una ruta— y
 * contra el estático ya no hay nada que probar. Sostener esa comparación habría
 * significado inyectarle al estático treinta «cambios visibles» declarados, que
 * es la técnica de la #03 llevada al punto en que deja de ser una declaración
 * legible y pasa a ser una segunda implementación de la web.
 *
 * Así que la referencia cambia; **el rigor no**. Ahora se compara contra las
 * capturas de la última versión aprobada, versionadas en `e2e/__snapshots__/`.
 * El presupuesto sigue siendo **cero píxeles**.
 *
 * ── Lo que hace que una captura guardada no envejezca ────────────────────
 * La #01 tenía razón en su objeción: una captura en el repo envejece, y al mes
 * nadie sabe si el rojo es un defecto o la imagen vieja. Lo que la desactiva no
 * es no guardarlas: es **quién puede cambiarlas y con qué ruido**.
 *
 * Se actualizan solo con `--update-snapshots`, y el PR que lo haga tiene que
 * decir la frase «capturas actualizadas por la orden #NN» con la lista de qué
 * cambió. Un PR que actualiza capturas sin decir por qué no se mergea. Es la
 * regla de Omnia: un guardián fija una decisión, y la decisión se revisa en el
 * mismo PR que la cambia. Una captura vieja deja de ser un misterio cuando hay
 * un renglón que dice quién la movió.
 *
 * ── Por qué el texto, los `href` y el `<head>` van una sola vez por página ─
 * El texto **sí** cambia con el ancho —a 600 px o menos, `.hd__menu span` y
 * `.marca small` se ocultan— así que se guarda uno por ancho. Los `href` y el
 * `<head>` no dependen del ancho: guardarlos tres veces serían dos archivos que
 * solo pueden decir lo mismo, y treinta y seis archivos casi idénticos esconden
 * la señal en vez de mostrarla. Si algún día uno de los dos dependiera del
 * ancho, eso sería el hallazgo — y esta nota, el lugar donde se lo discute.
 */

const PAGINAS = [
  { nombre: 'inicio', ruta: '/' },
  { nombre: 'taller', ruta: '/merida' },
  { nombre: 'privacidad', ruta: '/privacidad' },
  { nombre: 'terminos', ruta: '/terminos' },
] as const;

const ANCHOS = [1440, 900, 390] as const;

const PISO_DE_TEXTO = 500;

/**
 * Cero píxeles de diferencia, y no el 0,3 % que la orden #01 puso de presupuesto.
 *
 * ── Por qué se bajó, medido ──────────────────────────────────────────────
 * Porque el 0,3 % **no caza nada a esta escala**. La mutación de control de la
 * #01 —cambiar el color del rótulo «LEGAL» de la página de privacidad— mueve
 * **43 píxeles** sobre más de tres millones. Con el umbral en 0,3 % las tres
 * comprobaciones salían **verdes** con la palabra pintada de otro color. Un
 * guardián que aprueba eso no es un guardián: es un presupuesto.
 *
 * Queda el `threshold` por píxel que trae Playwright (0,2 en YIQ), que tolera el
 * antialias de una máquina a otra sin tolerar un color distinto. Si algún día
 * este número tiene que subir, sube con la medición al lado.
 */
const DIFERENCIA_MAXIMA = 0;

const url = (ruta: string) => `http://127.0.0.1:${PUERTO_PORT}${ruta}`;

/** Deja la página quieta y con todo revelado, lista para medir. */
async function asentar(page: Page, ruta: string, ancho: number) {
  await page.setViewportSize({ width: ancho, height: 900 });
  await page.goto(url(ruta), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  /* Hasta el final y de vuelta arriba: revela todo lo que espera al
     IntersectionObserver y dispara el mismo trabajo de layout que haría alguien
     leyendo. Volver arriba deja el header en su estado de reposo, que es donde
     se lo mide. */
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 120));
    window.scrollTo(0, 0);
  });
  /* Y que las imágenes estén enteras antes de la foto: desde la #05 hay catorce
     —ocho íconos y seis fotografías— y casi todas son `loading="lazy"`. Una
     captura tomada a mitad de la decodificación es un rojo que no se repite.

     Dos detalles, los dos aprendidos rompiéndolo:

     · **`loading` pasa a `eager` antes de esperar.** Una imagen perezosa que
       quedó lejos del viewport no empieza a cargar nunca, así que `complete`
       sigue en `false` y su `onload` no llega: la primera versión de esto se
       colgaba los 30 segundos del timeout en las tres medidas del taller.
     · **la espera tiene techo.** Si algún día una imagen falta de verdad, esto
       tiene que dejar que la comparación siga y se ponga roja por la imagen
       rota —que es el defecto— y no por un timeout del corredor, que no dice
       cuál era el problema. */
  await page.evaluate(async () => {
    const imagenes = [...document.images];
    imagenes.forEach((i) => { i.loading = 'eager'; });
    const conTecho = (p: Promise<unknown>) =>
      Promise.race([p, new Promise((r) => setTimeout(r, 5000))]);
    await Promise.all(imagenes.map((i) => conTecho(
      i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; }),
    )));
    await conTecho(Promise.all(imagenes.map((i) => i.decode().catch(() => {}))));
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
  test.describe(`${nombre} · la web dibuja lo que la última versión aprobada dibujaba`, () => {
    for (const ancho of ANCHOS) {
      test(`${ancho}px`, async ({ page }) => {
        await asentar(page, ruta, ancho);

        const texto = await textoVisible(page);

        /* EL PISO, PRIMERO: una página vacía coincide consigo misma. Sin esto,
           un `dist/` a medio escribir se compararía contra una captura de un
           `dist/` a medio escribir y saldría en verde. */
        expect(texto.length, `la página no trajo texto en ${ruta}`).toBeGreaterThan(PISO_DE_TEXTO);

        // (a) el texto visible
        expect(texto).toMatchSnapshot(`${nombre}-${ancho}-texto.txt`);

        if (ancho === ANCHOS[0]) {
          // (c) los enlaces, en orden — no dependen del ancho
          expect(JSON.stringify(await enlaces(page), null, 2))
            .toMatchSnapshot(`${nombre}-enlaces.json`);

          // (d) el head — tampoco
          expect(JSON.stringify(await cabeza(page), null, 2))
            .toMatchSnapshot(`${nombre}-cabeza.json`);
        }

        // (b) los píxeles
        await expect(page).toHaveScreenshot(`${nombre}-${ancho}.png`, {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: DIFERENCIA_MAXIMA,
        });
      });
    }
  });
}
