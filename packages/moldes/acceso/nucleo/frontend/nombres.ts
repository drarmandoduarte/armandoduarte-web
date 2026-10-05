import { ACCESO } from '../acceso.config';

/**
 * KIT DE ACCESO · NÚCLEO (S0) — NO se edita en una app.
 *
 * Los tres nombres que la app le muestra a la persona salen de UN solo lugar
 * (`ACCESO.app`). Antes estaban escritos a mano en tres archivos y nada
 * garantizaba que dijeran lo mismo.
 */

/** `Cenit` → `cenit`. Base de las claves locales y del nombre del archivo. */
function slug(): string {
  return ACCESO.app
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Clave de almacenamiento local con el prefijo de la app: `cenit.lo_que_sea`. */
export function clave(sufijo: string): string {
  return `${slug()}.${sufijo}`;
}

/**
 * Nombre con el que la cuenta aparece en la app de autenticación. Lleva la
 * fecha para distinguir enrolamientos sucesivos del mismo usuario.
 */
export function nombreDelAutenticador(fecha: Date = new Date()): string {
  return `${ACCESO.app} TOTP ${fecha.toISOString()}`;
}

/** Nombre del archivo que se descarga con los códigos de respaldo. */
export function archivoDeCodigos(): string {
  return `${slug()}-codigos-respaldo.txt`;
}
