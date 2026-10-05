#!/usr/bin/env node
/* El chequeo único de los moldes: `node guardian/check.mjs` (corre primero en `pnpm test`). */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { revisar } from './revisar.mjs';

const raiz = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..');
const { errores, comparados, version } = revisar(raiz);
if (errores.length) {
  process.stderr.write(`\nGUARDIÁN DE LOS MOLDES · rojo (${errores.length}):\n  ${errores.join('\n  ')}\n\n`);
  process.exit(1);
}
process.stdout.write(`Guardián de los moldes · v${version} · ${comparados} archivos idénticos a sus huellas.\n`);
