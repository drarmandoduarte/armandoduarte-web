#!/usr/bin/env node
/**
 * El guardián de los guardianes.
 *
 * ── El problema, en una línea ──────────────────────────────────────────────
 * **Un guardián que deja de correr no grita: se calla.** Y un silencio se parece
 * muchísimo a un «todo bien». Medido en Omnia, que es de donde viene este
 * archivo, con un test de víctima:
 *
 *   · `it.skip`               → «230 passed · 1 skipped»   → salida 0, VERDE
 *   · `describe.skip`         → «228 passed · 3 skipped»   → salida 0, VERDE
 *   · el archivo se renombra  → «21 archivos · 225 passed» → salida 0, VERDE
 *   · el `beforeAll` falla    → «7 skipped»                → salida 1, rojo
 *
 * El tercero es el peor: no deja ni rastro. La cuenta baja y nada en la salida
 * dice que falta algo.
 *
 * ── Qué hace, y por qué orquesta en vez de leer ────────────────────────────
 * Corre las suites él mismo y después lee los reportes. Podría limitarse a leer
 * cuatro `.vitest-report.json` que hubiera dejado otro comando, pero entonces
 * tendría el mismo defecto que persigue: un reporte viejo de una corrida
 * anterior se lee exactamente igual que uno fresco. **Borrando los reportes
 * antes de correr, un reporte que falta solo puede significar que esa suite no
 * corrió**, que es precisamente lo que hay que detectar.
 *
 * ── Dónde está el punto de confianza, que es uno solo y va escrito ─────────
 * En **`pnpm test`**, que es lo que la gate de `CLAUDE.md` llama y lo que este
 * archivo es. De ahí para adentro todo se comprueba solo: si una suite no
 * corre, falta su reporte → rojo; si un test se saltea sin permiso → rojo; si
 * un permiso sobra → rojo; si la cuenta baja → rojo; y si este análisis deja de
 * funcionar, lo dice el auto-examen de abajo, que corre en cada corrida.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Las suites de Vitest, con dónde deja cada una su reporte. */
const SUITES = [
  ['@codice/ui', 'packages/ui'],
  ['@codice/core', 'packages/core'],
  ['@codice/prompts', 'packages/prompts'],
  ['@codice/web', 'apps/web'],
];

/**
 * Y la quinta suite, que no es de Vitest: el guardián de fidelidad.
 *
 * ── Por qué entra a `pnpm test` y no queda como un comando aparte ─────────
 * Porque **lo que hay que acordarse de correr no se corre**, y esta es la única
 * comprobación que mide lo que la orden #01 pide: que el port sea indistinguible
 * del sitio estático. Dejarlo en `pnpm test:e2e` sería dejar la afirmación
 * central del trabajo a cargo de la memoria de alguien.
 *
 * Cuesta unos cuarenta segundos y un build. Es caro y es lo que vale: el resto
 * de la gate puede estar verde con la web dibujando otra cosa.
 *
 * ── Lo que necesita, y falla fuerte si no está ───────────────────────────
 * El sitio estático —desde la orden #04, `qa/referencia/` de este mismo repo,
 * versionado— y Chromium (`pnpm qa:instalar`). Las dos ausencias dan un rojo
 * que dice cuál es.
 */
const NAVEGADOR = '@codice/navegador';
const REPORTE_NAVEGADOR = 'apps/web/.playwright-report.json';

const REPORTE = '.vitest-report.json';
const PERMITIDOS = 'qa/skips-permitidos.md';
const PISO = 'qa/piso-de-tests.md';

/* ── Los dos documentos, leídos y no copiados ───────────────────────────────
   Las dos listas viven en markdown y no en un `.json` a propósito: son
   documentos que alguien tiene que leer para poder cambiarlos, y una tabla con
   columna de motivo obliga a escribir por qué. */

/**
 * Las filas de la **primera** tabla de un markdown, sin cabecera ni separador.
 *
 * La primera y no todas, y costó un susto en Omnia: con `piso.set(paquete, n)`
 * sobre las filas de todas las tablas, **la última fila que nombrara un paquete
 * ganaba**, así que una segunda tabla de comparación le bajaba el piso al
 * primero en silencio. Es el defecto que este script existe para cazar,
 * cometido por el script. Se corta al terminar la primera tabla, y el
 * auto-examen lo prueba con un markdown de dos.
 */
export function filasDeTabla(md) {
  const filas = [];
  let empezo = false;
  for (const linea of md.split('\n')) {
    const l = linea.trim();
    if (!l.startsWith('|')) {
      if (empezo && l !== '') break;
      continue;
    }
    empezo = true;
    const celdas = l.split('|').slice(1, -1).map((c) => c.trim());
    if (celdas.length < 2) continue;
    if (/^-{2,}$/.test(celdas[0].replace(/:/g, ''))) continue;
    filas.push(celdas);
  }
  return filas;
}

/** Los saltos permitidos: nombre completo del test → { motivo, desde }. */
export function leerPermitidos(md) {
  const permitidos = new Map();
  for (const [test, motivo, desde] of filasDeTabla(md)) {
    if (!test || test.toLowerCase() === 'test') continue;
    permitidos.set(test.replace(/^`|`$/g, ''), { motivo, desde });
  }
  return permitidos;
}

/** El piso de cada suite: paquete → cuántos tests tienen que correr como mínimo. */
export function leerPiso(md) {
  const piso = new Map();
  for (const [paquete, minimo] of filasDeTabla(md)) {
    if (!paquete || !/^\d+$/.test(String(minimo).replace(/[^\d]/g, ''))) continue;
    piso.set(paquete.replace(/^`|`$/g, ''), Number(String(minimo).replace(/[^\d]/g, '')));
  }
  return piso;
}

/**
 * El análisis, que es una función pura para poder probarla desde adentro de
 * este mismo script. Devuelve la lista de problemas; vacía es verde.
 */
export function analizar({ reportes, permitidos, piso }) {
  const problemas = [];
  const vistos = new Set();

  for (const [paquete, reporte] of Object.entries(reportes)) {
    if (!reporte) {
      problemas.push(
        `${paquete}: no dejó reporte. O la suite no corrió, o el reporter se cayó — `
        + 'las dos cosas se ven igual desde afuera y ninguna es «todo bien».',
      );
      continue;
    }

    /* Dos comprobaciones, y cada una con UN solo trabajo:
         · el piso cuenta los tests DECLARADOS —corran o no—, porque lo suyo es
           cazar los que desaparecen: el archivo renombrado que sale del glob;
         · la lista de permitidos se ocupa de los que están y no corren.
       Separadas, cada rojo habla de su propia causa. */
    let declarados = 0;
    for (const archivo of reporte.testResults ?? []) {
      for (const t of archivo.assertionResults ?? []) {
        declarados += 1;
        const nombre = [...(t.ancestorTitles ?? []), t.title].filter(Boolean).join(' > ');
        const saltado = t.status === 'pending' || t.status === 'skipped' || t.status === 'todo';
        if (!saltado) continue;
        vistos.add(nombre);
        if (!permitidos.has(nombre)) {
          problemas.push(
            `${paquete}: el test «${nombre}» no corrió (${t.status}) y no está en ${PERMITIDOS}. `
            + 'Un guardián que no corre no dice nada, y desde afuera se ve igual que uno que corrió bien.',
          );
        }
      }
    }

    const minimo = piso.get(paquete);
    if (minimo === undefined) {
      problemas.push(`${paquete}: no tiene piso escrito en ${PISO}. Sin piso, un archivo que desaparece no se nota.`);
    } else if (declarados < minimo) {
      problemas.push(
        `${paquete}: se declararon ${declarados} tests y el piso es ${minimo}. `
        + `Faltan ${minimo - declarados}, y no salieron como saltados: desaparecieron. `
        + `Si bajaron a propósito, se baja el número en ${PISO} — que es un renglón en el diff, que es `
        + 'exactamente lo que se quiere: bajar la vigilancia es un acto visible.',
      );
    }
  }

  /* Una lista de excepciones que no se limpia se convierte en una lista de
     mentiras: cada línea era cierta el día que se escribió. */
  for (const [nombre, { desde }] of permitidos) {
    if (!vistos.has(nombre)) {
      problemas.push(
        `${PERMITIDOS} permite saltar «${nombre}» (desde ${desde}) y ese test ya no está saltado `
        + '—o ya no existe—. Un permiso que sobra es una mentira con formato de tabla: se borra la fila.',
      );
    }
  }

  return problemas;
}

/* ── El auto-examen ────────────────────────────────────────────────────────
   Este script también puede dejar de funcionar, y su manera de fallar es la
   peor: devolver una lista vacía de problemas, que se lee igual que «está todo
   bien». Así que antes de creerle a `analizar()` se le dan escenarios de
   mentira y se comprueba que los cace. Corre en cada corrida, no una vez. */
function autoExamen() {
  const reporteCon = (estado) => ({
    testResults: [{ assertionResults: [{ ancestorTitles: ['bloque'], title: 'de mentira', status: estado }] }],
  });
  const casos = [
    ['un test saltado sin permiso tiene que dar problema',
      { reportes: { x: reporteCon('skipped') }, permitidos: new Map(), piso: new Map([['x', 0]]) }, true],
    ['un test saltado CON permiso no tiene que dar problema',
      { reportes: { x: reporteCon('skipped') }, permitidos: new Map([['bloque > de mentira', { motivo: 'm', desde: 'd' }]]), piso: new Map([['x', 0]]) }, false],
    ['un permiso que sobra tiene que dar problema',
      { reportes: { x: reporteCon('passed') }, permitidos: new Map([['bloque > de mentira', { motivo: 'm', desde: 'd' }]]), piso: new Map([['x', 0]]) }, true],
    ['una suite por debajo de su piso tiene que dar problema',
      { reportes: { x: reporteCon('passed') }, permitidos: new Map(), piso: new Map([['x', 99]]) }, true],
    ['un salto CON permiso no puede chocar contra el piso: el test sigue declarado',
      { reportes: { x: reporteCon('skipped') }, permitidos: new Map([['bloque > de mentira', { motivo: 'm', desde: 'd' }]]), piso: new Map([['x', 1]]) }, false],
    ['una suite sin piso escrito tiene que dar problema',
      { reportes: { x: reporteCon('passed') }, permitidos: new Map(), piso: new Map() }, true],
    ['una suite sin reporte tiene que dar problema',
      { reportes: { x: null }, permitidos: new Map(), piso: new Map([['x', 0]]) }, true],
  ];
  const fallas = [];
  for (const [que, entrada, esperaProblema] of casos) {
    if ((analizar(entrada).length > 0) !== esperaProblema) fallas.push(que);
  }

  /* Y el lector de los documentos, que es por donde se rompió en Omnia: una
     segunda tabla pisando a la primera, en silencio. */
  const DOS_TABLAS = [
    '## La tabla', '',
    '| paquete | piso |', '|---|---|',
    '| `@codice/core` | 17 |', '',
    '## De dónde sale cada número', '',
    '| paquete | antes | hoy |', '|---|--:|--:|',
    '| `@codice/core` | 3 | 17 |', '',
  ].join('\n');
  const leido = leerPiso(DOS_TABLAS);
  if (leido.get('@codice/core') !== 17) {
    fallas.push(`una segunda tabla le está pisando el piso a la primera: se leyó ${leido.get('@codice/core')} donde la tabla dice 17`);
  }
  if (leido.size !== 1) fallas.push(`\`leerPiso()\` leyó ${leido.size} paquetes de un documento que declara uno`);
  const unaSola = leerPiso('| paquete | piso |\n|---|---|\n| `@codice/ui` | 12 |');
  if (unaSola.get('@codice/ui') !== 12) fallas.push('`leerPiso()` no lee una tabla de una fila');

  return fallas;
}

function main() {
  const fallasDelExamen = autoExamen();
  if (fallasDelExamen.length) {
    console.error('\n✗ el guardián de guardianes no se pasa a sí mismo el examen:');
    for (const f of fallasDelExamen) console.error(`  · ${f}`);
    console.error('  No se corrió nada más: un analizador roto devuelve «sin problemas» y eso se lee como un sí.\n');
    process.exit(1);
  }

  /*
   * El build, ANTES de las suites.
   *
   * Dos guardianes miden sobre `apps/web/dist`: el de fidelidad, que compara el
   * port contra el sitio estático, y —desde la orden #02— `el-html-no-carga-react`,
   * que es de Vitest y por lo tanto corre en el primer tramo. Si el build fuera
   * después, ese test estaría leyendo el `dist/` de la corrida anterior: verde
   * sobre una medición vieja, que es el defecto exacto que este archivo persigue.
   * Compilar acá es unos segundos y deja a los dos mirando la misma salida.
   */
  compilarLaWeb();

  for (const [, dir] of SUITES) rmSync(join(RAIZ, dir, REPORTE), { force: true });

  let salidaDeLasSuites = 0;
  try {
    execFileSync('pnpm', ['-r', '--if-present', 'test'], { cwd: RAIZ, stdio: 'inherit' });
  } catch (e) {
    salidaDeLasSuites = typeof e.status === 'number' ? e.status : 1;
  }

  const reportes = {};
  for (const [paquete, dir] of SUITES) {
    const ruta = join(RAIZ, dir, REPORTE);
    if (!existsSync(ruta)) { reportes[paquete] = null; continue; }
    try { reportes[paquete] = JSON.parse(readFileSync(ruta, 'utf8')); } catch { reportes[paquete] = null; }
  }

  /*
   * Las reglas de los hooks, ANTES de leer los reportes.
   *
   * Va acá dentro y no en un script suelto de `package.json` por la razón de
   * siempre: **lo que hay que acordarse de correr no se corre.** El defecto que
   * lo trajo a Omnia tiró producción entera —un `useState` después de dos
   * `return`— y ninguna de las comprobaciones de la casa lo vio, porque ninguna
   * mira el árbol sintáctico de React.
   */
  const eslint = revisarLosHooks();
  if (eslint.length) {
    console.error('\n✗ reglas de los hooks (react-hooks/rules-of-hooks):');
    for (const e of eslint) console.error(`  · ${e}`);
    console.error(
      '\n  Un hook llamado dentro de un `if`, después de un `return` o dentro de un bucle\n'
      + '  cambia la cuenta entre renders, y React tira el #310 con la pantalla entera.\n'
      + '  Todos los hooks arriba, incondicionales.\n',
    );
    process.exit(1);
  }

  /* El de navegador, después de eslint y antes de analizar: si las reglas de
     los hooks ya están rojas, no tiene sentido levantar Chromium. */
  reportes[NAVEGADOR] = revisarLaFidelidad();

  const permitidos = leerPermitidos(readFileSync(join(RAIZ, PERMITIDOS), 'utf8'));
  const piso = leerPiso(readFileSync(join(RAIZ, PISO), 'utf8'));
  const problemas = analizar({ reportes, permitidos, piso });

  if (problemas.length) {
    console.error('\n✗ guardián de guardianes:');
    for (const p of problemas) console.error(`  · ${p}`);
    console.error('');
    process.exit(1);
  }

  const enRojo = (reportes[NAVEGADOR]?.testResults?.[0]?.assertionResults ?? []).filter((t) => t.status === 'failed');
  if (enRojo.length) {
    console.error(`\n✗ ${enRojo.length} comprobación(es) de fidelidad en rojo. La salida de arriba dice cuál.\n`);
    process.exit(1);
  }

  if (salidaDeLasSuites !== 0) {
    /* Las suites ya se quejaron con su propio formato; acá solo se propaga el
       código. Propagarlo es la mitad del trabajo: un arnés que encadena después
       de un `echo` se come el `exit 1`. */
    process.exit(salidaDeLasSuites);
  }

  const enNavegador = (reportes[NAVEGADOR]?.testResults?.[0]?.assertionResults ?? []).length;
  const declarados = Object.values(reportes).reduce((s, r) => s + (r?.numTotalTests ?? 0), 0) + enNavegador;
  const saltados = Object.values(reportes).reduce((s, r) => s + (r?.numPendingTests ?? 0) + (r?.numTodoTests ?? 0), 0);
  console.log(
    `\n✓ guardián de guardianes: ${declarados} tests declarados —${enNavegador} de ellos comparando el port `
    + `contra el sitio estático—, ${saltados} saltados (todos con permiso escrito), ninguna suite por debajo `
    + 'de su piso.\n',
  );
}

/**
 * Compila la web pública. Lo hace `main()` antes que nada, y no cada guardián
 * por su cuenta, porque son **dos** los que miden sobre `apps/web/dist` y el
 * orden de los comandos no puede decidir en silencio si miran algo.
 */
function compilarLaWeb() {
  execFileSync('pnpm', ['--filter', '@codice/web', 'build'], { cwd: RAIZ, stdio: 'inherit' });
}

/**
 * Corre el guardián de fidelidad y devuelve su reporte con la forma de Vitest,
 * para que `analizar()` no tenga que saber que existen dos corredores —y para
 * que el piso, los saltos y la baja de la cuenta valgan igual para él.
 *
 * Mide sobre el `dist/` que dejó `compilarLaWeb()` al empezar la corrida.
 */
function revisarLaFidelidad() {
  const salida = join(RAIZ, REPORTE_NAVEGADOR);
  rmSync(salida, { force: true });
  try {
    execFileSync(
      'npx',
      ['playwright', 'test', '--reporter', 'list,json'],
      {
        cwd: join(RAIZ, 'apps/web'),
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: salida, PLAYWRIGHT_HTML_OPEN: 'never' },
      },
    );
  } catch (e) {
    /* Playwright sale con 1 cuando algo falla: eso ya se vio en pantalla y el
       reporte igual está. Solo es un fallo del corredor si no dejó reporte —un
       navegador sin instalar, el sitio estático ausente— y eso se distingue
       mirando el archivo, no el código de salida. */
    if (!existsSync(salida)) {
      throw new Error(
        'no se pudo correr el guardián de fidelidad, así que NO se comprobó que el port sea '
        + 'indistinguible del sitio estático.\n  Si es la primera vez en esta máquina:  pnpm qa:instalar\n  '
        + 'Si falta el sitio estático: va en `qa/referencia/`, versionado con el repo.\n  '
        + (e.message ?? ''),
      );
    }
  }
  if (!existsSync(salida)) return null;

  /* Playwright anida `suites` dentro de `suites`; se recorre en profundidad y se
     le da la forma de Vitest, porque `analizar()` ya sabe leer eso y duplicar
     ese analizador sería duplicar sus defectos. */
  const crudo = JSON.parse(readFileSync(salida, 'utf8'));
  const casos = [];
  const recorrer = (suite, camino) => {
    const aqui = [...camino, suite.title].filter(Boolean);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        const estado = t.status === 'skipped' ? 'skipped' : (t.status === 'expected' ? 'passed' : 'failed');
        casos.push({ ancestorTitles: aqui, title: spec.title, status: estado });
      }
    }
    for (const hija of suite.suites ?? []) recorrer(hija, aqui);
  };
  for (const suite of crudo.suites ?? []) recorrer(suite, []);
  return { testResults: [{ assertionResults: casos }] };
}

/**
 * Corre eslint con la única regla que este guardián exige y devuelve sus
 * errores como líneas legibles. **Solo severidad 2 y solo esa regla**: las
 * advertencias no frenan nada, y las demás reglas no están encendidas. El
 * alcance queda declarado, que es la mitad del valor: esto NO es un linter de
 * la casa, es un guardián de un defecto.
 */
function revisarLosHooks() {
  let salida = '';
  try {
    salida = execFileSync('npx', ['eslint', '.', '-f', 'json'], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch (e) {
    /* Ojo con la primera palabra de este comentario: un bloque que empieza con
       `eslint` es una directiva de configuración en línea, y eslint intentaba
       leerlo como JSON y se ponía rojo con `ruleId: null` —invisible para el
       filtro de abajo, que solo mira `rules-of-hooks`, y visible para
       `pnpm lint`, que quedaba en 1—. Encontrado corriendo la gate de la #02.

       Dicho eso: `eslint` sale con 1 cuando encuentra errores: eso es lo NORMAL acá y su
       salida sigue estando en stdout. Solo es un fallo de verdad si no dejó
       JSON, y eso se distingue mirando el cuerpo y no el código. */
    salida = e.stdout ?? '';
    if (!salida.trim()) {
      throw new Error(`no se pudo correr eslint, así que las reglas de los hooks NO se comprobaron: ${e.stderr || e.message}`);
    }
  }
  return JSON.parse(salida).flatMap((archivo) => archivo.messages
    .filter((m) => m.severity === 2 && m.ruleId === 'react-hooks/rules-of-hooks')
    .map((m) => `${archivo.filePath.replace(`${RAIZ}/`, '')}:${m.line}:${m.column} · ${m.message}`));
}

if (process.argv[1] && process.argv[1].endsWith('guardian-de-guardianes.mjs')) main();
