import * as React from 'react';

export interface OpcionBuscable {
  value: string;
  label: string;
  /** Segunda línea del renglón —el responsable, el rubro— y **también se busca**. */
  detalle?: string;
}

export interface ComboBuscadorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'role'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** La lista, en el orden en que se muestra. El filtro no la reordena. */
  options?: OpcionBuscable[];
  /** El `value` de la opción elegida; con `libre`, cualquier texto. */
  value?: string;
  onChange?: (valor: string) => void;
  placeholder?: string;
  /**
   * Admite lo que la lista no tiene: al salir del campo, lo escrito se guarda
   * tal cual. Sin esto, salir con media búsqueda restituye lo que había.
   */
  libre?: boolean;
  /** Qué dice la lista vacía cuando `libre` va a quedarse con lo escrito. Traducida. */
  libreEtiqueta?: string;
  /** Qué dice la lista cuando no coincide nada y no hay `libre`. Traducida. */
  vacioTexto?: string;
  /** Qué dice el pie cuando hay más coincidencias de las que se dibujan. Traducida. */
  ayudaTope?: string;
  containerStyle?: React.CSSProperties;
}

export declare function ComboBuscador(props: ComboBuscadorProps): React.JSX.Element;
