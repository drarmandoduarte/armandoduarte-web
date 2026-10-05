import * as React from 'react';
import type { T } from '@moldes/idiomas';

export type Tamano = 'chico' | 'mediano' | 'grande';
export interface Contexto { manda?: boolean; rol?: string }

/** Lo que recibe un widget: la lectura única de Inicio, ya armada por la app. */
export interface PropsDeWidget { t: T; datos: Record<string, any>; tamano: Tamano; ctx: Contexto; onIr?: (ruta: string) => void }

export interface WidgetDeclarado {
  id: string;
  /** Clave de idioma del título. */
  clave: string;
  admite?: Tamano[];
  nace?: Tamano;
  /** Adónde lleva el título (la pantalla completa). */
  ruta?: string;
  soloManda?: boolean;
  Widget: React.ComponentType<PropsDeWidget>;
}
export interface Catalogo { widgets: Array<WidgetDeclarado & { admite: Tamano[]; nace: Tamano }>; porRol: Record<string, string[]> }
/** `null`: los defaults del rol. Si no, lo que la persona ajustó. */
export type ConfigDeInicio = { orden: string[]; tamanos?: Record<string, Tamano> } | null;

export declare const TAMANOS: Tamano[];
export declare const COLUMNAS: number;
export declare const COLUMNAS_DE_TAMANO: Record<Tamano, number>;
/** Arma el catálogo de la app; falla si un rol pide un widget que no existe. */
export declare function registrarCatalogo(widgets: WidgetDeclarado[], porRol?: Record<string, string[]>): Catalogo;
export declare function permitidos(catalogo: Catalogo, ctx?: Contexto): Catalogo['widgets'];
export declare function widgetsDeInicio(catalogo: Catalogo, ctx?: Contexto, config?: ConfigDeInicio): Catalogo['widgets'];
export declare function tamanoDe(widget: Catalogo['widgets'][number], config?: ConfigDeInicio): Tamano;
export declare function sanear(catalogo: Catalogo, crudo: unknown): ConfigDeInicio;
export declare function alternar(catalogo: Catalogo, ctx: Contexto, config: ConfigDeInicio, id: string): NonNullable<ConfigDeInicio>;
export declare function mover(catalogo: Catalogo, ctx: Contexto, config: ConfigDeInicio, id: string, paso: -1 | 1): NonNullable<ConfigDeInicio>;
export declare function conTamano(catalogo: Catalogo, ctx: Contexto, config: ConfigDeInicio, id: string, tamano: Tamano): NonNullable<ConfigDeInicio>;
export declare function deFabrica(): null;
/** Las columnas de cada widget con las filas llenas: el último de cada fila se estira hasta cerrarla. */
export declare function llenarFilas(anchos: number[], columnas?: number): number[];
export declare function panelDeAjuste(catalogo: Catalogo, ctx: Contexto, config: ConfigDeInicio): Array<{ widget: Catalogo['widgets'][number]; visible: boolean }>;

export interface InicioProps {
  t: T;
  ctx?: Contexto;
  catalogo: Catalogo;
  config?: ConfigDeInicio;
  /** Se llama al tocar «Listo», con la configuración nueva (o null = como al principio). */
  onGuardarConfig?: (config: ConfigDeInicio) => Promise<unknown> | void;
  nombre?: string;
  /** La fecha de hoy, ya formateada en el idioma de la persona. */
  fechaTexto?: string;
  /** Hasta tres; la primera es la principal. */
  acciones?: Array<{ texto: React.ReactNode; onClick?: () => void }>;
  /** La lectura única: lo que necesitan todos los widgets. */
  datos?: Record<string, any>;
  /** Los nombres (traducidos) de lo que no se pudo leer. */
  noCargo?: string[];
  primerosPasos?: Array<{ id: string; texto: React.ReactNode; hecho?: boolean; onIr?: () => void }>;
  /** El hueco del asistente («Mientras no estabas», fase 3): va arriba de todo. */
  mientras?: React.ReactNode;
  onIr?: (ruta: string) => void;
}
export declare function Inicio(props: InicioProps): React.JSX.Element;

export declare const RENGLONES: Record<Tamano, number>;
export declare function WidgetHoy(props: PropsDeWidget): React.JSX.Element;
export declare function WidgetAlertas(props: PropsDeWidget): React.JSX.Element;
export declare function WidgetPendientes(props: PropsDeWidget): React.JSX.Element;
export declare const WIDGETS_DEL_MOLDE: WidgetDeclarado[];
