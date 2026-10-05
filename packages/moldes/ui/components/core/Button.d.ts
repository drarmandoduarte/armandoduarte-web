import * as React from 'react';

/**
 * Botón de acción de la app. Primario en relleno del acento (una app en movimiento necesita
 * jerarquía inmediata), secundario en outline, terciario en outline neutro para lo que es
 * acción pero no es del negocio de la pantalla, ghost para lo que se puede ignorar,
 * danger SOLO para lo urgente o lo que destruye de verdad, danger-secondary para lo que
 * deshace sin destruir. Forma píldora (lo que se toca es píldora). Sin sombras, sin gradientes, sin scale.
 * @startingPoint section="Core" subtitle="Botones: primario, secundario, ghost y danger" viewport="700x220"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `tertiary` es outline en el borde neutro: la acción que no es del negocio
   * de la pantalla —ajustar cómo se ve el Inicio, no atender a alguien—. No
   * gasta el acento, que es el color de lo que la app hace, y a diferencia de
   * `ghost` **tiene caja**: en un renglón de acciones, un fantasma al lado de un
   * primario y un secundario se lee como texto suelto y termina 19 px antes que
   * sus hermanos (medido en Inicio).
   *
   * `danger` es relleno sólido el error — el único del sistema, y el color de la
   * urgencia: se gasta una vez por pantalla y solo cuando el acto no se deshace.
   * `danger-secondary` es su outline, para el acto que deshace pero no destruye
   * (anular un cobro deja el registro y devuelve el stock).
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'danger-secondary';
  size?: 'sm' | 'md' | 'lg';
  /** Ocupa el ancho del contenedor — útil en la app del responsable y en formularios angostos. */
  fullWidth?: boolean;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.JSX.Element;
