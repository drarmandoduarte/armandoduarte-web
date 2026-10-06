#!/usr/bin/env node
/**
 * El `design.json` de Mi espacio, GENERADO desde el canon — orden Códice #35.
 *
 *     node packages/ui/scripts/design-json.mjs
 *
 * El guion v1 del Kit de Acceso dice que las pantallas de acceso son las
 * mismas en todas las apps y que lo único que cambia por app sale de su
 * `design.json`: colores, tipografía, radio y nombre (§1). Ese archivo **no se
 * escribe a mano** (dirección, 2/10: «tomar colores y todo lo de diseño del
 * .json de la app de Armando»): sale de `codice-tokens.json`, que es el canon
 * (D28), con el mapa de la orden #35 escrito abajo, rol por rol, con la ruta del
 * token. Un `design.json` copiado a mano es una segunda verdad, y un guardián
 * que mira una copia no vigila nada (D27).
 *
 * Escribe dos archivos, los dos generados:
 *   · `apps/familia/design.json` — desde la orden #37, **en el esquema del
 *     molde** (`packages/moldes/design/design.schema.json`): `app`, `color`,
 *     `colorOscuro`, `tipografia` y `radio`, y nada más (el esquema no admite
 *     otras claves; de dónde sale cada valor queda en `$comment` y en `MAPA`);
 *   · (Hasta el PR 2 de la #37 escribía también `apps/familia/src/acceso/design.css`,
 *     las variables `--acceso-*` de las pantallas de la #35. Se fue con ellas:
 *     las pantallas de acceso son las del molde y leen el `design.json`.)
 *
 * De `design.json` salen, con las herramientas del molde y sin tocarlas,
 * `apps/familia/public/design.css` (`generar-css.mjs`) y
 * `apps/familia/public/fuentes/` (`bajar-fuentes.mjs`).
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

/**
 * El mapa de la orden #37: rol del molde → ruta del token en el canon.
 *
 * Claro, con la paleta CFF de Mi espacio (#29): fondo crema, papel —campos y
 * tarjetas— cálido, tinta, gris, acento teal oscuro. `linea` es el hairline,
 * como en la #35. Oscuro, `color.oscuro.*` (canon v1.3.0).
 */
export const MAPA_MOLDE = {
  color: {
    fondo: 'color.background.cream',
    papel: 'color.background.surfaceWarm',
    texto: 'color.ink.primary',
    texto2: 'color.ink.muted',
    linea: 'color.border.hairline',
    acento: 'color.cff.tealDark',
    error: 'color.semantic.danger',
    ok: 'color.semantic.success',
    aviso: 'color.semantic.warning',
  },
  colorOscuro: Object.fromEntries(
    ['fondo', 'papel', 'texto', 'texto2', 'linea', 'acento', 'error', 'ok', 'aviso'].map((k) => [k, `color.oscuro.${k}`]),
  ),
  /* La marca no tiene serif (#35, §1.2 del guion): los títulos y la palabra
     acentuada van en Montserrat, la misma de la estructura. Sin mono propia. */
  tipografia: { sans: 'typography.families.structure', serif: 'typography.families.structure', mono: 'system' },
  /* `radius.casa` (2 px) en botones y campos, como dibuja la casa desde la
     #07; `radius.lg` (12 px) en tarjetas. */
  radio: { boton: 'radius.casa', campo: 'radius.casa', tarjeta: 'radius.lg' },
};

/** La frase de marca en los tres idiomas (orden #37). */
export const FRASE = { es: 'Entra a tu *espacio*.', en: 'Enter your *space*.', pt: 'Entre no seu *espaço*.' };

const leer = (obj, ruta) => ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function generar() {
  const canon = JSON.parse(readFileSync(join(UI, 'codice-tokens.json'), 'utf8'));
  /* ── El design.json del molde ─────────────────────────────────────────── */
  /** El hex de un token, siguiendo una `ref` del canon (una sola vuelta). */
  const hexDe = (ruta) => {
    let nodo = leer(canon, ruta);
    if (nodo && typeof nodo === 'object' && nodo.ref) nodo = leer(canon, nodo.ref);
    const hex = typeof nodo === 'string' ? nodo : nodo?.value;
    if (!/^#[0-9A-F]{6}$/i.test(hex ?? '')) throw new Error(`design-json: ${ruta} no es un color del canon`);
    return hex.toUpperCase();
  };
  const paleta = (mapa) => Object.fromEntries(Object.entries(mapa).map(([rol, ruta]) => [rol, hexDe(ruta)]));
  const px = (ruta) => {
    const n = Number(String(leer(canon, ruta)).match(/^(\d+)px/)?.[1]);
    if (!Number.isInteger(n)) throw new Error(`design-json: ${ruta} no es un radio en px`);
    return n;
  };
  const documento = {
    $comment: `GENERADO por packages/ui/scripts/design-json.mjs desde packages/ui/codice-tokens.json v${canon.$meta.version} (órdenes Códice #35 y #37), en el esquema v1 del molde. No se edita a mano: tokens.test.mjs lo regenera y lo compara byte a byte. De dónde sale cada valor: MAPA_MOLDE en ese script.`,
    app: { nombre: 'Armando Duarte', frase: FRASE, espanol: 'neutro' },
    color: paleta(MAPA_MOLDE.color),
    colorOscuro: paleta(MAPA_MOLDE.colorOscuro),
    tipografia: Object.fromEntries(Object.entries(MAPA_MOLDE.tipografia).map(([rol, ruta]) => [rol, ruta === 'system' ? 'system' : leer(canon, ruta).family])),
    radio: Object.fromEntries(Object.entries(MAPA_MOLDE.radio).map(([rol, ruta]) => [rol, px(ruta)])),
  };

  const json = `${JSON.stringify(documento, null, 2)}\n`;
  return { json, documento };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { json } = generar();
  writeFileSync(SALIDA_JSON, json);
  process.stdout.write(`design-json: ${SALIDA_JSON.replace(`${RAIZ}/`, '')} generado.\n`);
}
