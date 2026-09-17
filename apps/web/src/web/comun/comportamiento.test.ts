/**
 * El header se pone claro sobre los fondos oscuros — y tiene que seguir
 * haciéndolo el día que alguien cambie un color.
 *
 * ── El test que había acá no alcanzó, y ésta es la historia ──────────────
 * `comportamiento.ts` guardaba una lista de dos cadenas —`'rgb(51, 88, 92)'` y
 * `'rgb(46, 43, 37)'`, el teal y la tinta en el formato que devuelve
 * `getComputedStyle`— y este test la recalculaba desde los tokens y comparaba.
 * Estaba bien pensado: son dos copias de un color escritas en el único formato
 * en el que nadie las va a encontrar buscando un hex.
 *
 * **Y no sirvió.** La #05 cambió el teal de la web a `#005761` agregando
 * `color.cff.tealDark` y dejando `color.brand.teal` en `#33585C` para la app.
 * Este test seguía leyendo `color.brand.teal`, así que siguió en verde; la web,
 * mientras tanto, pintaba las secciones de un teal que la lista no conocía. En
 * producción el wordmark quedó en **1,70:1** sobre «Sobre el facilitador».
 *
 * El test no estaba mal escrito: estaba **mirando la copia equivocada**. Y ése
 * es el problema con vigilar una copia — hay que acertarle a cuál.
 *
 * ── Qué se vigila ahora ──────────────────────────────────────────────────
 * Ya no hay lista: `esOscuro()` mide la luminancia del fondo. Este test afirma
 * que esa medición clasifica bien **los seis fondos que la web usa de verdad**,
 * leídos de los tokens que la web usa de verdad (`cff` y los neutros, no `brand`).
 *
 * La diferencia es que ahora un color nuevo no puede desincronizarse: si mañana
 * el teal cambia otra vez, `esOscuro()` lo mide igual y este test lo comprueba
 * contra el token nuevo sin que nadie toque nada. Lo único que haría falla acá
 * es que alguien elija un fondo que de verdad esté en el límite — y eso es
 * exactamente lo que un test debería hacer notar.
 */
import { describe, expect, it } from 'vitest';
import tokens from '@codice/ui/tokens.json';
import { esOscuro } from './comportamiento';

/** `#005761` → `rgb(0, 87, 97)`, que es como lo escribe el navegador. */
function comoLoEscribeElNavegador(hex: string): string {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

const C = tokens.color;

/** Los seis fondos que las secciones de la web pintan, y qué tiene que decidir. */
const FONDOS: [string, string, boolean][] = [
  ['crema (el fondo por defecto)', C.background.cream.value, false],
  ['cálido (`.calido`)', C.background.surfaceWarm.value, false],
  ['blanco (`.blanco`)', C.background.surface.value, false],
  ['teal CFF (`.oscuro`)', C.cff.tealDark.value, true],
  ['tinta (`.tinta`)', C.ink.primary.value, true],
  ['grafito (el telón del menú)', C.chrome.graphite.value, true],
];

describe('el tinte del header', () => {
  it('piso · la conversión sabe convertir', () => {
    expect(comoLoEscribeElNavegador('#000000')).toBe('rgb(0, 0, 0)');
    expect(comoLoEscribeElNavegador('#FFFFFF')).toBe('rgb(255, 255, 255)');
  });

  it('piso · la medición sabe medir los dos extremos', () => {
    expect(esOscuro('rgb(0, 0, 0)'), 'el negro tiene que ser oscuro').toBe(true);
    expect(esOscuro('rgb(255, 255, 255)'), 'el blanco no').toBe(false);
  });

  for (const [nombre, hex, esperado] of FONDOS) {
    it(`${nombre} ${hex} → ${esperado ? 'oscuro' : 'claro'}`, () => {
      expect(
        esOscuro(comoLoEscribeElNavegador(hex)),
        `si esto cambia, el header deja de ponerse ${esperado ? 'claro' : 'oscuro'} sobre ${nombre} `
        + 'y el wordmark queda ilegible sin que nada más se rompa. Es lo que pasó con el teal '
        + 'entre la #05 y la #06: 1,70:1 en producción.',
      ).toBe(esperado);
    });
  }

  /*
   * Y los dos casos que no son un color de sección. El primero es el que de
   * verdad ocurre: una `<section>` sin fondo propio —las crema— devuelve
   * `rgba(0, 0, 0, 0)`, que si se midiera crudo daría negro y pondría el header
   * claro sobre el fondo más claro de la web. Es el borde exacto donde la
   * versión anterior de esta función se habría equivocado.
   */
  it('transparente no es oscuro: lo decide la sección de atrás', () => {
    expect(esOscuro('rgba(0, 0, 0, 0)')).toBe(false);
  });

  it('una cadena que no es un color no rompe nada', () => {
    expect(esOscuro('')).toBe(false);
    expect(esOscuro('none')).toBe(false);
  });
});
