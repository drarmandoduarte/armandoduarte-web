/** Lo guardado a lo que se lee: `09:30` → `09:30`, `09:30:00` → `09:30`. */
export declare function horaATexto(valor: string | undefined | null): string;

/** ¿Existe esa hora en el reloj? `24:00` no existe, y `09:60` tampoco. */
export declare function esHoraReal(hora: number, minuto: number): boolean;

/**
 * Lo que se lee a `HH:MM`. `''` cuando está vacío —que es un estado legítimo— y
 * `null` cuando lo escrito todavía no es una hora.
 */
export declare function textoAHora(texto: string | undefined | null): string | null;

/** Los dos puntos se ponen solos mientras se teclea: `0930` → `09:30`. */
export declare function conDosPuntos(texto: string | undefined | null): string;
