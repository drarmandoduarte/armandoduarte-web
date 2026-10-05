import * as React from 'react';

/** La escalera de capas: 40 anclado, 50 tooltip, 60 el velo del diálogo, 70 lo portado. */
export declare const CAPA_FLOTANTE: number;

export interface CapaFlotanteProps extends React.HTMLAttributes<HTMLDivElement> {
  /** ¿Se dibuja? Con `false` no hay nada en el DOM. */
  abierta?: boolean;
  /** El campo del que cuelga. Se mide con `getBoundingClientRect`. */
  ancla: React.RefObject<HTMLElement | null>;
  /** Cuánto querría medir de alto. Por defecto, el tope de `flotar.js`. */
  alto?: number;
  /** Ancho fijo en píxeles. Sin esto, la capa se estira con su contenido. */
  ancho?: number;
  children?: React.ReactNode;
}

/**
 * Una capa que flota colgada de un campo, dibujada en `document.body` para que
 * el `overflow` de un diálogo no la recorte. Decide dónde va y cuánto mide;
 * no decide qué se dibuja adentro ni cuándo se cierra.
 */
export declare function CapaFlotante(props: CapaFlotanteProps): React.JSX.Element | null;
