import * as React from 'react';

export interface SettingsRailItem {
  id: string;
  label: React.ReactNode;
  /**
   * En qué zona del riel vive. El riel corta cada vez que cambia,
   * comparando con el de arriba. Sin zona **después** de zonas, la fila cuelga
   * suelta tras un filete, como la Papelera en el menú.
   */
  grupo?: string;
}

/**
 * Riel vertical de secciones para pantallas de ajustes: texto puro, sin
 * iconos, y la sección activa marcada con una barra vertical a su izquierda.
 * Es un índice DENTRO de una pantalla, no navegación de la app — por eso no
 * usa la píldora del Sidebar. El apilado responsive lo decide el layout.
 * @startingPoint section="Navigation" subtitle="Riel de secciones de ajustes" viewport="260x260"
 */
export interface SettingsRailProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  items: SettingsRailItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Etiqueta accesible del riel. */
  label?: string;
}
export declare function SettingsRail(props: SettingsRailProps): React.JSX.Element;
