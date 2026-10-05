import * as React from 'react';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  /** Ayuda breve bajo el control. */
  hint?: React.ReactNode;
  /** Si hay error, reemplaza al hint y se pinta en la letra del error (`--danger-text`). */
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children?: React.ReactNode;
}
export declare function Field(props: FieldProps): React.JSX.Element;
