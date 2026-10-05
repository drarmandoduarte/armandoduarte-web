import * as React from 'react';
/**
 * Nombre + explicación gris a la izquierda, control a la derecha, «Guardado» al cambiar.
 * @startingPoint section="Ajustes" subtitle="Una fila con interruptor" viewport="760x120"
 */
export interface FilaAjusteProps extends React.HTMLAttributes<HTMLDivElement> {
  nombre: React.ReactNode;
  explicacion?: React.ReactNode;
  /** El control: interruptor, segmentado, botón. */
  children?: React.ReactNode;
  /** Cambiarlo (a cualquier valor nuevo) muestra «Guardado» dos segundos. */
  guardadoEn?: unknown;
  /** El texto del aviso (`settings.saved`). */
  textoGuardado?: React.ReactNode;
}
export declare function FilaAjuste(props: FilaAjusteProps): React.JSX.Element;
