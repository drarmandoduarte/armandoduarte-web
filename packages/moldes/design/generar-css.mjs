#!/usr/bin/env node
/**
 * Escribe `design.css` en la carpeta pública de la app, a partir de su `design.json`.
 *
 *   node generar-css.mjs <design.json> <carpeta-public>
 *
 * Deja `<carpeta-public>/design.css` con las variables de claro y oscuro (las
 * `--c-*`, `--f-*` y `--r-*` que lee el Kit UI). La app no hace nada más:
 * `aplicarDesign(design)` enlaza `/design.css` solo.
 *
 * Por qué un archivo y no un `<style>`: la CSP de las apps es `style-src 'self'`,
 * y con ella el navegador no aplica un `<style>` escrito en la página. Un
 * archivo servido desde el dominio de la app, sí.
 *
 * Se corre al armar la app, y otra vez cada vez que cambie el `design.json`.
 * El archivo se commitea con la app, igual que `public/fuentes/`. No necesita red.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { avisos, validar } from './validar.js';
import { hojaDeDesign } from './resolver.js';

const [rutaDesign, carpetaPublica] = process.argv.slice(2);
if (!rutaDesign || !carpetaPublica) {
  console.error('Uso: node generar-css.mjs <design.json> <carpeta-public>');
  process.exit(1);
}

const design = JSON.parse(readFileSync(rutaDesign, 'utf8'));
const problemas = validar(design);
if (problemas.length) {
  console.error('El design.json no cumple el esquema:\n  ' + problemas.join('\n  '));
  process.exit(1);
}
for (const aviso of avisos(design)) console.warn(`Aviso · ${aviso}`);

const destino = resolve(carpetaPublica);
mkdirSync(destino, { recursive: true });
const archivo = join(destino, 'design.css');
const hoja = hojaDeDesign(design);
writeFileSync(archivo, hoja);
process.stdout.write(`${archivo} (${hoja.length} bytes) · la enlaza aplicarDesign() desde /design.css\n`);
