import * as React from 'react';

export interface AccionDeMenu {
  id?: string;
  label: string;
  /** Icono Lucide a la izquierda (14px). */
  icon?: string;
  /** el error + línea de separación encima. SOLO para lo que destruye. */
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface MenuAccionesProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre accesible del botón y del menú. Traducida. */
  label: string;
  items: AccionDeMenu[];
  disabled?: boolean;
}

export declare function MenuAcciones(props: MenuAccionesProps): React.JSX.Element;
