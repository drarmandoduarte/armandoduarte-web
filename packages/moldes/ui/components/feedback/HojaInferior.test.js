/**
 * La hoja que sube desde abajo.
 *
 * Lee el fuente por la misma razón que `BarraInferior.test.js` y que
 * `Sidebar.test.js`: este paquete no monta un DOM. Lo que cuida son las tres
 * decisiones que la pieza tiene escritas en líneas, y una de ellas es la única
 * que la separa de sus dos hermanas.
 */
import { describe, expect, it } from 'vitest';
import { soloCodigo } from '../../herramientas/soloCodigo.js';
import FUENTE from './HojaInferior.jsx?raw';
import FUENTE_DIALOGO from './Dialog.jsx?raw';
import FUENTE_PANEL from './PanelLateral.jsx?raw';

describe('la hoja inferior', () => {
  it('piso · los tres fuentes se leyeron', () => {
    expect(FUENTE.length, 'piso · la hoja').toBeGreaterThan(1000);
    expect(FUENTE_DIALOGO.length, 'piso · el diálogo').toBeGreaterThan(1000);
    expect(FUENTE_PANEL.length, 'piso · el panel').toBeGreaterThan(1000);
  });

  it('sale de abajo, que es lo que la distingue de las otras dos', () => {
    expect(FUENTE).toMatch(/alignItems: 'flex-end'/);
    expect(FUENTE_DIALOGO, 'el diálogo va al centro').toMatch(/alignItems: 'center'/);
    expect(FUENTE_PANEL, 'el panel va al costado').toMatch(/justifyContent: 'flex-end'/);
  });

  it('bloquea el scroll del fondo, y lo devuelve como estaba', () => {
    /* Lo único que hace y las otras dos no. En un escritorio un velo que no
       bloquea es un detalle; en un teléfono es el defecto entero — el dedo que
       arrastra la hoja arrastra la lista de atrás.

       Y devuelve el valor que había, no `''`: si mañana la app bloquea el
       scroll por otra razón, salir de aquí no tiene por qué desbloqueárselo. */
    expect(FUENTE).toMatch(/const antes = document\.body\.style\.overflow/);
    expect(FUENTE).toMatch(/document\.body\.style\.overflow = 'hidden'/);
    expect(FUENTE).toMatch(/document\.body\.style\.overflow = antes/);
    expect(FUENTE_DIALOGO, 'el diálogo no lo hacía').not.toMatch(/body\.style\.overflow/);
    expect(FUENTE_PANEL, 'el panel tampoco').not.toMatch(/body\.style\.overflow/);
  });

  it('hereda el velo y el Escape de sus hermanas', () => {
    for (const trozo of [/background: 'var\(--overlay\)'/, /blur\(var\(--overlay-blur\)\)/, /e\.key === 'Escape'/]) {
      expect(FUENTE, String(trozo)).toMatch(trozo);
    }
  });

  it('redondeada arriba y recta abajo: está apoyada contra el borde', () => {
    expect(FUENTE).toMatch(/borderTopLeftRadius: 'var\(--radius-tarjeta\)'/);
    expect(FUENTE).toMatch(/borderTopRightRadius: 'var\(--radius-tarjeta\)'/);
    expect(FUENTE, 'y no redondea abajo').not.toMatch(/borderBottomLeftRadius/);
  });

  it('reserva el área segura de abajo, porque tapa a la barra que la reservaba', () => {
    expect(FUENTE).toMatch(/paddingBottom: 'env\(safe-area-inset-bottom\)'/);
  });

  it('ningún hex escrito a mano', () => {
    /* Sobre el código y no sobre el archivo: los comentarios citan colores. */
    expect(soloCodigo(FUENTE).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
