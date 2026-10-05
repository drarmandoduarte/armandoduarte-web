import * as React from 'react';
import type { T } from '@moldes/idiomas';

export interface PasoDeBienvenida {
  id: string;
  /** Con la palabra acentuada entre asteriscos. */
  titulo: string;
  bajada?: React.ReactNode;
  /** Lo que se pregunta en este paso (un campo, una elección): una sola cosa. */
  contenido?: React.ReactNode;
  /** Sin esto la app no funciona: no se salta. */
  obligatoria?: boolean;
  /** `false` apaga «Siguiente» hasta que se complete. */
  listo?: boolean;
  /** Guarda lo del paso; si la promesa falla, no avanza. */
  alSeguir?: () => Promise<unknown> | void;
}
export declare const MAXIMO_DE_PANTALLAS: number;
export declare function validarPasos(pasos?: PasoDeBienvenida[]): PasoDeBienvenida[];
export declare function sePuedeSaltar(pasos: PasoDeBienvenida[], indice: number): boolean;
export declare function esElUltimo(pasos: PasoDeBienvenida[], indice: number): boolean;
export declare function Bienvenida(props: { t: T; pasos: PasoDeBienvenida[]; onTerminar?: () => Promise<unknown> | void }): React.JSX.Element;
