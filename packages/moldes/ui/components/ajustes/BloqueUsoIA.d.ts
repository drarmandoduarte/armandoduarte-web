import * as React from 'react';

interface FilaDeUso { nombre: React.ReactNode; valor: React.ReactNode; proporcion: number }
interface Limite { nombre: React.ReactNode; detalle?: React.ReactNode; proporcion: number; texto: React.ReactNode }

/** El objeto del contador, ya formateado en el idioma de la persona. */
export interface UsoIA {
  /** «Vas bien. Llegás al 1 de noviembre *con margen*.» */
  frase?: string;
  /** «1,24 M» */
  usados: React.ReactNode;
  /** «de 3 M tokens» */
  deTotal: React.ReactNode;
  /** 0 a 1 */
  proporcion: number;
  /** «41 %» */
  porcentajeTexto?: React.ReactNode;
  renovacion?: React.ReactNode;
  proyeccion?: React.ReactNode;
  /** Los últimos 30 días, el último es hoy. */
  dias?: Array<{ valor: number }>;
  /** «Hoy · 41 k» */
  hoy?: React.ReactNode;
  limites?: Limite[];
  porPersona?: FilaDeUso[];
  porUso?: FilaDeUso[];
  /** Qué es un token. */
  nota?: React.ReactNode;
  /** Si existe, el bloque se muestra en estado «al tope» con esta píldora. */
  pausado?: React.ReactNode;
}

/**
 * El bloque Uso de IA de Plan y facturación (la maqueta, entera).
 * @startingPoint section="Ajustes" subtitle="§ · USO DE IA" viewport="760x900"
 */
export interface BloqueUsoIAProps extends React.HTMLAttributes<HTMLElement> {
  uso: UsoIA;
  textos: {
    antetitulo?: React.ReactNode; titulo?: string; aviso?: React.ReactNode; porDia?: string;
    hace30?: React.ReactNode; porPersona?: React.ReactNode; enQue?: React.ReactNode; sumar?: React.ReactNode;
  };
  onSumar?: () => void;
}
export declare function BloqueUsoIA(props: BloqueUsoIAProps): React.JSX.Element;
