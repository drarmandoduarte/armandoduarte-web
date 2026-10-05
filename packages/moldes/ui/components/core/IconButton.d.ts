import * as React from 'react';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Nombre del icono Lucide. */
  icon: string;
  /** Obligatorio: es el nombre accesible y el tooltip nativo. */
  label: string;
  variant?: 'ghost' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  /** Estado seleccionado en barras de herramientas. */
  active?: boolean;
}
export declare function IconButton(props: IconButtonProps): React.JSX.Element;
