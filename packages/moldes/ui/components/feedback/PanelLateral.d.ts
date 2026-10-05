import * as React from 'react';

/**
 * Panel lateral — el hermano del diálogo para lo que se ajusta MIENTRAS se mira.
 *
 * Un diálogo interrumpe y pide una decisión; un panel acompaña. **No tiene pie
 * con botones a propósito**: lo que se toca adentro ya quedó hecho, y un panel
 * con «Guardar» sería un diálogo mal puesto.
 *
 * @startingPoint section="Feedback" subtitle="Panel al costado, sin botón de guardar" viewport="900x600"
 */
export interface PanelLateralProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
  /** Nombre accesible de la cruz. Traducido, siempre. */
  closeLabel?: string;
  /** Ancho máximo. En el teléfono ocupa el ancho entero igual. */
  width?: number | string;
  children?: React.ReactNode;
}
export declare function PanelLateral(props: PanelLateralProps): React.JSX.Element | null;
