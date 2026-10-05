export type Idioma = 'es' | 'en' | 'pt';
export type Variables = Record<string, string | number | null | undefined>;
export interface T {
  (clave: string, variables?: Variables): string;
  idioma: Idioma;
  existe(clave: string): boolean;
}
export declare const IDIOMAS: Idioma[];
export declare const TEXTOS: Record<Idioma, Record<string, string>>;
export declare const VOSEO: Record<string, string>;
export declare function interpolar(texto: string, variables?: Variables): string;
export declare function crearT(opciones?: {
  idioma?: Idioma;
  espanol?: 'neutro' | 'voseo';
  extras?: Partial<Record<Idioma | 'es-UY', Record<string, string>>>;
  comunes?: Variables;
}): T;
export declare function elegirIdioma(o?: { perfil?: string | null; aparato?: string | null; navegador?: string | null }): Idioma;
