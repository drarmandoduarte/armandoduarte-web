/**
 * El riel de la app: la canaleta es fija y el techo es alto.
 *
 * · La **canaleta** son 24 px a cada lado, a cualquier ancho, en píxeles (es un
 *   borde, no una medida de lectura).
 * · El **techo** existe para que un ultrawide no se vuelva una sábana, y tiene
 *   que ser ALTO: en 1920 y en 2560 no muerde, el riel usa todo lo que hay. Un
 *   techo bajo (1600) dejaba 224 px sin usar en un monitor de 2056.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HOJA = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'spacing.css'), 'utf8');
const valor = (token) => new RegExp(`${token}\\s*:\\s*([^;]+);`).exec(HOJA)?.[1].trim() ?? null;
const px = (v) => Number(String(v).replace('px', ''));
/* El riel vive al lado de la barra lateral (14,5rem = 232 px a letra normal):
   el ancho disponible es la ventana menos la barra, no la ventana. */
const BARRA = 232;

describe('el riel', () => {
  it('la canaleta está, en píxeles, y es 24', () => {
    expect(valor('--app-canaleta')).toBe('24px');
  });
  it('el techo no muerde en 1920 ni en 2560', () => {
    const techo = px(valor('--app-techo'));
    for (const ancho of [1920, 2560]) expect(ancho - BARRA - 2 * 24).toBeLessThan(techo);
  });
  it('pero existe: en 3440 el sobrante vuelve a ser margen', () => {
    expect(3440 - BARRA - 2 * 24).toBeGreaterThan(px(valor('--app-techo')));
  });
});
