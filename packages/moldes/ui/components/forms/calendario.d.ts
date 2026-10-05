/** Una casilla de la rejilla, lista para dibujar. */
export interface CasillaDeCalendario {
  /** El día en `YYYY-MM-DD`. */
  iso: string;
  /** El número que se escribe en la casilla. */
  dia: number;
  /** ¿Es del mes que se está mirando, o relleno del vecino? Decide el color, no el permiso. */
  delMes: boolean;
  esHoy: boolean;
  elegido: boolean;
  /** ¿Entra en `min`/`max`? Lo que decide si la casilla se puede apretar. */
  elegible: boolean;
}

export interface OpcionesDeCasillas {
  /** Hoy, en ISO. Lo pone quien dibuja: esta cuenta no lee el reloj. */
  hoy?: string;
  /** Lo elegido, en ISO. */
  valor?: string;
  /** Los dos inclusivos, como en el `<input type="date">` que esto reemplaza. */
  min?: string;
  max?: string;
  /** 1 = lunes (ISO 8601, la convención de la agenda). */
  primerDia?: number;
}

/** El ISO de un día, por componentes locales — nunca `toISOString()`. */
export declare function isoDeDia(fecha: Date): string;
/** El día de un ISO, con el constructor de componentes. `null` si no es una fecha completa. */
export declare function diaDeIso(iso: string): Date | null;
/** ¿Ese día entra en `min`/`max`? Los dos inclusivos. */
export declare function esElegible(iso: string, min?: string, max?: string): boolean;
/** Correr el ancla de un mes, con el día 1 siempre puesto. */
export declare function correrMes(anclaIso: string, pasos: number): string;
/** El día 1 del mes al que pertenece ese ISO. */
export declare function anclaDelMes(iso: string): string;
/** Qué mes abre el calendario: lo elegido, o hoy, o el borde del rango más cercano. */
export declare function mesQueAbre(valor: string, hoy: string, min?: string, max?: string): string;
/** ¿La flecha hacia atrás lleva a un mes con días elegibles? */
export declare function hayMesAnterior(anclaIso: string, min?: string): boolean;
/** ¿Y la de adelante? */
export declare function hayMesSiguiente(anclaIso: string, max?: string): boolean;
/** Las 42 casillas del mes —siempre seis filas—, listas para dibujar. */
export declare function casillasDeMes(anclaIso: string, opciones?: OpcionesDeCasillas): CasillaDeCalendario[];
