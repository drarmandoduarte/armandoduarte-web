/**
 * El tinte del header conoce las dos secciones oscuras — y tiene que seguir
 * conociéndolas el día que el teal cambie.
 *
 * ── Por qué hace falta un test para dos cadenas ──────────────────────────
 * Porque `SECCIONES_OSCURAS` guarda **colores**, pero no en forma de color: los
 * guarda como `'rgb(51, 88, 92)'`, que es lo que devuelve
 * `getComputedStyle().backgroundColor`. Eso las vuelve invisibles para
 * `check:tokens`, que busca hex, y para cualquiera que un día cambie el teal en
 * `codice-tokens.css` y busque dónde más aparece. Son dos copias de un color
 * escritas en el único formato en el que nadie las va a encontrar.
 *
 * Lo que pasa si se desincronizan no es un error: es que **el header deja de
 * ponerse claro sobre la sección teal**. Texto tinta sobre fondo teal, ilegible,
 * y todo lo demás funcionando. Un defecto que no rompe nada es un defecto que
 * vive meses.
 *
 * Así que el test convierte el token a la forma del navegador y compara.
 */
import { describe, expect, it } from 'vitest';
import tokens from '@codice/ui/tokens.json';
import { SECCIONES_OSCURAS } from './useTinteDeCabecera';

/** `#33585C` → `rgb(51, 88, 92)`, que es como lo escribe el navegador. */
function comoLoEscribeElNavegador(hex: string): string {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

describe('el tinte del header', () => {
  it('piso · la conversión sabe convertir', () => {
    expect(comoLoEscribeElNavegador('#000000')).toBe('rgb(0, 0, 0)');
    expect(comoLoEscribeElNavegador('#FFFFFF')).toBe('rgb(255, 255, 255)');
  });

  it('conoce exactamente las dos secciones oscuras del design system', () => {
    const esperadas = [
      tokens.color.brand.teal.value,
      tokens.color.ink.primary.value,
    ].map(comoLoEscribeElNavegador);

    expect(
      [...SECCIONES_OSCURAS].sort(),
      'si el teal o la tinta cambian en los tokens, el header deja de ponerse claro sobre ellos '
      + 'y el texto queda ilegible, sin que nada más se rompa',
    ).toEqual(esperadas.sort());
  });
});
