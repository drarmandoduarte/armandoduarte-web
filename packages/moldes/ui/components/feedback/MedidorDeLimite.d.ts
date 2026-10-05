import * as React from 'react';

export declare function colorDeBarra(proporcion: number): string;

export interface MedidorDeLimiteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Qué se mide. Traducido por quien lo usa. */
  titulo: React.ReactNode;
  /** Cuándo se reinicia, en secundario debajo del nombre. */
  reinicio?: React.ReactNode;
  /** Lo usado, ya formateado. Con tope va junto al porcentaje; sin tope, solo. */
  usado?: React.ReactNode;
  /** El tope, ya formateado. Solo se dibuja si hay `proporcion`. */
  limite?: React.ReactNode;
  /** De 0 a 1. Sin esto no hay barra ni porcentaje. */
  proporcion?: number;
  /** La lectura falló: ni barra ni cifra, y el renglón lo dice. */
  noSePudoLeer?: boolean;
}
export declare function MedidorDeLimite(props: MedidorDeLimiteProps): React.JSX.Element;

export interface AvisoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icono Lucide a la izquierda. */
  icono?: string;
}
export declare function Aviso(props: AvisoProps): React.JSX.Element;
