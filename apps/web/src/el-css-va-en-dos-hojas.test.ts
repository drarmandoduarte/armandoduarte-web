/**
 * El CSS se publica en **dos** hojas, y cada una trae lo suyo — orden Códice #09.
 *
 * ── Por qué existe este archivo, que es la parte que importa ──────────────
 * Porque la mutación de la orden **no tiraba nada**. Se devolvió el
 * `@import "./fuentes/fonts.css"` a `packages/ui/styles.css` —el renglón que
 * esta orden sacó, o sea el modo exacto en que la decisión se deshace— y el
 * build salió **verde**: el prerender seguía viendo dos hojas, el guardián de
 * fidelidad seguía viendo dos `<link>`, las capturas no se movían.
 *
 * Y sin embargo la web quedaba peor que antes de la orden: los ocho
 * `@font-face` viajaban **dos veces**, una en cada hoja, y cada visitante bajaba
 * 2,7 KB de más en la única cosa que bloquea el dibujo. Un defecto que no rompe
 * nada es un defecto que vive meses — es la misma lección de la #06 y de la #08,
 * y la orden mandaba escribir la comprobación en ese caso.
 *
 * Lo que este archivo vigila no es «hay dos archivos»: eso ya lo exige el
 * prerender y se cae el build. Es **qué hay adentro de cada uno**, que es la
 * decisión de verdad: lo que casi nunca cambia, separado de lo que cambia
 * siempre.
 *
 * ── Por qué mira `dist/` y no el código ───────────────────────────────────
 * Mismo criterio que `el-html-no-carga-react`: el config se puede leer de diez
 * maneras y el `dist/` de una sola. Se mide la salida, no la intención. Cuesta
 * leer tres archivos.
 *
 * ── El piso, primero ─────────────────────────────────────────────────────
 * «Ningún `@font-face` en la hoja de estilos» es verdad sobre un archivo vacío,
 * sobre un archivo que no existe y sobre un glob roto. Así que antes de los dos
 * ceros va lo que el barrido **sí** encontró: las dos hojas, con bytes, y los
 * ocho `@font-face` del lado que los tiene que tener.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUTAS } from './rutas';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const ASSETS = join(DIST, 'assets');

/**
 * Los ocho `@font-face` de `packages/ui/fuentes/fonts.css`: tres familias, y
 * `latin` + `latin-ext` de cada peso. Va como igualdad y no como «al menos»
 * porque los dos lados son defectos: siete significa que se perdió un subconjunto
 * —y con él los acentos o los símbolos de una familia entera—, y nueve, que
 * alguien agregó una tipografía sin pasar por dirección.
 */
const CUANTOS_FONT_FACE = 8;

/** El piso de bytes de cada hoja, medido: fuentes 2,7 KB · estilos 28,6 KB. */
const PISO_FUENTES = 1024;
const PISO_ESTILOS = 8192;

const archivosCss = existsSync(ASSETS)
  ? readdirSync(ASSETS).filter((n) => n.endsWith('.css'))
  : [];

const leer = (nombre: string | undefined) =>
  (nombre ? readFileSync(join(ASSETS, nombre), 'utf8') : '');

const nombreFuentes = archivosCss.find((n) => n.startsWith('fuentes-'));
const nombreEstilos = archivosCss.find((n) => n !== nombreFuentes);

const hojaFuentes = leer(nombreFuentes);
const hojaEstilos = leer(nombreEstilos);

/**
 * Cuántas veces aparece `@font-face` en un texto.
 *
 * Se cuenta la at-rule con el `@` pegado, no la palabra: la hoja tiene
 * `font-family` y `font-feature-settings` por todos lados, y un `includes`
 * flojo daría positivo con cualquiera de las dos.
 */
const cuentaFontFace = (css: string) => (css.match(/@font-face/g) ?? []).length;

const paginas = RUTAS.map(({ archivo }) => {
  const ruta = join(DIST, archivo);
  return { archivo, html: existsSync(ruta) ? readFileSync(ruta, 'utf8') : '' };
});

/** Los `href` de los `<link rel="stylesheet">`, en el orden del documento. */
const hojasDe = (html: string) =>
  [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]*)"[^>]*>/g)]
    .map((m) => m[1].replace(/-[A-Za-z0-9_-]{8}\.css$/, '-<hash>.css'));

describe('el CSS publicado', () => {
  it('piso · las dos hojas están, pesan, y los ocho @font-face están en la de fuentes', () => {
    expect(
      archivosCss.length,
      `en ${ASSETS} hay ${archivosCss.length} hoja(s) de estilo y esperaba dos `
      + `(${archivosCss.join(', ') || 'ninguna'}). O no se compiló `
      + '(`pnpm --filter @codice/web build`), o el build volvió a fusionarlas.',
    ).toBe(2);

    expect(
      [
        `fuentes: ${Buffer.byteLength(hojaFuentes, 'utf8')} bytes`,
        `estilos: ${Buffer.byteLength(hojaEstilos, 'utf8')} bytes`,
      ],
      'una hoja vacía enlaza bien y no aplica nada: las dos afirmaciones de abajo pasarían.',
    ).toEqual([
      expect.stringMatching(/^fuentes: \d+ bytes$/),
      expect.stringMatching(/^estilos: \d+ bytes$/),
    ]);

    expect(Buffer.byteLength(hojaFuentes, 'utf8')).toBeGreaterThan(PISO_FUENTES);
    expect(Buffer.byteLength(hojaEstilos, 'utf8')).toBeGreaterThan(PISO_ESTILOS);

    /* Y lo que el barrido SÍ encontró, que es lo que le da sentido al cero de
       la afirmación (1): los ocho `@font-face`, del lado que los lleva. */
    expect(
      cuentaFontFace(hojaFuentes),
      `la hoja de fuentes declara ${cuentaFontFace(hojaFuentes)} @font-face y son ${CUANTOS_FONT_FACE}: `
      + 'tres familias, latin y latin-ext de cada peso. De menos, la web pierde los acentos de una '
      + 'familia; de más, entró una tipografía que nadie decidió.',
    ).toBe(CUANTOS_FONT_FACE);
  });

  it('(1) la hoja de estilos no declara ni un @font-face', () => {
    expect(
      cuentaFontFace(hojaEstilos),
      'los @font-face volvieron a la hoja de estilos —el `@import` de vuelta en `packages/ui/styles.css`, '
      + 'o un import de más en `entrada-navegador.ts`— y ahora viajan dos veces, una en cada hoja. '
      + 'La orden #09 los separó para que una orden que toca un color no invalide la caché de las fuentes.',
    ).toBe(0);
  });

  it('(2) la hoja de fuentes no trae tokens ni reglas de la web', () => {
    /* El espejo de (1), y no sobra: la división se puede deshacer para los dos
       lados. Se buscan los tokens —que son de `codice-tokens.css`— y una regla
       cualquiera de la web, porque una hoja de fuentes con estilos adentro
       cambiaría en cada orden, que es exactamente lo que no tiene que hacer. */
    const intrusos = [
      ...(hojaFuentes.includes('--crema') ? ['tokens (--crema)'] : []),
      ...(hojaFuentes.includes('.hd') ? ['reglas de la web (.hd)'] : []),
    ];

    expect(
      intrusos,
      'la hoja de fuentes tiene adentro algo que cambia seguido. Entonces deja de cachearse: '
      + 'cada orden que toque un color le cambia el hash y el visitante vuelve a bajar las fuentes.',
    ).toEqual([]);
  });

  it('(3) las cuatro páginas enlazan las dos, y la de fuentes primero', () => {
    /* Esto también lo mira `e2e/dos-hojas.spec.ts`, y las dos hacen falta: ésta
       lee el **archivo** —barata, sin Chromium, y es la que corre primero—, y
       aquélla lee el **DOM ya cargado**, que es donde se vería una tercera hoja
       que agregara el JavaScript y que en el archivo no está escrita. */
    expect(
      paginas.map((p) => `${p.archivo}: ${hojasDe(p.html).join(' · ')}`),
      'dos hojas por página y en este orden. Un `@font-face` tiene que estar declarado cuando se '
      + 'aplica la regla que lo usa: al revés, el navegador pinta el primer cuadro con la tipografía '
      + 'del sistema y la cambia al llegar la buena.',
    ).toEqual(paginas.map((p) =>
      `${p.archivo}: /assets/fuentes-<hash>.css · /assets/style-<hash>.css`));
  });
});
