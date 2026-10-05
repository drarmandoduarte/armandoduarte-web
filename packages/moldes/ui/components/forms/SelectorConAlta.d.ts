import * as React from 'react';
import type { SelectorProps } from './Selector';

/** Lo que la ficha recién nacida devuelve para quedar elegida. */
export interface AltaNacida {
  value: string;
  label: string;
}

/** Los textos del alta. Llegan traducidos: `packages/ui` no sabe de idiomas. */
export interface TextosDelAlta {
  /** La opción dentro de la lista que abre el bloque. */
  opcion?: string;
  /** Encabezado del bloque. Dice qué se está por crear. */
  titulo?: string;
  /** El botón que confirma. */
  accion?: string;
  /** Lo que dice ese botón mientras escribe. */
  guardando?: string;
  cancelar?: string;
}

export interface SelectorConAltaProps extends Omit<SelectorProps, 'groups'> {
  /**
   * Si se dibuja la opción de alta. En `false` esto es un `Selector` y nada más.
   *
   * **No es una cortesía**: crear una ficha de proveedor o de profesional es del
   * dueño y solo del dueño (`es_dueno_de()`, migraciones 0008 y 0011), así que
   * para un administrador la opción sería un botón que se estrella contra un
   * 42501. Lo que no se puede hacer, no se dibuja.
   */
  puedeAgregar?: boolean;
  agregar?: TextosDelAlta;
  /** Los campos del alta. Los arma quien llama, con su propio estado. */
  formulario?: React.ReactNode;
  /**
   * Crea la ficha y devuelve con qué quedó elegida. Devolver `undefined` deja el
   * bloque abierto con lo escrito —es lo que hace una validación que no pasó—;
   * lanzar muestra el mensaje dentro del bloque.
   */
  onAgregar?: () => Promise<AltaNacida | undefined>;
  /** Se llama al abrir el bloque, para limpiar el formulario de quien llama. */
  onAbrirAlta?: () => void;
}

export declare function SelectorConAlta(props: SelectorConAltaProps): React.JSX.Element;
