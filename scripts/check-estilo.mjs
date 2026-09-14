#!/usr/bin/env node
/**
 * Guardián de la regla de dos registros (D6), desde el lado del doctor.
 *
 * Copiado del scaffold de julio (`Development/Codice/scripts/check-estilo.mjs`)
 * y adaptado a las carpetas de este repo. Es el hermano de `check-tuteo.mjs`:
 *
 *   · `check-tuteo`  mira que el voseo NO esté en la interfaz;
 *   · `check-estilo` mira que **solo pueda estar en `packages/prompts`**.
 *
 * Los dos parecen el mismo guardián y no lo son. `check-tuteo` barre carpetas
 * elegidas a mano —lo que hoy dibuja—; éste barre **todo el repo** y deja pasar
 * un solo lugar. La diferencia se paga el día que nazca `apps/api` o
 * `apps/jobs`: `check-tuteo` no los conoce todavía y este los ve igual.
 *
 * ── Lo que se afloja, y se declara ────────────────────────────────────────
 * Quedan fuera los archivos de test —una fixture necesita poder citar voseo
 * para probarlo, y `packages/prompts/src/estilo.test.ts` hace exactamente eso—
 * y los comentarios, incluida esta cabecera: si mirara comentarios, este mismo
 * archivo, que escribe «tenés» y «podés» para explicarse, se pondría rojo a sí
 * mismo. Es la regla de la casa sobre los guardianes que leen prosa como si
 * fuera código: se limpia antes de mirar, y se dice que se limpia.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PERMITIDO = 'packages/prompts';
const IGNORAR = ['node_modules', 'dist', '.git', 'e2e', 'public', 'fuentes'];
const EXTENSIONES = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'];

/**
 * Los tres archivos que el barrido saltea, cada uno con su motivo escrito. Una
 * excepción sin motivo al lado es una excepción que dentro de un mes nadie sabe
 * si todavía vale.
 */
const EXCEPCIONES = new Map([
  ['scripts/check-tuteo.mjs', 'lleva adentro la lista de ~180 formas que caza: un guardián tiene que poder nombrar lo que persigue'],
  ['scripts/check-estilo.mjs', 'ídem — este mismo archivo escribe el patrón'],
  ['packages/ui/codice-tokens.json', 'es el documento de D6 que DEFINE la regla de dos registros: su `estilo.assistant.example` es el ejemplo canónico del registro del doctor. No se dibuja en ninguna pantalla; describir la regla no es romperla'],
]);

/**
 * El patrón. **Exige el acento**, y ésa es la corrección que esta casa le hizo
 * al que venía del scaffold de julio.
 *
 * Aquel escribía `sab[eé]s`, `hac[eé]s`, `mir[aá]` — con la vocal sin tilde
 * adentro del corchete— así que cazaba **«sabes», «haces» y «mira»**, que son
 * tuteo neutro perfecto y lo que la casa quiere que se escriba. Lo encontró la
 * primera corrida sobre el port: se puso rojo con «no sabes leer» y con «que te
 * haces en silencio», dos frases de Armando, y el arreglo habría sido cambiarle
 * el texto a la web. Un guardián que pide cambiar lo que vino a proteger está
 * mal escrito, y se ve en cuanto se lo corre contra contenido real.
 */
const VOSEO = /(?<![A-Za-zÁÉÍÓÚáéíóúÑñ])(tenés|podés|querés|sabés|hacés|decís|mirá|vos)(?![A-Za-zÁÉÍÓÚáéíóúÑñ])/i;

/**
 * El archivo sin comentarios. Tres caminos —bloque, línea entera y línea de
 * `*` adentro de un bloque— y los tres se prueban por separado en el examen de
 * abajo: un limpiador cuyo piso lo sostiene otra mitad no está sosteniendo nada.
 */
export function soloCodigo(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n');
}

/* El auto-examen del limpiador, con una línea de cada forma que dice sacar.
   Corre siempre, antes de barrer nada: si el limpiador se rompe, el barrido
   entero se vuelve una opinión. */
{
  /*
   * La muestra tiene una línea POR CAMINO, y ninguna que dos caminos puedan
   * sacar. Eso no es prolijidad: es la única forma de que romper un camino se
   * vea.
   *
   * La primera versión de esta muestra empezaba con `/* un bloque que dice
   * tenés *\/` en una sola línea — y esa línea la sacaba **el filtro de
   * líneas**, porque empieza con `/*`. Resultado medido: se podía romper
   * entero el `replace` de los bloques y el examen seguía verde, con medio
   * limpiador muerto. Por eso el bloque de acá abarca tres líneas y el voseo
   * vive en la del medio, que no empieza ni con `//`, ni con `*`, ni con `/*`:
   * ahí no llega nadie más que el `replace`.
   */
  const MUESTRA = [
    'const antes = 1; /* abre el bloque',
    '  tenés adentro, en una línea que no empieza con asterisco',
    '  cierra el bloque */ const despues = 2;',
    '// una línea que dice podés',
    ' * una línea de asterisco que dice querés',
    'const real = "vos";',
  ].join('\n');
  const limpio = soloCodigo(MUESTRA);
  const fallas = [];
  if (/tenés/.test(limpio)) fallas.push('no saca los bloques /* */');
  if (/podés/.test(limpio)) fallas.push('no saca las líneas //');
  if (/querés/.test(limpio)) fallas.push('no saca las líneas de * dentro de un bloque');
  if (!/const real = "vos";/.test(limpio)) fallas.push('se come el código junto con los comentarios');
  if (!/const antes = 1;/.test(limpio) || !/const despues = 2;/.test(limpio)) {
    fallas.push('se come el código que rodea a un bloque de varias líneas');
  }
  if (fallas.length) {
    process.stderr.write(`check-estilo: el limpiador de comentarios está roto (${fallas.join(' · ')}).\n`);
    process.exit(1);
  }
}

function recorrer(dir) {
  const out = [];
  let entradas;
  try { entradas = readdirSync(dir); } catch { return out; }
  for (const entrada of entradas) {
    /* Los reportes que dejan los corredores son `.json` y llevan adentro los
       nombres de todos los tests: contarlos infla el barrido y deja que un
       nombre de test decida si este guardián se pone rojo. */
    if (IGNORAR.includes(entrada) || entrada.endsWith('-report.json')) continue;
    const full = join(dir, entrada);
    if (statSync(full).isDirectory()) out.push(...recorrer(full));
    else if (EXTENSIONES.some((e) => full.endsWith(e)) && !/\.(test|spec)\./.test(entrada)) out.push(full);
  }
  return out;
}

const infractores = [];
let archivos = 0;
for (const archivo of recorrer(RAIZ)) {
  const rel = archivo.slice(RAIZ.length + 1);
  if (rel.startsWith(PERMITIDO) || EXCEPCIONES.has(rel)) continue;
  archivos += 1;
  soloCodigo(readFileSync(archivo, 'utf8')).split('\n').forEach((linea, i) => {
    if (VOSEO.test(linea)) infractores.push(`${rel}:${i + 1} → ${linea.trim().slice(0, 100)}`);
  });
}

if (archivos < 10) {
  process.stderr.write(`check-estilo: el barrido leyó ${archivos} archivos. Con tan pocos no afirma nada.\n`);
  process.exit(1);
}

if (infractores.length) {
  process.stderr.write(
    'Voseo fuera de packages/prompts (la interfaz habla neutro; el estilo de escritura del doctor vive '
    + `en ${PERMITIDO}):\n`,
  );
  for (const i of infractores) process.stderr.write(`  ${i}\n`);
  process.exit(1);
}
process.stdout.write(`check-estilo: ${archivos} archivos leídos, el voseo vive solo en ${PERMITIDO}.\n`);
