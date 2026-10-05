import * as React from 'react';
/** Panel derecho de 420 px en escritorio; hoja desde abajo en celular. */
export interface PanelProps {
  abierto?: boolean;
  titulo?: React.ReactNode;
  descripcion?: React.ReactNode;
  onCerrar?: () => void;
  /** Nombre accesible de la cruz, traducido. */
  etiquetaCerrar?: string;
  children?: React.ReactNode;
}
export declare function Panel(props: PanelProps): React.JSX.Element | null;
