import * as React from 'react';

/**
 * Campo de texto de una línea con etiqueta, ayuda y error.
 * @startingPoint section="Forms" subtitle="Campo de texto con etiqueta, icono y error" viewport="700x200"
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** Icono Lucide dentro del campo, a la izquierda (14px). */
  icon?: string;
  /** Nodo a la derecha: unidad, atajo, botón de escaneo. */
  trailing?: React.ReactNode;
  /** Forma píldora — solo para el buscador (lo que se toca es píldora); los campos de formulario quedan en 8px. */
  pill?: boolean;
  containerStyle?: React.CSSProperties;
}
export declare function Input(props: InputProps): React.JSX.Element;
