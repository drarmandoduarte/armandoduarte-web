import * as React from 'react';
/** `§ · PALABRA`, mayúsculas espaciadas en el acento. */
export interface AntetituloProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'children'> {
  /** Solo la palabra; el `§ ·` lo pone el componente. */
  texto: React.ReactNode;
  /** `apagado` para los sub-bloques (p. ej. «Por persona» en Uso de IA). */
  tono?: 'acento' | 'apagado';
}
export declare function Antetitulo(props: AntetituloProps): React.JSX.Element;
