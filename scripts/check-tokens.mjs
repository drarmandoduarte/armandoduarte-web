#!/usr/bin/env node
/**
 * Guardián de los tokens: **ningún color escrito a mano.**
 *
 * ── La regla, y por qué es de esta orden y no de una futura ───────────────
 * Un hex suelto en un componente es un color que el design system no conoce.
 * No se ve mal el día que se escribe —es el mismo crema, copiado— se ve mal seis
 * meses después, cuando el crema cambia en `codice-tokens.css` y quedan nueve
 * pantallas con el viejo. Es exactamente lo que la web pública evitó desde su
 * primera línea: `estilo.css` declara los colores arriba y abajo solo usa
 * `var(--token)`. Esta orden porta ese CSS a React, y el guardián existe para
 * que la disciplina sobreviva al port.
 *
 * ── Dónde mira y dónde no, declarado ─────────────────────────────────────
 * Mira `apps/` y `packages/ui/components`: lo que se dibuja.
 * **No mira** `packages/ui/codice-tokens.css`, que es donde los hex tienen que
 * vivir, ni `codice-tokens.json`, que es su documento. Tampoco mira `public/`
 * (son archivos de Armando, no código) ni los SVG de favicon.
 *
 * ── Y el piso, primero ───────────────────────────────────────────────────
 * «Cero hex» sobre cero archivos leídos es idéntico a «cero hex» sobre una casa
 * limpia: los dos devuelven la lista vacía. Así que antes del cero va cuántos
 * archivos recorrió el barrido, y si son menos de 20 falla aunque el cero se
 * cumpla. La orden lo pide con ese número.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CARPETAS = ['apps', 'packages/ui/components'];
const EXTENSIONES = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json', '.mjs', '.cjs'];
const IGNORAR_DIR = ['node_modules', 'dist', '.git', 'public', 'test-results', '.capturas'];
/* Los reportes que dejan los corredores. Son `.json` y viven dentro de `apps/`,
   así que el barrido los contaría como archivos leídos —y un piso que se cumple
   con archivos generados es un piso que se cumple solo. */
const IGNORAR_ARCHIVO = ['.vitest-report.json', '.playwright-report.json'];

/*
 * El piso, y por qué hoy dice 16.
 *
 * La orden #01 lo fija en 20 para el final del trabajo. La Fase A todavía no
 * tiene el port: `apps/web` son 16 archivos y poner 20 acá sería un rojo
 * permanente que alguien apagaría. Sube a 20 en la Fase B, en su propio commit
 * y en un renglón que se lee — que es como esta casa cambia una vigilancia.
 */
const PISO_DE_ARCHIVOS = 16;

/** El único archivo del repo donde un hex es lo correcto. */
const DONDE_VIVEN = 'packages/ui/codice-tokens.css';

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function recorrer(dir) {
  const out = [];
  let entradas;
  try { entradas = readdirSync(dir); } catch { return out; }
  for (const entrada of entradas) {
    if (IGNORAR_DIR.includes(entrada)) continue;
    const full = join(dir, entrada);
    if (statSync(full).isDirectory()) out.push(...recorrer(full));
    else if (EXTENSIONES.some((e) => full.endsWith(e))) out.push(full);
  }
  return out;
}

const hallazgos = [];
let archivos = 0;
for (const carpeta of CARPETAS) {
  for (const archivo of recorrer(join(RAIZ, carpeta))) {
    const rel = relative(RAIZ, archivo);
    if (rel === DONDE_VIVEN || IGNORAR_ARCHIVO.some((n) => rel.endsWith(n))) continue;
    archivos += 1;
    readFileSync(archivo, 'utf8').split('\n').forEach((linea, i) => {
      for (const m of linea.match(HEX) ?? []) {
        hallazgos.push(`${rel}:${i + 1}  ${m}  ->  ${linea.trim().slice(0, 100)}`);
      }
    });
  }
}

/* EL PISO, ANTES DEL CERO. Ver la cabecera. */
if (archivos < PISO_DE_ARCHIVOS) {
  process.stderr.write(
    `check-tokens: el barrido recorrió ${archivos} archivos en [${CARPETAS.join(', ')}] y el piso es `
    + `${PISO_DE_ARCHIVOS}. Un «cero hex» sobre casi nada no afirma nada: o las carpetas se movieron, o `
    + 'las extensiones cambiaron.\n',
  );
  process.exit(1);
}

if (hallazgos.length) {
  process.stderr.write(
    `Hex escritos a mano (${hallazgos.length}). Los colores viven en ${DONDE_VIVEN} y se usan con `
    + 'var(--token): si un color no tiene token, no entra al producto.\n\n',
  );
  for (const h of hallazgos) process.stderr.write(`  ${h}\n`);
  process.exit(1);
}

process.stdout.write(`check-tokens: ${archivos} archivos recorridos, ningún hex fuera de ${DONDE_VIVEN}.\n`);
