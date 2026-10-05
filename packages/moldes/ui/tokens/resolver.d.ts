export interface Resolvedor {
  capas: { claro: Record<string, string>; oscuro: Record<string, string> };
  crudo(tema: 'claro' | 'oscuro', token: string): string | undefined;
  expandir(tema: 'claro' | 'oscuro', texto: string): string;
  hex(tema: 'claro' | 'oscuro', token: string): string;
  hexDeValor(tema: 'claro' | 'oscuro', valor: string): string;
}
/** Arma un resolvedor sobre la capa cruda (salida de `aCss`) y la de alias (`semantic.css`). */
export declare function resolvedor(colorsCss: string, semanticCss: string): Resolvedor;
/** Evalúa un valor ya expandido (hex o `color-mix`) a hex. */
export declare function aHex(valor: string): string;
