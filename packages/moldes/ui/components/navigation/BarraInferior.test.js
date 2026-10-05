/**
 * La barra de abajo del modo celular.
 *
 * ── Por qué este test lee el fuente y no monta el componente ───────────────
 * Por lo mismo que `Sidebar.test.js`: el corredor de `packages/ui` no monta un
 * DOM, y `EntradaDeBarra` no tiene estado pero vive dentro de un módulo que
 * exporta piezas con `React.createElement` — montarlo de verdad pediría
 * `react-dom` como dependencia nueva de este paquete, que esta orden no pide.
 *
 * Y lo que este archivo cuida **está escrito en líneas**: los 56 px, el reparto
 * en quintos, y los dos tokens de lo activo. Lo que no se puede leer en el
 * fuente —que la zona de toque mida 44 × 44 en una pantalla de verdad— lo mide
 * una prueba de punta a punta de cada app sobre el bundle compilado,
 * que es donde esa pregunta tiene respuesta.
 */
import { describe, expect, it } from 'vitest';
import { soloCodigo } from '../../herramientas/soloCodigo.js';
import FUENTE from './BarraInferior.jsx?raw';
import { ALTO_BARRA_INFERIOR } from './BarraInferior.jsx';

describe('la barra de abajo', () => {
  /* El piso, y va primero: si el `?raw` dejara de traer el archivo, cada
     `toMatch` de abajo estaría buscando dentro de una cadena vacía. */
  it('piso · el fuente se leyó', () => {
    expect(FUENTE.length, 'piso · caracteres del fuente').toBeGreaterThan(1000);
    expect(FUENTE, 'piso · es el archivo que se cree').toContain('BarraInferior');
  });

  it('el alto que se ve y se toca son 56 px', () => {
    expect(ALTO_BARRA_INFERIOR).toBe(56);
  });

  it('el área segura va como relleno y no sumada al alto', () => {
    /* Si se sumara, la zona tocable de un iPhone con notch dejaría de medir 56
       y crecería con el aparato. Y el `body` la suelta en modo celular
       (la hoja de la app) para que no la reserven los dos. */
    expect(FUENTE).toMatch(/paddingBottom: 'env\(safe-area-inset-bottom\)'/);
    expect(FUENTE, 'el alto no lleva la resta adentro')
      .toMatch(/height: ALTO_BARRA_INFERIOR/);
  });

  it('la línea de arriba es sombra y no borde', () => {
    /* Medido: un `borderTop` de 1 px sumaba al alto de la caja y la barra medía
       57 donde la orden dice 56. La sombra se pinta hacia afuera. */
    expect(FUENTE).toMatch(/boxShadow: '0 calc\(-1 \* var\(--border-w\)\) 0 var\(--border\)'/);
    expect(FUENTE, 'y no queda un borde suelto').not.toMatch(/borderTop:/);
  });

  it('cada entrada mide un quinto, y eso pide las dos mitades', () => {
    /* `flex: 1 1 0` solo reparte en partes iguales si además hay `minWidth: 0`:
       sin él, la entrada del nombre largo se lleva más ancho que sus hermanas.
       Las dos van juntas o no reparte nada. */
    expect(FUENTE).toMatch(/flex: '1 1 0', minWidth: 0/);
  });

  it('lo activo usa los mismos dos tokens que el riel', () => {
    /* `estiloFila` del Sidebar pinta la fila activa con `--primary-soft` de
       fondo y `--primary-soft-fg` de tinta. Si dirección cambia el acento de
       lo activo, se cambia el token y se mueven los dos. */
    expect(FUENTE).toMatch(/var\(--primary-soft\)/);
    expect(FUENTE).toMatch(/var\(--primary-soft-fg\)/);
  });

  it('el nombre es una línea con elipsis', () => {
    /* «Tablero del día» no entra en los 70 px que quedan a 390 y se corta. Es
       el mismo nombre que el riel, que es lo que la orden manda. */
    expect(FUENTE).toMatch(/textOverflow: 'ellipsis'/);
    expect(FUENTE).toMatch(/whiteSpace: 'nowrap'/);
  });

  it('ningún hex escrito a mano', () => {
    /* La regla de la casa: solo tokens. Y se mira el CÓDIGO y no el archivo:
       los comentarios citan colores y un guardián que no los limpia se cae
       contra su propia prosa. */
    expect(soloCodigo(FUENTE).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
