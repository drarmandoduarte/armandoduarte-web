import * as React from 'react';

export interface CampoFechaProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** ISO `YYYY-MM-DD`, el mismo contrato que tenía `<input type="date">`. */
  value?: string;
  /** Se llama solo cuando lo escrito ES una fecha, o cuando se vacía el campo. */
  onChange?: (iso: string) => void;
  min?: string;
  max?: string;
  /** Nombre accesible del botón que abre el calendario, y del panel. Va traducido. */
  calendarioLabel?: string;
  /** Para los nombres del mes y las iniciales de los días, que salen de `Intl`. */
  idioma?: string;
  /**
   * Los cuatro textos del panel, ya traducidos. Llegan juntos y no de a uno
   * porque son dieciséis pantallas: cuatro props sueltas por pantalla son
   * sesenta y cuatro líneas que dicen lo mismo.
   */
  textos?: {
    hoy?: React.ReactNode;
    /** Solo se dibuja donde la fecha es opcional (`required` en `false`). */
    quitar?: React.ReactNode;
    mesAnterior?: string;
    mesSiguiente?: string;
  };
  containerStyle?: React.CSSProperties;
}

export declare function CampoFecha(props: CampoFechaProps): React.JSX.Element;
