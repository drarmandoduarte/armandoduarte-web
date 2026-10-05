import * as React from 'react';

/**
 * Pantalla que todavía no existe, dicha con dignidad: icono, título, una frase
 * de qué va a vivir ahí y una nota de cuándo llega. No es un estado de error —
 * no alarma, no late y no ofrece acciones que no existen.
 * @startingPoint section="Feedback" subtitle="Pantalla vacía de una pieza que aún no llegó" viewport="700x320"
 */
export interface PantallaProximaProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Nombre de icono Lucide en kebab-case — el mismo que la pieza usa en el sidebar. */
  icon?: string;
  title?: React.ReactNode;
  /** Una frase, no un párrafo: qué va a vivir en esta pantalla. */
  description?: React.ReactNode;
  /** Cuándo llega. Va en píldora tenue, sin tono de alerta. */
  note?: React.ReactNode;
}
export declare function PantallaProxima(props: PantallaProximaProps): React.JSX.Element;
