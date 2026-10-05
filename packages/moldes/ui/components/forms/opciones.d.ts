import type { OpcionDeSelector, GrupoDeSelector } from './Selector';

/** Hasta cuántas opciones entra un desplegable sin búsqueda. Siete. */
export declare const TOPE_DESPLEGABLE: number;

export declare function modoDeSeleccion(
  cuantas: number, buscable?: boolean, libre?: boolean,
): 'desplegable' | 'busqueda';

export declare function aplanarOpciones(
  options?: OpcionDeSelector[], groups?: GrupoDeSelector[],
): OpcionDeSelector[];

export interface TramoDeOpciones {
  /** El nombre del grupo, o `undefined` para las opciones sueltas. */
  grupo?: string;
  /** Sus opciones, con el índice que tienen en la lista completa. */
  opciones: { opcion: OpcionDeSelector; indice: number }[];
}

export declare function segmentarPorGrupo(
  opciones?: OpcionDeSelector[],
): TramoDeOpciones[];
