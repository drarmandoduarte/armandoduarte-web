import * as React from 'react';
/** Pantalla centrada: antetítulo, título, frase y un botón. */
export interface CartelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  antetitulo?: React.ReactNode;
  /** Con la palabra acentuada entre asteriscos. */
  titulo: string;
  texto?: React.ReactNode;
  accion?: { texto: React.ReactNode; onClick?: () => void };
}
export declare function Cartel(props: CartelProps): React.JSX.Element;
