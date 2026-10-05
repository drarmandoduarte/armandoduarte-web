import * as React from 'react';
/** Chip `[etiqueta]` que abre el registro del que sale una respuesta del asistente. */
export interface CitaProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'id'> {
  tipo: string;
  id: string | number;
  etiqueta: React.ReactNode;
  onAbrir?: (ref: { tipo: string; id: string | number }) => void;
}
export declare function Cita(props: CitaProps): React.JSX.Element;
