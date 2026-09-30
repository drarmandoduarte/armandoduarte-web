import { SEGURIDAD_512, type TipoDeCuenta } from '../seguridad-512.config';

/**
 * KIT DE SEGURIDAD 512 · NÚCLEO (S0) — NO se edita en una app.
 *
 * Una mejora acá se hace en el kit, sube la versión y se regeneran las huellas
 * (`seguridad-512/HUELLAS.txt`). `scripts/check-seguridad-512.mjs` compara este
 * archivo contra su huella y falla si alguien lo tocó en una app.
 *
 * Lo único variable es la CONFIG (`../seguridad-512.config`), que es adaptador.
 */

/** Cómo está clasificado un rol, o `undefined` si nadie lo clasificó. */
export function tipoDeCuenta(rol: string | null | undefined): TipoDeCuenta | undefined {
  if (typeof rol !== 'string') return undefined;
  return SEGURIDAD_512.roles[rol];
}

/**
 * ¿Este rol trabaja adentro (ve datos de otras personas)? El segundo paso es
 * obligatorio solo para el equipo.
 *
 * FALLA CERRADO: un rol desconocido —o ausente— cuenta como equipo. Si mañana
 * alguien agrega un rol a la base y se olvida de clasificarlo, lo peor que
 * pasa es que le pidan el segundo paso de más; nunca de menos. (Y además el
 * test guardián `roles-clasificados.spec.ts` lo pone en rojo.)
 */
export function esEquipo(rol: string | null | undefined): boolean {
  return tipoDeCuenta(rol) !== 'cliente';
}

/** Roles que existen en la base pero nadie clasificó. Lo usa el test guardián. */
export function rolesSinClasificar(rolesDeLaBase: readonly string[]): string[] {
  return rolesDeLaBase.filter((rol) => tipoDeCuenta(rol) === undefined);
}

/** Mensaje único del guardián: dice exactamente qué hacer, no solo qué falló. */
export function comoClasificar(rolesFaltantes: readonly string[]): string {
  return (
    `Rol(es) sin clasificar: ${rolesFaltantes.join(', ')}. ` +
    'Clasificá el rol nuevo como equipo o cliente en seguridad-512.config.ts'
  );
}
