/**
 * Mi espacio NO lee la base desde el navegador — orden Códice #15, A.
 *
 * ── Qué afirma, y por qué es un `grep` y no un tipo ──────────────────────
 * Que en `apps/familia/src` no aparezca `.from(`, `.rpc(` ni `.storage`. Se
 * podría intentar con tipos —envolver el cliente y no exponer esos métodos— y
 * sería mejor si el cliente fuera nuestro; no lo es. `supabase-js` los trae, y
 * cualquiera puede importar `createClient` de vuelta en un archivo nuevo y
 * saltearse el envoltorio sin que TypeScript diga una palabra. El barrido mira
 * lo que hay escrito, que es lo único que no se puede esquivar desde adentro.
 *
 * ── Por qué la regla ────────────────────────────────────────────────────
 * El día que la pantalla lea `personas` directo, la única defensa de esa
 * lectura es la RLS. La RLS está bien (la #13 la probó con 83 tests), pero el
 * segundo paso, el paso reciente y la clasificación de roles viven en el guard
 * del kit, **en el servidor**. Una lectura que esquiva el servidor esquiva el
 * kit entero — y lo hace en silencio, porque funciona.
 *
 * ── El alcance, escrito para que el cero no se lea como «todo» ──────────
 * Busca en `apps/familia/src`, recursivo, en `.ts` y `.tsx`. **No** mira
 * `apps/api` (allá `.from(` es lo correcto), ni `node_modules`, ni el `dist/`.
 * **Se salta los comentarios y las cadenas de texto**: este mismo archivo
 * nombra `.from(` una docena de veces al explicarse, y un barrido que lee la
 * prosa como si fuera código aprueba el arreglo borrado y rechaza la
 * explicación. Es la lección de la casa sobre `soloCodigo()`.
 *
 * ── EL PISO, PRIMERO ────────────────────────────────────────────────────
 * «Cero llamadas a la base» sobre una carpeta vacía o un glob roto se escribe
 * igual que sobre una app en orden. Así que antes del cero va cuántos archivos
 * leyó y cuántos bytes de código quedaron después de limpiar.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));

/**
 * Los tres accesos a datos que `supabase-js` expone y esta app no usa.
 *
 * ── Por qué se arman con `new RegExp` y no como literales ───────────────
 * Porque **este archivo también lo barre el barrido**, y tiene que ser así: un
 * guardián que se excluye a sí mismo es el primer lugar donde esconder lo que
 * vigila. Pero `soloCodigo()` limpia comentarios y cadenas, no literales de
 * expresión regular — así que un `/\.storage\b/` escrito acá **es código** y
 * el barrido lo denunciaba. Lo hizo, en la primera corrida:
 *
 *     sin-base-desde-el-navegador.test.ts: usa .storage
 *
 * Armados desde cadenas, el patrón vive dentro de un literal de texto, que es
 * lo que `soloCodigo()` sí sabe limpiar. El barrido sigue mirando este archivo
 * entero y ya no se denuncia por explicarse. */
const PROHIBIDOS = [
  { patron: new RegExp('\\.from\\s*\\(', 'g'), nombre: '.from(' },
  { patron: new RegExp('\\.rpc\\s*\\(', 'g'), nombre: '.rpc(' },
  { patron: new RegExp('\\.storage\\b', 'g'), nombre: '.storage' },
];

/**
 * **La única excepción**, con su forma exacta — orden #27 C.1.
 *
 * El comprobante sube directo a Storage con la sesión del cliente, porque la
 * función de Vercel tiene tope de 4,5 MB por cuerpo y el bucket acepta 5 (el
 * porqué entero está en `mi-espacio/subir-comprobante.ts`). Es una **escritura**
 * a la carpeta de una inscripción propia, que decide la policy de la 006; no
 * lee nada que el guard del kit debiera cuidar.
 *
 * La excepción no es «ese archivo puede usar `.storage`»: es **esta llamada,
 * una vez, en ese archivo**. Se borra del código antes de barrer, y lo que
 * quede —otro `.from(`, un `.rpc(`, un `.storage.from(…).download(`— cae igual
 * que en cualquier otro archivo. Y su piso: si la llamada desaparece o se
 * duplica, el test lo dice, para que la excepción no sobreviva a lo que la
 * justificaba.
 */
const EXCEPCION = {
  archivo: join('mi-espacio', 'subir-comprobante.ts'),
  forma: new RegExp('supabase\\.storage\\.from\\(BUCKET_DE_COMPROBANTES\\)\\.upload\\(', 'g'),
};

/**
 * Piso medido el 29/9, no estimado.
 *
 * Son los archivos de `apps/familia/src` sin contar el núcleo del kit. Sube con
 * cada orden que agregue pantallas, en un renglón que se lee — igual que el
 * piso de tests. Lo que caza es que la carpeta se mueva o que el recorrido se
 * rompa, no que la app crezca poco.
 */
const PISO_DE_ARCHIVOS = 6;
const PISO_DE_BYTES = 2048;

function archivosDe(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const completo = join(dir, entrada);
    if (statSync(completo).isDirectory()) {
      /* El núcleo del kit no es de esta app: viaja con su huella y no se edita.
         Si alguna vez trajera un `.from(`, el que tiene que decirlo es el
         guardián de los moldes, no este barrido. Se saltea SOLO el núcleo
         (`acceso/nucleo/`): desde la #37 la carpeta `acceso/` también tiene
         las pantallas de la app, y ésas sí se barren. */
      if (entrada === 'nucleo' && dir.endsWith('acceso')) continue;
      salida.push(...archivosDe(completo));
    } else if (/\.tsx?$/.test(entrada)) {
      salida.push(completo);
    }
  }
  return salida.sort();
}

/**
 * El archivo sin comentarios y sin literales de texto.
 *
 * Es lo mismo que `soloCodigo()` en los guardianes de la web, y existe por el
 * mismo susto: un barrido que lee la prosa da positivo sobre el comentario que
 * explica por qué la regla existe. Se reemplaza por espacios y no se borra para
 * que los números de posición sigan sirviendo si algún día se reporta la línea.
 */
export function soloCodigo(fuente: string): string {
  const enBlanco = (m: string) => m.replace(/[^\n]/g, ' ');
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, enBlanco)
    .replace(/\/\/[^\n]*/g, enBlanco)
    .replace(/'(?:[^'\\\n]|\\.)*'/g, enBlanco)
    .replace(/"(?:[^"\\\n]|\\.)*"/g, enBlanco)
    .replace(/`(?:[^`\\]|\\.)*`/g, enBlanco);
}

describe('Mi espacio no le habla a la base desde el navegador', () => {
  const archivos = archivosDe(SRC);
  const codigo = archivos.map((a) => {
    const archivo = relative(SRC, a);
    const texto = soloCodigo(readFileSync(a, 'utf8'));
    return { archivo, texto: archivo === EXCEPCION.archivo ? texto.replace(EXCEPCION.forma, ' ') : texto };
  });

  it('EL PISO, PRIMERO: el barrido leyó la app', () => {
    expect(
      archivos.length,
      `el barrido encontró ${archivos.length} archivo(s) en apps/familia/src y el piso es `
      + `${PISO_DE_ARCHIVOS}. Un «cero llamadas a la base» sobre casi nada no afirma nada: `
      + 'o la carpeta se movió, o el recorrido se rompió.',
    ).toBeGreaterThanOrEqual(PISO_DE_ARCHIVOS);

    const bytes = codigo.reduce((s, c) => s + c.texto.replace(/\s+/g, '').length, 0);
    expect(
      bytes,
      'después de quitar comentarios y cadenas no quedó casi código: `soloCodigo()` se rompió y '
      + 'está limpiando de más, así que el barrido estaría mirando archivos en blanco.',
    ).toBeGreaterThan(PISO_DE_BYTES);
  });

  it('cero `.from(`, `.rpc(` y `.storage` en apps/familia/src', () => {
    const hallazgos: string[] = [];
    for (const { archivo, texto } of codigo) {
      for (const { patron, nombre } of PROHIBIDOS) {
        patron.lastIndex = 0;
        if (patron.test(texto)) hallazgos.push(`${archivo}: usa ${nombre}`);
      }
    }
    expect(
      hallazgos,
      'Mi espacio le pide los datos a `apps/api`, no a Supabase. `supabase-js` acá es solo para '
      + 'autenticarse: signInWithOtp, verifyOtp, signInWithOAuth, auth.mfa.*, signOut, getSession. '
      + 'Una lectura directa esquiva el guard del kit —segundo paso, paso reciente, roles— y lo '
      + 'hace en silencio, porque funciona.',
    ).toEqual([]);
  });

  it('la excepción del comprobante (#27 C) es UNA llamada, y está', () => {
    const fuente = soloCodigo(readFileSync(join(SRC, EXCEPCION.archivo), 'utf8'));
    expect(
      fuente.match(EXCEPCION.forma)?.length ?? 0,
      `${EXCEPCION.archivo}: la subida directa a Storage tiene que estar exactamente una vez. Si se fue, `
      + 'la excepción sobra y se borra de este test; si hay dos, la segunda no está declarada.',
    ).toBe(1);
  });

  it('y el barrido sabe distinguir el código de la prosa', () => {
    /* La mitad que hace que el cero de arriba valga. Sin esto, `soloCodigo()`
       podría estar devolviendo cadena vacía y los dos tests saldrían verdes. */
    const from = PROHIBIDOS[0].patron.source;
    const rpc = PROHIBIDOS[1].patron.source;
    const storage = PROHIBIDOS[2].patron.source;
    /* Los patrones salen de `PROHIBIDOS`, no de copias escritas acá: si un día
       alguien afloja uno de los tres, esta comprobación se afloja con él y el
       rojo aparece donde tiene que aparecer — en el test de arriba. */
    expect(soloCodigo('// esto menciona .from( en un comentario')).not.toMatch(new RegExp(from));
    expect(soloCodigo("const s = 'texto con .rpc( adentro';")).not.toMatch(new RegExp(rpc));
    expect(soloCodigo('const x = supabase.from("personas");')).toMatch(new RegExp(from));
    expect(soloCodigo('const y = cliente.storage;')).toMatch(new RegExp(storage));
  });
});
