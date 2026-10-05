/** Medianoche local de esa fecha, sin hora. */
export declare function soloDia(fecha: Date): Date;
/** El día 1 del mes de esa fecha. */
export declare function primeroDelMes(fecha: Date): Date;
/** ¿Son el mismo día del mismo mes del mismo año? */
export declare function mismoDia(a: Date, b: Date): boolean;
/** ¿Cae esa fecha dentro de ese mes? */
export declare function mismoMes(fecha: Date, mes: Date): boolean;
/**
 * Las 42 casillas del mes —siempre seis filas, para que el alto no cambie de un
 * mes a otro—. `primerDia`: 1 = lunes (ISO 8601, la convención de la agenda).
 */
export declare function diasDeMes(mes: Date, primerDia?: number): Date[];
/** Las iniciales de los siete días, del idioma dado y desde el que abre la semana. */
export declare function inicialesDeSemana(idioma: string, primerDia?: number): string[];
