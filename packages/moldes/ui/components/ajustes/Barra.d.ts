import * as React from 'react';
/** Barra de progreso con marca opcional (80 %) y etiqueta. */
export interface BarraProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0 a 1. */
  valor: number;
  /** Dónde va la marca, 0 a 1 (el aviso al 80 % es 0.8). */
  marca?: number;
  /** El rótulo de la marca (`AVISO`). */
  etiquetaMarca?: React.ReactNode;
  /** Nombre accesible. */
  etiqueta?: string;
  /** Alto en px (10 la principal, 4–6 las secundarias). */
  alto?: number;
  tono?: 'acento' | 'aviso' | 'peligro';
}
export declare function Barra(props: BarraProps): React.JSX.Element;
