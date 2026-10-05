import * as React from 'react';

export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Texto corto. Si necesita más de una línea, no es un tooltip. */
  label: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): React.JSX.Element;
