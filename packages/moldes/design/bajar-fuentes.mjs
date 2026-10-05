#!/usr/bin/env node
/**
 * Baja las fuentes de un `design.json` a la carpeta pública de la app.
 *
 *   node bajar-fuentes.mjs <design.json> <carpeta-public> [--prefijo /fuentes]
 *
 * Deja en `<carpeta-public>/fuentes/` los `.woff2` (latin y latin-ext: es, en,
 * pt) y `fuentes.css` con su `@font-face`. La app no hace nada más:
 * `aplicarDesign(design)` enlaza `/fuentes/fuentes.css` solo.
 *
 * Se corre UNA vez al armar la app, y otra cada vez que cambie la tipografía
 * del `design.json`. Los archivos se commitean con la app: así la app no depende
 * de Google para verse. Necesita red solo mientras corre.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { avisos, validar } from './validar.js';
import { asignarArchivos, filtrarCaras, hojaDeFuentes, leerHojaDeGoogle, urlDeFuentes } from './fuentes.js';

/* Google sirve woff2 solo a navegadores que lo entienden: se pide como uno. */
const NAVEGADOR = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const [rutaDesign, carpetaPublica, ...resto] = process.argv.slice(2);
if (!rutaDesign || !carpetaPublica) {
  console.error('Uso: node bajar-fuentes.mjs <design.json> <carpeta-public> [--prefijo /fuentes]');
  process.exit(1);
}
const i = resto.indexOf('--prefijo');
const prefijo = i >= 0 ? resto[i + 1] : '/fuentes';

const design = JSON.parse(readFileSync(rutaDesign, 'utf8'));
const problemas = validar(design);
if (problemas.length) {
  console.error('El design.json no cumple el esquema:\n  ' + problemas.join('\n  '));
  process.exit(1);
}

for (const aviso of avisos(design)) console.warn(`Aviso · ${aviso}`);

const url = urlDeFuentes(design);
const destino = resolve(carpetaPublica, 'fuentes');
mkdirSync(destino, { recursive: true });
if (!url) {
  writeFileSync(join(destino, 'fuentes.css'), '/* Las tres tipografías son `system`: no hay nada que bajar. */\n');
  process.stdout.write('Las tres tipografías son del sistema. Nada que bajar.\n');
  process.exit(0);
}

const respuesta = await fetch(url, { headers: { 'user-agent': NAVEGADOR } });
if (!respuesta.ok) {
  console.error(`Google Fonts respondió ${respuesta.status}. ¿Están bien escritos los nombres de las tipografías?\n  ${url}`);
  process.exit(1);
}
const caras = asignarArchivos(filtrarCaras(leerHojaDeGoogle(await respuesta.text())));
if (caras.length === 0) {
  console.error('Google no devolvió ninguna cara woff2 en latin/latin-ext. No se escribió nada.');
  process.exit(1);
}

let bytes = 0;
const bajados = new Set();
for (const cara of caras) {
  if (bajados.has(cara.archivo)) continue;
  const archivo = await fetch(cara.url, { headers: { 'user-agent': NAVEGADOR } });
  if (!archivo.ok) { console.error(`No se pudo bajar ${cara.url} (${archivo.status}).`); process.exit(1); }
  const datos = Buffer.from(await archivo.arrayBuffer());
  bytes += datos.length;
  writeFileSync(join(destino, cara.archivo), datos);
  bajados.add(cara.archivo);
}
writeFileSync(join(destino, 'fuentes.css'), hojaDeFuentes(caras, prefijo));

const familias = [...new Set(caras.map((c) => c.familia))];
process.stdout.write(`${bajados.size} archivos para ${caras.length} caras (${Math.round(bytes / 1024)} KB) de ${familias.join(', ')} → ${destino}` + "\n");
process.stdout.write(`Hoja: ${join(destino, 'fuentes.css')} · la enlaza aplicarDesign() desde ${prefijo}/fuentes.css` + "\n");
