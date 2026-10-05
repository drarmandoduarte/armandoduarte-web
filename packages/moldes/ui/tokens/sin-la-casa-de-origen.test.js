/**
 * El molde no nombra a ninguna app.
 *
 * El kit se extrajo de apps que ya existían, y lo que se extrae trae pegado el
 * nombre de su casa: en un comentario, en un texto, en un token (`--clinic-…`),
 * en la paleta de origen (`--bone`, `--bark`). Si queda, el molde deja de ser de
 * todas y vuelve a ser de una. Este guardián barre **todos** los archivos de
 * texto de `packages/` y falla con archivo y renglón.
 *
 * ── Alcance ────────────────────────────────────────────────────────────────
 * Mira: `.css .js .mjs .jsx .ts .tsx .json .md .html` de `packages/`, sin
 * `node_modules`, `dist` ni `.corridas`.
 * No mira: el README y el CHANGELOG de la raíz del repo, que cuentan de dónde
 * se extrajo cada cosa (contarlo es su trabajo), ni este archivo, que tiene que
 * nombrar lo que busca. Es la única exclusión y va por nombre.
 * Excepción: el nombre viejo del molde (`@512/`) se busca en el repo ENTERO,
 * abajo de todo. Ese barrido se saltea, con mensaje, cuando el molde está
 * instalado en una app (no hay `storybook/` ni `docs/` al lado).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PAQUETES = join(AQUI, '..', '..');
const EXTENSIONES = /\.(css|m?jsx?|tsx?|json|md|html)$/;
const FUERA = new Set(['node_modules', 'dist', '.corridas']);

function archivos(dir) {
  const salida = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (FUERA.has(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) salida.push(...archivos(ruta));
    else if (EXTENSIONES.test(e.name)) salida.push([relative(PAQUETES, ruta), readFileSync(ruta, 'utf8')]);
  }
  return salida;
}

const YO = relative(PAQUETES, fileURLToPath(import.meta.url));
const ARCHIVOS = archivos(PAQUETES).filter(([n]) => n !== YO);

/* El nombre que el molde tuvo antes de ser «de mis apps»: el scope `@512/`, las
   clases `m512-`, «Kit UI 512», «moldes 512». El «Kit de Seguridad 512» NO cae:
   ya está instalado con ese nombre en las apps y se renombra en la fase 2. */
const NOMBRE_VIEJO = /@512\/|\bm512-|kit ui 512|moldes[ -]512|molde 512|design-512|fuentes-512/i;

/* Los nombres de las apps y de su vocabulario de dominio, y los tokens
   de la paleta de la casa de origen. Sin distinguir mayúsculas. */
const PROHIBIDAS = [
  ['bitácora', /bit[áa]cora/i],
  ['clínica / clinic', /cl[íi]nic/i],
  ['omnia', /\bomnia\b/i],
  ['cenit', /\bcenit\b/i],
  ['preparadora', /preparadora/i],
  ['paciente', /paciente/i],
  ['flora profunda', /flora profunda/i],
  ['paleta de origen', /--(bone|linen|bark|honey|clay|sage|stone|brand-forest|brand-glow|sunken)\b/],
  /* La historia del origen: números de orden y rutas de su repo. En el molde no
     apuntan a nada, y una referencia que no se puede seguir es ruido. */
  ['número de orden del origen', /orden #\d|\b(la|las|de la|en la|desde la|hasta la) #\d{2,3}\b/i],
  ['ruta del repo de origen', /apps\/web|docs\/reglas\.md|CLAUDE\.md/],
  ['el nombre viejo del molde', NOMBRE_VIEJO],
  ['el nombre viejo del kit de acceso', /seguridad[-_ ]?512|SEGURIDAD_512/i],
];

/* Las excepciones, una por una y con su razón: nada más que esto.
   · El núcleo del Kit de Acceso entra «byte a byte + renombre» desde el kit 1.2.1
     (Dirección, 4/10/2026), y ese núcleo nombra a la app en la que nació en nueve
     comentarios y un test. Neutralizarlos cambiaría bytes que Dirección pidió no
     cambiar; `el-nucleo-es-el-1.2.1.test.js` lo prueba. Solo «cenit», solo ahí.
   · La tabla del renombre y su prueba tienen que nombrar el nombre viejo del kit
     para poder reemplazarlo y deshacerlo. */
const EXCEPCIONES = {
  cenit: (archivo) => archivo.startsWith('acceso/nucleo/'),
  'el nombre viejo del kit de acceso': (archivo) => [
    'acceso/renombre.js', 'acceso/el-nucleo-es-el-1.2.1.test.js',
    'acceso/renombrar-en-app.mjs', 'acceso/renombrar-en-app.test.js',
  ].includes(archivo),
};

describe('el piso: se está leyendo algo', () => {
  it('el barrido recorrió los paquetes', () => {
    expect(ARCHIVOS.length).toBeGreaterThan(80);
    expect(ARCHIVOS.some(([n]) => n.startsWith('ui/components/'))).toBe(true);
    expect(ARCHIVOS.some(([n]) => n.startsWith('design/'))).toBe(true);
  });
  it('y los patrones reconocen lo que dicen reconocer', () => {
    const muestras = ['Bitácora', 'clínica', 'Omnia', 'Cenit', 'Preparadora', 'pacienteId', 'Flora Profunda', 'var(--bone)', 'la #55', 'docs/reglas.md', "import x from '@512/ui'", 'seguridad-512'];
    PROHIBIDAS.forEach(([, patron], i) => expect(patron.test(muestras[i]), muestras[i]).toBe(true));
    expect(PROHIBIDAS[2][1].test('omnipresente')).toBe(false);
    for (const viejo of ['.m512-otp', 'Kit UI 512', 'moldes-512', 'Moldes 512', 'design-512']) expect(NOMBRE_VIEJO.test(viejo), viejo).toBe(true);
    const kitViejo = PROHIBIDAS.find(([n]) => n === 'el nombre viejo del kit de acceso')[1];
    for (const viejo of ['seguridad-512', 'Kit de Seguridad 512', 'SEGURIDAD_512']) expect(kitViejo.test(viejo), viejo).toBe(true);
    expect(EXCEPCIONES.cenit('acceso/nucleo/frontend/nombres.ts')).toBe(true);
    expect(EXCEPCIONES.cenit('acceso/adaptador/acceso.config.ts'), 'el adaptador no tiene excepción').toBe(false);
    expect(EXCEPCIONES.cenit('ui/components/core/Button.jsx')).toBe(false);
    expect(NOMBRE_VIEJO.test('Kit de Seguridad 512'), 'el kit de seguridad conserva su nombre').toBe(false);
    expect(NOMBRE_VIEJO.test('seguridad-512'), 'y su carpeta también').toBe(false);
  });
});

describe('ningún nombre de app ni de su casa sobrevive en el molde', () => {
  it.each(PROHIBIDAS)('«%s» no aparece en packages/', (nombre, patron) => {
    const encontrados = [];
    for (const [archivo, fuente] of ARCHIVOS) {
      if (EXCEPCIONES[nombre] && EXCEPCIONES[nombre](archivo)) continue;
      for (const [i, renglon] of fuente.split('\n').entries()) {
        if (patron.test(renglon)) encontrados.push(`${archivo}:${i + 1}  ${renglon.trim().slice(0, 90)}`);
      }
    }
    expect(encontrados, `«${nombre}» sigue en el molde:\n  ${encontrados.join('\n  ')}`).toEqual([]);
  });
});

/* ── El nombre viejo, en TODO el repo ──────────────────────────────────────
   Lo de arriba mira `packages/`. El nombre viejo vuelve más fácil por afuera:
   un README, un CHANGELOG, el storybook, la descripción de un PR. Así que este
   barrido mira el repo entero, menos lo que no es fuente (dependencias, salidas
   de herramientas, las capturas). */
const REPO = join(PAQUETES, '..');
const FUERA_DEL_REPO = new Set(['node_modules', 'dist', '.corridas', '.git', 'capturas']);
function delRepo(dir) {
  const salida = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (FUERA_DEL_REPO.has(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) salida.push(...delRepo(ruta));
    else if (/\.(css|jsx?|mjs|tsx?|json|md|html|yaml)$/.test(e.name) && e.name !== 'pnpm-lock.yaml') salida.push([relative(REPO, ruta), readFileSync(ruta, 'utf8')]);
  }
  return salida;
}

/* Instalado en una app (`packages/moldes/`), al lado no está el repo del molde
   sino la carpeta `packages/` de la app: no hay `storybook/` ni `docs/`, y barrer
   eso sería mirar código que no es del molde. Ahí este barrido se saltea, y lo
   dice. Solo si faltan LOS DOS: en el repo del molde existen siempre, y si uno
   falta el piso de abajo lo marca. */
const ES_EL_REPO_DEL_MOLDE = existsSync(join(REPO, 'storybook')) || existsSync(join(REPO, 'docs'));
const SALTEADO = 'salteado: al lado de packages/ no hay storybook/ ni docs/ (es una app, no el repo del molde)';
if (!ES_EL_REPO_DEL_MOLDE) console.warn(`sin-la-casa-de-origen · el barrido del repo entero, ${SALTEADO}.`);

describe.skipIf(!ES_EL_REPO_DEL_MOLDE)(`el molde se llama como se llama${ES_EL_REPO_DEL_MOLDE ? '' : ` · ${SALTEADO}`}`, () => {
  const TODOS = ES_EL_REPO_DEL_MOLDE ? delRepo(REPO).filter(([n]) => !n.endsWith('sin-la-casa-de-origen.test.js')) : [];
  it('el piso: se leyó el repo entero, no solo packages/', () => {
    expect(TODOS.some(([n]) => n === 'README.md')).toBe(true);
    expect(TODOS.some(([n]) => n.startsWith('storybook/'))).toBe(true);
    expect(TODOS.some(([n]) => n.startsWith('docs/'))).toBe(true);
  });
  it('ni @512/ ni el nombre viejo en ningún archivo del repo', () => {
    const hallados = TODOS.flatMap(([n, f]) => f.split('\n').map((r, i) => (NOMBRE_VIEJO.test(r) ? `${n}:${i + 1}  ${r.trim().slice(0, 90)}` : null)).filter(Boolean));
    expect(hallados, hallados.join('\n')).toEqual([]);
  });
});
