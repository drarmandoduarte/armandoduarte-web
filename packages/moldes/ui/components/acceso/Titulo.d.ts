import * as React from 'react';
/**
 * Título con la palabra acentuada en serif cursiva y acento (`*palabra*`).
 * @startingPoint section="Acceso" subtitle="Verifica tu *identidad*." viewport="700x160"
 */
export interface TituloProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'children'> {
  /** El texto, con la palabra acentuada entre asteriscos. */
  texto: string;
  tamano?: 'portada' | 'pantalla' | 'bloque';
  como?: 'h1' | 'h2' | 'h3';
  alineado?: 'inicio' | 'centro';
}
export declare function Titulo(props: TituloProps): React.JSX.Element;
