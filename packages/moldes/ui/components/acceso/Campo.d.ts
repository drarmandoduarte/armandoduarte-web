import * as React from 'react';
/** Campo de 56 px con etiqueta en mayúsculas espaciadas encima. */
export interface CampoProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  etiqueta?: React.ReactNode;
  /** Mensaje de error: se muestra debajo y marca el campo como inválido. */
  error?: React.ReactNode;
  /** Letra monoespaciada (lo usa `CampoMono`). */
  mono?: boolean;
  /** Estilo del contenedor. */
  style?: React.CSSProperties;
  /** Estilo del `<input>`. */
  estiloCampo?: React.CSSProperties;
}
export declare const Campo: React.ForwardRefExoticComponent<CampoProps & React.RefAttributes<HTMLInputElement>>;
