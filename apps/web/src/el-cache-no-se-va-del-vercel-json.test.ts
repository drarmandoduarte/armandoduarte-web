/**
 * Las tres reglas de `Cache-Control` siguen puestas — orden Códice #11.
 *
 * ── Por qué existe este archivo ───────────────────────────────────────────
 * Por lo mismo que `el-noindex-no-sale-del-vercel-app`: **la mutación no tiraba
 * nada.** Antes de esta orden se borró del `vercel.json` la regla entera de
 * `/fuentes/(.*)` —la que hace que 200 KB de tipografía no se vuelvan a pedir
 * en cada visita— y `pnpm test` salió **verde, 29 de 29**. Ninguna comprobación
 * del repo miraba una cabecera de caché.
 *
 * Es el perfil de defecto que esta casa ya pagó dos veces: no rompe nada que se
 * pueda notar. La web se ve idéntica, todos los tests pasan, y lo único que
 * cambia es que cada visitante baja de nuevo lo que ya tenía. Se descubre meses
 * después, midiendo, o no se descubre.
 *
 * ── Qué cuida, y qué NO ──────────────────────────────────────────────────
 * Cuida la **intención escrita en el archivo**: que las tres carpetas de
 * contenido estático lleven la cabecera, con el mismo valor, y que nadie se la
 * ponga a todo el sitio. Que Vercel la *aplique* es otra comprobación y no se
 * hace acá: se mide con `curl` contra producción y está en el informe de la
 * #11. Hacen falta las dos —ésta caza el renglón borrado en un PR, la otra caza
 * que la plataforma cambie de opinión—, y es el mismo reparto que la #08 dejó
 * escrito para el `noindex`.
 *
 * ── `immutable` sobre `/(.*)` sería irreversible, y por eso hay un test ──
 * Un año de caché inmutable sobre el HTML no se arregla desplegando: el
 * navegador de cada visitante que lo haya recibido **no vuelve a pedir la
 * página** hasta 2027, y no hay nada que se le pueda mandar para convencerlo.
 * Por eso la afirmación (3) mira lo contrario que las otras dos: que ninguna
 * regla que aplique a todo el sitio traiga `Cache-Control`.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..', '..');
const ASSETS = join(AQUI, '..', 'dist', 'assets');

/** Un año, inmutable. Es el valor que el sitio estático ya usaba. */
const UN_ANO = 'public, max-age=31536000, immutable';

/**
 * Las tres carpetas, y por qué las tres pueden ser `immutable` con motivos
 * distintos — que conviene tener escrito, porque el motivo es lo que hace
 * segura la regla:
 *
 *   · `/assets/` — **el nombre lleva hash del contenido** (`style-0BCOhvT3.css`).
 *     Un contenido nuevo es un nombre nuevo, así que el navegador nunca puede
 *     quedarse con una versión vieja. Lo afirma la comprobación (4).
 *   · `/fuentes/` — el nombre es estable y sin hash **a propósito** (está en
 *     `vite.config.ts`): una tipografía nueva es un archivo nuevo, no el mismo
 *     con otro contenido. El día que eso deje de ser cierto, esta regla miente.
 *   · `/img/` — igual que las fuentes: salen de `public/` con su nombre.
 */
const CARPETAS = ['/assets/(.*)', '/fuentes/(.*)', '/img/(.*)'];

/**
 * Los dos archivos, por el mismo motivo que el guardián del `noindex`: el que
 * Vercel lee es el de la raíz, el de `apps/web/` quedó como referencia de sus
 * reglas, y mientras exista **no puede contradecirlo**. Una referencia que
 * miente es peor que ninguna.
 */
const ARCHIVOS = [
  ['la raíz · es el que Vercel lee', 'vercel.json'],
  ['apps/web · referencia, pero no puede contradecir', 'apps/web/vercel.json'],
] as const;

type Regla = {
  source: string;
  has?: { type: string; value: string }[];
  headers: { key: string; value: string }[];
};

const leer = (ruta: string) =>
  (JSON.parse(readFileSync(join(RAIZ, ruta), 'utf8')) as { headers: Regla[] }).headers ?? [];

/** Las reglas de caché de un archivo, como `ruta → valor`, en orden. */
const cacheDe = (reglas: Regla[]) => reglas
  .filter((r) => r.headers.some((h) => h.key === 'Cache-Control'))
  .map((r) => `${r.source} → ${r.headers.find((h) => h.key === 'Cache-Control')?.value}`);

for (const [nombre, ruta] of ARCHIVOS) {
  describe(`${nombre} (${ruta})`, () => {
    const reglas = leer(ruta);

    /* EL PISO, PRIMERO: sobre cero reglas leídas, «ninguna regla incondicional
       trae Cache-Control» es cierto y no dice nada. */
    it(`piso · se leyeron las reglas de cabeceras (${ruta})`, () => {
      expect(reglas.length, 'no se leyó ninguna regla: el archivo cambió de forma o de lugar')
        .toBeGreaterThanOrEqual(5);
    });

    it('(1) las tres carpetas estáticas llevan un año de caché inmutable', () => {
      expect(
        cacheDe(reglas),
        'sin estas tres reglas cada visitante vuelve a bajar 200 KB de tipografía, las fotos y las '
        + 'hojas de estilo en cada visita. No se ve: la web queda igual y sólo tarda más. '
        + 'Borrar una es un renglón que en un diff parece limpieza.',
      ).toEqual(CARPETAS.map((c) => `${c} → ${UN_ANO}`));
    });

    it('(2) ninguna de las tres está condicionada a un host', () => {
      /* El `has` de la #08 es de la regla de robots y de ninguna otra. Una regla
         de caché condicionada al host de Vercel dejaría al dominio propio —el
         único que le importa a alguien— sin caché, y el preview con ella: al
         revés de lo que cualquiera supondría leyendo el diff. */
      const condicionadas = reglas
        .filter((r) => r.headers.some((h) => h.key === 'Cache-Control'))
        .filter((r) => r.has)
        .map((r) => r.source);
      expect(condicionadas, 'la caché es del sitio, no de un host').toEqual([]);
    });

    it('(3) ninguna regla que aplique a todo el sitio sirve Cache-Control', () => {
      /* La mitad irreversible. Un año inmutable sobre `/(.*)` congela el HTML en
         el navegador de cada visitante que lo reciba, y no hay despliegue que lo
         arregle: no vuelve a pedir la página. */
      const aTodo = reglas
        .filter((r) => r.source === '/(.*)')
        .filter((r) => r.headers.some((h) => h.key === 'Cache-Control'))
        .map((r) => `${r.source} (${r.headers.map((h) => h.key).join(', ')})`);
      expect(
        aTodo,
        'una cabecera de caché sobre TODO el sitio alcanza al HTML, y el HTML no lleva hash: '
        + 'cada visitante que la reciba queda con la página congelada hasta que expire, '
        + 'y no hay nada que se le pueda desplegar para sacarlo de ahí.',
      ).toEqual([]);
    });
  });
}

describe('los dos archivos, comparados', () => {
  it('(4) todo lo que se publica en /assets/ lleva hash en el nombre', () => {
    /* Es lo que hace **segura** la regla de `/assets/`, y es lo único de las tres
       que se puede comprobar contra la salida en vez de contra la intención:
       `/fuentes/` y `/img/` llevan nombres estables a propósito y su seguridad
       es una decisión declarada, no una propiedad del archivo.

       El piso va primero: sobre una carpeta vacía —o que no existe porque nadie
       compiló— «todos llevan hash» es cierto sin haber mirado nada. */
    const archivos = existsSync(ASSETS) ? readdirSync(ASSETS) : [];

    expect(
      archivos.length,
      `no hay nada en ${ASSETS}. Sin build (\`pnpm --filter @codice/web build\`) esta afirmación `
      + 'pasa sin haber mirado un solo archivo.',
    ).toBeGreaterThanOrEqual(2);

    const sinHash = archivos.filter((n) => !/-[A-Za-z0-9_-]{8}\.(js|css)$/.test(n));
    expect(
      sinHash,
      'estos archivos van a /assets/, que desde la #11 se sirve con un año de caché inmutable, '
      + 'y no llevan hash en el nombre: un contenido nuevo reusaría el mismo nombre y el navegador '
      + 'se quedaría con el viejo hasta 2027. O el archivo lleva hash, o /assets/ no es su lugar.',
    ).toEqual([]);
  });

  it('(5) la raíz y apps/web declaran exactamente las mismas reglas de caché', () => {
    const [enRaiz, enApp] = ARCHIVOS.map(([, ruta]) => cacheDe(leer(ruta)));
    expect(
      enApp,
      'el de `apps/web/` es la referencia escrita de lo que Vercel aplica. Si dicen cosas distintas, '
      + 'el que lo lea en tres meses va a creerle al equivocado — y no hay manera de saber cuál es.',
    ).toEqual(enRaiz);
  });
});
