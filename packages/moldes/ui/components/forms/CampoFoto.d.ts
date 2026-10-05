import * as React from 'react';

/**
 * El encuadre elegido, en las coordenadas de la ventana de recorte.
 * `x` e `y` son la esquina de la imagen respecto de esa ventana, y son
 * negativos o cero: la imagen siempre la cubre.
 */
export interface EncuadreFoto {
  /** Lado de la ventana de recorte en píxeles de pantalla. */
  lado: number;
  /** 1 = el lado corto llena la ventana. */
  zoom: number;
  x: number;
  y: number;
  naturalW: number;
  naturalH: number;
}

export interface TextosCampoFoto {
  subir: string;
  camara: string;
  cambiar: string;
  quitar: string;
  recortar: string;
  cancelar: string;
  ayudaEncuadre: string;
  zoom: string;
}

export interface CampoFotoProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** La foto que ya hay: la guardada, o la recién recortada. */
  valorUrl?: string;
  /** Para las iniciales del respaldo mientras no hay foto. */
  nombre?: string;
  /** El original elegido y cómo se encuadró. No comprime ni sube: eso es de la app. */
  onArchivo?: (archivo: File, encuadre: EncuadreFoto) => void;
  onQuitar?: () => void;
  /** Los ocho textos del control. Van traducidos; ninguno tiene default en español. */
  textos: TextosCampoFoto;
  style?: React.CSSProperties;
}

export declare function CampoFoto(props: CampoFotoProps): React.JSX.Element;
