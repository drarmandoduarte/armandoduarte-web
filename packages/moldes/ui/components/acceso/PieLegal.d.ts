import * as React from 'react';
interface EnlaceLegal { texto: string; href: string }
/** La frase legal de la entrada, con sus dos enlaces. */
export interface PieLegalProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** La frase entera (`auth.legal`). */
  texto: string;
  /** El trozo de la frase que enlaza a los términos, y adónde. */
  terminos?: EnlaceLegal;
  /** El trozo que enlaza a la política de privacidad, y adónde. */
  privacidad?: EnlaceLegal;
}
export declare function PieLegal(props: PieLegalProps): React.JSX.Element;
