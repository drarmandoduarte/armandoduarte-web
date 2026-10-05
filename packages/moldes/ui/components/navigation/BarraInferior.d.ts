import * as React from 'react';

export interface EntradaBarraInferior {
  /** Id de la entrada, y lo que viaja en `data-clave`. */
  id: string;
  /** Ya traducida: el kit no sabe de i18n. */
  label: string;
  /** Icono Lucide en kebab-case — el mismo que la entrada usa en el riel. */
  icon: string;
  count?: number;
  countTone?: 'neutral' | 'warning' | 'atencion' | 'urgente' | 'ok';
}

export interface BarraInferiorProps {
  items?: EntradaBarraInferior[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  /** Nombre accesible de la barra. */
  etiqueta?: string;
  style?: React.CSSProperties;
}

/** Los 56 px que se ven y se tocan; el área segura va aparte, como relleno. */
export declare const ALTO_BARRA_INFERIOR: number;
export declare function BarraInferior(props: BarraInferiorProps): React.JSX.Element;
