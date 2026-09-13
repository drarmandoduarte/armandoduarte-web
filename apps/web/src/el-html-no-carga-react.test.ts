/**
 * El HTML que se publica **no carga React** — orden Códice #02, A.
 *
 * ── Qué defecto persigue ──────────────────────────────────────────────────
 * El de esta orden, exactamente: que el bundle vuelva. No haría ruido —la web se
 * vería igual, el guardián de fidelidad seguiría en verde, los tests pasarían—
 * y costaría los mismos 17 puntos de Lighthouse móvil que la orden #01 midió:
 * 354 KB bajando para no ejecutar nada. Un defecto que no rompe nada es un
 * defecto que vive meses.
 *
 * Puede volver de tres maneras, y las tres terminan igual: `index.html` de vuelta
 * como entrada del build, un `import` de React que se cuele en
 * `entrada-navegador.ts`, o alguien que agregue un segundo `<script>` a la
 * plantilla. Este test no mira el config: mira **el HTML que se publica**, que es
 * lo único que le llega al navegador de Armando.
 *
 * ── Por qué mira `dist/` y no el código ───────────────────────────────────
 * Porque el config se puede leer de diez maneras y el `dist/` de una sola. Es el
 * mismo criterio del guardián de fidelidad: se mide la salida, no la intención.
 * Lo hace barato —lee cuatro archivos— mientras que el de navegador levanta
 * Chromium.
 *
 * ── El piso, primero ─────────────────────────────────────────────────────
 * «Ningún script de React» sobre un archivo que no existe, o que salió vacío, es
 * verdad y no dice nada. Así que antes de las dos afirmaciones va que las cuatro
 * páginas están, pesan y traen un `<h1>`. `pnpm test` compila antes de correr las
 * suites justamente para que esto mida el `dist/` de esta corrida y no el de la
 * anterior.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUTAS } from './rutas';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

/**
 * El piso de bytes, medido y no elegido.
 *
 * Las cuatro páginas de esta corrida pesan **14,3 · 17,5 · 7,3 · 6,2 KB**; la
 * más chica es `terminos.html`, que es corta porque el texto es corto. Un render
 * vacío pesaría poco más de 1 KB —la plantilla y el `<head>`—, así que 4 KB lo
 * caza con margen y deja respirar a la página más corta.
 *
 * La orden #02 escribió 8 KB. Ese número habría salido **rojo el primer día** en
 * las dos legales, que nunca pesaron tanto: se informa el cambio con la medición
 * al lado, que es como esta casa mueve un piso en cualquiera de las dos
 * direcciones.
 */
const PISO_DE_BYTES = 4096;

/** Todos los `<script>` con `src`, con el atributo entero para poder mirarlo. */
const scriptsDe = (html: string) => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]*)"[^>]*>/g)]
  .map((m) => ({ etiqueta: m[0], src: m[1] }));

const paginas = RUTAS.map(({ archivo }) => {
  const ruta = join(DIST, archivo);
  return { archivo, ruta, html: existsSync(ruta) ? readFileSync(ruta, 'utf8') : '' };
});

describe('el HTML publicado', () => {
  it('piso · las cuatro páginas están, pesan y traen un <h1>', () => {
    const flacas = paginas.filter((p) => Buffer.byteLength(p.html, 'utf8') < PISO_DE_BYTES);
    expect(
      flacas.map((p) => `${p.archivo}: ${Buffer.byteLength(p.html, 'utf8')} bytes`),
      `estas páginas no llegan al piso de ${PISO_DE_BYTES} bytes en ${DIST}. `
      + 'O no se compiló (`pnpm --filter @codice/web build`), o el render salió vacío: '
      + 'un archivo mudo pasa todas las afirmaciones de abajo.',
    ).toEqual([]);

    expect(
      paginas.filter((p) => !p.html.includes('<h1')).map((p) => p.archivo),
      'una página sin <h1> no es una página dibujada',
    ).toEqual([]);
  });

  it('(1) no hay ningún script de `assets/` que no sea el del comportamiento', () => {
    const intrusos = paginas.flatMap((p) => scriptsDe(p.html)
      .filter((s) => s.src.includes('assets/') && !s.src.includes('/comportamiento-'))
      .map((s) => `${p.archivo}: ${s.etiqueta}`));

    expect(
      intrusos,
      'la web pública no se hidrata: el único JavaScript que baja son los tres comportamientos. '
      + 'Un segundo archivo de `assets/` es el bundle de React de vuelta —354 KB y 17 puntos de '
      + 'Lighthouse móvil— sin que nada se vea distinto.',
    ).toEqual([]);
  });

  it('(2) hay exactamente un <script defer> del comportamiento por página', () => {
    const cuenta = paginas.map((p) => {
      const suyos = scriptsDe(p.html).filter((s) => s.src.includes('/comportamiento-'));
      const diferidos = suyos.filter((s) => /\bdefer\b/.test(s.etiqueta));
      return `${p.archivo}: ${suyos.length} script(s), ${diferidos.length} con defer`;
    });

    expect(
      cuenta,
      'uno y diferido: dos lo cargarían dos veces —y los `addEventListener` se duplicarían—, '
      + 'y sin `defer` correría antes de que exista el `#hd` que va a buscar',
    ).toEqual(paginas.map((p) => `${p.archivo}: 1 script(s), 1 con defer`));
  });

  it('(3) tampoco quedó un `modulepreload` del bundle', () => {
    /* El `modulepreload` es la otra mitad del `<script type="module">`: precarga
       el chunk aunque el `<script>` ya no esté. Lo pide la orden por nombre, y
       se mira aparte porque no es un `<script>` y la afirmación (1) no lo vería. */
    expect(
      paginas.filter((p) => p.html.includes('modulepreload')).map((p) => p.archivo),
      'un `modulepreload` baja el bundle igual, sin ejecutarlo: el costo de esta orden era el de bajarlo',
    ).toEqual([]);
  });
});
