import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SEGURIDAD_512 } from './seguridad-512/seguridad-512.config';
import { comoClasificar, esEquipo, rolesSinClasificar, tipoDeCuenta } from './seguridad-512/nucleo/roles';

/**
 * CLASIFICACIÓN DE ROLES (Kit de Seguridad 512 · S0) — GUARDIÁN, adaptado.
 *
 * Del kit, `tests-por-app/roles-clasificados.spec.ts`. Lo adaptado es de dónde
 * sale la lista de roles de la base, y no es un cambio cosmético:
 *
 * **Cenit tiene un `enum user_role`; esta app no tiene enum.** La migración
 * `001` de la #13 declara los roles como una restricción de columna —
 * `rol text not null check (rol in ('dueno', 'equipo'))`— y el tercer rol de la
 * app, `cliente`, **no está en la base en ninguna forma**: un cliente es una
 * persona **sin fila activa en `miembros`**. Es la definición de la spec, y por
 * eso la comprobación «la config no clasifica roles que no existen en la base»
 * del kit no se puede aplicar tal cual: `cliente` existe en el producto y no en
 * el `check`. Se reemplazó por una que dice exactamente eso y falla si aparece
 * un cuarto nombre que nadie explicó.
 *
 * Lo que NO cambió: que todo rol de la base esté clasificado, que las
 * clasificaciones sean solo `equipo` o `cliente`, y que el kit falle cerrado.
 */

/** Raíz del repo: se sube hasta encontrar el `pnpm-workspace.yaml`. */
function raizDelRepo(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error(`No se encontró la raíz del repo desde ${process.cwd()}`);
}

const RAIZ = raizDelRepo();
const MIGRACIONES = join(RAIZ, 'packages', 'db', 'migrations');

/**
 * Los roles que la base acepta, leídos del `check` de `miembros.rol`.
 *
 * Se lee del SQL y no de una copia escrita acá: es la lección de la #06 —un
 * guardián que compara contra otra copia vigila la copia—. Si mañana una
 * migración `007` agrega `'coordinador'` al `check`, este test lo ve sin que
 * nadie lo anote.
 */
function rolesDeLaBase(): string[] {
  const roles = new Set<string>();
  for (const archivo of readdirSync(MIGRACIONES).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(MIGRACIONES, archivo), 'utf8');
    for (const check of sql.matchAll(/\brol\s+text[^,]*?check\s*\(\s*rol\s+in\s*\(([^)]*)\)/gis)) {
      for (const valor of check[1].matchAll(/'([^']+)'/g)) roles.add(valor[1]);
    }
    /* Y la forma en que se agregaría uno nuevo sin tocar una migración vieja,
       que en esta casa está prohibido: un `check` nuevo en una migración
       posterior. Se suma en vez de reemplazar. */
    for (const alter of sql.matchAll(/add\s+constraint[^;]*?rol\s+in\s*\(([^)]*)\)/gis)) {
      for (const valor of alter[1].matchAll(/'([^']+)'/g)) roles.add(valor[1]);
    }
  }
  return [...roles].sort();
}

/**
 * El rol que el producto tiene y la base no: no es una fila, es la **ausencia**
 * de una fila activa en `miembros`. Está acá, con nombre, para que el test de
 * «sobrantes» pueda distinguir «un rol que la base no tiene porque así se
 * diseñó» de «un rol que alguien borró de la base y olvidó borrar de la
 * config», que es el defecto que ese test caza.
 */
const SIN_FILA_EN_LA_BASE = ['cliente'];

describe('Clasificación de roles (S0) — guardián', () => {
  const deLaBase = rolesDeLaBase();

  it('EL PISO: el `check` de `miembros.rol` se lee de las migraciones', () => {
    expect(
      deLaBase,
      'si esto falla, cambió la fuente de verdad de los roles: o la migración 001 se movió, o el '
      + '`check (rol in (...))` se escribió de otra forma y este barrido dejó de encontrarlo. Todo '
      + 'lo que sigue estaría midiendo sobre una lista vacía.',
    ).toEqual(['dueno', 'equipo']);
  });

  it('TODO rol de la base está clasificado en seguridad-512.config.ts', () => {
    const faltantes = rolesSinClasificar(deLaBase);
    expect(faltantes, comoClasificar(faltantes)).toEqual([]);
  });

  it('la config no clasifica roles que no existen, salvo los declarados sin fila', () => {
    const sobrantes = Object.keys(SEGURIDAD_512.roles)
      .filter((rol) => !deLaBase.includes(rol))
      .filter((rol) => !SIN_FILA_EN_LA_BASE.includes(rol));
    expect(
      sobrantes,
      `Roles clasificados que no existen en la base: ${sobrantes.join(', ')}. Si se borró un rol, `
      + 'bórralo también de seguridad-512.config.ts; si es un rol que por diseño no tiene fila '
      + '—como `cliente`—, agrégalo a SIN_FILA_EN_LA_BASE con su motivo.',
    ).toEqual([]);
  });

  it('`cliente` es exactamente eso: un rol del producto sin fila en la base', () => {
    for (const rol of SIN_FILA_EN_LA_BASE) {
      expect(SEGURIDAD_512.roles[rol], `${rol} tiene que estar clasificado`).toBeDefined();
      expect(deLaBase, `${rol} no debería estar en el check de la base`).not.toContain(rol);
    }
  });

  it('cada clasificación es equipo o cliente, sin terceras opciones', () => {
    for (const [rol, tipo] of Object.entries(SEGURIDAD_512.roles)) {
      expect(['equipo', 'cliente'], `rol ${rol}`).toContain(tipo);
    }
  });

  it('los tres roles de esta app están clasificados como dirección los decidió', () => {
    expect(tipoDeCuenta('dueno')).toBe('equipo');
    expect(tipoDeCuenta('equipo')).toBe('equipo');
    expect(tipoDeCuenta('cliente')).toBe('cliente');
    expect(esEquipo('dueno')).toBe(true);
    expect(esEquipo('equipo')).toBe(true);
    expect(esEquipo('cliente'), 'a un cliente NO se le impone el segundo paso').toBe(false);
  });

  it('falla CERRADO: un rol desconocido, vacío o ausente cuenta como equipo', () => {
    expect(esEquipo('rol_que_no_existe')).toBe(true);
    expect(esEquipo(null)).toBe(true);
    expect(esEquipo(undefined)).toBe(true);
    expect(tipoDeCuenta('rol_que_no_existe')).toBeUndefined();
  });

  it('la app del autenticador se llama como decidió dirección', () => {
    /* De acá salen el nombre que la persona ve en Google Authenticator y el del
       archivo de códigos. «Códice» es el nombre de la plataforma por dentro y
       no lo conoce nadie de la familia. */
    expect(SEGURIDAD_512.app).toBe('Armando Duarte');
  });
});
