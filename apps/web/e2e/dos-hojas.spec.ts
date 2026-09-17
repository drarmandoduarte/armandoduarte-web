import { expect, test, type Page } from '@playwright/test';
import { PUERTO_PORT } from '../playwright.config';

/**
 * Las dos hojas — orden Códice #09, sección B.
 *
 * ── Qué se prueba acá, y qué NO ──────────────────────────────────────────
 * **No se prueba el número de Lighthouse.** El número es la consecuencia y vive
 * en el informe, con su método al lado (cinco corridas pareadas). Lo que se
 * prueba acá es el **mecanismo**, que es lo que la orden compró: que la hoja de
 * fuentes y la de estilos existan como dos, se pidan **en paralelo**, lleguen
 * con la prioridad que corresponde, y que separarlas **no haya abierto un salto
 * de texto** donde no había ninguno.
 *
 * El cuarto es la trampa de esta orden y por eso son cuatro tests y no uno: la
 * hoja de fuentes podría llegar tarde, la página pintaría el primer cuadro con
 * la tipografía del sistema y la cambiaría al llegar la buena. Eso mejora el
 * LCP **y rompe el CLS**, o sea gana el número que la orden perseguía perdiendo
 * el que no se podía tocar.
 *
 * ── Por qué con el enlace estrangulado ───────────────────────────────────
 * Porque sin estrangular no hay nada que medir: en `localhost` las dos hojas y
 * las seis tipografías llegan en un puñado de milisegundos, antes del primer
 * cuadro, y **cualquier** arreglo da CLS 0 —incluso uno roto—. El CLS de esta
 * suite se mide con `Network.emulateNetworkConditions` en los mismos 1,6 Mbit/s
 * y 150 ms que usa Lighthouse móvil, que es donde el defecto se ve.
 *
 * ── Verlo fallar, que es lo que lo termina ───────────────────────────────
 * Cada mitad se rompió por separado, porque una que sobrevive sostenida por
 * otra no está sosteniendo nada. Los cuatro rojos, con la mutación que los
 * produce, están en el informe de la orden con sus números:
 *
 *   · **piso** — las dos hojas al revés en el `<head>`, un renglón del
 *     prerender. Rojo también en `src/el-css-va-en-dos-hojas.test.ts` y —lo que
 *     importa— en el guardián de fidelidad, que hasta esta orden no lo veía.
 *   · **prioridades** — la hoja de fuentes cargada sin bloquear
 *     (`media="print" onload="this.media='all'"`), que es la «optimización» que
 *     alguien va a copiar de un blog algún día: baja a `Low` y el test lo dice.
 *   · **salto de texto** — la pila de respaldo movida en `codice-tokens.css`.
 *     Con `--lectura` en `Georgia,serif` se ponen rojos inicio, privacidad y
 *     terminos (el inicio ×20, terminos ×200); con `--display` en
 *     `Georgia,serif`, inicio y **taller**. Hicieron falta las dos porque el
 *     salto de `/merida` es del rótulo de la cabecera y no del cuerpo.
 *
 * Y una que **no** los rompe, anotada porque es más útil que las que sí: mover
 * la hoja de fuentes al final del `<body>` deja los cuatro del salto en verde
 * —el preload scanner la encuentra igual y llega antes del primer cuadro— y la
 * cazan el piso y el de prioridades. O sea que estos cuatro tests vigilan
 * **cuánto salta el texto**, no dónde está escrito el `<link>`; para eso están
 * los otros tres.
 */

const PAGINAS = [
  { nombre: 'inicio', ruta: '/' },
  { nombre: 'taller', ruta: '/merida' },
  { nombre: 'privacidad', ruta: '/privacidad' },
  { nombre: 'terminos', ruta: '/terminos' },
] as const;

/** El ancho de Lighthouse móvil, que es donde se midió el pendiente 5b. */
const ANCHO = 390;

/* Los 1,6 Mbit/s y los 150 ms de Lighthouse móvil, en las unidades de CDP
   (bytes por segundo y milisegundos). */
const BAJADA = Math.round((1.6 * 1000 * 1000) / 8);
const SUBIDA = Math.round((750 * 1000) / 8);
const LATENCIA = 150;

const url = (ruta: string) => `http://127.0.0.1:${PUERTO_PORT}${ruta}`;

type Pedido = { url: string; prioridad: string; empieza: number; termina: number | null };

/**
 * La cascada de red de una carga, tal como la ve Chrome.
 *
 * Se lee por CDP y no por `page.on('request')` porque la **prioridad** no está
 * en la API de Playwright: es `request.initialPriority` de
 * `Network.requestWillBeSent`, que es el número con el que Chrome ordena la
 * cola. Y los tiempos son los de CDP —segundos de reloj monótono— que es lo
 * único que permite afirmar «empezaron las dos antes de que terminara ninguna».
 */
async function cascada(page: Page, ruta: string, opciones: { estrangular?: boolean } = {}) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  if (opciones.estrangular) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: LATENCIA,
      downloadThroughput: BAJADA,
      uploadThroughput: SUBIDA,
    });
  }

  const porId = new Map<string, Pedido>();
  cdp.on('Network.requestWillBeSent', (e) => {
    porId.set(e.requestId, {
      url: e.request.url,
      prioridad: e.request.initialPriority,
      empieza: e.timestamp,
      termina: null,
    });
  });
  const cerrar = (e: { requestId: string; timestamp: number }) => {
    const p = porId.get(e.requestId);
    if (p && p.termina === null) p.termina = e.timestamp;
  };
  cdp.on('Network.loadingFinished', cerrar);
  cdp.on('Network.loadingFailed', cerrar);

  await page.setViewportSize({ width: ANCHO, height: 844 });
  await page.goto(url(ruta), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  /* Un respiro después de que las tipografías están listas: el reflow del
     `swap`, si lo hubiera, ocurre en el cuadro siguiente al que las carga. */
  await page.waitForTimeout(500);

  return [...porId.values()];
}

const hojas = (pedidos: Pedido[]) => ({
  fuentes: pedidos.find((p) => /\/assets\/fuentes-[^/]+\.css$/.test(p.url)),
  estilos: pedidos.find((p) => /\/assets\/style-[^/]+\.css$/.test(p.url)),
});

/**
 * El salto que la web ya tenía, medido — y por qué NO dice «cero».
 *
 * La orden pedía comprobar que «CLS sigue en 0». El número que Lighthouse
 * publica sí es 0 (está en el informe, cinco corridas pareadas); lo que un
 * `PerformanceObserver` a precisión completa ve es que las cuatro páginas
 * tienen un salto **diminuto** al cambiar la tipografía del sistema por la
 * buena, en el rótulo de la cabecera y en el primer párrafo. Existía antes de
 * esta orden: los cuatro valores se midieron sobre `main` y sobre la rama, tres
 * corridas de cada lado, y salieron **idénticos hasta el último dígito**. O sea
 * que partir la hoja en dos no lo movió, que es lo que la orden vino a exigir.
 *
 *   inicio 0.000782 · taller 0.000150 · privacidad 0.004878 · terminos 0.000035
 *
 * Se escriben **como igualdad y no como «menor que»**, por lo mismo que el
 * contraste de `packages/ui/tokens.test.mjs`: el día que alguien arregle el
 * salto de la cabecera —o lo empeore— el test se pone rojo y lo obliga a venir
 * hasta acá a mover el número a mano, con su medición al lado. Un presupuesto
 * («menos de 0,01») dejaría pasar un salto veinte veces más grande sin decir
 * nada.
 *
 * La tolerancia del `toBeCloseTo` es de 1e-5 y es de coma flotante, no de
 * diseño: absorbe el último dígito y nada más. Una regresión de verdad —la hoja
 * de fuentes llegando tarde— mueve esto tres órdenes de magnitud.
 *
 * **En otra máquina estos cuatro números van a ser otros**, porque dependen de
 * las métricas de la tipografía del sistema: el día que esto corra en Linux hay
 * que volver a medir los dos lados y anotar los dos juegos, como hace
 * `playwright.config.ts` con el sufijo `{platform}` de las capturas.
 */
const SALTO: Record<string, number> = {
  inicio: 0.000782,
  taller: 0.000150,
  privacidad: 0.004878,
  terminos: 0.000035,
};

test.describe('las dos hojas de `@codice/ui`', () => {
  test('piso · las cuatro páginas enlazan dos hojas, y la de fuentes va primero', async ({ page }) => {
    /* EL PISO, PRIMERO, y por el motivo de siempre: los tres tests de abajo
       miran la portada. Si `/terminos` quedara con una hoja sola —o con las dos
       al revés— ninguno lo vería, y es justo la página del segundo caso del
       pendiente 5b. */
    const leidas: string[] = [];
    for (const { nombre, ruta } of PAGINAS) {
      await page.goto(url(ruta), { waitUntil: 'load' });
      const enlazadas = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
          .map((l) => new URL(l.href).pathname.replace(/-[A-Za-z0-9_-]{8}\.css$/, '-<hash>.css')));
      leidas.push(`${nombre}: ${enlazadas.join(' · ')}`);
    }

    expect(
      leidas,
      'dos hojas por página y en este orden. Una sola significa que volvieron a fusionarse '
      + '—el `@import` de vuelta en `styles.css`, o un `import` de más en `entrada-navegador.ts`—; '
      + 'y al revés, los `@font-face` se declararían después de las reglas que los usan.',
    ).toEqual(PAGINAS.map(({ nombre }) =>
      `${nombre}: /assets/fuentes-<hash>.css · /assets/style-<hash>.css`));
  });

  test('se piden en paralelo: las dos empiezan antes de que termine cualquiera', async ({ page }) => {
    const pedidos = await cascada(page, '/');
    const { fuentes, estilos } = hojas(pedidos);

    expect(fuentes, 'no se pidió ninguna hoja de fuentes').toBeTruthy();
    expect(estilos, 'no se pidió ninguna hoja de estilos').toBeTruthy();
    expect(fuentes!.termina, 'la hoja de fuentes no terminó de bajar').not.toBeNull();
    expect(estilos!.termina, 'la hoja de estilos no terminó de bajar').not.toBeNull();

    const arranque = Math.max(fuentes!.empieza, estilos!.empieza);
    const primerFinal = Math.min(fuentes!.termina!, estilos!.termina!);

    expect(
      arranque <= primerFinal,
      'las dos hojas van en fila y no en paralelo: la segunda empezó después de que la primera '
      + `terminara (última en arrancar ${arranque.toFixed(3)}s, primera en terminar ${primerFinal.toFixed(3)}s). `
      + 'Partir el CSS no sirve de nada si el navegador las pide una después de otra: pasa cuando '
      + 'una se descubre leyendo la otra (un `@import`) o cuando la segunda la agrega el JavaScript.',
    ).toBe(true);
  });

  test('las dos son VeryHigh, y la foto del hero sigue en High', async ({ page }) => {
    const pedidos = await cascada(page, '/');
    const { fuentes, estilos } = hojas(pedidos);
    const foto = pedidos.find((p) => p.url.includes('/img/armando/medio-cuerpo'));

    expect(foto, 'no se pidió la foto del hero').toBeTruthy();

    expect(
      [
        `fuentes: ${fuentes?.prioridad}`,
        `estilos: ${estilos?.prioridad}`,
        `foto:    ${foto?.prioridad}`,
      ],
      'las dos hojas bloquean el dibujo y van en VeryHigh; la foto del hero lleva '
      + '`fetchpriority="high"` y por eso es High y no Low. Si la de fuentes bajara de prioridad '
      + '—un `media` condicional, un `preload as="style"` mal puesto— las tipografías llegarían '
      + 'tarde y aparecería el salto de texto que el CLS de abajo persigue.',
    ).toEqual(['fuentes: VeryHigh', 'estilos: VeryHigh', 'foto:    High']);
  });

  for (const { nombre, ruta } of PAGINAS) {
    test(`el salto de texto no crece · ${nombre}`, async ({ page }) => {
      /* El observador se instala **antes** de navegar: un `layout-shift` que
         ocurre antes de que alguien lo escuche no se recupera, ni con
         `buffered`. */
      await page.addInitScript(() => {
        (window as unknown as { __cls: number }).__cls = 0;
        new PerformanceObserver((lista) => {
          for (const entrada of lista.getEntries() as (PerformanceEntry & {
            value: number; hadRecentInput: boolean;
          })[]) {
            if (!entrada.hadRecentInput) (window as unknown as { __cls: number }).__cls += entrada.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });

      await cascada(page, ruta, { estrangular: true });

      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);

      expect(
        cls,
        `el salto de texto de ${ruta} cambió (${cls}, esperado ${SALTO[nombre]}). `
        + 'Es la trampa de la orden #09: separar las fuentes puede hacer que el primer cuadro se '
        + 'pinte con la tipografía del sistema y salte al llegar la buena. Si esto se pone rojo '
        + 'hacia arriba, la orden falló aunque el LCP haya mejorado.',
      ).toBeCloseTo(SALTO[nombre], 5);
    });
  }
});
