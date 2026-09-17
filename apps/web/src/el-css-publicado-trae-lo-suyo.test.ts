/**
 * La hoja que se publica trae las fuentes y los tokens — rescate de la #09.
 *
 * ── De dónde sale este archivo ────────────────────────────────────────────
 * La orden #09 iba a partir el CSS en dos hojas. **Se midió y no convenía**, y
 * la división no entró (el porqué, con los números, está en
 * `docs/informes/09/LEEME.md` y en `docs/tareas.md` § 5b). Lo que sí entra es
 * esto, porque el hallazgo que lo motivó **no dependía** de que la división se
 * hiciera:
 *
 * Trabajando la #09 se rompió a propósito la cadena de `@import` de
 * `packages/ui/styles.css` —que es de donde salen los `@font-face` y los
 * tokens— y **el build salió verde**. Nada en el repo miraba qué hay adentro de
 * la hoja que se publica. Se habría visto en las capturas del guardián de
 * fidelidad, sí, pero como un rojo de píxeles que no dice la causa: doce
 * comprobaciones en rojo y alguien buscando media hora de dónde salió.
 *
 * Este archivo lo dice en una línea y antes de levantar Chromium.
 *
 * ── Qué vigila, y por qué esas tres cosas ────────────────────────────────
 * La hoja publicada es la suma de tres orígenes que viajan por un `@import` o
 * un `import` cada uno, y cada uno puede desaparecer solo:
 *
 *   · los ocho `@font-face` (`packages/ui/fuentes/fonts.css`),
 *   · los tokens (`packages/ui/codice-tokens.css`),
 *   · el CSS de la web (`apps/web/src/index.css`).
 *
 * ── Por qué mira `dist/` y no el código ───────────────────────────────────
 * Mismo criterio que `el-html-no-carga-react`: el config se puede leer de diez
 * maneras y el `dist/` de una sola. Se mide la salida, no la intención.
 *
 * ── El piso, primero ─────────────────────────────────────────────────────
 * «La hoja trae los ocho `@font-face`» sobre un archivo que no existe, o sobre
 * `dist/` sin compilar, es falso de una manera y cierto de otra según cómo se
 * escriba. Así que antes va que la hoja esté y pese.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUTAS } from './rutas';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const ASSETS = join(DIST, 'assets');

/**
 * Los ocho `@font-face`: tres familias, y `latin` + `latin-ext` de cada peso.
 *
 * Va como **igualdad** y no como «al menos», porque los dos lados son defectos:
 * siete significa que se perdió un subconjunto —y con él los acentos o los
 * símbolos de una familia entera— y nueve, que entró una tipografía que nadie
 * decidió.
 *
 * Y un detalle medido que conviene tener escrito: son ocho `@font-face` pero
 * **seis** archivos en `dist/fuentes/`. `OpenSans-600-latin.woff2` y
 * `OpenSans-400-latin.woff2` son el mismo archivo byte por byte —Open Sans es
 * variable— y Vite lo nota y emite uno solo para los dos. El sitio estático de
 * `qa/referencia/` trae los ocho y baja 73 KB de más.
 */
const CUANTOS_FONT_FACE = 8;

/** Medido: la hoja publicada pesa ~31 KB. El piso caza una hoja mutilada. */
const PISO_DE_BYTES = 8192;

const archivosCss = existsSync(ASSETS)
  ? readdirSync(ASSETS).filter((n) => n.endsWith('.css'))
  : [];
const hoja = archivosCss.length === 1 ? readFileSync(join(ASSETS, archivosCss[0]), 'utf8') : '';

/**
 * Cuántas veces aparece la at-rule `@font-face`.
 *
 * Se cuenta con el `@` pegado y no la palabra suelta: la hoja tiene
 * `font-family` y `font-feature-settings` por todos lados, y un `includes`
 * flojo daría positivo con cualquiera de las dos.
 */
const cuentaFontFace = (css: string) => (css.match(/@font-face/g) ?? []).length;

const paginas = RUTAS.map(({ archivo }) => {
  const ruta = join(DIST, archivo);
  return { archivo, html: existsSync(ruta) ? readFileSync(ruta, 'utf8') : '' };
});

/** Los `href` de los `<link rel="stylesheet">`, en orden, con el hash normalizado. */
const hojasDe = (html: string) =>
  [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]*)"[^>]*>/g)]
    .map((m) => m[1].replace(/-[A-Za-z0-9_-]{8}\.css$/, '-<hash>.css'));

describe('el CSS publicado', () => {
  it('piso · hay una sola hoja en dist/assets y pesa', () => {
    expect(
      archivosCss,
      `en ${ASSETS} esperaba exactamente una hoja de estilo. Si no hay ninguna, no se compiló `
      + '(`pnpm --filter @codice/web build`); si hay dos, alguien partió el CSS — y eso es una '
      + 'decisión de dirección con su medición al lado: ver `docs/tareas.md` § 5b.',
    ).toHaveLength(1);

    expect(
      Buffer.byteLength(hoja, 'utf8'),
      'una hoja vacía o mutilada enlaza bien y no aplica nada: las tres afirmaciones de abajo '
      + 'pasarían sin haber mirado un solo byte',
    ).toBeGreaterThan(PISO_DE_BYTES);
  });

  it('(1) trae los ocho @font-face', () => {
    expect(
      cuentaFontFace(hoja),
      'la hoja publicada no declara las ocho tipografías. Se rompe solo: son un `@import` dentro de '
      + 'otro `@import` (`packages/ui/styles.css` → `fuentes/fonts.css`), y si esa cadena se corta '
      + 'la web se dibuja entera con la tipografía del sistema. Se vería en las capturas de '
      + 'fidelidad, pero como un rojo de píxeles que no dice la causa.',
    ).toBe(CUANTOS_FONT_FACE);
  });

  it('(2) trae los tokens DEFINIDOS, y el CSS de la web', () => {
    /* ── Los dos puntos, y el que costó una mutación ──────────────────────
       Un par de testigos de cada origen, y no uno: un solo testigo por archivo
       puede sobrevivir a que el resto se pierda —un `@import` a medias, un
       `postcss` que descarta un bloque— y el test seguiría en verde.

       Y los tokens se buscan **con los dos puntos** (`--crema:`), que es como
       se escribe una **definición**. La primera versión de este test buscaba
       `--crema` a secas y **pasó en verde con el `@import` de los tokens
       cortado**: `var(--crema)` contiene esa cadena, así que el test estaba
       encontrando el **uso** en `index.css` y dando por presente el archivo que
       ya no estaba. Lo destapó la mutación R2, y es el mismo modo de falso
       verde que el guardián que lee la prosa como si fuera código. */
    const faltan = [
      ...(hoja.includes('--crema:') ? [] : ['tokens: --crema definido']),
      ...(hoja.includes('--teal:') ? [] : ['tokens: --teal definido']),
      ...(hoja.includes('.hd') ? [] : ['web: .hd (la cabecera)']),
      ...(hoja.includes('.hero') ? [] : ['web: .hero']),
    ];
    expect(
      faltan,
      'la hoja publicada perdió uno de sus tres orígenes. Son tres archivos que llegan por un '
      + '`@import` o un `import` cada uno, y cada uno puede desaparecer sin que nada más se queje.',
    ).toEqual([]);
  });

  it('(3) las cuatro páginas la enlazan, y enlazan sólo esa', () => {
    expect(
      paginas.map((p) => `${p.archivo}: ${hojasDe(p.html).join(' · ')}`),
      'cada página enlaza una hoja y es la misma. Una página sin `<link>` se dibuja sin estilos; '
      + 'dos `<link>` significan que el CSS se partió, que es la decisión que la #09 midió y '
      + 'dirección no tomó.',
    ).toEqual(paginas.map((p) => `${p.archivo}: /assets/style-<hash>.css`));
  });
});
