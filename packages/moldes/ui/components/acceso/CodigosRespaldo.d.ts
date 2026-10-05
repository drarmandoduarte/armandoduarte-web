import * as React from 'react';
/**
 * Los 10 códigos en dos columnas, con Descargar · Copiar · Compartir y «Listo» bloqueado hasta usar uno.
 * @startingPoint section="Acceso" subtitle="Guarda estos *códigos*." viewport="600x420"
 */
export interface CodigosRespaldoProps extends React.HTMLAttributes<HTMLDivElement> {
  codigos: string[];
  /** Los cuatro textos, traducidos: `auth.backup.download|copy|share|done`. */
  textos: { descargar?: React.ReactNode; copiar?: React.ReactNode; compartir?: React.ReactNode; listo?: React.ReactNode };
  nombreArchivo?: string;
  onListo?: () => void;
}
export declare function CodigosRespaldo(props: CodigosRespaldoProps): React.JSX.Element;
