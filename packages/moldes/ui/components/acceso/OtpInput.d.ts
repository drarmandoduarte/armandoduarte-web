import * as React from 'react';

/** Control imperativo: la pantalla lo usa para recuperarse de un intento fallido. */
export interface OtpInputHandle {
  /** Enfoca; con el código completo, lo deja seleccionado. */
  focus: () => void;
  /** Vacía el código (vía `onChange`) y devuelve el foco a la primera casilla. */
  reset: () => void;
}

/**
 * La casilla de 6 huecos: pega y reparte, verifica sola al llenar la sexta, tiembla si está mal.
 * @startingPoint section="Acceso" subtitle="Seis casillas, un solo input real" viewport="700x160"
 */
export interface OtpInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'style'> {
  /** El código actual (0–6 dígitos). La pantalla es la dueña del valor. */
  value: string;
  /** Cada cambio, ya limpio (solo dígitos, hasta 6). */
  onChange: (codigo: string) => void;
  /** Una vez al llegar a 6 dígitos. Vuelve a llamarse si se borra y se completa de nuevo. */
  onCompleto?: (codigo: string) => void;
  /** Pinta las casillas del error y las hace temblar una vez cada vez que pasa a `true`. */
  error?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  style?: React.CSSProperties;
}
export declare const OtpInput: React.ForwardRefExoticComponent<OtpInputProps & React.RefAttributes<OtpInputHandle>>;
