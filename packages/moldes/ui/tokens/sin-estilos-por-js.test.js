/**
 * Ninguna pieza del molde escribe una hoja de estilos desde JS.
 *
 * La CSP de las apps es `style-src 'self'` (docs/fase-2.md §1). Con ella el
 * navegador NO aplica:
 *  · un `<style>` puesto en la página (por JSX, por `createElement('style')`,
 *    por `innerHTML`), ni una hoja armada con `insertRule`/`CSSStyleSheet`;
 *  · un atributo `style="…"` escrito como texto: en el HTML, con
 *    `setAttribute('style', …)` o con `cssText`.
 * Los estilos del molde viven en archivos: `@moldes/ui/styles.css` (que el
 * bundler de la app emite como archivo) y el `design.css` de cada app.
 *
 * Lo que SÍ deja pasar la CSP, y el molde usa: la prop `style={{…}}` de React y
 * `elemento.style.x = …`. React la aplica propiedad por propiedad por el CSSOM,
 * no como texto, y la CSP no lo bloquea. Medido: la galería servida con
 * `style-src 'self'` tiene cientos de nodos con `style` y cero violaciones
 * (`storybook/csp.test.js`). Eso deja de valer si una app renderiza en el
 * servidor: ahí `style` sale como texto en el HTML (docs/fase-2.md §1).
 *
 * Mira todos los paquetes, sin comentarios y sin tests.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { soloCodigoPorRenglon } from '../herramientas/soloCodigo.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PAQUETES = join(AQUI, '..', '..');

function fuentes(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.name === 'node_modules' || e.name === 'dist') return [];
    if (e.isDirectory()) return fuentes(ruta);
    if (!/\.(jsx?|tsx?|mjs)$/.test(e.name) || /\.(test|spec)\.[jt]sx?$/.test(e.name) || e.name.endsWith('.d.ts')) return [];
    return [[relative(PAQUETES, ruta), soloCodigoPorRenglon(readFileSync(ruta, 'utf8'))]];
  });
}
const ARCHIVOS = readdirSync(PAQUETES, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== 'node_modules')
  .flatMap((e) => fuentes(join(PAQUETES, e.name)));

export const REGLAS = [
  ['un <style> en JSX', /<style[\s>]/],
  ["createElement('style')", /createElement\(\s*['"`]style['"`]/],
  ["setAttribute('style', …)", /setAttribute\(\s*['"`]style['"`]/],
  ['cssText', /\.cssText\b/],
  ['innerHTML / outerHTML / insertAdjacentHTML', /\.(innerHTML|outerHTML|insertAdjacentHTML)\b/],
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
  ['una hoja armada por JS (insertRule, CSSStyleSheet, adoptedStyleSheets)', /\binsertRule\b|\bCSSStyleSheet\b|\badoptedStyleSheets\b/],
  ['document.write', /document\.write(ln)?\(/],
  ['un style escrito como texto (style="…" o style: \'…\')', /\bstyle\s*[=:]\s*['"`]/],
];

/** `[archivo:renglón, regla]` de cada lugar donde un fuente escribe estilos por JS. */
export function estilosPorJs(archivos) {
  const hallazgos = [];
  for (const [nombre, fuente] of archivos) {
    fuente.split('\n').forEach((renglon, i) => {
      for (const [regla, patron] of REGLAS) if (patron.test(renglon)) hallazgos.push(`${nombre}:${i + 1} · ${regla}`);
    });
  }
  return hallazgos;
}

describe('ninguna pieza del molde escribe estilos por JS', () => {
  it('mira los paquetes de verdad (no da verde mirando nada)', () => {
    expect(ARCHIVOS.length).toBeGreaterThan(100);
    expect(ARCHIVOS.some(([n]) => n === join('design', 'aplicar.js'))).toBe(true);
  });

  it('cero <style>, cero style como texto, cero hojas armadas por JS', () => {
    expect(estilosPorJs(ARCHIVOS)).toEqual([]);
  });

  it('el chequeo agarra cada forma (con un fuente plantado)', () => {
    const plantados = [
      "const h = document.createElement('style');",
      'return <style>{css}</style>;',
      "el.setAttribute('style', 'color:red');",
      'el.style.cssText = "color:red";',
      'head.innerHTML += css;',
      '<div dangerouslySetInnerHTML={{ __html: x }} />',
      'hoja.insertRule(regla);',
      'document.write(x);',
      '<div style="color:red" />',
    ];
    for (const linea of plantados) expect(estilosPorJs([['plantado.jsx', linea]]), linea).toHaveLength(1);
    // Lo que la CSP deja pasar no se marca: la prop de React y el CSSOM.
    expect(estilosPorJs([['bien.jsx', soloCodigoPorRenglon("<div style={{ color: 'var(--text)' }} />\ndocument.body.style.overflow = 'hidden';\n// un <style> en un comentario")]])).toEqual([]);
  });
});
