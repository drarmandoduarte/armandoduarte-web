#!/usr/bin/env node
/**
 * Empaqueta la salida de `tsc` en UN archivo que Vercel pueda ejecutar.
 *
 * ── Por qué hacen falta dos pasos y no uno ─────────────────────────────────
 * Cada herramienta sabe hacer exactamente una de las dos cosas que esta función
 * necesita, y no sabe hacer la otra:
 *
 *   · **`tsc`** es el único que emite `emitDecoratorMetadata`. Sin esos
 *     metadatos, `RolMiddleware` —que recibe `SupabaseService` por el tipo del
 *     constructor y por nada más— arranca sin nada que inyectar. esbuild no
 *     sabe emitirlos: está documentado como limitación suya.
 *   · **esbuild** es el único que puede meter adentro un paquete **ESM puro**.
 *     `jose@6` no publica CommonJS (`"type": "module"` y un `exports` sin
 *     condición `require`), así que el `require("jose")` que emite `tsc` se cae
 *     con ERR_REQUIRE_ESM. Pasó en el preview el 29/9/2026, una capa más
 *     adentro del `.ts` que lo precedió.
 *
 * Así que `tsc` primero —queda el CommonJS con los metadatos ya escritos como
 * llamadas a `__metadata()`— y esbuild después, sobre ese JavaScript, donde no
 * hay decorador que emitir porque ya están resueltos.
 *
 * ── Qué se empaqueta y qué se deja afuera, y por qué se decide solo ────────
 * Se deja afuera **todo lo que Node puede `require()`** y se mete adentro el
 * resto. No hay lista escrita a mano: el criterio se le pregunta a cada
 * dependencia leyendo su `package.json`, porque una lista de nombres envejece
 * en silencio —el día que `@supabase/supabase-js` publique ESM puro, una lista
 * lo seguiría dejando afuera y la función se caería en vivo, que es justamente
 * el modo de falla que este archivo existe para cerrar—.
 *
 * Dejar afuera lo que se puede es deliberado: NestJS resuelve dependencias
 * opcionales con `require()` dentro de `try/catch` y empaquetarlo entero es
 * pedir problemas. Lo que entra es lo que no hay más remedio que hacer entrar.
 */
import { build } from 'esbuild';
import { sePuedeRequerir } from './se-puede-requerir.mjs';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(API, 'dist');
const requerir = createRequire(join(API, 'package.json'));

function manifiestoDe(nombre) {
  try {
    return JSON.parse(readFileSync(requerir.resolve(`${nombre}/package.json`), 'utf8'));
  } catch {
    /* Un paquete sin `package.json` exportado (algunos no lo publican en su
       `exports`) se deja afuera: es el comportamiento de hoy y el que no
       sorprende. Si fuera ESM puro, se vería en el preview — y el test de
       `apps/familia` lo dice antes, mirando el empaquetado. */
    return null;
  }
}

const ENTRADA = join(DIST, 'index.js');
if (!existsSync(ENTRADA)) {
  console.error('✗ empaquetar-funcion: no hay `dist/index.js`. `tsc -p tsconfig.build.json` no dejó salida.');
  process.exit(1);
}

const paquete = JSON.parse(readFileSync(join(API, 'package.json'), 'utf8'));
const dependencias = Object.keys(paquete.dependencies ?? {});
const afuera = [];
const adentro = [];
for (const nombre of dependencias) {
  const manifiesto = manifiestoDe(nombre);
  (manifiesto === null || sePuedeRequerir(manifiesto) ? afuera : adentro).push(nombre);
}

await build({
  entryPoints: [ENTRADA],
  outfile: join(DIST, 'funcion.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  sourcemap: true,
  /* Los subcaminos también: `@nestjs/common/constants`, que el núcleo del kit
     importa, tiene que quedar afuera igual que `@nestjs/common`. */
  external: afuera.flatMap((n) => [n, `${n}/*`]),
  logLevel: 'warning',
});

console.log(
  `empaquetar-funcion: dist/funcion.cjs listo. Adentro: ${adentro.join(', ') || '(nada)'}. `
  + `Afuera, por requeribles: ${afuera.length}.`,
);
