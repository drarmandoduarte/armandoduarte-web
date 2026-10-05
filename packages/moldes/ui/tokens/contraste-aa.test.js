/**
 * Todo lo que lleva letra se lee — AA (4,5:1) medido, en los dos temas, para
 * cada `design.json` de muestra.
 *
 * Lo que se mide, en tres grupos:
 *   1. La tinta y sus dos escalones contra las dos superficies, y ordenados.
 *   2. Lo que se escribe encima de un relleno (`--on-*` sobre su color).
 *   3. La letra de cada color de estado contra las dos superficies y contra su
 *      propio suave (el chip): es lo que el resolver promete al derivar el
 *      escalón de letra, y acá se comprueba sin creerle.
 *
 * Qué NO se mide: puntos, barras y bordes (no son texto, su umbral no es 4,5),
 * ni ninguna pantalla.
 */
import { describe, expect, it } from 'vitest';
import { razonDeContraste } from '../../design/contraste.js';
import { DISENOS, TEMAS, resolvedorDe } from './medir.js';

const AA = 4.5;
const CASOS = DISENOS.flatMap(([nombre, design]) => TEMAS.map((tema) => [nombre, tema, resolvedorDe(design)]));

describe('el piso: hay paletas, y resuelven a hex', () => {
  it('hay al menos tres design.json para medir', () => {
    expect(DISENOS.length).toBeGreaterThanOrEqual(3);
  });
  it.each(CASOS)('%s · %s: el fondo, el papel y la tinta resuelven, y el tema cambia', (nombre, tema, res) => {
    for (const t of ['--bg', '--surface', '--text']) expect(res.hex(tema, t), `${nombre} ${tema} ${t}`).toMatch(/^#[0-9A-F]{6}$/);
    expect(res.hex('claro', '--bg')).not.toBe(res.hex('oscuro', '--bg'));
  });
});

describe('la tinta se lee sobre los dos papeles, y sus tres escalones están ordenados', () => {
  it.each(CASOS)('%s · %s', (nombre, tema, res) => {
    for (const tinta of ['--text', '--text-2', '--text-3']) {
      for (const papel of ['--bg', '--surface']) {
        const r = razonDeContraste(res.hex(tema, tinta), res.hex(tema, papel));
        expect(r, `${nombre} ${tema} · ${tinta} sobre ${papel}: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA);
      }
    }
    const contra = (t) => razonDeContraste(res.hex(tema, t), res.hex(tema, '--bg'));
    expect(contra('--text')).toBeGreaterThan(contra('--text-2'));
    expect(contra('--text-2')).toBeGreaterThan(contra('--text-3'));
  });
});

describe('lo que se escribe encima de un relleno se lee', () => {
  const PARES = [['--on-primary', '--primary'], ['--on-danger', '--danger']];
  it.each(CASOS)('%s · %s', (nombre, tema, res) => {
    for (const [tinta, fondo] of PARES) {
      const r = razonDeContraste(res.hex(tema, tinta), res.hex(tema, fondo));
      expect(r, `${nombre} ${tema} · ${tinta} sobre ${fondo}: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe('la letra de cada color de estado se lee donde cae', () => {
  const LETRAS = [
    ['--primary-text', '--primary-soft-2'],
    ['--warning-text', '--warning-soft-2'],
    ['--danger-text', '--danger-soft'],
    ['--info-text', '--info-soft-2'],
    ['--success-text', null],
  ];
  it.each(CASOS)('%s · %s', (nombre, tema, res) => {
    for (const [letra, chip] of LETRAS) {
      for (const papel of ['--bg', '--surface', ...(chip ? [chip] : [])]) {
        const r = razonDeContraste(res.hex(tema, letra), res.hex(tema, papel));
        expect(r, `${nombre} ${tema} · ${letra} sobre ${papel}: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA);
      }
    }
  });
});
