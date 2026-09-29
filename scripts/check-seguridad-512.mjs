#!/usr/bin/env node
/**
 * GUARDIÁN DEL KIT DE SEGURIDAD 512 · v1
 *
 * El núcleo del kit (las carpetas `seguridad-512/nucleo/`) tiene que ser IDÉNTICO en todas
 * las apps. Una mejora se hace en el kit, sube la versión y se regeneran las
 * huellas; NO se edita el núcleo dentro de una app. Este script es lo que hace
 * que esa regla no dependa de la memoria de nadie.
 *
 * Qué revisa:
 *  1. Cada archivo del núcleo contra su SHA-256 en `seguridad-512/HUELLAS.txt`.
 *     Si alguno cambió, falla y dice cuál.
 *  2. Que no haya `console.log` en ninguna carpeta `seguridad-512/`.
 *  3. Que no falte la config, ni ningún archivo del núcleo, ni HUELLAS.txt.
 *  4. Que no haya archivos en el núcleo SIN huella (agregar uno a escondidas
 *     sería la forma obvia de esquivar el punto 1).
 *  5. Que las dos copias de la config (backend y frontend) sean iguales, y que
 *     los archivos de núcleo con el mismo nombre en las dos también lo sean.
 *
 * PISO: si terminó comparando menos archivos de los que el kit v1 tiene, falla.
 * Un guardián que compara cero archivos y dice "todo bien" es peor que ninguno.
 *
 * Sin dependencias: corre con `node` pelado, dentro de `npm run test`.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const HUELLAS = join(RAIZ, 'seguridad-512', 'HUELLAS.txt');
const VERSION = join(RAIZ, 'seguridad-512', 'VERSION');

/**
 * Las dos instalaciones del kit en ESTE repo.
 *
 * ── Lo único que se adaptó del guardián, y por qué ──────────────────────
 * El kit trae `apps/backend` y `apps/frontend`, que son los nombres de Cenit.
 * Acá las apps se llaman `apps/api` y `apps/familia` (orden Códice #15, A y B),
 * así que las rutas se traducen. El `LEEME.md` del kit pone este archivo en la
 * fila de los que «van a `scripts/`» y no en la de los que se copian byte por
 * byte: el núcleo es lo que no se toca, y el núcleo no se tocó (19 de 19).
 *
 * ── Y `HUELLAS.txt` NO se reescribió ────────────────────────────────────
 * Se copió tal cual, como manda el kit, con sus rutas de Cenit adentro. Se
 * traducen acá al leerlas (`aQuiRuta`). El motivo es el que hace que este
 * guardián sirva: **lo que protege una huella es el SHA-256, no la cadena de
 * la ruta.** Reescribir el archivo para que las rutas «queden lindas» sería
 * editar el documento que se usa para detectar ediciones, y el día que alguien
 * regenere las huellas dentro de esta app —que es justo lo que el kit prohíbe—
 * no habría forma de notar que el archivo ya no es el del kit. Copiado igual,
 * se compara con `cmp` contra el kit y sale idéntico.
 */
const INSTALACIONES = [
  { nombre: 'backend', base: join('apps', 'api', 'src', 'seguridad-512'), delKit: 'apps/backend/src/seguridad-512' },
  { nombre: 'frontend', base: join('apps', 'familia', 'src', 'seguridad-512'), delKit: 'apps/frontend/src/seguridad-512' },
];

/**
 * Traduce una ruta como la escribe `HUELLAS.txt` (las de Cenit) a la de esta
 * app. Si no reconoce el prefijo la devuelve tal cual: una huella que apunte a
 * un lugar que no existe tiene que fallar diciendo que falta el archivo, no
 * desaparecer en silencio — que sería la forma más barata de vaciar el guardián.
 */
function aQuiRuta(rutaDelKit) {
  for (const i of INSTALACIONES) {
    if (rutaDelKit.startsWith(`${i.delKit}/`)) {
      return normalizar(i.base) + rutaDelKit.slice(i.delKit.length);
    }
  }
  return rutaDelKit;
}

/**
 * Piso de archivos comparados. Es el tamaño del núcleo del kit: si el script
 * compara menos, algo se rompió (una carpeta que no existe, un HUELLAS.txt
 * vaciado, una ruta mal armada) y NO se puede dar el verde.
 */
const PISO_DE_ARCHIVOS = 19;

const errores = [];
const fallar = (mensaje) => errores.push(mensaje);

const sha256 = (ruta) => createHash('sha256').update(readFileSync(ruta)).digest('hex');
const normalizar = (ruta) => ruta.split(sep).join('/');

/** Archivos de un directorio, recursivo, en rutas relativas a la raíz del repo. */
function archivosDe(dirAbsoluto) {
  if (!existsSync(dirAbsoluto)) return [];
  const salida = [];
  for (const entrada of readdirSync(dirAbsoluto)) {
    const completo = join(dirAbsoluto, entrada);
    if (statSync(completo).isDirectory()) salida.push(...archivosDe(completo));
    else salida.push(normalizar(relative(RAIZ, completo)));
  }
  return salida.sort();
}

// — 3.a) Estructura mínima —————————————————————————————————————————————
if (!existsSync(HUELLAS)) {
  fallar(
    'Falta seguridad-512/HUELLAS.txt. Sin huellas no hay nada que comparar: ' +
      'el núcleo queda sin guardián. Regeneralo con `node scripts/huellas-seguridad-512.mjs`.',
  );
}
if (!existsSync(VERSION)) {
  fallar('Falta seguridad-512/VERSION (la versión del kit instalada en esta app).');
}

for (const instalacion of INSTALACIONES) {
  const config = join(RAIZ, instalacion.base, 'seguridad-512.config.ts');
  const nucleo = join(RAIZ, instalacion.base, 'nucleo');
  if (!existsSync(config)) {
    fallar(`Falta ${normalizar(relative(RAIZ, config))}: sin config el núcleo no sabe nada.`);
  }
  if (!existsSync(nucleo)) {
    fallar(`Falta la carpeta del núcleo ${normalizar(relative(RAIZ, nucleo))}.`);
  }
}

// — 1) Huellas ——————————————————————————————————————————————————————————
let comparados = 0;
const conHuella = new Set();

if (existsSync(HUELLAS)) {
  const lineas = readFileSync(HUELLAS, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  for (const linea of lineas) {
    const partes = linea.split(/\s+/);
    if (partes.length < 2) {
      fallar(`Línea ilegible en HUELLAS.txt: "${linea}"`);
      continue;
    }
    const [esperada, rutaDelKit] = [partes[0], partes.slice(1).join(' ')];
    const ruta = aQuiRuta(rutaDelKit);
    conHuella.add(ruta);
    const absoluta = join(RAIZ, ruta);
    if (!existsSync(absoluta)) {
      fallar(
        `Falta un archivo del núcleo: ${ruta} ` +
          `(HUELLAS.txt lo nombra como ${rutaDelKit} y en el disco no está).`,
      );
      continue;
    }
    const real = sha256(absoluta);
    comparados += 1;
    if (real !== esperada) {
      fallar(
        `El núcleo del kit cambió: ${ruta}\n` +
          `    esperado ${esperada}\n` +
          `    real     ${real}\n` +
          '    El núcleo NO se edita dentro de una app. Si la mejora es real, hacela en ' +
          'el kit, subí seguridad-512/VERSION y regenerá las huellas.',
      );
    }
  }
}

// — 4) Archivos del núcleo sin huella ——————————————————————————————————
for (const instalacion of INSTALACIONES) {
  for (const archivo of archivosDe(join(RAIZ, instalacion.base, 'nucleo'))) {
    if (!conHuella.has(archivo)) {
      fallar(
        `Archivo en el núcleo SIN huella: ${archivo}. ` +
          'Todo lo que vive en nucleo/ viaja con el kit y tiene que estar en HUELLAS.txt ' +
          '(si es propio de esta app, no es núcleo: va afuera, como adaptador).',
      );
    }
  }
}

// — 2) console.log en cualquier carpeta del kit ———————————————————————
for (const instalacion of INSTALACIONES) {
  for (const archivo of archivosDe(join(RAIZ, instalacion.base))) {
    if (!/\.(ts|tsx|js|mjs)$/.test(archivo)) continue;
    const contenido = readFileSync(join(RAIZ, archivo), 'utf8');
    if (/\bconsole\s*\.\s*log\b/.test(contenido)) {
      fallar(`console.log en ${archivo}. Prohibido (CLAUDE.md): todo pasa por el logger.`);
    }
  }
}

// — 5) Las dos copias tienen que coincidir ————————————————————————————
const configs = INSTALACIONES.map((i) => join(RAIZ, i.base, 'seguridad-512.config.ts'));
if (configs.every((c) => existsSync(c))) {
  const [backend, frontend] = configs.map((c) => sha256(c));
  if (backend !== frontend) {
    fallar(
      'Las dos copias de seguridad-512.config.ts (backend y frontend) son distintas. ' +
        'Tienen que decir lo MISMO: el mismo nombre de app y los mismos roles clasificados, ' +
        'o el servidor y la pantalla van a discrepar sobre quién necesita el segundo paso.',
    );
  }
}

const porNombre = new Map();
for (const instalacion of INSTALACIONES) {
  for (const archivo of archivosDe(join(RAIZ, instalacion.base, 'nucleo'))) {
    const nombre = archivo.split('/').pop();
    if (!porNombre.has(nombre)) porNombre.set(nombre, []);
    porNombre.get(nombre).push(archivo);
  }
}
for (const [nombre, rutas] of porNombre) {
  if (rutas.length < 2) continue;
  const huellas = new Set(rutas.map((r) => sha256(join(RAIZ, r))));
  if (huellas.size > 1) {
    fallar(
      `El archivo de núcleo "${nombre}" existe en backend y frontend con contenido DISTINTO ` +
        `(${rutas.join(', ')}). Si es núcleo, es el mismo archivo en todos lados.`,
    );
  }
}

// — PISO ————————————————————————————————————————————————————————————————
if (comparados < PISO_DE_ARCHIVOS) {
  fallar(
    `El guardián comparó ${comparados} archivo(s), y el kit tiene ${PISO_DE_ARCHIVOS}. ` +
      'Comparar de menos es no comparar: se revisa qué se rompió antes de dar el verde.',
  );
}

// — Resultado ——————————————————————————————————————————————————————————
if (errores.length > 0) {
  const version = existsSync(VERSION) ? readFileSync(VERSION, 'utf8').trim() : 'desconocida';
  process.stderr.write(`\nKit de Seguridad 512 (v${version}) — ${errores.length} problema(s):\n\n`);
  for (const error of errores) process.stderr.write(`  ✗ ${error}\n\n`);
  process.exit(1);
}

const version = readFileSync(VERSION, 'utf8').trim();
process.stdout.write(
  `Kit de Seguridad 512 v${version}: ${comparados} archivos de núcleo intactos.\n`,
);
