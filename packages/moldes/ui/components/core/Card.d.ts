import * as React from 'react';

/**
 * Superficie base del molde: borde de 1px del papel, el radio de tarjeta del design.json, sin sombra.
 * @startingPoint section="Core" subtitle="Superficie con título, acciones y pie" viewport="700x260"
 */
export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Controles alineados a la derecha del encabezado. */
  actions?: React.ReactNode;
  /** Franja inferior sobre el papel hundido — resúmenes, totales, acciones secundarias. */
  footer?: React.ReactNode;
  /** surface = el papel de la tarjeta · sunken = el papel hundido · quiet = sin relleno. */
  tone?: 'surface' | 'sunken' | 'quiet';
  padding?: number | string;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): React.JSX.Element;
