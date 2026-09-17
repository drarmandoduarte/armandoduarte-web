import { expect, test, type Page } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * La CSP — orden Códice #10, sección B.
 *
 * ── Las dos mitades, y hacen falta las dos ───────────────────────────────
 * **Una CSP que no rompe nada puede ser una CSP que no está puesta.** Así que
 * no alcanza con recorrer la web y ver la consola limpia: eso sale idéntico si
 * la cabecera no llegó nunca. Los tests van en ese orden:
 *
 *   1 · **que llegue** — la cabecera, entera, en las cuatro rutas;
 *   2 · **que no rompa** — las cuatro rutas por los dos anchos, abriendo el menú
 *       y tocando el WhatsApp, sin una sola violación en consola;
 *   3 · **que muerda** — un `<script>` en línea inyectado en la respuesta, que
 *       el navegador tiene que negarse a ejecutar.
 *
 * El (3) es el que convierte al (2) en una afirmación. Sin él, «consola limpia»
 * y «no hay política» se escriben igual.
 *
 * ── La política no se copia acá, se lee ──────────────────────────────────
 * `e2e/servidor.mjs` sirve las cabeceras del **`vercel.json` de la raíz**, el
 * mismo archivo que Vercel lee, así que estos tests miden la política que se va
 * a publicar. Una copia de la cadena en este archivo sería una segunda verdad
 * que un día deja de coincidir — y coincidiría justo hasta el día que importa.
 *
 * ── Lo que NO comprueba, declarado ───────────────────────────────────────
 * Que **Vercel** sirva la cabecera. Esto mide el servidor de QA con la política
 * leída del archivo; que la plataforma la aplique se mide con `curl` contra el
 * preview y contra producción, y está en el informe de la #10. Es el mismo
 * reparto que la #08 dejó escrito para el `noindex`: un test caza el renglón
 * borrado en un PR, el `curl` caza que la plataforma cambie de opinión.
 *
 * ── Por qué la sonda no dice `alert(1)` ──────────────────────────────────
 * Porque un `alert()` que **no** fuera bloqueado abre un diálogo modal que
 * congela la pestaña y se lleva puesta la corrida entera, y el rojo que deja es
 * un timeout que no dice cuál era el problema. `window.__inyectado = true`
 * prueba exactamente lo mismo —¿corrió o no corrió un script en línea?— y
 * cuando falla, falla diciendo que corrió.
 */

const PAGINAS = [
  { nombre: 'inicio', ruta: '/' },
  { nombre: 'taller', ruta: '/merida' },
  { nombre: 'privacidad', ruta: '/privacidad' },
  { nombre: 'terminos', ruta: '/terminos' },
] as const;

const ANCHOS = [1440, 390] as const;

const url = (ruta: string) => `http://127.0.0.1:${PUERTO_PORT}${ruta}`;

/** Lo que Chrome escribe en consola cuando la CSP corta algo. */
const esViolacion = (texto: string) =>
  /Content Security Policy|Refused to (load|execute|apply|connect|frame)/i.test(texto);

/** Engancha la consola y los errores de página, y devuelve lo que se juntó. */
function escuchar(page: Page) {
  const ruido: string[] = [];
  page.on('console', (m) => { if (esViolacion(m.text())) ruido.push(m.text()); });
  page.on('pageerror', (e) => { if (esViolacion(e.message)) ruido.push(`pageerror: ${e.message}`); });
  return ruido;
}

test.describe('la Content-Security-Policy', () => {
  test('(1) llega entera en las cuatro rutas', async ({ request }) => {
    const leidas: string[] = [];
    for (const { nombre, ruta } of PAGINAS) {
      const r = await request.get(url(ruta));
      leidas.push(`${nombre}: ${r.headers()['content-security-policy'] ?? '(no llegó)'}`);
    }

    /* Las cuatro tienen que traer LA MISMA, y se comparan entre sí en vez de
       contra una cadena escrita acá: la política sale del `vercel.json` y este
       archivo no la conoce. Lo que se afirma es que ninguna ruta se quedó sin
       ella y que ninguna trae una distinta. */
    const valores = new Set(leidas.map((l) => l.split(': ').slice(1).join(': ')));
    expect(
      [...valores],
      'las cuatro rutas tienen que traer la misma política. Si una trae `(no llegó)`, la regla del '
      + '`vercel.json` dejó de cubrirla; si traen dos distintas, alguien la condicionó a algo.',
    ).toHaveLength(1);

    const politica = [...valores][0];
    expect(politica, 'no llegó ninguna cabecera de CSP').not.toBe('(no llegó)');

    /* Y el piso de lo que esa política tiene que decir. Se nombran las dos
       directivas que hacen el trabajo y la palabra que no puede aparecer: sin
       esto, una CSP vacía o un `default-src *` pasarían las tres comparaciones
       de arriba, que sólo miran que las cuatro digan lo mismo. */
    expect(politica, 'sin `script-src \'self\'` la política no impide ejecutar nada').toContain("script-src 'self'");
    expect(politica, 'sin `default-src \'self\'` no hay piso: lo que no esté nombrado queda libre').toContain("default-src 'self'");
    expect(
      politica.includes('unsafe-inline') || politica.includes('unsafe-eval'),
      'apareció un `unsafe-*` en la política. Es la línea que hace todo el trabajo: si hizo falta, '
      + 'algo se hizo mal en la página, no en la política. Sube a dirección antes de agregarlo.',
    ).toBe(false);
  });

  test('(2) no rompe nada: cuatro rutas, dos anchos, menú y WhatsApp', async ({ page }) => {
    const ruido = escuchar(page);
    let visitadas = 0;

    for (const ancho of ANCHOS) {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const { ruta } of PAGINAS) {
        await page.goto(url(ruta), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        /* Hasta el fondo y de vuelta: dispara el IntersectionObserver, las
           imágenes perezosas y el teñido de la cabecera, que son las tres cosas
           que el único script hace. */
        await page.evaluate(async () => {
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((r) => setTimeout(r, 150));
          window.scrollTo(0, 0);
        });

        /* El menú, que a 390 px es un overlay y a 1440 no está. */
        const menu = page.locator('#hd .hd__menu');
        if (await menu.isVisible().catch(() => false)) {
          await menu.click();
          await page.waitForTimeout(250);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(250);
        }
        visitadas += 1;
      }
    }

    /* El WhatsApp se comprueba clickeando y no razonando, que es lo que la orden
       pide: `wa.me` con `target="_blank"` es **navegación**, no carga de
       recurso, y ninguna directiva de esta política la gobierna. Si eso fuera
       falso, se vería acá. Se intercepta para no salir a internet: lo que se
       mide es si el navegador deja empezar la navegación, no qué contesta. */
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url('/'), { waitUntil: 'load' });
    await page.route('https://wa.me/**', (r) => r.fulfill({ status: 200, body: 'ok' }));
    const wa = page.locator('a[href*="wa.me"]').first();
    const emergente = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
    await wa.click();
    const abierta = await emergente;
    expect(abierta, 'el enlace de WhatsApp no abrió nada: la CSP no debería impedirlo —es navegación, '
      + 'no carga de recurso— así que si esto falla hay una directiva de más').toBeTruthy();
    await abierta?.close();

    /* EL PISO, ANTES del cero: «ninguna violación» sobre cero páginas visitadas
       es cierto y no dice nada. Si el bucle se rompe, esto habla primero. */
    expect(visitadas, 'se recorrieron menos páginas de las ocho: el cero de abajo no significaría nada')
      .toBe(PAGINAS.length * ANCHOS.length);

    expect(ruido, `violaciones de CSP en ${visitadas} páginas recorridas`).toEqual([]);
  });

  test('(3) y muerde: un <script> en línea inyectado no se ejecuta', async ({ page }) => {
    /* La mutación va en la respuesta y no en el repo: la sonda de la #08 fue un
       commit temporal porque probaba algo de Vercel; ésta prueba algo del
       navegador, así que puede vivir acá para siempre y morder en cada corrida.
       Un guardián permanente vale más que una sonda que se quitó. */
    await page.route(url('/'), async (ruta) => {
      const original = await ruta.fetch();
      const html = (await original.text())
        .replace('</head>', '<script>window.__inyectado = true;</script>\n</head>');
      await ruta.fulfill({ response: original, body: html });
    });

    const ruido = escuchar(page);
    await page.goto(url('/'), { waitUntil: 'load' });

    /* EL PISO: que el `<script>` que se quiere ver bloqueado haya llegado de
       verdad a la página. Sin esto, un `route` que no interceptó nada daría
       «no se ejecutó» —cierto, porque no existía— y el test pasaría en verde
       habiendo probado nada. */
    const llego = await page.evaluate(() => document.head.innerHTML.includes('__inyectado'));
    expect(llego, 'la inyección no llegó al HTML: el test de abajo pasaría sin haber probado nada').toBe(true);

    expect(
      await page.evaluate(() => (window as unknown as { __inyectado?: boolean }).__inyectado),
      'el <script> en línea inyectado SÍ se ejecutó. La política no está puesta, no llegó, o trae '
      + '`unsafe-inline`: y entonces las otras comprobaciones no valen nada, porque una consola '
      + 'limpia y una política ausente se escriben igual.',
    ).toBeUndefined();

    expect(
      ruido.length,
      'el navegador tiene que además decirlo en consola: si bloquea en silencio, nadie se entera '
      + 'de que algo intentó ejecutarse',
    ).toBeGreaterThan(0);
  });
});
