import * as React from 'react';
import type { T } from '@moldes/idiomas';

export interface Modulo { id: string; etiqueta: string; icono?: string; cuenta?: number }
export interface ShellProps {
  t: T;
  /** `design.json → app`: el nombre es la marca si no hay logo. */
  app: { nombre: string };
  /** Un logo propio en lugar del nombre. */
  marca?: React.ReactNode;
  /** Los módulos del negocio, en el orden de la app. */
  modulos?: Modulo[];
  /** Lo transversal que va después de la Papelera (Pagos, Biblioteca). */
  transversales?: Modulo[];
  /** El módulo que va en la pestaña inferior del celular (por defecto, el primero). */
  principal?: string;
  /** El id activo: 'inicio', un módulo, 'alertas', 'papelera', 'ajustes', 'perfil'. */
  activo?: string;
  /** Avisa adónde ir; la ruta la decide la app. */
  onIr?: (id: string) => void;
  /** Cuántas alertas sin mirar (la campana y la fila). */
  alertas?: number;
  usuario?: { nombre?: string; plan?: string; fotoUrl?: string };
  onSalir?: () => void;
  /** Si la app tiene asistente: abre «Pregúntale a {app}» (y ⌘K). Sin esto, la fila no aparece. */
  onPreguntar?: () => void;
  contraidaInicial?: boolean;
  children?: React.ReactNode;
}
export declare function Shell(props: ShellProps): React.JSX.Element;
export declare function Pantalla(props: { antetitulo?: React.ReactNode; titulo: string; hint?: React.ReactNode; acciones?: React.ReactNode; children?: React.ReactNode }): React.JSX.Element;
export declare function filasDeNavegacion(o: { t: T; app: { nombre: string }; modulos?: Modulo[]; transversales?: Modulo[]; alertas?: number; conAsistente?: boolean }): Array<{ id: string; etiqueta: string; icono: string; atajo?: string; cuenta?: number }>;
/** La etiqueta larga si entra; si no, la corta. */
export declare function etiquetaQueEntra(o: { larga: string; corta?: string; entra: boolean }): string;
export declare function pestanasDelCelular(o: { t: T; modulos?: Modulo[]; principal?: string; conAsistente?: boolean }): Array<{ id: string; label: string; icon: string }>;

export interface Alerta { id: string; tono: 'critico' | 'hoy' | 'proximamente' | 'oportunidades'; titulo: React.ReactNode; detalle?: React.ReactNode; accion?: { texto: React.ReactNode; onClick?: () => void } }
export declare const COLUMNAS_DE_ALERTAS: Array<Alerta['tono']>;
export declare function repartirAlertas(alertas?: Alerta[]): Record<Alerta['tono'], Alerta[]>;
export declare function CentroDeAlertas(props: { t: T; alertas?: Alerta[] }): React.JSX.Element;

export declare const DIAS_EN_PAPELERA: number;
export declare function diasQueQuedan(borradoEl: string | Date, hoy?: string | Date, dias?: number): number;
export interface Borrado { id: string; nombre: React.ReactNode; tipo?: React.ReactNode; borradoEl: string | Date; fechaTexto: string; persona: string }
export declare function Papelera(props: { t: T; items?: Borrado[]; onRestaurar?: (id: string) => void; hoy?: string | Date }): React.JSX.Element;

export interface Persona { id: string; nombre: string; correo?: string; fotoUrl?: string; rol?: string; estado?: 'activa' | 'invitada' | 'suspendida'; ultima?: string; yo?: boolean }
export declare function Equipo(props: {
  t: T; ctx?: { manda?: boolean }; kit?: { rescate?: string }; personas?: Persona[];
  roles?: Array<{ id: string; etiqueta: string }>;
  acciones?: { invitar?: () => void; cambiarRol?: (id: string, rol: string) => void; suspender?: (id: string, suspender: boolean) => void; resetearAutenticador?: (id: string) => void; abrirActividad?: () => void };
}): React.JSX.Element;
