import * as React from 'react';
/** «Continuar con Google», ancho completo, G en una sola tinta. */
export interface BotonGoogleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** El texto (`auth.google`). */
  children?: React.ReactNode;
}
export declare function BotonGoogle(props: BotonGoogleProps): React.JSX.Element;
