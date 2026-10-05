#!/usr/bin/env node
/**
 * Renombra, en el código de UNA APP, lo que nombra al kit viejo — para pasar del
 * kit 1.2.1 al Kit de Acceso 1.3.0 (ver `docs/fase-2.md` del molde, §7).
 *
 *   node renombrar-en-app.mjs <carpeta> [<carpeta> …] [--probar]
 *
 * Recorre las carpetas que se le pasen (típicamente `apps/backend/src` y
 * `apps/frontend/src`, y la de tests) y aplica la MISMA tabla de `renombre.js`, con
 * las rutas incluidas: `…/seguridad-512/…` → `…/acceso/…`,
 * `seguridad-512.config` → `acceso.config`, `SEGURIDAD_512` → `ACCESO`…
 *
 * NO toca: `node_modules`, ni ninguna carpeta `nucleo/` (el núcleo no se
 * renombra en la app: se REEMPLAZA entero por el de 1.3.0). Solo archivos de
 * código (`.ts .tsx .js .jsx .mjs .cjs .json`).
 *
 * Con `--probar` no escribe nada: dice qué archivos cambiaría.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { renombrar } from './renombre.js';

const CODIGO = /\.(ts|tsx|js|jsx|mjs|cjs|json)$/;
const FUERA = new Set(['node_modules', 'nucleo', 'dist', '.git']);

export function archivosParaRenombrar(carpeta) {
  const salida = [];
  for (const nombre of readdirSync(carpeta)) {
    if (FUERA.has(nombre)) continue;
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivosParaRenombrar(ruta));
    else if (CODIGO.test(nombre)) salida.push(ruta);
  }
  return salida;
}

/** Devuelve los archivos que cambian (y los escribe, salvo `probar`). */
export function renombrarEnApp(carpetas, { probar = false } = {}) {
  const cambiados = [];
  for (const carpeta of carpetas) {
    for (const ruta of archivosParaRenombrar(carpeta)) {
      const antes = readFileSync(ruta, 'utf8');
      const despues = renombrar(antes, { rutas: true });
      if (despues === antes) continue;
      cambiados.push(ruta);
      if (!probar) writeFileSync(ruta, despues);
    }
  }
  return cambiados;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const args = process.argv.slice(2);
  const probar = args.includes('--probar');
  const carpetas = args.filter((a) => a !== '--probar');
  if (carpetas.length === 0) {
    process.stderr.write('Uso: node renombrar-en-app.mjs <carpeta> [<carpeta> …] [--probar]\n');
    process.exit(1);
  }
  const cambiados = renombrarEnApp(carpetas, { probar });
  process.stdout.write(`${probar ? 'Cambiaría' : 'Cambió'} ${cambiados.length} archivos:\n${cambiados.map((c) => `  ${relative(process.cwd(), c)}`).join('\n')}\n`);
}
