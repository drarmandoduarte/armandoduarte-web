import * as React from 'react';

/**
 * Contenedor obligatorio para cualquier salida de IA en la interfaz: atribuye la fuente,
 * aclara qué es y deja lugar a la decisión de la persona.
 */
export interface AIAttributionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Quién produjo el texto («Asistente de {app}»), traducido. */
  source?: string;
  /** Aclaración corta al lado de la fuente, traducida. */
  note?: string;
  /** Botones de aceptar / editar / descartar. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
}
export declare function AIAttribution(props: AIAttributionProps): React.JSX.Element;
