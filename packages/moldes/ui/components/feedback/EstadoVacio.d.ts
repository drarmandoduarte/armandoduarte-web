import * as React from 'react';

/**
 * Pantalla sin datos todavía — pero que puede tenerlos hoy.
 * A diferencia de `PantallaProxima`, aquí la función existe: por eso lleva
 * acción y la acción es el centro.
 */
export interface EstadoVacioProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Icono Lucide en kebab-case. El mismo que la pieza tiene en el sidebar. */
  icon?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** El botón que crea la primera fila. */
  action?: React.ReactNode;
}
export declare function EstadoVacio(props: EstadoVacioProps): React.JSX.Element;
