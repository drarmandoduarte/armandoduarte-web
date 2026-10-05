import * as React from 'react';

export interface AvatarPersonaProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** El nombre de la persona. De él salen las iniciales del respaldo. */
  nombre?: string;
  /** Sin foto, el avatar cae en las iniciales. No es un error: es el respaldo. */
  fotoUrl?: string;
  /** Lado en píxeles. 32 lista · 48 tarjeta · 72 portada de la ficha. */
  size?: number;
}

export declare function AvatarPersona(props: AvatarPersonaProps): React.JSX.Element;
