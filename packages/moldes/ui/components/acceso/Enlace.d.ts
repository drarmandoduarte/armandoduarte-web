import * as React from 'react';
/** Enlace subrayado, en el acento o apagado. Sin `href` es un botón. */
export interface EnlaceProps extends React.HTMLAttributes<HTMLElement> {
  tono?: 'acento' | 'apagado';
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  children?: React.ReactNode;
}
export declare function Enlace(props: EnlaceProps): React.JSX.Element;
