import * as React from 'react';

/** Lo que el panel mide de ancho: siete columnas más su aire. */
export declare const ANCHO_DEL_CALENDARIO: number;

/**
 * El calendario de la casa que cuelga de un campo — el que reemplaza al panel del navegador.
 * @startingPoint section="Forms" subtitle="Calendario propio, en el idioma del producto" viewport="360x420"
 */
export interface CalendarioDeCampoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Lo elegido, en `YYYY-MM-DD`. */
  valor?: string;
  /** Hoy, en `YYYY-MM-DD`. Lo pone quien dibuja: la pieza no lee el reloj. */
  hoy?: string;
  /** Los dos inclusivos. Un día fuera del rango se ve apagado y no se aprieta. */
  min?: string;
  max?: string;
  /** Para los nombres del mes y las iniciales de los días, que salen de `Intl`. */
  idioma?: string;
  /** Recibe el día en ISO. */
  onElegir?: (iso: string) => void;
  /** Solo se pasa donde la fecha es OPCIONAL: es lo que dibuja «Quitar». */
  onQuitar?: () => void;
  /** Escape. */
  onCerrar?: () => void;
  /** Nombre del panel y de la rejilla para el lector de pantalla. */
  label?: string;
  hoyEtiqueta?: React.ReactNode;
  quitarEtiqueta?: React.ReactNode;
  mesAnteriorEtiqueta?: string;
  mesSiguienteEtiqueta?: string;
}
export declare function CalendarioDeCampo(props: CalendarioDeCampoProps): React.JSX.Element;
