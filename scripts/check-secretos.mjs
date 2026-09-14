#!/usr/bin/env node
/**
 * El guardián de los secretos — orden Códice #04, G.
 *
 * ── Por qué existe ────────────────────────────────────────────────────────
 * Este repo es **público**, y lo es por una razón de dirección: es lo que hace
 * que Vercel Hobby despliegue los commits de cualquier autor sin pagar nada.
 * Mientras lo único que contenga sea la web pública, está bien. Lo que no
 * puede pasar nunca es que entre algo secreto: una clave, un token, la URL de
 * una base de datos, el código de acceso de una cortina, un `.env` con algo
 * adentro. Lo secreto vive en las variables de entorno de Vercel y se lee con
 * `process.env`; el repo solo conoce el **nombre** de la variable.
 *
 * Un secreto commiteado a un repo público no se arregla borrándolo: queda en la
 * historia, en los forks y en los espejos. Se arregla rotándolo. Por eso la
 * comprobación va **antes** del commit y no después.
 *
 * ── El piso, y por qué es la mitad del valor ──────────────────────────────
 * **Un barrido roto y un repo limpio se ven exactamente igual**: los dos
 * imprimen «no se encontró nada». Si `git ls-files` fallara, si el filtro de
 * binarios se comiera todo, si alguien cambiara una ruta y la lista quedara
 * vacía, este script saldría en 0 con cara de buena noticia. Así que afirma
 * cuántos archivos recorrió, y si recorrió menos de 50 falla **aunque no haya
 * encontrado nada**. El número es holgado a propósito: hoy son cientos.
 *
 * ── El auto-examen ────────────────────────────────────────────────────────
 * La otra manera de fallar en silencio es que los patrones dejen de cazar. Cada
 * patrón trae su muestra sintética y se comprueba contra ella en cada corrida,
 * antes de mirar un solo archivo del repo. Un patrón que no caza su propia
 * muestra es un rojo, no un aviso.
 *
 * ── Por qué los patrones están partidos en pedazos ────────────────────────
 * Porque si `'sk-ant-'` apareciera entero en este archivo, este archivo sería
 * el primer hallazgo de su propio barrido. Se arman en tiempo de ejecución
 * desde trozos que por separado no son nada. La alternativa —excluir este
 * archivo del barrido— dejaría un punto ciego justo donde vive la lista de lo
 * que hay que vigilar.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const PISO_DE_ARCHIVOS = 50;

/**
 * Las formas que de verdad aparecen. Cada una: nombre, los trozos de su regex,
 * una muestra que TIENE que cazar, y un contraejemplo que NO tiene que cazar.
 *
 * Sobre `SUPABASE_SERVICE_ROLE`: se caza el nombre **con un valor pegado**, no
 * el nombre solo. El repo tiene derecho a nombrar sus variables de entorno —esa
 * es justamente la regla: el repo conoce el nombre, Vercel guarda el valor— y
 * un guardián que se pusiera rojo por `process.env.SUPABASE_SERVICE_ROLE_KEY`
 * enseñaría a la gente a apagarlo.
 */
const FORMAS = [
  {
    nombre: 'clave de Anthropic',
    trozos: ['sk', '-ant-', '[A-Za-z0-9_-]{16,}'],
    caza: ['sk', '-ant-', 'api03-AAAAAAAAAAAAAAAAAAAA'],
    noCaza: 'sk-ant- es el prefijo del que hablamos',
  },
  {
    nombre: 'clave con prefijo sk-',
    trozos: ['sk', '-', '[A-Za-z0-9]{20,}'],
    caza: ['sk', '-', 'AAAAAAAAAAAAAAAAAAAAAAAA'],
    noCaza: 'un guion y poco: sk-abc',
  },
  {
    nombre: 'token JWT (Supabase, entre otros)',
    trozos: ['ey', 'J', '[A-Za-z0-9_-]{10,}\\.', '[A-Za-z0-9_-]{10,}\\.', '[A-Za-z0-9_-]{10,}'],
    caza: ['ey', 'J', 'hbGciOiJIUzI1NiJ9.', 'eyJzdWIiOiIxMjM0NTY3.', 'SflKxwRJSMeKKF2QT4'],
    noCaza: 'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
  },
  {
    nombre: 'URL de Postgres con usuario y contraseña',
    trozos: ['postgres', '(?:ql)?://[^\\s:@/]+:[^\\s:@/]+@'],
    caza: ['postgres', 'ql://admin:hunter2@db.example.com:5432/codice'],
    noCaza: 'postgresql://localhost:5432/codice',
  },
  {
    nombre: 'clave privada',
    trozos: ['-----BEG', 'IN [A-Z ]*PRIVATE KEY-----'],
    caza: ['-----BEG', 'IN RSA PRIVATE KEY-----'],
    noCaza: 'la clave privada no se commitea nunca',
  },
  {
    nombre: 'service role de Supabase con valor',
    trozos: ['SUPABASE_SERVICE', '_ROLE[A-Z_]*\\s*[=:]\\s*[\'"`]?\\S{12,}'],
    caza: ['SUPABASE_SERVICE', '_ROLE_KEY=AAAAAAAAAAAAAAAAAAAA'],
    noCaza: 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;',
  },
  {
    nombre: 'clave de Perplexity',
    trozos: ['pplx', '-[A-Za-z0-9]{20,}'],
    caza: ['pplx', '-AAAAAAAAAAAAAAAAAAAAAAAA'],
    noCaza: 'pplx- a secas no es una clave',
  },
  {
    nombre: 'token personal de GitHub',
    trozos: ['ghp', '_[A-Za-z0-9]{30,}'],
    caza: ['ghp', '_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
    noCaza: 'los tokens de GitHub empiezan con ghp_',
  },
  {
    nombre: 'token de Vercel',
    trozos: ['vercel', '_[a-zA-Z_]+_[A-Za-z0-9]{20,}'],
    caza: ['vercel', '_blob_rw_AAAAAAAAAAAAAAAAAAAAAA'],
    noCaza: 'el archivo se llama vercel_json en la conversación',
  },
];

const regexDe = (forma) => new RegExp(forma.trozos.join(''));

/**
 * Lo que no se barre, y por qué cada cosa.
 *
 * `qa/referencia/` es el sitio estático: HTML y CSS publicados, ya auditados, y
 * la orden lo excluye explícitamente. `node_modules` no está versionado, así
 * que `git ls-files` ni lo menciona; se nombra igual por si alguien algún día
 * lo versiona sin querer.
 */
const FUERA = [/^qa\/referencia\//, /(^|\/)node_modules\//];

/** Extensiones que son binario seguro. El resto se decide leyendo. */
const BINARIAS = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot|pdf|zip|mp4|mov|avif)$/i;

/** Un archivo con un byte NUL en los primeros 8 KB no es texto. */
function esTexto(ruta) {
  if (BINARIAS.test(ruta)) return false;
  try {
    if (statSync(join(RAIZ, ruta)).size > 8 * 1024 * 1024) return false;
    return !readFileSync(join(RAIZ, ruta)).subarray(0, 8192).includes(0);
  } catch {
    return false;
  }
}

/** El examen: cada patrón contra su muestra y su contraejemplo. */
function autoExamen() {
  const fallas = [];
  for (const forma of FORMAS) {
    const re = regexDe(forma);
    const muestra = forma.caza.join('');
    if (!re.test(muestra)) {
      fallas.push(`«${forma.nombre}» no caza su propia muestra: el patrón dejó de funcionar`);
    }
    if (re.test(forma.noCaza)) {
      fallas.push(
        `«${forma.nombre}» caza su contraejemplo «${forma.noCaza}»: se pone rojo con texto legítimo, `
        + 'y un guardián que grita por nada es un guardián que alguien apaga',
      );
    }
  }
  return fallas;
}

function main() {
  const fallasDelExamen = autoExamen();
  if (fallasDelExamen.length) {
    console.error('\n✗ el guardián de secretos no se pasa a sí mismo el examen:');
    for (const f of fallasDelExamen) console.error(`  · ${f}`);
    console.error('  No se barrió nada: un patrón roto no encuentra nada y eso se lee como «está limpio».\n');
    process.exit(1);
  }

  let versionados = [];
  try {
    versionados = execFileSync('git', ['ls-files', '-z'], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 26 })
      .split('\0').filter(Boolean);
  } catch (e) {
    console.error(`\n✗ no se pudo listar los archivos versionados, así que NO se barrió nada: ${e.message}\n`);
    process.exit(1);
  }

  const hallazgos = [];
  let recorridos = 0;

  for (const ruta of versionados) {
    if (FUERA.some((r) => r.test(ruta))) continue;
    if (!esTexto(ruta)) continue;
    recorridos += 1;

    const lineas = readFileSync(join(RAIZ, ruta), 'utf8').split('\n');
    for (const [i, linea] of lineas.entries()) {
      for (const forma of FORMAS) {
        if (regexDe(forma).test(linea)) {
          hallazgos.push({ ruta, linea: i + 1, forma: forma.nombre, texto: linea.trim().slice(0, 120) });
        }
      }
    }
  }

  /* EL PISO, DESPUÉS DE BARRER Y ANTES DE DAR LA BUENA NOTICIA. Un barrido que
     no recorrió nada no encuentra nada, y sale igual de verde que uno que
     recorrió todo. */
  if (recorridos < PISO_DE_ARCHIVOS) {
    console.error(
      `\n✗ el barrido recorrió ${recorridos} archivos de texto y el piso es ${PISO_DE_ARCHIVOS}.\n`
      + '  No se encontró nada, pero tampoco se miró casi nada: las dos cosas se ven igual desde\n'
      + '  afuera y solo una es una buena noticia. Algo se rompió en la lista o en el filtro.\n',
    );
    process.exit(1);
  }

  if (hallazgos.length) {
    console.error('\n✗ guardián de secretos: esto no puede entrar a un repo público.');
    for (const h of hallazgos) {
      console.error(`  · ${h.ruta}:${h.linea} — ${h.forma}`);
      console.error(`      ${h.texto}`);
    }
    console.error(
      '\n  No alcanza con borrarlo del archivo: si ya se commiteó, queda en la historia y hay\n'
      + '  que ROTAR la credencial. Lo secreto va en las variables de entorno de Vercel y se\n'
      + '  lee con `process.env`; el repo solo conoce el nombre de la variable.\n',
    );
    process.exit(1);
  }

  console.log(
    `\n✓ guardián de secretos: ${recorridos} archivos de texto recorridos, ${FORMAS.length} formas buscadas, `
    + 'ninguna encontrada. El repo puede seguir siendo público.\n',
  );
}

main();
