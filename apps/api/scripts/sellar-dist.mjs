#!/usr/bin/env node
/**
 * Deja `dist/package.json` con `{"type":"commonjs"}`, y es el cinturón del
 * tirante.
 *
 * ── Qué problema resuelve, en una línea ────────────────────────────────────
 * Node decide si un `.js` es ESM o CommonJS leyendo el `package.json` **más
 * cercano hacia arriba**. `tsconfig.build.json` emite CommonJS; si algún día
 * alguien le devuelve `"type": "module"` a `apps/api/package.json`, ese mismo
 * `.js` pasa a leerse como ESM y la función se cae con `exports is not defined`
 * —otro arranque roto en Vercel, otra vez sólo visible en vivo—. Un
 * `package.json` propio dentro de `dist/` corta la búsqueda antes de llegar
 * arriba y deja la respuesta escrita al lado de los archivos que describe.
 *
 * Hoy es redundante a propósito: `apps/api/package.json` ya **no** declara
 * `type`, así que el default de Node ya es CommonJS. Lo redundante acá es lo
 * que vale — es la mitad que sobrevive a que alguien cambie la otra.
 *
 * Se genera y no se versiona: `dist/` está en `.gitignore`, y un archivo
 * generado que se commitea es un archivo que un día deja de coincidir con el
 * build que dice describir.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist');

if (!existsSync(join(DIST, 'index.js'))) {
  console.error(
    '✗ sellar-dist: no hay `dist/index.js`. O `tsc -p tsconfig.build.json` no corrió, o dejó la\n'
    + '  salida en otro lado. Sellar una carpeta que no existe sería firmar un build que no pasó.',
  );
  process.exit(1);
}

writeFileSync(
  join(DIST, 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
);
