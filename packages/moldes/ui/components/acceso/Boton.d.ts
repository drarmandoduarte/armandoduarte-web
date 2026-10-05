import * as React from 'react';
/**
 * Botón de contorno de las pantallas del molde: mayúsculas espaciadas, flecha opcional, nunca relleno.
 * @startingPoint section="Acceso" subtitle="ENVIAR CÓDIGO →" viewport="600x200"
 */
export interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'peligro';
  /** `→` a la derecha: cuando el botón lleva a otra pantalla. */
  flecha?: boolean;
  /** `texto` (entrada) o `completo` (pantallas de código). */
  ancho?: 'texto' | 'completo';
  /** `chico` (40 px) para el control de una fila de Ajustes. */
  tamano?: 'normal' | 'chico';
  /** Tres puntos que laten en lugar del texto; deshabilita el botón. */
  cargando?: boolean;
  children?: React.ReactNode;
}
export declare function Boton(props: BotonProps): React.JSX.Element;
