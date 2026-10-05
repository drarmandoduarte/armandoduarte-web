/** ISO a lo que se lee: `2026-08-10` → `10/08/2026`. Vacío devuelve vacío. */
export declare function isoATexto(iso: string | undefined | null): string;

/** ¿Existe ese día en el calendario? `31/02/2026` no existe. */
export declare function esFechaReal(dia: number, mes: number, anio: number): boolean;

/**
 * Lo que se lee a ISO. `''` cuando está vacío —que es un estado legítimo— y
 * `null` cuando lo escrito todavía no es una fecha.
 */
export declare function textoAIso(texto: string | undefined | null): string | null;

/** Las barras se ponen solas mientras se teclea: `10082026` → `10/08/2026`. */
export declare function conBarras(texto: string | undefined | null): string;
