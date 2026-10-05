export type NombreDeColor = 'fondo' | 'papel' | 'texto' | 'texto2' | 'linea' | 'acento' | 'error' | 'ok' | 'aviso';

/** El design.json de una app (esquema v1). */
export interface Design {
  /** `frase`: un texto (español) o la frase en cada idioma. */
  app: { nombre: string; frase: string | Partial<Record<'es' | 'en' | 'pt', string>>; espanol: 'voseo' | 'neutro' };
  color: Record<NombreDeColor, string>;
  colorOscuro: Record<NombreDeColor, string>;
  tipografia: { sans: string; serif: string; mono: string };
  radio: { boton: number; campo: number; tarjeta: number };
}

export declare const COLORES: NombreDeColor[];
export declare const TIPOGRAFIAS: Array<'sans' | 'serif' | 'mono'>;
export declare const RADIOS: Array<'boton' | 'campo' | 'tarjeta'>;
/** Lista de problemas; vacía si el archivo cumple el esquema y se lee (AA). */
export declare function validar(design: unknown): string[];
/** Lo que conviene saber y no impide usar el design.json (p. ej., la frase en un solo idioma). */
export declare function avisos(design: unknown): string[];
/** La frase de marca en ese idioma, o null: entonces va `t('auth.login.titleDefault')`. */
export declare function fraseDeMarca(design: Design, idioma?: 'es' | 'en' | 'pt'): string | null;
export declare const IDIOMAS_DE_FRASE: Array<'es' | 'en' | 'pt'>;

export interface Variables { claro: Record<string, string>; oscuro: Record<string, string>; comunes: Record<string, string> }
export declare function aVariables(design: Design): Variables;
/** La hoja CSS con `:root{…}` y `[data-theme="dark"]{…}`. */
export declare function aCss(design: Design): string;
/** `design.css`: `aCss()` con su cabecera. Es lo que escribe `generar-css.mjs` en `public/`. */
export declare function hojaDeDesign(design: Design): string;
/** La URL de Google Fonts para las tres tipografías, o null si son todas `system`. */
export declare function urlDeFuentes(design: Design): string | null;
export declare function escalonDeLetra(color: string, fondos: string[], tinta: string, fondo?: string): string;
export declare function mezclar(a: string, b: string, p: number): string;
export declare const SELECTOR_CLARO: string;
export declare const SELECTOR_OSCURO: string;

/**
 * Enlaza con `<link>` las dos hojas que la app sirve desde su dominio: `hoja`
 * (por defecto `/design.css`, de `generar-css.mjs`) y, con `fuentes: 'propias'`
 * (por defecto), `hojaDeFuentes` (`/fuentes/fuentes.css`, de `bajar-fuentes.mjs`).
 * Nunca escribe un `<style>`: la CSP de las apps es `style-src 'self'`.
 * `fuentes: 'ninguna'` si la app enlaza sus fuentes aparte.
 */
export declare function aplicarDesign(design: Design, opciones?: { documento?: Document; hoja?: string; fuentes?: 'propias' | 'ninguna'; hojaDeFuentes?: string }): void;

export interface CaraDeFuente { subconjunto: string; familia: string; estilo: string; peso: string; rango: string | null; url: string }
export declare const SUBCONJUNTOS: string[];
export declare function leerHojaDeGoogle(css: string): CaraDeFuente[];
export declare function filtrarCaras(caras: CaraDeFuente[], subconjuntos?: string[]): CaraDeFuente[];
export declare function nombreDeArchivo(cara: CaraDeFuente): string;
export declare function asignarArchivos(caras: CaraDeFuente[]): Array<CaraDeFuente & { archivo: string }>;
export declare function hojaDeFuentes(caras: CaraDeFuente[], prefijo?: string): string;

export { razonDeContraste, distanciaPerceptual, croma, sobreColor } from './contraste';
