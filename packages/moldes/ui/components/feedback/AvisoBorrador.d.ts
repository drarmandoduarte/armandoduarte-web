import * as React from 'react';

export interface AvisoBorradorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** «Retomaste lo que estabas escribiendo.» Va traducido. */
  texto: React.ReactNode;
  /** «Descartar y empezar de cero». Va traducido. */
  accionDescartar: React.ReactNode;
  onDescartar?: () => void;
}

export declare function AvisoBorrador(props: AvisoBorradorProps): React.JSX.Element;
