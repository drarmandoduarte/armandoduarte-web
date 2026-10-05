/**
 * `--accent` no vuelve.
 *
 * Se llamaba `--accent` el color que AVISA, y el `design.json` llama `acento` al
 * color de la marca, que es el que ACTÚA (`--primary`). Dos palabras iguales
 * para dos colores distintos: alguien iba a pintar un botón de «acento» con el
 * ámbar del aviso. En el PR 2 se renombró a `--warning`; esto lo sostiene.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const UI = join(dirname(fileURLToPath(import.meta.url)), '..');
const YO = fileURLToPath(import.meta.url);
const todos = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const r = join(d, e.name);
  if (e.name === 'node_modules') return [];
  return e.isDirectory() ? todos(r) : (/\.(css|jsx?|ts|md)$/.test(e.name) && r !== YO ? [r] : []);
});
const ARCHIVOS = todos(UI);
const VIEJO = /--(on-)?accent\b/;

describe('el aviso se llama --warning', () => {
  it('el piso: se leen los tokens y los componentes, y --warning existe', () => {
    expect(ARCHIVOS.length).toBeGreaterThan(100);
    expect(readFileSync(join(UI, 'tokens', 'semantic.css'), 'utf8')).toMatch(/--warning:var\(--c-aviso\)/);
    expect(VIEJO.test('var(--accent-text)')).toBe(true);
    expect(VIEJO.test('var(--primary)')).toBe(false);
  });
  it('ningún archivo de @moldes/ui nombra --accent', () => {
    const hallados = ARCHIVOS.flatMap((f) => readFileSync(f, 'utf8').split('\n')
      .map((l, i) => (VIEJO.test(l) ? `${relative(UI, f)}:${i + 1}  ${l.trim().slice(0, 80)}` : null)).filter(Boolean));
    expect(hallados, hallados.join('\n')).toEqual([]);
  });
});
