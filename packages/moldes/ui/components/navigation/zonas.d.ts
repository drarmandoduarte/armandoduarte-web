import * as React from 'react';

export interface RotuloDeZonaProps extends React.HTMLAttributes<HTMLParagraphElement> {
  titulo: React.ReactNode;
  /** Sangría lateral, para alinearlo con las filas de su columna. */
  sangria?: string;
}
export declare function RotuloDeZona(props: RotuloDeZonaProps): React.JSX.Element;

export interface FileteDeZonaProps extends React.HTMLAttributes<HTMLSpanElement> {
  sangria?: string;
}
export declare function FileteDeZona(props: FileteDeZonaProps): React.JSX.Element;

/**
 * El aire que queda donde estaba el rótulo del menú.
 * Mide exactamente lo que medía el rótulo, y no dice nada.
 */
export type AireDeZonaProps = React.HTMLAttributes<HTMLSpanElement>;
export declare function AireDeZona(props: AireDeZonaProps): React.JSX.Element;
