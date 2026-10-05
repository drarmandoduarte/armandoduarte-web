import * as React from 'react';
import type { T } from '@moldes/idiomas';

/** Quién mira, en ESTA cuenta. */
export interface Contexto {
  /** Dueño o administrador: lo que la base deja editar a nivel cuenta. */
  manda?: boolean;
  /** Rol de equipo (autenticador obligatorio) o cliente final. */
  equipo?: boolean;
  dueno?: boolean;
  /** `false` si el rol no usa el asistente. */
  asistente?: boolean;
}

export interface PropsDePanel { t: T; ctx: Contexto; config: ConfigDeAjustes; valores: Valores; acciones: Acciones }

/** El adaptador de la app (`ajustes.config`). */
export interface ConfigDeAjustes {
  /** Las comunes que la app usa (por defecto, todas las que correspondan). */
  comunes?: Array<'perfil' | 'cuenta' | 'apariencia' | 'idioma' | 'notificaciones' | 'asistente' | 'integraciones' | 'privacidad' | 'datos' | 'avisos' | 'plan' | 'acerca'>;
  /** Las secciones propias, del grupo {APP}, en su orden. */
  propias?: Array<{ id: string; etiqueta: string; paraTodos?: boolean; Panel: React.ComponentType<PropsDePanel> }>;
  /** Ids viejos propios de la app → id actual (se suman a los del molde). */
  alias?: Record<string, string>;
  asistente?: { nivel?: number } | false;
  integraciones?: Array<{ id: string; nombre: string; explicacion?: string; conectada?: boolean }>;
  /** Lo que la cuenta manda hacia afuera (sección Avisos). */
  avisos?: { filas: Array<{ id: string; nombre: string; explicacion?: string }> };
  canales?: Array<'email' | 'app' | 'whatsapp'>;
  copias?: { frecuencia: string; dias: number };
  datosExtra?: React.ComponentType<{ t: T; valores: Valores; acciones: Acciones }>;
  version?: { numero: string; fecha?: string };
  /** El CHANGELOG de la app, en texto (Acerca de → Novedades). */
  changelog?: string;
  novedades?: Novedad[];
  enlaces?: { terminos?: string; privacidad?: string };
  contacto?: string;
}

export type Valores = Record<string, any>;
export type Acciones = Record<string, (...args: any[]) => Promise<unknown> | void>;

export interface AjustesProps {
  t: T;
  /** El nombre de la app (`design.json → app.nombre`): rotula el grupo {APP}. */
  appNombre: string;
  ctx?: Contexto;
  config?: ConfigDeAjustes;
  valores?: Valores;
  acciones?: Acciones;
  /** La sección pedida (`?s=`). En celular, `null` = la lista. */
  seccion?: string | null;
  onSeccion?: (id: string | null) => void;
  style?: React.CSSProperties;
}
export declare function Ajustes(props: AjustesProps): React.JSX.Element;

export interface Seccion { id: string; grupo?: 'tu' | 'app'; clave?: string; etiqueta?: string; propia?: boolean }
export declare const COMUNES: Seccion[];
export declare const ALIAS: Record<string, string>;
export declare const GRUPOS: { tu: 'tu'; app: 'app' };
export declare function seccionesVisibles(ctx?: Contexto, config?: ConfigDeAjustes): Seccion[];
export declare function resolverSeccion(pedida: string | null | undefined, visibles: Seccion[], porDefecto?: string | null, aliasDeLaApp?: Record<string, string>): string | null;

export declare function claveDelAutenticador(ctx?: Contexto, totp?: { activo?: boolean }): string;
export declare function filasDeCuenta(ctx?: Contexto, valores?: Valores): string[];
export declare function filasDelAsistente(ctx?: Contexto, asistente?: { nivel?: number }): string[];
export declare function filasDeEquipo(ctx?: Contexto, kit?: { rescate?: string }): string[];
/** La hora del resumen por defecto: '08:00', hora local. */
export declare const HORA_DEL_RESUMEN: string;
export declare function muestraHoraDelResumen(resumen?: string): boolean;

export interface Novedad { version: string; fecha: string | null; cambios: string[] }
export declare function leerNovedades(markdown?: string, opciones?: { maximo?: number; porVersion?: number }): Novedad[];

export declare function conUltimaAcentuada(texto: string): string;
export declare function CabeceraSeccion(props: { titulo: string; hint?: string }): React.JSX.Element;
export declare function useGuardar<A extends any[]>(accion?: (...args: A) => Promise<unknown> | void): [number | null, (...args: A) => Promise<void>];
export declare function FilaDeOpciones(props: { nombre: React.ReactNode; explicacion?: React.ReactNode; valor: string; opciones: Array<{ value: string; label: React.ReactNode }>; accion?: (v: string) => Promise<unknown>; textoGuardado?: React.ReactNode }): React.JSX.Element;

type Panel = (props: Partial<PropsDePanel> & { t: T }) => React.JSX.Element;
export declare const PanelPerfil: Panel; export declare const PanelCuenta: Panel; export declare const PanelApariencia: Panel;
export declare const PanelIdioma: Panel; export declare const PanelNotificaciones: Panel; export declare const PanelAsistente: Panel;
export declare const PanelIntegraciones: Panel; export declare const PanelPrivacidad: Panel; export declare const PanelDatos: Panel;
export declare const PanelAvisos: Panel; export declare const PanelPlan: Panel; export declare const PanelAcerca: Panel;
export declare const PANELES: Record<string, Panel>;
