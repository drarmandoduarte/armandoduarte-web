import * as React from 'react';

export interface OpcionDeSelector {
  value: string;
  label: string;
  /** Segunda línea del renglón —el responsable, el rubro— y **también se busca**. */
  detalle?: string;
  /** Lo pone `aplanarOpciones` al partir los grupos; no se pasa a mano. */
  grupo?: string;
  /**
   * Se ve y no se elige. Para lo que **existe pero todavía no se puede usar** —un
   * canal que llega en la próxima etapa—: esconderlo no dice nada y mostrarlo
   * apagado dice «esto va a estar». No es lo mismo que sacarlo de la lista.
   */
  disabled?: boolean;
}

export interface GrupoDeSelector {
  label: string;
  options: OpcionDeSelector[];
}

export interface SelectorProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'defaultValue'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** La lista, en el orden en que se muestra. El filtro no la reordena. */
  options?: OpcionDeSelector[];
  /** Secciones con encabezado. Conviven con `options`, que van primero. */
  groups?: GrupoDeSelector[];
  value?: string;
  /**
   * Recibe el `value` elegido, no un evento: esto no es un `<select>` nativo y
   * fingir un `e.target.value` sería mentir sobre lo que es.
   */
  onChange?: (valor: string) => void;
  /** Lo que dice el campo cuando no hay nada elegido. */
  placeholder?: string;
  /**
   * Fuerza el modo. Sin decir nada lo decide el tamaño (`modoDeSeleccion`):
   * hasta 7 opciones, desplegable; de ahí en adelante, búsqueda. `true` fuerza
   * la búsqueda y `false` la prohíbe — los días de la semana no se buscan.
   */
  buscable?: boolean;
  /**
   * Admite lo que la lista no tiene: al salir del campo, lo escrito se guarda
   * tal cual. Implica el modo de búsqueda —si se puede escribir, tiene que haber
   * dónde—. Sin esto, salir con media búsqueda restituye lo que estaba.
   */
  libre?: boolean;
  /** Qué dice la lista vacía cuando `libre` se va a quedar con lo escrito. Traducido. */
  libreEtiqueta?: string;
  /** Lo que invita a escribir cuando la lista está abierta en modo búsqueda. Traducido. */
  buscarPlaceholder?: string;
  /** Qué dice la lista cuando no coincide nada con lo escrito. Traducido. */
  vacioTexto?: string;
  /**
   * Qué dice la lista cuando **no hay ninguna opción**, que no es lo mismo:
   * «nada coincide» no es «no hay nada», y lo que hay que hacer después es
   * distinto. Sin esto, cae en `vacioTexto`.
   */
  sinOpcionesTexto?: string;
  /** Qué dice el pie cuando hay más coincidencias de las que se dibujan. Traducido. */
  ayudaTope?: string;
  disabled?: boolean;
  containerStyle?: React.CSSProperties;
}

export declare function Selector(props: SelectorProps): React.JSX.Element;
