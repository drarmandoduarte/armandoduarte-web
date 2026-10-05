import * as React from 'react';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'color'> {
  /** Nombre del icono Lucide, kebab-case o PascalCase: "stethoscope", "syringe", "activity", "calendar-clock". */
  name: string;
  /** 12 | 14 | 16 | 20 | 24 — los tamaños ópticos del sistema. */
  size?: 12 | 14 | 16 | 20 | 24 | number;
  /** Siempre 1.5 salvo razón óptica muy concreta. */
  strokeWidth?: number;
  /** Por defecto currentColor: el icono hereda el color del texto. */
  color?: string;
  /** Si el icono comunica algo por sí solo, pasa label; si es decorativo, omítelo. */
  label?: string;
}
export declare function Icon(props: IconProps): React.JSX.Element;
