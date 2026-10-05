/**
 * Toda variable que se usa, existe — el espejo entre `design.json`, los tokens y
 * los componentes.
 *
 * Un `var(--x)` sin declarar no falla: el navegador usa el valor inicial (o el
 * respaldo) en silencio, y el componente sale sin color o sin radio. Este test
 * junta lo que declaran `tokens/*.css` y lo que escribe el resolver de
 * `@moldes/design`, y exige que cada `var(--…)` de los componentes y de los tokens
 * esté ahí. Y al revés, que los tokens no pidan al `design.json` nada que el
 * resolver no escriba.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aVariables } from '../../design/resolver.js';
import { DISENOS } from './medir.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const HOJAS = readdirSync(AQUI).filter((n) => n.endsWith('.css')).map((n) => sinComentarios(readFileSync(join(AQUI, n), 'utf8')));

function todos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return todos(ruta);
    return /\.(jsx|js)$/.test(e.name) && !e.name.endsWith('.test.js') ? [readFileSync(ruta, 'utf8')] : [];
  });
}
const COMPONENTES = todos(join(AQUI, '..', 'components'));

const declaradas = new Set(HOJAS.flatMap((css) => [...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1])));
const DEL_RESOLVER = new Set(DISENOS.flatMap(([, d]) => {
  const v = aVariables(d);
  return [...Object.keys(v.claro), ...Object.keys(v.oscuro), ...Object.keys(v.comunes)];
}));
/* Las que un componente se pone a sí mismo en línea (`style={{'--x': …}}`). */
const PROPIAS = new Set(COMPONENTES.flatMap((f) => [...f.matchAll(/['"](--[a-z0-9-]+)['"]\s*:/g)].map((m) => m[1])));

const usadas = (textos) => new Set(textos.flatMap((t) => [...t.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1])));

describe('el espejo', () => {
  it('el piso: hay declaradas, hay del resolver, hay usadas', () => {
    expect(declaradas.size).toBeGreaterThan(100);
    expect(DEL_RESOLVER.size).toBeGreaterThan(20);
    expect(usadas(COMPONENTES).size).toBeGreaterThan(60);
  });

  it('todo var() de los componentes está declarado', () => {
    const faltan = [...usadas(COMPONENTES)].filter((v) => !declaradas.has(v) && !DEL_RESOLVER.has(v) && !PROPIAS.has(v));
    expect(faltan, `sin declarar: ${faltan.join(' · ')}`).toEqual([]);
  });

  it('todo var() de los tokens está declarado o lo escribe el resolver', () => {
    const faltan = [...usadas(HOJAS)].filter((v) => !declaradas.has(v) && !DEL_RESOLVER.has(v));
    expect(faltan, `sin declarar: ${faltan.join(' · ')}`).toEqual([]);
  });

  it('los tokens solo piden al design.json lo que el resolver escribe', () => {
    const pedidas = [...usadas(HOJAS)].filter((v) => /^--(c|f|r)-/.test(v));
    expect(pedidas.length).toBeGreaterThan(15);
    expect(pedidas.filter((v) => !DEL_RESOLVER.has(v))).toEqual([]);
  });
});
