/**
 * La regla que borra las flechitas del navegador sigue completa.
 *
 * Se lee el archivo con `readFileSync` porque Vitest, sin `css: { include }`,
 * devuelve cadena vacía para toda importación de un `.css`: un test que
 * importara `base.css` pasaría comparando contra la nada.
 *
 * Un navegador ignora en silencio la declaración que no es suya, así que si
 * alguien «limpia» la que le parece repetida, las flechas vuelven en media flota
 * de escritorios y nada se pone rojo. Esa es la forma en que este arreglo puede
 * morir, y es la que se custodia acá.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const AQUI = dirname(fileURLToPath(import.meta.url));
const BASE = readFileSync(join(AQUI, 'base.css'), 'utf8');

/**
 * El cuerpo de la regla que termina en ese selector, sin montar navegador.
 * `selector` es una expresión regular escapada y SIN la llave: la llave la pone
 * esto, y es lo que hace que `.molde-sin-flechas` no enganche por error con
 * `.molde-sin-flechas::-webkit-outer-spin-button`.
 */
function cuerpo(selector) {
  const encontrado = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(BASE);
  return encontrado ? encontrado[1] : null;
}

describe('las flechitas de `type="number"` no se dibujan', () => {
  it('Chrome, Edge y Safari: los dos pseudo-elementos, apagados', () => {
    // Van los DOS: `inner` es el par que se ve, `outer` es la caja que lo
    // envuelve y que en Safari se sigue llevando su ancho aunque el par no
    // se dibuje. Apagar uno solo deja un hueco a la derecha de la cifra.
    const regla = cuerpo('\\.molde-sin-flechas::-webkit-inner-spin-button');
    expect(regla, 'no está la regla de los spin buttons en base.css').not.toBeNull();
    expect(BASE).toContain('.molde-sin-flechas::-webkit-outer-spin-button');
    expect(BASE).toContain('.molde-sin-flechas::-webkit-inner-spin-button');
    expect(regla).toContain('-webkit-appearance:none');
    // Sin esto Chrome deja el margen del control aunque no lo pinte.
    expect(regla).toContain('margin:0');
  });

  it('Firefox: `appearance: textfield`, con y sin prefijo', () => {
    const regla = cuerpo('\\.molde-sin-flechas');
    expect(regla, 'no está la regla del campo en base.css').not.toBeNull();
    // El prefijado es para los Firefox viejos; el pelado, para los de hoy.
    expect(regla).toContain('-moz-appearance:textfield');
    expect(regla).toMatch(/(^|;)appearance:textfield/);
  });
});
