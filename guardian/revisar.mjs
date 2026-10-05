/**
 * GUARDIÁN DE LOS MOLDES · v1 (formato 1.2 del kit de acceso)
 *
 * Los paquetes del molde tienen que ser IDÉNTICOS en todas las apps. Una mejora
 * se hace acá, en `moldes-apps`, sube la versión y se regeneran las huellas; NO
 * se edita un paquete dentro de una app. Este guardián es lo que hace que esa
 * regla no dependa de la memoria de nadie.
 *
 * Qué revisa, contra `HUELLAS.txt`:
 *  1. Cada archivo de cada paquete (y `tsconfig.base.json`, suelto en la
 *     carpeta de paquetes) contra su SHA-256. Si alguno cambió, falla y
 *     dice cuál.
 *  2. Que no haya archivos SIN huella (sumar uno a escondidas sería la forma
 *     obvia de esquivar el punto 1).
 *  3. Que no falte ninguno de los que tienen huella, ni ningún paquete.
 *  4. Que la versión de `HUELLAS.txt`, la de `VERSION` y la de cada
 *     `package.json` sean la misma.
 *  5. Que no haya `console.log` en ningún paquete.
 *  6. El Kit de Acceso instalado en una app (desde 1.3.0, uno de los paquetes):
 *     su núcleo en las dos instalaciones (backend y frontend) contra las mismas
 *     huellas, ningún archivo de núcleo sin huella, la config (`acceso.config.ts`)
 *     presente en las dos e IDÉNTICA, y ningún `console.log` en sus carpetas. Son
 *     los chequeos del guardián viejo del kit, que se apaga al instalar 1.3.0.
 *
 * PISO: si terminó comparando menos archivos de los que el molde tiene, falla.
 * Un guardián que compara cero archivos y dice «todo bien» es peor que ninguno.
 *
 * ── Dónde están los paquetes ───────────────────────────────────────────────
 * En este repo, en `packages/`. En una app que instala el molde copiando, la app
 * lo declara en `moldes/instalacion.json` (que reemplaza al `instalaciones.json`
 * del kit viejo):
 *
 *   {
 *     "paquetes": "packages/moldes",
 *     "acceso": { "backend": "apps/api/src/acceso", "frontend": "apps/web/src/acceso" }
 *   }
 *
 * Las huellas se guardan relativas a la carpeta de paquetes (`ui/components/…`,
 * `acceso/nucleo/backend/…`), así el mismo `HUELLAS.txt` sirve en cualquier
 * repo. Con `acceso` declarado, el núcleo del kit se busca en esas dos carpetas
 * (`<backend>/nucleo/…`) y no hace falta copiar el paquete `acceso` entero.
 *
 * Sin dependencias: corre con `node` pelado.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Los paquetes del molde a la 1.0.0. Si falta uno, no está instalado entero. */
export const PAQUETES = ['design', 'ui', 'idiomas', 'ajustes', 'inicio', 'app-shell', 'bienvenida', 'acceso'];
/** El núcleo del Kit de Acceso: lo único del paquete `acceso` que se instala en una app. */
export const PISO_DEL_NUCLEO = 21;
const INSTALACIONES_DEL_KIT = ['backend', 'frontend'];
/** Lo que no es fuente: salida de herramientas y dependencias. */
const FUERA = new Set(['node_modules', 'dist', '.corridas', '.DS_Store']);
/**
 * Piso de archivos comparados: el tamaño del molde a la 1.0.0, menos un margen
 * chico. Si una carpeta no existe o HUELLAS.txt quedó vacío, se compara mucho
 * menos que esto y no se puede dar el verde. Sube cuando el molde crece.
 */
export const PISO_DE_ARCHIVOS = 300;

const normalizar = (ruta) => ruta.split(sep).join('/');
export const sha256 = (ruta) => createHash('sha256').update(readFileSync(ruta)).digest('hex');

function archivos(dir) {
  if (!existsSync(dir)) return [];
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    if (FUERA.has(nombre)) continue;
    const completo = join(dir, nombre);
    if (statSync(completo).isDirectory()) salida.push(...archivos(completo));
    else salida.push(completo);
  }
  return salida;
}

/**
 * Lee `moldes/instalacion.json`. Devuelve `{ paquetes, acceso, errores }`:
 * `acceso` es `null` en este repo (el kit es un paquete más) o
 * `{ backend, frontend }` con las rutas absolutas de la app. Solo se admiten
 * esas claves: nada más es configurable.
 */
export function leerInstalacion(raiz) {
  const errores = [];
  const ruta = join(raiz, 'moldes', 'instalacion.json');
  let json = {};
  if (existsSync(ruta)) {
    try { json = JSON.parse(readFileSync(ruta, 'utf8')); } catch { errores.push('moldes/instalacion.json no es JSON válido.'); }
  }
  for (const clave of Object.keys(json)) {
    if (!['paquetes', 'acceso'].includes(clave)) errores.push(`instalacion.json: clave desconocida «${clave}». Solo «paquetes» y «acceso».`);
  }
  let acceso = null;
  if (json.acceso !== undefined) {
    acceso = {};
    for (const nombre of INSTALACIONES_DEL_KIT) {
      const r = json.acceso[nombre];
      if (typeof r !== 'string' || !/(^|\/)acceso$/.test(r)) errores.push(`instalacion.json: «acceso.${nombre}» tiene que ser una ruta que termine en /acceso.`);
      else acceso[nombre] = join(raiz, ...r.split('/'));
    }
    for (const clave of Object.keys(json.acceso)) {
      if (!INSTALACIONES_DEL_KIT.includes(clave)) errores.push(`instalacion.json: «acceso.${clave}» no existe. Solo «backend» y «frontend».`);
    }
  }
  const paquetes = typeof json.paquetes === 'string' ? join(raiz, ...json.paquetes.split('/')) : join(raiz, 'packages');
  return { paquetes, acceso, errores };
}

/** Dónde están los paquetes en este repo (ver la cabecera). */
export function carpetaDePaquetes(raiz) {
  return leerInstalacion(raiz).paquetes;
}

/**
 * El guardián también tiene huella: si alguien lo edita en una app para que dé
 * verde siempre, eso es lo primero que tiene que ponerse rojo. Viven en
 * `guardian/` en la raíz, acá y en cada app.
 */
export const ARCHIVOS_DEL_GUARDIAN = ['check.mjs', 'huellas.mjs', 'revisar.mjs'];

/**
 * Los archivos sueltos de la carpeta de paquetes, fuera de cualquier paquete.
 * `tsconfig.base.json`: de él dependen los `tsconfig.json` de cada paquete (y
 * con ellos Vite, para compilar los `.jsx` del molde). Editarlo en una app
 * cambia cómo se compila el molde ahí, igual que editar un paquete.
 */
export const SUELTOS = ['tsconfig.base.json'];

/** Todos los archivos del molde (los paquetes, los sueltos y el guardián), como `{ clave, abs }`, ordenados. */
export function archivosDelMolde(raiz) {
  const base = carpetaDePaquetes(raiz);
  const delGuardian = ARCHIVOS_DEL_GUARDIAN
    .map((nombre) => ({ clave: `guardian/${nombre}`, abs: join(raiz, 'guardian', nombre) }))
    .filter((a) => existsSync(a.abs));
  const sueltos = SUELTOS.map((nombre) => ({ clave: nombre, abs: join(base, nombre) })).filter((a) => existsSync(a.abs));
  return [
    ...PAQUETES.flatMap((p) => archivos(join(base, p))).map((abs) => ({ clave: normalizar(relative(base, abs)), abs })),
    ...sueltos,
    ...delGuardian,
  ].sort((a, b) => a.clave.localeCompare(b.clave));
}

/** Lee `HUELLAS.txt`: la versión de la cabecera y el mapa clave → sha. */
export function leerHuellas(texto) {
  const version = /^# Moldes de mis apps · v(\S+)/m.exec(texto)?.[1] ?? null;
  const huellas = new Map();
  for (const renglon of texto.split('\n')) {
    const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(renglon.trim());
    if (m) huellas.set(m[2], m[1]);
  }
  return { version, huellas };
}

/** El `HUELLAS.txt` de ahora, para regenerarlo (ver `huellas.mjs`). */
export function escribirHuellas(raiz, version) {
  const entradas = archivosDelMolde(raiz);
  return [
    `# Moldes de mis apps · v${version}`,
    '#',
    '# SHA-256 de cada archivo de cada paquete del molde. `guardian/check.mjs` los',
    '# compara en cada `pnpm test`. Si una huella no coincide, alguien editó el',
    '# molde dentro de una app: eso se revierte, no se re-genera.',
    '#',
    '# Se regenera SOLO cuando el molde cambia de verdad, con la versión ya subida:',
    '#   node guardian/huellas.mjs',
    '',
    ...entradas.map((e) => `${sha256(e.abs)}  ${e.clave}`),
    '',
  ].join('\n');
}

/**
 * La revisión entera. Devuelve `{ errores, comparados, version }`; sin errores
 * es verde. No escribe nada.
 */
export function revisar(raiz, { piso = PISO_DE_ARCHIVOS, pisoDelNucleo = PISO_DEL_NUCLEO } = {}) {
  const instalacion = leerInstalacion(raiz);
  const errores = [...instalacion.errores];
  const rutaHuellas = join(raiz, 'HUELLAS.txt');
  const rutaVersion = join(raiz, 'VERSION');
  if (!existsSync(rutaHuellas)) return { errores: ['Falta HUELLAS.txt en la raíz.'], comparados: 0, version: null };
  if (!existsSync(rutaVersion)) errores.push('Falta VERSION en la raíz.');
  const version = existsSync(rutaVersion) ? readFileSync(rutaVersion, 'utf8').trim() : null;
  const { version: deLasHuellas, huellas } = leerHuellas(readFileSync(rutaHuellas, 'utf8'));

  // 4 · Una sola versión.
  if (deLasHuellas !== version) errores.push(`HUELLAS.txt dice v${deLasHuellas} y VERSION dice ${version}.`);
  const base = instalacion.paquetes;
  const kitInstalado = instalacion.acceso;
  for (const p of PAQUETES) {
    const pkg = join(base, p, 'package.json');
    // En una app, el kit se instala por su núcleo (abajo): el paquete entero no hace falta.
    if (p === 'acceso' && kitInstalado && !existsSync(join(base, p))) continue;
    if (!existsSync(join(base, p))) { errores.push(`Falta el paquete «${p}».`); continue; }
    if (existsSync(pkg)) {
      const v = JSON.parse(readFileSync(pkg, 'utf8')).version;
      if (v !== version) errores.push(`${p}/package.json dice ${v} y VERSION dice ${version}.`);
    }
  }

  // 1 · 2 · 3 · Archivo por archivo.
  const presentes = archivosDelMolde(raiz);
  const vistos = new Set();
  let comparados = 0;
  for (const { clave, abs } of presentes) {
    vistos.add(clave);
    const esperada = huellas.get(clave);
    if (!esperada) { errores.push(`Archivo sin huella: ${clave}. Si es parte del molde, se suma subiendo la versión; si no, no va acá.`); continue; }
    comparados += 1;
    if (sha256(abs) !== esperada) errores.push(`Cambió: ${clave}. El molde no se edita dentro de una app: se revierte, o se propone al molde.`);
  }
  // 6 · El Kit de Acceso instalado en una app.
  let delNucleo = 0;
  if (kitInstalado) {
    for (const nombre of INSTALACIONES_DEL_KIT) {
      const dir = kitInstalado[nombre];
      if (!dir) continue;
      const rel = (abs) => normalizar(relative(raiz, abs));
      if (!existsSync(join(dir, 'acceso.config.ts'))) errores.push(`Falta ${rel(join(dir, 'acceso.config.ts'))}: sin config el núcleo no sabe nada.`);
      if (!existsSync(join(dir, 'nucleo'))) { errores.push(`Falta la carpeta del núcleo ${rel(join(dir, 'nucleo'))}.`); continue; }
      const prefijo = `acceso/nucleo/${nombre}/`;
      const instalados = archivos(join(dir, 'nucleo')).map((abs) => ({ clave: prefijo + normalizar(relative(join(dir, 'nucleo'), abs)), abs }));
      for (const { clave, abs } of instalados) {
        vistos.add(clave);
        const esperada = huellas.get(clave);
        if (!esperada) { errores.push(`Archivo en el núcleo del Kit de Acceso SIN huella: ${rel(abs)}. Si es de esta app, no es núcleo: va afuera, como adaptador.`); continue; }
        delNucleo += 1;
        comparados += 1;
        if (sha256(abs) !== esperada) errores.push(`Cambió el núcleo del Kit de Acceso: ${rel(abs)}. No se edita dentro de una app: se revierte, o se propone al molde.`);
      }
      for (const abs of archivos(dir)) {
        if (/\.(ts|tsx|js|mjs)$/.test(abs) && /\bconsole\s*\.\s*log\b/.test(readFileSync(abs, 'utf8'))) errores.push(`console.log en ${rel(abs)}.`);
      }
    }
    const configs = INSTALACIONES_DEL_KIT.map((n) => kitInstalado[n] && join(kitInstalado[n], 'acceso.config.ts')).filter((c) => c && existsSync(c));
    if (configs.length === 2 && sha256(configs[0]) !== sha256(configs[1])) {
      errores.push('Las dos copias de acceso.config.ts (backend y frontend) son distintas: tienen que decir lo MISMO, o el servidor y la pantalla van a discrepar sobre quién necesita el segundo paso.');
    }
    if (delNucleo < pisoDelNucleo) errores.push(`Se compararon ${delNucleo} archivos del núcleo del Kit de Acceso y el núcleo tiene ${pisoDelNucleo}: algo no se leyó.`);
  }

  for (const clave of huellas.keys()) {
    if (vistos.has(clave)) continue;
    // En una app con el kit instalado por su núcleo, lo del paquete `acceso` que
    // no es núcleo (adaptador de ejemplo, tests por app, LEEME) no se instala.
    if (kitInstalado && clave.startsWith('acceso/') && !existsSync(join(base, 'acceso'))) {
      if (!clave.startsWith('acceso/nucleo/')) continue;
    }
    errores.push(`Falta: ${clave}.`);
  }

  // 5 · Sin console.log.
  for (const { clave, abs } of presentes) {
    if (!/\.(m?jsx?|tsx?)$/.test(clave)) continue;
    readFileSync(abs, 'utf8').split('\n').forEach((renglon, i) => {
      if (/\bconsole\.log\s*\(/.test(renglon)) errores.push(`console.log en ${clave}:${i + 1}.`);
    });
  }

  // PISO, al final y siempre: un cero no es un verde.
  if (comparados < piso) errores.push(`Se compararon ${comparados} archivos y el piso es ${piso}: algo no se leyó.`);
  return { errores, comparados, version };
}
