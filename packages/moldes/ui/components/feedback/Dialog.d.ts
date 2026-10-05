import * as React from 'react';

export interface DialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Cierra con Escape, clic en el fondo y la cruz. */
  onClose?: () => void;
  /** Etiqueta accesible de la cruz. La pantalla la pasa traducida. */
  closeLabel?: string;
  /** Acciones alineadas a la derecha sobre el papel hundido. */
  footer?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): React.JSX.Element | null;
