/**
 * El `noindex` sigue puesto en `.vercel.app` — orden Códice #08, A.
 *
 * ── Qué cuida, y por qué es la comprobación más barata y más cara del repo ─
 * Barata: lee un JSON y mira cuatro cosas. Cara: si se equivoca, Google indexa
 * **dos sitios idénticos** —`armandoduarte.com` y `armandoduarte-web.vercel.app`—
 * y el que gana no es el que uno quiere. Eso no se ve mirando la web: se ve
 * meses después, en los resultados de búsqueda, cuando ya está hecho.
 *
 * La #08 no borró la cabecera de robots: **la condicionó al host**. Sacar esa
 * condición es un renglón, se ve inocente en un diff —«limpieza del
 * vercel.json»— y no rompe absolutamente nada que se pueda notar. Es el perfil
 * exacto del defecto que esta casa aprendió a temer en la #06: el que no grita.
 *
 * ── Por qué este archivo existe, dicho sin vueltas ───────────────────────
 * La orden #08 pedía probar la mutación —quitar el `has`— y ver qué se ponía
 * rojo. **No se ponía rojo nada**: ninguna comprobación del repo miraba
 * `vercel.json`. La orden lo anticipaba y mandaba escribir la comprobación en
 * esa misma orden si pasaba. Esto es eso.
 *
 * ── Lo que NO puede comprobar, declarado ─────────────────────────────────
 * Que Vercel *honre* la condición. Esto lee la intención escrita en el archivo;
 * que el servidor la aplique se mide con `curl` contra los dos hosts, y está
 * pegado en el informe de la #08 y repetido sobre producción. Son dos
 * comprobaciones distintas y hacen falta las dos: ésta caza el renglón borrado
 * en un PR, la otra caza que la plataforma cambie de opinión.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..', '..');

/** El host de Vercel que sirve el mismo sitio y no tiene que indexarse. */
const HOST_DE_VERCEL = 'armandoduarte-web.vercel.app';

/**
 * Los dos archivos, y por qué se miran los dos.
 *
 * El que Vercel lee desde la #04 es el de la raíz. El de `apps/web/` quedó como
 * referencia de sus reglas, y `docs/tareas.md` ya avisaba en el pendiente 2:
 * «se saca de los dos o se borra ése». Mientras exista, decir una cosa en uno y
 * otra en el otro es dejar escrita una trampa para el que lo lea en tres meses.
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

for (const [nombre, ruta] of ARCHIVOS) {
  describe(`${nombre} (${ruta})`, () => {
    const config = JSON.parse(readFileSync(join(RAIZ, ruta), 'utf8')) as { headers: Regla[] };
    const reglas = config.headers ?? [];
    const conRobots = reglas.filter((r) => r.headers.some((h) => h.key === 'X-Robots-Tag'));

    /* EL PISO, PRIMERO: sin reglas leídas, «ninguna regla incondicional trae
       robots» es cierto sobre la nada y el test pasa con el archivo vacío. */
    it(`piso · se leyeron las reglas de cabeceras (${ruta})`, () => {
      expect(reglas.length, 'no se leyó ninguna regla: el archivo cambió de forma o de lugar')
        .toBeGreaterThanOrEqual(3);
    });

    it('hay exactamente una regla que sirve X-Robots-Tag', () => {
      expect(
        conRobots.length,
        'si son dos, una puede quedarse sin condición y la otra taparla en la lectura del diff',
      ).toBe(1);
    });

    it(`y está condicionada al host ${HOST_DE_VERCEL}`, () => {
      const [regla] = conRobots;
      expect(
        regla?.has,
        'la cabecera de robots SIN condición de host apaga el índice de armandoduarte.com: '
        + 'la web deja de existir para Google y nada en la página se ve distinto',
      ).toBeTruthy();
      expect(regla.has).toEqual([{ type: 'host', value: HOST_DE_VERCEL }]);
    });

    it('el valor sigue siendo noindex, nofollow', () => {
      const robots = conRobots[0].headers.find((h) => h.key === 'X-Robots-Tag');
      expect(robots?.value).toBe('noindex, nofollow');
    });

    /*
     * Y la otra mitad, que es la que la orden vino a resolver: **ninguna regla
     * sin condición puede traer robots**. Sin esto, agregar una segunda regla
     * incondicional dejaría el test de arriba en verde —hay una condicionada— y
     * el dominio propio seguiría con `noindex`.
     */
    it('ninguna regla sin condición de host sirve X-Robots-Tag', () => {
      const sueltas = reglas
        .filter((r) => !r.has)
        .filter((r) => r.headers.some((h) => h.key === 'X-Robots-Tag'))
        .map((r) => r.source);
      expect(sueltas, 'estas reglas aplican el noindex a TODOS los hosts, el dominio propio incluido')
        .toEqual([]);
    });

    /*
     * Las de seguridad van al revés: tienen que seguir **sin** condición. Si
     * alguien arrastrara una de ellas dentro del bloque condicionado, el dominio
     * propio se quedaría sin `nosniff` ni `X-Frame-Options` y tampoco se vería.
     */
    it('las cabeceras de seguridad siguen aplicando a todos los hosts', () => {
      const sinCondicion = new Set(
        reglas.filter((r) => !r.has).flatMap((r) => r.headers.map((h) => h.key)),
      );
      for (const clave of ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options']) {
        expect(sinCondicion.has(clave), `${clave} quedó condicionada a un host y no tiene que estarlo`).toBe(true);
      }
    });
  });
}
