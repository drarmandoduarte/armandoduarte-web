#!/usr/bin/env node
/**
 * Regenera `HUELLAS.txt`.
 *
 * CUÁNDO se corre: cuando el MOLDE cambia de verdad, acá en `moldes-apps`, con la
 * versión ya subida en `VERSION` y en cada `package.json`. NUNCA para «arreglar»
 * un guardián en rojo dentro de una app: si el guardián está rojo es porque
 * alguien editó el molde ahí, y lo que corresponde es revertir esa edición.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escribirHuellas, archivosDelMolde } from './revisar.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = readFileSync(join(raiz, 'VERSION'), 'utf8').trim();
writeFileSync(join(raiz, 'HUELLAS.txt'), escribirHuellas(raiz, version));
process.stdout.write(`HUELLAS.txt regenerado: ${archivosDelMolde(raiz).length} archivos (v${version}).\n`);
