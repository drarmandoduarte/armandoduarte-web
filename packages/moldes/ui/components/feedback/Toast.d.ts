import * as React from 'react';

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Un único botón de deshacer o ver. */
  action?: React.ReactNode;
  onClose?: () => void;
  /** Etiqueta accesible de la cruz. La pantalla la pasa traducida. */
  closeLabel?: string;
}
export declare function Toast(props: ToastProps): React.JSX.Element;
