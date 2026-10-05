/**
 * Toda clave que usa una pantalla del molde existe en los archivos de idioma.
 *
 * Una clave mal escrita no rompe nada: `t()` devuelve la llave y la persona ve
 * «inicio.widget.hoyy» en pantalla. Este barrido lee las claves literales del
 * código de todos los paquetes de pantalla —`t('…')`, `fila(t, '…')` (con su
 * `.d`), `clave="…"` y `clave: '…'` de los catálogos— y exige que estén en
 * `es.json` (y, por la paridad de `idiomas.test.js`, en los otros dos).
 *
 * Qué NO ve: las claves armadas con variables (`t(\`alertas.${c}\`)`). Esas las
 * cubre cada paquete en sus propios tests.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TEXTOS } from './t.js';

const PAQUETES = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAICES = ['ui/components', 'ajustes', 'inicio', 'app-shell', 'bienvenida'];
const fuentes = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const r = join(d, e.name);
  if (e.name === 'node_modules') return [];
  if (e.isDirectory()) return fuentes(r);
  return /\.(jsx|js)$/.test(e.name) && !e.name.includes('.test.') ? [r] : [];
});
const ARCHIVOS = RAICES.flatMap((r) => fuentes(join(PAQUETES, r)).map((f) => [relative(PAQUETES, f), readFileSync(f, 'utf8')]));

const PATRONES = [
  [/\bt\(\s*'([a-zA-Z0-9.]+)'/g, false],
  [/fila\(t,\s*'([a-zA-Z0-9.]+)'\)/g, true],
  [/clave="([a-zA-Z0-9.]+)"/g, true],
  [/\bclave:\s*'([a-zA-Z0-9.]+)'/g, false],
];
const USADAS = ARCHIVOS.flatMap(([n, f]) => PATRONES.flatMap(([re, conD]) => [...f.matchAll(re)].flatMap((m) => {
  const c = m[1];
  return (conD ? [c, `${c}.d`] : [c]).map((x) => [n, x]);
})));

describe('las claves del molde existen', () => {
  it('el piso: se leyeron claves de cada paquete', () => {
    for (const r of ['ajustes', 'inicio', 'app-shell', 'bienvenida']) {
      expect(USADAS.some(([n]) => n.startsWith(`${r}/`)), r).toBe(true);
    }
  });
  it('toda clave literal está en es.json', () => {
    const faltan = USADAS.filter(([, c]) => !(c in TEXTOS.es)).map(([n, c]) => `${n}: ${c}`);
    expect([...new Set(faltan)]).toEqual([]);
  });
});
