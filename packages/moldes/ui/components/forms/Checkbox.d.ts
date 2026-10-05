import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  /** Segunda línea atenuada: consecuencia o aclaración. */
  description?: React.ReactNode;
}
export declare function Checkbox(props: CheckboxProps): React.JSX.Element;
