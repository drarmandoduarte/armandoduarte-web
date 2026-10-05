import * as React from 'react';
import type { ButtonProps } from '../core/Button';

export interface ConfirmDialogProps {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Etiqueta de la cruz. Sin valor, cae en `cancelLabel`. */
  closeLabel?: string;
  /** SOLO acciones destructivas. Relleno sólido el error: es el color de la urgencia. */
  danger?: boolean;
  /**
   * Gana por encima de `danger`. Para el acto que deshace sin destruir —anular
   * un cobro deja el registro y devuelve el stock— va `danger-secondary`.
   */
  confirmVariant?: ButtonProps['variant'];
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}
export declare function ConfirmDialog(props: ConfirmDialogProps): React.JSX.Element;
