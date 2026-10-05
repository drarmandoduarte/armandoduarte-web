import * as React from 'react';

export interface HojaInferiorProps {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * La hoja que sube desde abajo. Hermana de `Dialog` y `PanelLateral` para el
 * modo celular: mismo velo, mismo Escape, mismo toque afuera — y, a diferencia
 * de las dos, **bloquea el scroll del fondo** mientras está abierta.
 */
export declare function HojaInferior(props: HojaInferiorProps): React.JSX.Element | null;
