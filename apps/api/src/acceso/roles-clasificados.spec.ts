/**
 * PLANTILLA · Kit de Acceso · test por app. Se copia, se adaptan las líneas
 * marcadas `← ADAPTAR` (imports, rutas, roles) y recién ahí se corre. Tal cual
 * NO compila: nombra módulos que cada app tiene con su propio nombre.
 * Va en: `<api>/src/acceso/` (al lado de `acceso.config.ts` y de `nucleo/`).
 *
 * ── Lo adaptado en Mi espacio (orden #15, C; plantilla 1.3.0 en la #37) ───
 * **Mi espacio no tiene enum de roles.** La `001` los declara como un `check`
 * de columna —`rol text not null check (rol in ('dueno', 'equipo'))`— y el
 * tercer rol, `cliente`, **no está en la base en ninguna forma**: es una
 * persona sin fila activa en `miembros`. Por eso `rolesDeLaBase()` lee el
 * `check` en vez del `create type`, y «la config no clasifica roles que no
 * existen» deja pasar exactamente los roles sin fila (`SIN_FILA_EN_LA_BASE`).
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ACCESO } from './acceso.config'; // ← ADAPTAR solo si este test no vive en <api>/src/acceso/
import { comoClasificar, esEquipo, rolesSinClasificar, tipoDeCuenta } from './nucleo/roles';

/**
 * GUARDIÁN DE LA CLASIFICACIÓN DE ROLES (Kit de Acceso · S0) — ADAPTADOR.
 *
 * FUENTE DE VERDAD: el enum `user_role` de las migraciones
 * (`supabase/migrations/…`), NO el tipo TypeScript.
 *
 * Por qué la base y no el tipo: la base es lo que decide qué valor puede tener
 * `profiles.role` en producción. El tipo de TypeScript es una copia a mano que
 * puede quedar atrasada — de hecho hay dos copias (`auth.types.ts` del backend y
 * `types.ts` del frontend), y nada las obliga a coincidir. Si mañana una
 * migración agrega un rol y alguien se olvida del tipo, el tipo no se entera;
 * la base sí. Este test lee la base.
 *
 * (De yapa se verifica que los dos tipos de TypeScript coincidan con el enum:
 * si se desincronizan, mejor enterarse acá que en runtime.)
 */

/**
 * Raíz del repo. `import.meta.dirname` no compila con el `module` de NestJS
 * (CommonJS), así que se sube desde el directorio del runner hasta encontrar el
 * lockfile de la raíz (`package-lock.json` o `pnpm-lock.yaml`).
 */
function raizDelRepo(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, 'package-lock.json')) || existsSync(join(dir, 'pnpm-lock.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('No se encontró la raíz del repo desde ' + process.cwd());
}

const RAIZ = raizDelRepo();
const MIGRACIONES = join(RAIZ, 'packages', 'db', 'migrations'); // ← ADAPTAR: hecho, las migraciones de Mi espacio

/**
 * ← ADAPTAR: hecho. Los roles que la base acepta, leídos del `check` de
 * `miembros.rol` (la `001`), más los que una migración posterior agregara con
 * un `add constraint … rol in (…)`, que es como se sumaría uno sin tocar una
 * migración vieja.
 */
function rolesDeLaBase(): string[] {
  const roles = new Set<string>();
  const archivos = readdirSync(MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const archivo of archivos) {
    const sql = readFileSync(join(MIGRACIONES, archivo), 'utf8');
    for (const check of sql.matchAll(/\brol\s+text[^,]*?check\s*\(\s*rol\s+in\s*\(([^)]*)\)/gis)) {
      for (const valor of check[1].matchAll(/'([^']+)'/g)) roles.add(valor[1]);
    }
    for (const alter of sql.matchAll(/add\s+constraint[^;]*?rol\s+in\s*\(([^)]*)\)/gis)) {
      for (const valor of alter[1].matchAll(/'([^']+)'/g)) roles.add(valor[1]);
    }
  }
  return [...roles].sort();
}

/**
 * ← ADAPTAR: hecho. El rol que el producto tiene y la base no: `cliente` es la
 * **ausencia** de una fila activa en `miembros`. Con nombre, para distinguir
 * «un rol sin fila porque así se diseñó» de «un rol que alguien borró de la
 * base y olvidó borrar de la config».
 */
const SIN_FILA_EN_LA_BASE = ['cliente'];

describe('Clasificación de roles (S0) — guardián', () => {
  const deLaBase = rolesDeLaBase();

  it('el check de miembros.rol se lee de las migraciones (si esto falla, cambió la fuente de verdad)', () => {
    expect(deLaBase.length).toBeGreaterThan(0);
    expect(deLaBase).toEqual(['dueno', 'equipo']); // ← ADAPTAR: hecho, los roles de la base de Mi espacio
  });

  it('TODO rol de la base está clasificado en acceso.config.ts', () => {
    const faltantes = rolesSinClasificar(deLaBase);
    expect(faltantes, comoClasificar(faltantes)).toEqual([]);
  });

  it('la config no clasifica roles que no existen en la base (salvo los sin fila)', () => {
    const sobrantes = Object.keys(ACCESO.roles)
      .filter((rol) => !deLaBase.includes(rol))
      .filter((rol) => !SIN_FILA_EN_LA_BASE.includes(rol)); // ← ADAPTAR: hecho, `cliente` no tiene fila
    expect(
      sobrantes,
      `Roles clasificados que ya no existen en la base: ${sobrantes.join(', ')}. ` +
        'Si se borró un rol, borralo también de acceso.config.ts',
    ).toEqual([]);
  });

  it('cada clasificación es equipo o cliente, sin terceras opciones', () => {
    for (const [rol, tipo] of Object.entries(ACCESO.roles)) {
      expect(['equipo', 'cliente'], `rol ${rol}`).toContain(tipo);
    }
  });

  /**
   * ← ADAPTAR: los roles de equipo de ESTA app. Ven datos de terceros, así que
   * `esEquipo()` tiene que dar true para cada uno.
   */
  it('los roles de equipo de la app son equipo → esEquipo true', () => {
    for (const rol of ['dueno', 'equipo']) { // ← ADAPTAR: hecho
      expect(tipoDeCuenta(rol)).toBe('equipo');
      expect(esEquipo(rol)).toBe(true);
    }
  });

  it('falla CERRADO: un rol desconocido, vacío o ausente cuenta como equipo', () => {
    expect(esEquipo('rol_que_no_existe')).toBe(true);
    expect(esEquipo(null)).toBe(true);
    expect(esEquipo(undefined)).toBe(true);
    expect(tipoDeCuenta('rol_que_no_existe')).toBeUndefined();
  });

  it('un rol clasificado como cliente NO es equipo (el camino queda hecho)', () => {
    // No se toca la config real: se prueba la función con una clasificación
    // hipotética, que es lo que va a pasar el día que exista un portal del dueño.
    const original = ACCESO.roles as Record<string, 'equipo' | 'cliente'>;
    original.propietario = 'cliente';
    try {
      expect(esEquipo('propietario')).toBe(false);
    } finally {
      delete original.propietario;
    }
  });

  it('cliente: clasificado, sin fila en la base y sin segundo paso impuesto', () => {
    for (const rol of SIN_FILA_EN_LA_BASE) {
      expect(ACCESO.roles[rol], `${rol} tiene que estar clasificado`).toBeDefined();
      expect(deLaBase, `${rol} no debería estar en el check de la base`).not.toContain(rol);
    }
    expect(esEquipo('cliente'), 'a un cliente NO se le impone el segundo paso').toBe(false);
  });

  /**
   * Las copias a mano de los roles en TypeScript: que no se desincronicen.
   * ← ADAPTAR: hecho. Mi espacio no tiene un `UserRole`: tiene `Rol` en
   * `@codice/core` (el panel), el tipo que devuelve `rolDe()` en la API (que no
   * puede importar `core`) y el campo `rol` de `/api/yo` en la pantalla. Las
   * tres tienen que decir los roles de la base más los sin fila.
   */
  it('los roles escritos en TypeScript coinciden con la base y los sin fila', () => {
    const esperados = [...deLaBase, ...SIN_FILA_EN_LA_BASE].sort();
    const fuentes: ReadonlyArray<[string, RegExp]> = [
      [join(RAIZ, 'packages', 'core', 'src', 'panel', 'equipo.ts'), /export\s+type\s+Rol\s*=\s*([^;]+);/],
      [join(RAIZ, 'apps', 'api', 'src', 'identidad', 'supabase.service.ts'), /async\s+rolDe\([^)]*\):\s*Promise<([^>]+)>/],
      [join(RAIZ, 'apps', 'familia', 'src', 'comun', 'api.ts'), /\brol:\s*('[^;]+);/],
    ];
    for (const [fuente, patron] of fuentes) {
      const declaracion = patron.exec(readFileSync(fuente, 'utf8'));
      expect(declaracion, `no se encontraron los roles en ${fuente}`).not.toBeNull();
      const valores = [...(declaracion?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
      expect(valores, `roles desincronizados en ${fuente}`).toEqual(esperados);
    }
  });

  it('la app del autenticador se llama como decidió dirección', () => {
    /* De acá salen el nombre que la persona ve en su app de autenticación y el
       del archivo de códigos. «Códice» es el nombre de la plataforma por dentro. */
    expect(ACCESO.app).toBe('Armando Duarte');
  });

  it('Mi espacio es de rescate solo: nadie resetea el autenticador de otra persona (fase-2 §8)', () => {
    expect(ACCESO.rescate).toBe('solo');
  });
});
