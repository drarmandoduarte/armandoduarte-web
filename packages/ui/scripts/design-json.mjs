#!/usr/bin/env node
/**
 * El `design.json` de Mi espacio, GENERADO desde el canon — orden Códice #35.
 *
 *     node packages/ui/scripts/design-json.mjs
 *
 * El guion v1 del Kit de Seguridad 512 dice que las pantallas de acceso son las
 * mismas en todas las apps y que lo único que cambia por app sale de su
 * `design.json`: colores, tipografía, radio y nombre (§1). Ese archivo **no se
 * escribe a mano** (dirección, 2/10: «tomar colores y todo lo de diseño del
 * .json de la app de Armando»): sale de `codice-tokens.json`, que es el canon
 * (D28), con el mapa de la orden #35 escrito abajo, rol por rol, con la ruta del
 * token. Un `design.json` copiado a mano es una segunda verdad, y un guardián
 * que mira una copia no vigila nada (D27).
 *
 * Escribe dos archivos, los dos generados:
 *   · `apps/familia/design.json` — el documento que lee el molde del kit:
 *     cada rol con su token, su hex y su variable CSS;
 *   · `apps/familia/src/acceso/design.css` — las variables `--acceso-*` que
 *     usan las pantallas de acceso, **por referencia** a las del canon
 *     (`var(--teal)`), nunca con el hex.
 *
 * `packages/ui/tokens.test.mjs` los regenera y los compara byte a byte, y
 * afirma que cada hex del `design.json` está en el canon.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UI = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = join(UI, '..', '..');
export const SALIDA_JSON = join(RAIZ, 'apps', 'familia', 'design.json');
export const SALIDA_CSS = join(RAIZ, 'apps', 'familia', 'src', 'acceso', 'design.css');

/** El mapa de la orden #35, rol → ruta del token en el canon. */
export const MAPA = {
  colores: {
    fondo: 'color.background.cream',
    superficie: 'color.background.surfaceWarm',
    texto: 'color.ink.primary',
    secundario: 'color.ink.muted',
    /* Mi espacio usa la paleta CFF de Armando (decisión del 29/9). */
    acento: 'color.cff.tealDark',
    /* El borde de campos y casillas. Era el hairline (1,18:1 sobre crema, no
       llega al 3:1 de WCAG 1.4.11 y en P3 casi no se veía); auditoría del CEO
       del PR #56: ink.muted, 4,99:1. */
    borde: 'color.ink.muted',
    error: 'color.semantic.danger',
    /* Las líneas que NO son borde de un control: la del separador de P1 y el
       recuadro de los códigos de P5. Siguen en el hairline (auditoría #56:
       el cambio es «en campos y casillas»). */
    linea: 'color.border.hairline',
  },
  tipografia: {
    sans: 'typography.families.structure',
    lectura: 'typography.families.reading',
  },
  radio: 'radius.casa',
};

const leer = (obj, ruta) => ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** `color.cff.tealDark` → `--teal`, leído de los comentarios de `codice-tokens.css`. */
function variablesDelCanon(css) {
  const mapa = new Map();
  for (const m of css.matchAll(/^\s*(--[a-z-]+):([^;]+);\s*\/\*\s*([a-zA-Z.]+)/gm)) mapa.set(m[3], { css: m[1], valor: m[2].trim() });
  return mapa;
}

export function generar() {
  const canon = JSON.parse(readFileSync(join(UI, 'codice-tokens.json'), 'utf8'));
  const vars = variablesDelCanon(readFileSync(join(UI, 'codice-tokens.css'), 'utf8'));
  const variable = (ruta) => {
    const v = vars.get(ruta);
    if (!v) throw new Error(`design-json: ${ruta} no tiene variable en codice-tokens.css`);
    return v.css;
  };

  const colores = {};
  for (const [rol, ruta] of Object.entries(MAPA.colores)) {
    const nodo = leer(canon, ruta);
    const hex = typeof nodo === 'string' ? nodo : nodo?.value;
    if (!/^#[0-9A-F]{6}$/i.test(hex ?? '')) throw new Error(`design-json: ${ruta} no es un color del canon`);
    colores[rol] = { token: ruta, hex: hex.toUpperCase(), css: variable(ruta) };
  }
  const familia = (ruta) => {
    const f = leer(canon, ruta);
    return { token: ruta, familia: f.family, pesos: f.weights, css: variable(ruta) };
  };
  const radioCrudo = String(leer(canon, MAPA.radio)).match(/^\d+px/)?.[0];
  if (!radioCrudo) throw new Error(`design-json: ${MAPA.radio} no es un radio`);

  const documento = {
    $nota: 'GENERADO por packages/ui/scripts/design-json.mjs desde packages/ui/codice-tokens.json (orden Códice #35). No se edita a mano: tokens.test.mjs lo regenera y lo compara byte a byte.',
    kit: 'Kit de Seguridad 512 · guion de pantallas de acceso v1',
    canon: { archivo: 'packages/ui/codice-tokens.json', version: canon.$meta.version },
    nombre: 'Armando Duarte',
    web: 'https://armandoduarte.com',
    /* La palabra entre asteriscos es la acentuada (guion §2). */
    frase: 'Entra a tu *espacio*.',
    /* Tuteo mexicano (D6): «pierdes», «entra». Es el único cambio de texto que el guion permite (§5). */
    espanol: 'neutro',
    colores,
    tipografia: {
      sans: familia(MAPA.tipografia.sans),
      lectura: familia(MAPA.tipografia.lectura),
      /* §1.2: la marca no tiene serif → la palabra acentuada va en la misma sans, cursiva y en el acento. */
      serif: null,
      acentuada: { familia: 'sans', estilo: 'italic', color: 'acento' },
    },
    radio: { token: MAPA.radio, valor: radioCrudo, css: variable(MAPA.radio) },
  };

  const json = `${JSON.stringify(documento, null, 2)}\n`;
  const lineas = [
    ...Object.entries(colores).map(([rol, c]) => `  --acceso-${rol}:var(${c.css});${' '.repeat(Math.max(1, 14 - rol.length))}/* ${c.token} */`),
    `  --acceso-sans:var(${documento.tipografia.sans.css});`,
    `  --acceso-lectura:var(${documento.tipografia.lectura.css});`,
    `  --acceso-radio:var(${documento.radio.css});         /* ${MAPA.radio} · ${radioCrudo} */`,
  ];
  const css = `/* GENERADO por packages/ui/scripts/design-json.mjs desde el canon (orden Códice #35).
   No se edita a mano: tokens.test.mjs lo regenera y lo compara byte a byte.
   Es el design.json de Mi espacio en forma ejecutable, por referencia a las
   variables del canon (ningún hex vive acá). */
.acceso{
${lineas.join('\n')}
}
`;
  return { json, css, documento };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { json, css } = generar();
  writeFileSync(SALIDA_JSON, json);
  writeFileSync(SALIDA_CSS, css);
  process.stdout.write(`design-json: ${SALIDA_JSON.replace(`${RAIZ}/`, '')} y ${SALIDA_CSS.replace(`${RAIZ}/`, '')} generados.\n`);
}
