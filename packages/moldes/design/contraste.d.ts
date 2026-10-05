/** Razón de contraste WCAG 2.1 entre dos colores hex. */
export declare function razonDeContraste(a: string, b: string): number;
/** Cuán distintos se ven dos colores, tono incluido (ΔE en OKLab). */
export declare function distanciaPerceptual(a: string, b: string): number;
/** Cuánto color tiene un color: el croma en OKLab, la distancia al eje gris. */
export declare function croma(hex: string): number;
/** De dos tintas, la que mejor se lee sobre `fondo`. */
export declare function sobreColor(fondo: string, tintaClara: string, tintaOscura: string): string;
