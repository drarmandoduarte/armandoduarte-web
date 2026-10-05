import * as React from 'react';

/**
 * Bloque de formulario que se abre y se cierra. Varias pueden estar abiertas a
 * la vez: no es un acordeón.
 * @startingPoint section="Forms" subtitle="Bloque de formulario plegable con resumen" viewport="700x220"
 */
export interface SeccionPlegableProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  titulo: React.ReactNode;
  /** Lo que se ve con la sección cerrada. La pantalla lo arma; el kit no sabe de dominio. */
  resumen?: React.ReactNode;
  /** Estado inicial cuando el componente se gobierna solo. */
  abiertaInicial?: boolean;
  /** Si se pasa, el componente queda controlado por la pantalla. */
  abierta?: boolean;
  onCambio?: (abierta: boolean) => void;
  children?: React.ReactNode;
}
export declare function SeccionPlegable(props: SeccionPlegableProps): React.JSX.Element;
