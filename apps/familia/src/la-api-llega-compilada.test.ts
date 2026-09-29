/**
 * La función de Vercel recibe JavaScript, no TypeScript — orden Códice #15, F.4.
 *
 * ── El defecto que este archivo existe para que no vuelva ───────────────
 * El 29/9/2026 la #15 se desplegó y **toda** `/api/*` devolvió 500:
 *
 *     Error [ERR_MODULE_NOT_FOUND]: Cannot find module
 *     '/var/task/apps/familia/node_modules/@codice/api/src/index.ts'
 *     imported from /var/task/apps/familia/api/index.js
 *
 * `apps/api/package.json` exportaba el **fuente**: `"exports": "./src/index.ts"`.
 * Vercel compila la entrada de la función (`apps/familia/api/index.ts`) y nada
 * más: las dependencias del workspace viajan tal como están. En el servidor,
 * Node recibió un `.ts` y no lo pudo ejecutar.
 *
 * ── Por qué ninguna comprobación lo vio, que es lo que importa ──────────
 * Porque **en la máquina anda**. Vitest transpila todo lo que importa, así que
 * los 48 tests de `@codice/api` corrían felices sobre el `.ts`; `tsc --noEmit`
 * tampoco mira cómo se ejecuta; el build de la pantalla ni toca el paquete. Las
 * tres herramientas que podían haberlo dicho tienen en común que **no arrancan
 * la función**. Es el perfil de defecto de la casa —el `X-Robots-Tag` de la #08,
 * el `Cache-Control` de la #11—: un archivo de configuración que nadie lee hasta
 * que está publicado.
 *
 * ── Qué afirma, entonces ────────────────────────────────────────────────
 * Recorre el **cierre real** de la función: arranca en `apps/familia/api/index.ts`,
 * junta los `@codice/*` que importa, entra al fuente de cada uno y sigue. De
 * cada paquete del cierre mira lo que Node va a resolver —no lo que TypeScript
 * resuelve— y exige que sea `.js`, que exista compilado, que el `vercel.json`
 * lo construya antes que la pantalla y que el compilado conserve los metadatos
 * de los decoradores, sin los cuales NestJS no puede inyectar nada.
 *
 * El cierre se recorre en vez de mirar una lista escrita a mano por la razón de
 * siempre: una lista se desactualiza en silencio. El día que `@codice/api`
 * importe `@codice/core`, este barrido lo va a incluir solo — y `@codice/core`
 * exporta `src/index.ts` hoy, así que se va a poner rojo el mismo día, que es
 * cuando sirve.
 *
 * ── Lo que NO comprueba, y está dicho para que el verde no se lea de más ─
 * Que Vercel **despliegue** bien. Eso se mide con un `GET /api/salud` contra el
 * preview y es F.4; acá se comprueba lo que se le va a entregar a Vercel. Y la
 * resolución de `exports` que implementa `entradaDeEjecucion()` es la parte que
 * usa este repo —cadena, o condiciones `node`/`require`/`import`/`default`—, no
 * la especificación entera: sin `imports`, sin patrones `./*`, sin subrutas.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
/* La regla de «¿Node puede requerir esto?» se importa del build y no se copia:
   es la misma que decide qué entra al empaquetado. Dos copias serían dos
   verdades, y el día que no coincidieran mandaría la del servidor. El camino es
   relativo y feo porque es un módulo de build, que no tiene alias de tsconfig
   ni lo tendría a buen precio. */
import { sePuedeRequerir } from '../../api/scripts/se-puede-requerir.mjs';

const APP = dirname(dirname(fileURLToPath(import.meta.url)));
const RAIZ = dirname(dirname(APP));
const ENTRADA = join(APP, 'api', 'index.ts');

/** Dónde puede vivir un paquete del workspace (`pnpm-workspace.yaml`). */
const CARPETAS = ['apps', 'packages'];

/**
 * El texto sin comentarios.
 *
 * ── Por qué no se importa el `soloCodigo()` del vecino ──────────────────
 * Porque el vecino es un `.test.ts`: importarlo ejecutaría sus `describe` acá
 * adentro y los mismos tres tests quedarían declarados dos veces, inflando la
 * cuenta que `qa/piso-de-tests.md` vigila. Un piso que se cumple con copias no
 * es un piso.
 *
 * Y lo que se limpia es **sólo** comentario, no cadenas: acá los
 * especificadores que se buscan **son** cadenas (`from '@codice/api'`). El que
 * hay que sacar es el otro: este archivo y el de la función nombran
 * `@codice/api` una docena de veces al explicarse, y un barrido que lee la
 * prosa encuentra dependencias que nadie importó.
 */
export function sinComentarios(fuente: string): string {
  const enBlanco = (m: string) => m.replace(/[^\n]/g, ' ');
  return fuente.replace(/\/\*[\s\S]*?\*\//g, enBlanco).replace(/\/\/[^\n]*/g, enBlanco);
}

/** Los `@codice/*` que un archivo importa de verdad. */
export function paquetesImportados(fuente: string): string[] {
  const codigo = sinComentarios(fuente);
  const hallados = new Set<string>();
  const formas = [
    /\bfrom\s*['"](@codice\/[^'"]+)['"]/g,
    /\bimport\s*\(\s*['"](@codice\/[^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"](@codice\/[^'"]+)['"]\s*\)/g,
  ];
  for (const forma of formas) {
    for (const [, nombre] of codigo.matchAll(forma)) hallados.add(nombre.split('/').slice(0, 2).join('/'));
  }
  return [...hallados].sort();
}

type Paquete = { nombre: string; dir: string; manifiesto: Record<string, unknown> };

/** El mapa del workspace: nombre de paquete → carpeta y manifiesto. */
function workspace(): Map<string, Paquete> {
  const mapa = new Map<string, Paquete>();
  for (const carpeta of CARPETAS) {
    const base = join(RAIZ, carpeta);
    if (!existsSync(base)) continue;
    for (const entrada of readdirSync(base)) {
      const dir = join(base, entrada);
      const manifiestoRuta = join(dir, 'package.json');
      if (!statSync(dir).isDirectory() || !existsSync(manifiestoRuta)) continue;
      const manifiesto = JSON.parse(readFileSync(manifiestoRuta, 'utf8')) as Record<string, unknown>;
      const nombre = manifiesto.name;
      if (typeof nombre === 'string') mapa.set(nombre, { nombre, dir, manifiesto });
    }
  }
  return mapa;
}

/**
 * Lo que **Node** va a resolver de un paquete, que no es lo que resuelve
 * TypeScript.
 *
 * La condición `types` se saltea a propósito y es el corazón de la
 * comprobación: `apps/api/package.json` apunta `types` al fuente —para que
 * `pnpm typecheck` ande sobre un repo recién clonado— y `default` al compilado.
 * Un barrido que leyera la primera condición que encuentra daría rojo sobre un
 * manifiesto correcto; uno que lea `main` a secas daría verde sobre uno roto,
 * porque `exports` le gana a `main` cuando los dos están.
 */
export function entradaDeEjecucion(manifiesto: Record<string, unknown>): string | null {
  const CONDICIONES = ['node', 'require', 'import', 'default'];

  const resolver = (valor: unknown): string | null => {
    if (typeof valor === 'string') return valor;
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
    const objeto = valor as Record<string, unknown>;
    for (const condicion of CONDICIONES) {
      if (condicion in objeto) {
        const resuelto = resolver(objeto[condicion]);
        if (resuelto) return resuelto;
      }
    }
    return null;
  };

  const exportaciones = manifiesto.exports;
  if (typeof exportaciones === 'string') return exportaciones;
  if (exportaciones && typeof exportaciones === 'object') {
    const raiz = (exportaciones as Record<string, unknown>)['.'];
    /* Un `exports` sin `.` pero con condiciones sueltas también es la raíz. */
    const resuelto = resolver(raiz ?? exportaciones);
    if (resuelto) return resuelto;
  }
  if (typeof manifiesto.main === 'string') return manifiesto.main;
  return null;
}

/** Los fuentes de un paquete, sin los tests (no viajan a la función). */
function fuentesDe(dir: string): string[] {
  const salida: string[] = [];
  const recorrer = (actual: string) => {
    if (!existsSync(actual)) return;
    for (const entrada of readdirSync(actual)) {
      const completo = join(actual, entrada);
      if (statSync(completo).isDirectory()) {
        if (entrada === 'node_modules' || entrada === 'dist') continue;
        recorrer(completo);
      } else if (/\.tsx?$/.test(entrada) && !/\.(spec|test)\.tsx?$/.test(entrada)) {
        salida.push(completo);
      }
    }
  };
  recorrer(join(dir, 'src'));
  return salida.sort();
}

/**
 * El cierre: todo paquete del workspace que la función va a necesitar en
 * ejecución, empezando por la entrada y siguiendo los imports hacia adentro.
 */
function cierreDeLaFuncion(): Paquete[] {
  const mapa = workspace();
  const vistos = new Map<string, Paquete>();
  const pendientes = paquetesImportados(readFileSync(ENTRADA, 'utf8'));

  while (pendientes.length) {
    const nombre = pendientes.shift() as string;
    if (vistos.has(nombre)) continue;
    const paquete = mapa.get(nombre);
    if (!paquete) continue;
    vistos.set(nombre, paquete);
    for (const archivo of fuentesDe(paquete.dir)) {
      pendientes.push(...paquetesImportados(readFileSync(archivo, 'utf8')));
    }
  }
  return [...vistos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

const CIERRE = cierreDeLaFuncion();
const VERCEL = JSON.parse(readFileSync(join(APP, 'vercel.json'), 'utf8')) as { buildCommand: string };

describe('la función de Vercel recibe JavaScript, no TypeScript', () => {
  it('EL PISO, PRIMERO: el cierre se calculó sobre la entrada de verdad', () => {
    /* Sin esto, todo lo de abajo saldría verde sobre una lista vacía: si la
       función se renombra, si `api/index.ts` se mueve o si el lector de imports
       se rompe, «ningún paquete apunta a un .ts» es cierto por no haber mirado
       ninguno. */
    expect(existsSync(ENTRADA), `no está ${relative(RAIZ, ENTRADA)}: la función de Vercel se movió o se renombró.`).toBe(true);
    expect(
      CIERRE.map((p) => p.nombre),
      'la entrada de la función ya no importa ningún paquete del workspace. O la función cambió de '
      + 'forma, o `paquetesImportados()` dejó de leer los imports — y las dos cosas dejan este '
      + 'archivo mirando el vacío.',
    ).toContain('@codice/api');
  });

  it('ningún paquete del cierre le entrega un `.ts` a Node', () => {
    const rotos = CIERRE
      .map((p) => ({ nombre: p.nombre, entrada: entradaDeEjecucion(p.manifiesto) }))
      .filter((p) => p.entrada === null || /\.tsx?$/.test(p.entrada))
      .map((p) => `${p.nombre}: resuelve a ${p.entrada ?? '(nada: sin `exports` ni `main`)'}`);

    expect(
      rotos,
      'Vercel compila SÓLO la entrada de la función; lo que resuelvan los paquetes del workspace '
      + 'viaja tal cual al servidor. Un `.ts` acá es un ERR_MODULE_NOT_FOUND en producción, que es '
      + 'lo que pasó el 29/9/2026 con `"exports": "./src/index.ts"`. El paquete tiene que compilar '
      + 'a `dist/` y apuntar ahí su condición de ejecución; `types` sí puede seguir en el fuente.',
    ).toEqual([]);
  });

  it('y ese `.js` existe compilado, con su script de build que lo hace', () => {
    const problemas: string[] = [];
    for (const paquete of CIERRE) {
      const guiones = (paquete.manifiesto.scripts ?? {}) as Record<string, string>;
      if (!guiones.build) {
        problemas.push(`${paquete.nombre}: no tiene script \`build\`, así que nadie compila lo que promete.`);
        continue;
      }
      const entrada = entradaDeEjecucion(paquete.manifiesto);
      if (entrada && !existsSync(join(paquete.dir, entrada))) {
        problemas.push(`${paquete.nombre}: promete ${entrada} y ese archivo no está. Corré \`pnpm build\`.`);
      }
    }
    expect(
      problemas,
      'Un manifiesto que apunta a un `dist/` que nadie construye falla igual que uno que apunta al '
      + 'fuente, sólo que el error dice otra cosa.',
    ).toEqual([]);
  });

  it('el `buildCommand` del vercel.json los construye ANTES que la pantalla', () => {
    const comando = VERCEL.buildCommand ?? '';
    const dondeEsta = (nombre: string) => {
      const encontrado = comando.match(new RegExp(`--filter\\s+${nombre.replace('/', '\\/')}\\.{0,3}\\s+build`));
      return encontrado?.index ?? -1;
    };
    const pantalla = dondeEsta('@codice/familia');
    expect(pantalla, `el buildCommand no construye @codice/familia: «${comando}»`).toBeGreaterThanOrEqual(0);

    const problemas = CIERRE
      .filter((p) => p.nombre !== '@codice/familia')
      .map((p) => ({ nombre: p.nombre, pos: dondeEsta(p.nombre) }))
      .filter((p) => p.pos < 0 || p.pos > pantalla)
      .map((p) => (p.pos < 0
        ? `${p.nombre}: el buildCommand no lo construye`
        : `${p.nombre}: se construye DESPUÉS de la pantalla`));

    expect(
      problemas,
      `buildCommand actual: «${comando}». Vercel corre un solo comando y no sabe nada del grafo de `
      + 'pnpm: si el paquete no se compila ahí, el `dist/` que el manifiesto promete no existe en el '
      + 'despliegue — aunque exista en la máquina de quien lo escribió.',
    ).toEqual([]);
  });

  it('el empaquetado conserva los metadatos de los decoradores y no requiere ESM puro', () => {
    const api = CIERRE.find((p) => p.nombre === '@codice/api');
    expect(api, 'sin @codice/api en el cierre no hay nada que mirar acá').toBeDefined();
    const dir = (api as Paquete).dir;
    const dist = join(dir, 'dist');

    /* (1) CommonJS de verdad. El núcleo del kit se copia byte por byte y trae
       imports sin extensión (`./roles`), que Node ESM se niega a resolver. Si
       este `dist/` se leyera como ESM, la función se caería igual que el 29/9,
       un nivel más adentro. */
    const sello = join(dist, 'package.json');
    expect(existsSync(sello), 'falta `dist/package.json`: sin el sello, el `type` del paquete decide, y puede cambiar.').toBe(true);
    expect(JSON.parse(readFileSync(sello, 'utf8')).type).toBe('commonjs');
    expect(
      (api as Paquete).manifiesto.type,
      '`@codice/api` volvió a declararse `"type": "module"` y emite CommonJS: cada `.js` de `dist/` '
      + 'se va a leer como ESM.',
    ).not.toBe('module');

    /* (2) `emitDecoratorMetadata` sobrevivió a las dos pasadas. Es lo que la
       orden pide verificar y no se ve de ninguna otra forma: sin
       `design:paramtypes`, Nest arranca igual y se cae al construir el primer
       provider con dependencias — en ejecución, no en el build. Es también el
       motivo por el que `tsc` va primero y esbuild después: esbuild no sabe
       emitir estos metadatos, así que empaquetar el fuente directo dejaría un
       build verde y una función muerta. */
    const empaquetado = join(dist, 'funcion.cjs');
    expect(existsSync(empaquetado), 'no está `dist/funcion.cjs`: el empaquetado no corrió. Corré `pnpm build`.').toBe(true);
    const codigo = readFileSync(empaquetado, 'utf8');
    expect(
      codigo,
      'el empaquetado perdió `design:paramtypes`. `RolMiddleware` recibe `SupabaseService` por el '
      + 'tipo del constructor y nada más: sin metadatos, Nest no sabe qué inyectarle.',
    ).toContain('design:paramtypes');
    expect(codigo).toContain('SupabaseService');

    /* (3) Y nada de lo que quedó AFUERA del empaquetado es ESM puro.
       `jose@6` no publica CommonJS, y el `require("jose")` que emitía `tsc`
       tiró la función entera con ERR_REQUIRE_ESM el 29/9/2026 —la segunda
       caída del mismo día, después del `.ts`—. La comprobación no busca `jose`
       por su nombre: le pregunta a cada paquete que el empaquetado todavía
       requiere si Node lo puede requerir, con la misma regla que usó el build
       para decidirlo. Un nombre escrito acá sólo cazaría a éste; la regla caza
       al próximo. */
    const requeridos = [...codigo.matchAll(/require\(["']([^"'.][^"']*)["']\)/g)]
      .map(([, nombre]) => nombre)
      .filter((nombre) => !nombre.startsWith('node:'));
    const esmPuro: string[] = [];
    for (const nombre of [...new Set(requeridos)]) {
      let manifiesto: Record<string, unknown> | null = null;
      try {
        manifiesto = JSON.parse(readFileSync(join(dir, 'node_modules', nombre, 'package.json'), 'utf8'));
      } catch {
        /* Sin manifiesto legible no se puede afirmar nada, y afirmar de menos
           es mejor que afirmar de más: se lista aparte en vez de aprobarse. */
        esmPuro.push(`${nombre}: no se pudo leer su package.json para saber si se puede requerir`);
        continue;
      }
      if (!sePuedeRequerir(manifiesto)) esmPuro.push(`${nombre}: es ESM puro y quedó como require()`);
    }
    expect(
      esmPuro,
      'El empaquetado dejó afuera algo que Node no puede `require()`. `scripts/empaquetar-funcion.mjs` '
      + 'mete adentro lo que no se puede requerir y deja afuera el resto: si esto está en rojo, o la '
      + 'regla dejó de coincidir con la realidad, o una dependencia cambió de formato. El síntoma en '
      + 'vivo es ERR_REQUIRE_ESM y un 500 en toda /api/*.',
    ).toEqual([]);
  });

  it('y el lector de manifiestos distingue el fuente del compilado', () => {
    /* La mitad que hace que los verdes de arriba valgan: si `entradaDeEjecucion()`
       devolviera siempre `null`, o leyera la condición `types`, los dos primeros
       tests saldrían verdes sobre un repo roto. */
    expect(entradaDeEjecucion({ exports: './src/index.ts' })).toBe('./src/index.ts');
    expect(entradaDeEjecucion({ exports: { '.': './src/index.ts' } })).toBe('./src/index.ts');
    expect(entradaDeEjecucion({ main: 'src/index.ts' })).toBe('src/index.ts');
    expect(entradaDeEjecucion({ exports: { '.': { types: './src/index.ts', default: './dist/index.js' } } })).toBe('./dist/index.js');
    /* `exports` le gana a `main`: un `main` compilado NO rescata un `exports` al fuente. */
    expect(entradaDeEjecucion({ main: 'dist/index.js', exports: { '.': './src/index.ts' } })).toBe('./src/index.ts');
    expect(entradaDeEjecucion({})).toBeNull();

    /* Y el lector de imports, que es el otro punto por donde esto se vuelve un
       espejo: tiene que leer el código y no la prosa que lo explica. */
    expect(paquetesImportados("import { x } from '@codice/api';")).toEqual(['@codice/api']);
    expect(paquetesImportados("// habla de '@codice/core' en un comentario")).toEqual([]);
    expect(paquetesImportados("/* from '@codice/core' en un bloque */")).toEqual([]);
    expect(paquetesImportados("const a = require('@codice/ui/styles.css');")).toEqual(['@codice/ui']);

    /* Y la regla del empaquetado, contra los dos manifiestos de verdad que hay
       en disco: si `sePuedeRequerir()` devolviera siempre `true`, el (3) de
       arriba saldría verde sobre el mismo `jose` que tiró la función. */
    const manifiesto = (nombre: string) =>
      JSON.parse(readFileSync(join(RAIZ, 'apps', 'api', 'node_modules', nombre, 'package.json'), 'utf8'));
    expect(sePuedeRequerir(manifiesto('jose')), '`jose@6` es ESM puro y la regla tiene que decirlo').toBe(false);
    expect(sePuedeRequerir(manifiesto('express')), '`express` se puede requerir y la regla tiene que decirlo').toBe(true);
  });
});
