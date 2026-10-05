import * as React from 'react';
import type { InputProps } from './Input';

/**
 * La hora, escrita como se escribe: hh:mm en 24 h, en los cuatro idiomas.
 * @startingPoint section="Forms" subtitle="Hora en 24 h, sin el reloj del navegador" viewport="700x200"
 */
export interface CampoHoraProps
  extends Omit<InputProps, 'onChange' | 'value' | 'type'> {
  /** `HH:MM` en 24 h. Acepta también el `HH:MM:SS` con que vuelve un `time`. */
  value?: string;
  /**
   * Recibe `HH:MM`, no un evento — y **solo cuando lo escrito ya es una hora**:
   * mientras alguien teclea a medias, el valor de arriba no se toca.
   */
  onChange?: (hora: string) => void;
}
export declare function CampoHora(props: CampoHoraProps): React.JSX.Element;
