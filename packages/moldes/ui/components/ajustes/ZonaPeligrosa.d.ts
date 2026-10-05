import * as React from 'react';
/**
 * Bloque con borde de error; la acción pide palabra + código del autenticador.
 * @startingPoint section="Ajustes" subtitle="§ · ZONA PELIGROSA" viewport="760x320"
 */
export interface ZonaPeligrosaProps extends React.HTMLAttributes<HTMLElement> {
  antetitulo?: React.ReactNode;
  nombre: React.ReactNode;
  explicacion?: React.ReactNode;
  /** La palabra que hay que escribir (p. ej. «BORRAR»), ya traducida. */
  palabra: string;
  /** Si pide además el código del autenticador. Por defecto, sí. */
  irreversible?: boolean;
  textos: {
    abrir?: React.ReactNode;
    escribiPalabra?: React.ReactNode;
    codigo?: React.ReactNode;
    confirmar?: React.ReactNode;
    cancelar?: React.ReactNode;
  };
  /** Con el código si es irreversible; el servidor lo verifica. */
  onConfirmar?: (codigo?: string) => void;
  cargando?: boolean;
}
export declare function ZonaPeligrosa(props: ZonaPeligrosaProps): React.JSX.Element;
