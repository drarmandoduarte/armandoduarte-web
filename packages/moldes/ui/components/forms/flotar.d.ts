/** Lo que mide el panel cuando tiene lugar de sobra (15 rem). */
export declare const ALTO_MAXIMO: number;
/** El aire que se le deja al borde de la ventana. */
export declare const MARGEN: number;

export interface CampoMedido {
  /** `rect.top` del campo, en píxeles de ventana. */
  arribaDelCampo: number;
  /** `rect.bottom` del campo. */
  abajoDelCampo: number;
  /** `window.innerHeight`. */
  altoDeVentana: number;
  /** Cuánto querría medir la capa. Por defecto `ALTO_MAXIMO`. */
  alto?: number;
  /** Aire contra el borde. Por defecto `MARGEN`. */
  margen?: number;
}

export interface UbicacionDePanel {
  /** De qué lado del campo se dibuja. */
  hacia: 'abajo' | 'arriba';
  /** Cuánto puede medir sin salirse de la ventana. */
  alto: number;
}

/** Hacia dónde abre la capa que flota, y cuánto puede medir. */
export declare function ubicarPanel(campo: CampoMedido): UbicacionDePanel;
