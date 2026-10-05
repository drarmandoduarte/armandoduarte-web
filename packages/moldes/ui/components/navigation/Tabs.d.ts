import * as React from 'react';

export interface TabItem { value: string; label: React.ReactNode; icon?: string; count?: number }
/**
 * Navegación entre vistas hermanas dentro de una pantalla (una ficha, ajustes).
 * @startingPoint section="Navigation" subtitle="Pestañas con icono y contador" viewport="700x110"
 */
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}
export declare function Tabs(props: TabsProps): React.JSX.Element;
