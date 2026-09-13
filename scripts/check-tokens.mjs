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
 * Mira `apps/` y `packages/ui/components`: **lo que se dibuja**. Cualquier
 * `.ts`, `.tsx`, `.css`, `.html` o config de ahí adentro, comentarios incluidos:
 * un hex escrito en un comentario es igual de copia que uno escrito en una
 * regla, y envejece igual. Está medido — la primera corrida sobre el port cazó
 * dos, en una nota que explicaba justamente por qué ese color no se repetía.
 *
 * **No mira** cuatro cosas, cada una con su motivo:
 *   · `packages/ui/codice-tokens.css`, que es donde los hex tienen que vivir;
 *   · `public/`, que son los archivos de Armando y no código;
 *   · los reportes que dejan los corredores, que son `.json` generados;
 *   · **los archivos de test.** Una fixture necesita poder escribir un color
 *     para probar algo sobre colores: `useTinteDeCabecera.test.ts` convierte
 *     blanco y negro para comprobar que su conversión convierte, y ese piso no
 *     se puede escribir sin nombrarlos. Es la misma excepción que hace
 *     `check-estilo` con el voseo de sus propias fixtures, y por la misma razón:
 *     un test no se publica.
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
 * El piso, que la orden #01 fija en 20.
 *
 * En la Fase A estuvo en 16, que era el número real de `apps/web` antes del
 * port: poner 20 sobre 16 archivos habría sido un rojo permanente, y un rojo
 * permanente termina apagado. Sube acá, en la Fase B, cuando el port lo hace
 * cierto — y sube en un renglón que se lee, que es como esta casa mueve una
 * vigilancia en cualquiera de las dos direcciones.
 */
const PISO_DE_ARCHIVOS = 20;

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
    else if (EXTENSIONES.some((e) => full.endsWith(e)) && !/\.(test|spec)\./.test(entrada)) out.push(full);
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
