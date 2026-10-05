import * as React from 'react';
/** Antetítulo + filas separadas por línea fina. */
export interface BloqueProps extends React.HTMLAttributes<HTMLElement> {
  antetitulo?: React.ReactNode;
  children?: React.ReactNode;
}
export declare function Bloque(props: BloqueProps): React.JSX.Element;
