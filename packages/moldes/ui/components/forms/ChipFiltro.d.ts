import * as React from 'react';

export interface ChipFiltroProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Puesto o no. Viaja como `aria-pressed`: es un control, no una etiqueta. */
  activo?: boolean;
  /** Cuántas filas deja ver este filtro. Se dibuja en tnum. */
  cuantos?: number;
  /** Icono Lucide opcional a la izquierda (12px). */
  icon?: string;
  /**
   * Se ve y no se toca. Para el filtro que hoy no deja ver nada: no se esconde
   * —un cero también informa, y una fila que cambia de largo no se puede
   * recorrer con la vista— pero no lleva a un tablero vacío.
   */
  disabled?: boolean;
  children?: React.ReactNode;
}
export declare function ChipFiltro(props: ChipFiltroProps): React.JSX.Element;
