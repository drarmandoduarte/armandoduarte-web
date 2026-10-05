import type { OpcionBuscable } from './ComboBuscador';

/** Sin acentos, sin mayúsculas y sin aire en las puntas. */
export declare function normalizar(texto: unknown): string;

/**
 * Las opciones que coinciden con lo escrito, en el orden en que venían. Busca
 * en `label` y en `detalle`. `tope` corta lo que se dibuja, no lo que se busca.
 */
export declare function filtrarOpciones<T extends OpcionBuscable>(
  opciones: T[] | undefined | null, texto: string, tope?: number,
): T[];

/** La opción que tiene ese valor, si es que la lista lo tiene. */
export declare function opcionDe<T extends OpcionBuscable>(
  opciones: T[] | undefined | null, valor: string | undefined | null,
): T | null;
