import * as React from 'react';
/**
 * «Voy a {acción}» + vista previa + Confirmar/No (+ código si es irreversible).
 * @startingPoint section="Asistente" subtitle="La tarjeta antes de hacer" viewport="480x360"
 */
export interface TarjetaConfirmacionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** «Voy a mandarle el recordatorio a 3 personas.», ya traducido. */
  accion: React.ReactNode;
  vista?: React.ReactNode;
  irreversible?: boolean;
  textos: { confirmar?: React.ReactNode; no?: React.ReactNode; codigo?: React.ReactNode };
  onConfirmar?: (codigo?: string) => void;
  onCancelar?: () => void;
  cargando?: boolean;
}
export declare function TarjetaConfirmacion(props: TarjetaConfirmacionProps): React.JSX.Element;
