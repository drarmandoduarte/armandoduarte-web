#!/usr/bin/env node
/**
 * Guardián de paridad de i18n. `es` es la fuente; ningún otro idioma puede
 * driftear en claves ni en interpolaciones `{{}}`.
 *
 * Heredado de Omnia. La diferencia de acá: **hoy hay un solo idioma y el
 * guardián no se queja.** D13 pide es/en/pt para la plataforma y todavía no
 * entraron; cuando `packages/core/src/i18n/en/` exista, se compara sola.
 *
 * ── Y aun con un idioma solo, no se queda sin trabajo ─────────────────────
 * Un guardián que con un idioma «no tiene nada que comparar» y sale verde es un
 * guardián apagado, y el día que alguien rompa `es/web.json` va a salir verde
 * igual. Así que con un idioma comprueba lo que sí puede: que el JSON parsea,
 * que hay namespaces, y el **piso de claves** —el barrido leyó algo—. Es la
 * regla de la casa sobre las aserciones de cero: al lado de cada cero va lo que
 * el barrido sí encontró.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = join(RAIZ, 'packages/core/src/i18n');
const FUENTE = 'es';
/* Medido, no estimado: son las claves que la orden #01 dejó. Con 120 —el
   mínimo que pedía la orden— se podían borrar tres de las cuatro páginas y este
   guardián seguía verde; está comprobado corriéndolo. Sube con el texto nuevo,
   en un renglón que se lee. */
const PISO_DE_CLAVES = 284;

const destinos = readdirSync(LOCALES).filter(
  (e) => e !== FUENTE && !e.startsWith('.') && statSync(join(LOCALES, e)).isDirectory(),
);

const namespaces = (idioma) => readdirSync(join(LOCALES, idioma))
  .filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();

const cargar = (idioma, ns) => JSON.parse(readFileSync(join(LOCALES, idioma, `${ns}.json`), 'utf8'));

function aplanar(obj, prefijo = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const ruta = prefijo ? `${prefijo}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, aplanar(v, ruta));
    else out[ruta] = v;
  }
  return out;
}

const interpolaciones = (valor) => {
  const out = new Set();
  if (typeof valor !== 'string') return out;
  for (const m of valor.matchAll(/\{\{\s*([a-zA-Z0-9_]+)(?:\s*,[^}]*)?\s*\}\}/g)) out.add(m[1]);
  return out;
};

const soloEn = (a, b) => [...a].filter((x) => !b.has(x));

const problemas = [];
const nsFuente = namespaces(FUENTE);
const planoFuente = {};
let clavesFuente = 0;

for (const ns of nsFuente) {
  try {
    planoFuente[ns] = aplanar(cargar(FUENTE, ns));
    clavesFuente += Object.keys(planoFuente[ns]).length;
  } catch (err) {
    problemas.push(`${FUENTE}/${ns}.json no parsea: ${err.message}`);
  }
}

/* EL PISO, PRIMERO. Sin esto, «cero diferencias» y «no leí nada» se escriben
   igual. */
if (nsFuente.length === 0) problemas.push(`no hay ningún namespace en ${FUENTE}/. El barrido no leyó nada.`);
if (clavesFuente < PISO_DE_CLAVES) {
  problemas.push(
    `${FUENTE}/ declara ${clavesFuente} claves y el piso es ${PISO_DE_CLAVES}. `
    + 'Si bajaron a propósito, se baja el número acá, que es un renglón en el diff.',
  );
}

for (const destino of destinos) {
  const nsDestino = namespaces(destino);
  for (const ns of soloEn(new Set(nsFuente), new Set(nsDestino))) problemas.push(`falta ${destino}/${ns}.json (está en ${FUENTE}/)`);
  for (const ns of soloEn(new Set(nsDestino), new Set(nsFuente))) problemas.push(`sobra ${destino}/${ns}.json (no está en ${FUENTE}/)`);

  for (const ns of nsFuente.filter((n) => nsDestino.includes(n))) {
    const a = planoFuente[ns];
    if (!a) continue;
    let b;
    try { b = aplanar(cargar(destino, ns)); } catch (err) {
      problemas.push(`${destino}/${ns}.json no parsea: ${err.message}`);
      continue;
    }
    const ka = new Set(Object.keys(a));
    const kb = new Set(Object.keys(b));
    for (const k of soloEn(ka, kb)) problemas.push(`${destino}·${ns}: falta la clave "${k}"`);
    for (const k of soloEn(kb, ka)) problemas.push(`${destino}·${ns}: la clave "${k}" no existe en ${FUENTE}`);
    for (const k of ka) {
      if (!kb.has(k)) continue;
      for (const i of soloEn(interpolaciones(a[k]), interpolaciones(b[k]))) problemas.push(`${destino}·${ns}: "${k}" usa {{${i}}} en ${FUENTE} y no en ${destino}`);
      for (const i of soloEn(interpolaciones(b[k]), interpolaciones(a[k]))) problemas.push(`${destino}·${ns}: "${k}" usa {{${i}}} en ${destino} y no en ${FUENTE}`);
    }
  }
}

if (problemas.length) {
  process.stderr.write(`Paridad i18n: ${problemas.length} problema(s).\n\n`);
  for (const p of problemas) process.stderr.write(`  · ${p}\n`);
  process.stderr.write(`\nFuente de verdad: ${FUENTE}.\n`);
  process.exit(1);
}

process.stdout.write(
  destinos.length
    ? `check-i18n-parity: ${nsFuente.length} namespace(s), ${clavesFuente} claves, en paridad ${FUENTE}↔[${destinos.join(', ')}].\n`
    : `check-i18n-parity: ${nsFuente.length} namespace(s) y ${clavesFuente} claves en ${FUENTE}. Todavía no hay otro idioma que comparar (D13).\n`,
);
