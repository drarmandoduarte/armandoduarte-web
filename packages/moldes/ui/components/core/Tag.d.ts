import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Icono Lucide opcional a la izquierda (12px). */
  icon?: string;
  /**
   * Los dos tonos con color, cada uno con su rol del sistema:
   * "alergia" (el error suave) es seguridad que se ve antes de leerse;
   * "aviso" (el aviso suave) es algo que hay que atender y no es urgencia — una
   * mensualidad vencida, un dato que caducó.
   */
  tone?: 'alergia' | 'aviso';
  /** Si se pasa, aparece la cruz para quitar el tag. */
  onRemove?: () => void;
  removeLabel?: string;
  children?: React.ReactNode;
}
export declare function Tag(props: TagProps): React.JSX.Element;
