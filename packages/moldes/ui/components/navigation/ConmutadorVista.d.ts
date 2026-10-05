import * as React from 'react';

export interface OpcionDeVista {
  value: string;
  /** Nombre del icono Lucide: `layout-grid` para tarjetas, `list` para lista. */
  icon: string;
  /** Obligatoria: es el nombre accesible y el tooltip. No se dibuja. */
  label: string;
}

/**
 * Cómo se mira una lista: en filas o en tarjetas. Va al borde derecho de la fila
 * del buscador, en toda pantalla de listado.
 * @startingPoint section="Navigation" subtitle="Conmutador de vista lista/tarjetas" viewport="240x80"
 */
export interface ConmutadorVistaProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: OpcionDeVista[];
  value: string;
  onChange?: (value: string) => void;
  /** Nombre del grupo para el lector de pantalla. */
  label: string;
}
export declare function ConmutadorVista(props: ConmutadorVistaProps): React.JSX.Element;
