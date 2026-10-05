/**
 * El umbral del medidor de límite.
 *
 * Vivía en `BarraDeUso.test.js` hasta que esa pieza se jubiló; el umbral
 * es lo único que sobrevivió sin un cambio, porque no era de la anatomía sino
 * del color. **Los tres estados del renglón se prueban dibujando**, y eso vive
 * en una prueba de cada app: `packages/ui` no
 * tiene `react-dom` y agregarle una dependencia para dibujar en un test sería
 * pagar caro lo que la app ya sabe hacer.
 *
 * Es el tramo de color de la barra de plan del origen, traído con los tokens de
 * esta casa. Se prueba solo, sin renderizar nada, porque es una función pura: lo
 * que puede romperse en silencio no es el `<div>`, es el número donde cambia el
 * color.
 *
 * Lo que fija, y por qué importa: **que el error no aparezca nunca.** Es la
 * tentación obvia el día que alguien «mejore» el medidor —rojo al 95 % parece de
 * sentido común— y es exactamente lo que el molde prohíbe: el relleno sólido
 * del error es de la urgencia, y gastarlo en un disco lleno es no tenerlo
 * el día que pasa algo grave.
 */
import { describe, expect, it } from 'vitest';
import { colorDeBarra } from './MedidorDeLimite.jsx';

describe('el color del medidor avisa, no alarma', () => {
  it('mientras hay margen es el acento', () => {
    for (const p of [0, 0.1, 0.5, 0.749]) {
      expect(colorDeBarra(p), String(p)).toBe('var(--primary)');
    }
  });

  it('desde el 75 % avisa con el aviso', () => {
    // El 75 exacto ya avisa: es el borde del origen, `pct >= 0.75`.
    for (const p of [0.75, 0.8, 0.9]) {
      expect(colorDeBarra(p), String(p)).toBe('var(--warning)');
    }
  });

  it('y arriba del 90 el mismo aviso, más hondo', () => {
    for (const p of [0.901, 0.99, 1]) {
      expect(colorDeBarra(p), String(p)).toBe('var(--warning-text)');
    }
  });

  it('el error no aparece en ningún tramo, ni siquiera lleno', () => {
    for (let p = 0; p <= 1.0001; p += 0.01) {
      expect(colorDeBarra(p)).not.toContain('danger');
    }
  });
});
