/**
 * El núcleo del Kit de Acceso 1.3.0 es el del Kit de Seguridad 512 1.2.1 «byte a
 * byte + renombre» (Dirección, 4/10/2026). No se le cree: se prueba.
 *
 * Cada archivo del núcleo 1.3.0, con el renombre DESHECHO (`renombre.js`), tiene
 * que dar exactamente el SHA-256 que tenía en el kit 1.2.1
 * (`referencia-1.2.1/HUELLAS-1.2.1.txt`, copiado tal cual del kit congelado). Si
 * alguien toca una coma del núcleo, o el renombre se pasa de la tabla, esto falla.
 *
 * La única otra diferencia permitida es un archivo NUEVO: el título de entrada
 * (frase de marca en tres idiomas) y su test. Cualquier otro archivo nuevo en el
 * núcleo falla.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renombrar, desrenombrar } from './renombre.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const sha = (texto) => createHash('sha256').update(texto).digest('hex');
const REFERENCIA = readFileSync(join(AQUI, 'referencia-1.2.1', 'HUELLAS-1.2.1.txt'), 'utf8')
  .split('\n').filter(Boolean).map((l) => l.split(/\s{2}/))
  .map(([h, ruta]) => [ruta.replace(/^(backend|frontend)\/nucleo\//, 'nucleo/$1/'), h]);
const NUEVOS_EN_1_3_0 = ['nucleo/frontend/titulo-de-entrada.test.ts', 'nucleo/frontend/titulo-de-entrada.ts'];
const todos = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? todos(join(d, e.name)) : [join(d, e.name)]));
const EN_EL_NUCLEO = todos(join(AQUI, 'nucleo')).map((f) => relative(AQUI, f).split('\\').join('/')).sort();

describe('el núcleo 1.3.0 es el 1.2.1 más el renombre', () => {
  it('el piso: la referencia trae los 19 archivos del núcleo 1.2.1', () => {
    expect(REFERENCIA).toHaveLength(19);
  });
  it.each(REFERENCIA)('%s: sin el renombre, da la huella del 1.2.1', (ruta, huella) => {
    const actual = readFileSync(join(AQUI, ruta), 'utf8');
    expect(sha(desrenombrar(actual))).toBe(huella);
  });
  it('y el renombre se nota: ningún archivo del núcleo dice «512»', () => {
    for (const ruta of EN_EL_NUCLEO) expect(readFileSync(join(AQUI, ruta), 'utf8'), ruta).not.toMatch(/512/);
  });
  it('los únicos archivos nuevos son los del título de entrada', () => {
    const nuevos = EN_EL_NUCLEO.filter((r) => !REFERENCIA.some(([ruta]) => ruta === r));
    expect(nuevos).toEqual(NUEVOS_EN_1_3_0);
  });
});

describe('la tabla del renombre', () => {
  it('se deshace exacto', () => {
    const muestra = "import { SEGURIDAD_512 } from '../seguridad-512.config';\n * KIT DE SEGURIDAD 512 · NÚCLEO\n `scripts/check-seguridad-512.mjs` (`seguridad-512/HUELLAS.txt`) '__seguridad512_x' ConfigSeguridad512";
    expect(desrenombrar(renombrar(muestra))).toBe(muestra);
    expect(renombrar(muestra)).not.toMatch(/512/);
  });
  it('no toca el «acceso» que el núcleo ya decía', () => {
    expect(desrenombrar("throw new UnauthorizedException('Falta el token de acceso.');")).toBe("throw new UnauthorizedException('Falta el token de acceso.');");
  });
  it('las rutas de instalación pasan a /acceso/ solo fuera del núcleo', () => {
    expect(renombrar("'../src/seguridad-512/nucleo/x'", { rutas: true })).toBe("'../src/acceso/nucleo/x'");
  });
});
