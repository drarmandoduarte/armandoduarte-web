/**
 * Toda imagen publicada lleva la huella de su contenido — orden Códice #21, A.
 *
 * `/img/` se sirve `immutable` un año. Eso solo es verdad si la URL cambia
 * cuando cambia el archivo: si no, quien ya visitó la web ve la foto vieja
 * durante un año sin volver a preguntar. Pasó: el 30/9 Germán, Lucía y Armando
 * seguían viendo a la mujer meditando y al Armando que flotaba.
 *
 * Mide sobre `apps/web/dist`, que el guardián de guardianes compila antes de
 * las suites. **No reusa la expresión de `scripts/huellas.mjs`**: busca con una
 * propia y más ancha —cualquier `img/` seguido de un nombre con extensión de
 * imagen, en cualquier contexto—, para que un hueco en la de allá no sea
 * también un hueco acá.
 *
 * Qué NO mira, dicho: imágenes que no vivan bajo `img/` (los íconos de la
 * raíz —`favicon.*`, `apple-touch-icon.png`— no llevan `immutable`) y URLs
 * dentro del CSS (hoy no hay ninguna; lo afirma el piso de abajo).
 */
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const IMAGEN = /img\/[A-Za-z0-9_\-/.]+?\.(?:webp|png|jpe?g|svg|avif|gif)(\?v=([0-9a-f]*))?/g;

const paginas = readdirSync(DIST).filter((n) => n.endsWith('.html'));
const huella = (ruta: string) =>
  createHash('sha256').update(readFileSync(join(DIST, ruta))).digest('hex').slice(0, 8);

const encontradas = paginas.flatMap((pagina) =>
  [...readFileSync(join(DIST, pagina), 'utf8').matchAll(IMAGEN)].map((m) => ({
    pagina,
    ruta: m[0].replace(/\?v=.*$/, ''),
    v: m[2],
  })),
);

describe('las imágenes llevan su huella', () => {
  it('EL PISO, primero: el barrido vio las cuatro páginas y las imágenes de las dos que tienen', () => {
    /* Medido el 30/9: 20 URLs en `/` y 31 en `/merida`. Un «cero sin huella»
       sobre un `dist/` vacío o una expresión rota sería igual de verde. */
    expect(paginas.sort()).toEqual(['index.html', 'merida.html', 'privacidad.html', 'terminos.html']);
    expect(encontradas.filter((x) => x.pagina === 'index.html').length).toBeGreaterThanOrEqual(15);
    expect(encontradas.filter((x) => x.pagina === 'merida.html').length).toBeGreaterThanOrEqual(25);
    const css = readdirSync(join(DIST, 'assets')).filter((n) => n.endsWith('.css'));
    for (const c of css) expect(readFileSync(join(DIST, 'assets', c), 'utf8'), c).not.toMatch(/img\//);
  });

  it('EL CASO: ninguna URL de imagen sale sin `?v=`', () => {
    const sinHuella = encontradas.filter((x) => x.v === undefined).map((x) => `${x.pagina}: ${x.ruta}`);
    expect(sinHuella, 'sin `?v=`, un archivo reemplazado no le llega a quien ya tenía el viejo').toEqual([]);
  });

  it('y la huella es la del archivo que se publica: si el archivo cambió, cae', () => {
    const malas = encontradas
      .filter((x) => x.v !== undefined)
      .filter((x) => !existsSync(join(DIST, x.ruta)) || x.v !== huella(x.ruta))
      .map((x) => `${x.pagina}: ${x.ruta}?v=${x.v}${existsSync(join(DIST, x.ruta)) ? ` (el archivo da ${huella(x.ruta)})` : ' (no existe)'}`);
    expect(malas).toEqual([]);
  });

  it('la miniatura al compartir también: cada og:image con huella (y twitter:image si la hubiera)', () => {
    /* Hoy no hay `twitter:image`: X cae a `og:image`. Si un día se agrega,
       entra en esta misma comprobación sin tocarla. */
    const vistas: string[] = [];
    for (const pagina of ['index.html', 'merida.html']) {
      const html = readFileSync(join(DIST, pagina), 'utf8');
      for (const m of html.matchAll(/(?:property|name)="(?:og:image|twitter:image)" content="([^"]+)"/g)) {
        vistas.push(m[1]);
        expect(m[1], pagina).toMatch(/^https:\/\/armandoduarte\.com\/img\/.+\?v=[0-9a-f]{8}$/);
      }
    }
    /* Piso: una en `/` y dos en `/merida` (la apaisada y la cuadrada). */
    expect(vistas.length).toBeGreaterThanOrEqual(3);
  });
});
