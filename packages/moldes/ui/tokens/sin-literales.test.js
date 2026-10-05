/**
 * Ningún componente trae un color, una fuente ni un radio propio (spec Kit UI §A.2).
 *
 * Todo lo que es marca entra por `design.json` → variables CSS. Si un componente
 * escribe un hex, ese color no cambia con la app y el molde deja de pintarse
 * solo. Lo mismo un nombre de fuente o un radio en píxeles.
 *
 * Mira `components/**` sin comentarios (la prosa puede citar un hex para
 * explicar por qué no está). No mira `tokens/`: ahí viven los valores del molde
 * que no cambian por app (espaciado, escala, sombras), que es su lugar.
 *
 * Un radio es `var(--radius-*)` o `0`, nunca un número de píxeles.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { soloCodigoPorRenglon } from '../herramientas/soloCodigo.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const COMPONENTES = join(AQUI, '..', 'components');
const PANTALLAS = ['ajustes', 'inicio', 'app-shell', 'bienvenida'];

function fuentes(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.name === 'node_modules') return [];
    if (e.isDirectory()) return fuentes(ruta, base);
    if (!/\.(jsx|js)$/.test(e.name) || /\.test\.js$/.test(e.name)) return [];
    return [[relative(base, ruta), soloCodigoPorRenglon(readFileSync(ruta, 'utf8'))]];
  });
}
// El kit y los paquetes de pantalla: ninguno trae marca propia.
const ARCHIVOS = [
  ...fuentes(COMPONENTES),
  ...PANTALLAS.flatMap((p) => fuentes(join(AQUI, '..', '..', p)).map(([n, f]) => [`${p}/${n}`, f])),
];

const REGLAS = [
  ['un hex', /#[0-9A-Fa-f]{3,8}\b/],
  ['un rgb()/hsl() escrito a mano', /\b(rgba?|hsla?)\(/],
  ['un nombre de fuente', /(font-?family|fontFamily)\s*:\s*['"](?!var\()/],
  ['un radio en píxeles', /(border-?radius|borderRadius|border(Top|Bottom)(Left|Right)Radius)\s*:\s*['"]?\d+(\.\d+)?px/],
  ['un radio numérico', /(borderRadius|border(Top|Bottom)(Left|Right)Radius)\s*:\s*[1-9]\d*\s*[,}]/],
];

describe('el piso', () => {
  it('se leyeron los componentes', () => expect(ARCHIVOS.length).toBeGreaterThan(40));
  it('las reglas ven lo que dicen ver', () => {
    expect(REGLAS[0][1].test("color: '#3D5A40'")).toBe(true);
    expect(REGLAS[1][1].test("background: 'rgb(0 0 0)'")).toBe(true);
    expect(REGLAS[2][1].test("fontFamily: 'Outfit'")).toBe(true);
    expect(REGLAS[2][1].test("fontFamily: 'var(--font-ui)'")).toBe(false);
    expect(REGLAS[3][1].test("borderRadius: '12px'")).toBe(true);
    expect(REGLAS[4][1].test('borderRadius: 4,')).toBe(true);
    expect(REGLAS[4][1].test('borderRadius: 0,')).toBe(false);
  });
});

describe('ningún componente trae marca propia', () => {
  it.each(REGLAS)('ningún componente escribe %s', (que, patron) => {
    const hallados = [];
    for (const [archivo, fuente] of ARCHIVOS) {
      fuente.split('\n').forEach((renglon, i) => {
        if (patron.test(renglon)) hallados.push(`${archivo}:${i + 1}  ${renglon.trim().slice(0, 100)}`);
      });
    }
    expect(hallados, `${que}:\n  ${hallados.join('\n  ')}`).toEqual([]);
  });
});
