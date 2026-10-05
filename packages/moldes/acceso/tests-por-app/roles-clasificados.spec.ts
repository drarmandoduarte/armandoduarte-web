/**
 * PLANTILLA · Kit de Acceso · test por app. Se copia, se adaptan las líneas
 * marcadas `← ADAPTAR` (imports, rutas, roles) y recién ahí se corre. Tal cual
 * NO compila: nombra módulos que cada app tiene con su propio nombre.
 * Va en: `<api>/src/acceso/` (al lado de `acceso.config.ts` y de `nucleo/`).
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
const MIGRACIONES = join(RAIZ, 'supabase', 'migrations'); // ← ADAPTAR: dónde están las migraciones de la app

/**
 * Valores del enum `user_role` según las migraciones. Lee el `create type` y
 * suma los `alter type … add value` posteriores (que es como se agrega un rol
 * sin tocar una migración vieja, que en este repo está prohibido).
 */
function rolesDeLaBase(): string[] {
  const roles = new Set<string>();
  const archivos = readdirSync(MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const archivo of archivos) {
    const sql = readFileSync(join(MIGRACIONES, archivo), 'utf8');

    const creacion = /create\s+type\s+user_role\s+as\s+enum\s*\(([^)]*)\)/i.exec(sql);
    if (creacion) {
      for (const valor of creacion[1].matchAll(/'([^']+)'/g)) roles.add(valor[1]);
    }
    for (const agregado of sql.matchAll(
      /alter\s+type\s+user_role\s+add\s+value\s+(?:if\s+not\s+exists\s+)?'([^']+)'/gi,
    )) {
      roles.add(agregado[1]);
    }
  }
  return [...roles].sort();
}

describe('Clasificación de roles (S0) — guardián', () => {
  const deLaBase = rolesDeLaBase();

  it('el enum user_role se lee de las migraciones (si esto falla, cambió la fuente de verdad)', () => {
    expect(deLaBase.length).toBeGreaterThan(0);
    expect(deLaBase).toEqual(['cliente', 'dueno', 'recepcion']); // ← ADAPTAR: los roles de la base de esta app (los del adaptador de ejemplo)
  });

  it('TODO rol de la base está clasificado en acceso.config.ts', () => {
    const faltantes = rolesSinClasificar(deLaBase);
    expect(faltantes, comoClasificar(faltantes)).toEqual([]);
  });

  it('la config no clasifica roles que no existen en la base', () => {
    const sobrantes = Object.keys(ACCESO.roles).filter((rol) => !deLaBase.includes(rol));
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
    for (const rol of ['dueno', 'recepcion']) {
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

  /** Los dos tipos de TypeScript son copias a mano: que no se desincronicen. */
  it('los tipos UserRole de backend y frontend coinciden con el enum de la base', () => {
    const fuentes = [
      join(RAIZ, 'apps', 'backend', 'src', 'auth', 'auth.types.ts'), // ← ADAPTAR: dónde declara UserRole el backend
      join(RAIZ, 'apps', 'frontend', 'src', 'types.ts'),             // ← ADAPTAR: y el frontend
    ];
    for (const fuente of fuentes) {
      const ts = readFileSync(fuente, 'utf8');
      const declaracion = /export\s+type\s+UserRole\s*=\s*([^;]+);/.exec(ts);
      expect(declaracion, `no se encontró UserRole en ${fuente}`).not.toBeNull();
      const valores = [...(declaracion?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
      expect(valores, `UserRole desincronizado en ${fuente}`).toEqual(deLaBase);
    }
  });
});
