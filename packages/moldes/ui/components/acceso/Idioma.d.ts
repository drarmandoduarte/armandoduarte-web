import * as React from 'react';
/** Globo + `ES · EN · PT`; el activo en negrita. */
export interface IdiomaProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  valor?: string;
  idiomas?: string[];
  onCambiar?: (codigo: string) => void;
  /** Nombre accesible del grupo (traducido). */
  etiqueta?: string;
}
export declare function Idioma(props: IdiomaProps): React.JSX.Element;
