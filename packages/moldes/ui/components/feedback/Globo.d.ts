import * as React from 'react';

export interface GloboProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre accesible del disparador y del globo. Traducido. */
  label: string;
  /** Lo que se ve siempre: el gesto que se toca. */
  disparador: React.ReactNode;
  /** Lo que se abre. Informa; si pide una decisión, eso es un `Dialog`. */
  children?: React.ReactNode;
  /** De qué lado se alinea con su disparador. Por defecto, derecha. */
  alineado?: 'derecha' | 'izquierda';
}

export declare function Globo(props: GloboProps): React.JSX.Element;
