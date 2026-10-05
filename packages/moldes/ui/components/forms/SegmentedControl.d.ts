import * as React from 'react';

export interface SegmentedOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

/**
 * Elección entre pocas opciones excluyentes, en fila de píldoras. Es un
 * radiogroup: flechas mueven foco y selección. La activa va en el acento soft —
 * el relleno sólido está reservado a la urgencia.
 * @startingPoint section="Forms" subtitle="Opciones excluyentes en píldora" viewport="700x80"
 */
export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SegmentedOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** Etiqueta accesible del grupo. */
  label?: string;
  disabled?: boolean;
}
export declare function SegmentedControl(props: SegmentedControlProps): React.JSX.Element;
