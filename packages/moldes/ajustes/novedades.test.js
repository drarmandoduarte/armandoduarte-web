import { describe, expect, it } from 'vitest';
import { leerNovedades } from './novedades.js';

const CHANGELOG = `# CHANGELOG

## Sin publicar
- Algo que todavía no salió

## 1.2.0 · 3/10/2026
- Ahora se puede pagar con transferencia.
  - detalle técnico que no va
- El buscador encuentra por teléfono.
### Para programadores
- refactor del cobro
- uno
- dos

## [1.1.0] - 2026-09-20
- Modo oscuro.

## 1.0.0
`;

describe('Novedades desde el CHANGELOG', () => {
  const n = leerNovedades(CHANGELOG);
  it('lee las versiones con su fecha, en las dos formas de escribirlas', () => {
    expect(n.map((v) => [v.version, v.fecha])).toEqual([['1.2.0', '3/10/2026'], ['1.1.0', '2026-09-20']]);
  });
  it('salta «Sin publicar», las versiones vacías, las sub-viñetas y los ### de programadores', () => {
    expect(n[0].cambios).toEqual(['Ahora se puede pagar con transferencia.', 'El buscador encuentra por teléfono.']);
  });
  it('tres líneas por versión: la persona lee tres líneas', () => {
    const larga = '## 2.0.0\n- a\n- b\n- c\n- d\n';
    expect(leerNovedades(larga)[0].cambios).toEqual(['a', 'b', 'c']);
  });
  it('un CHANGELOG vacío no rompe', () => {
    expect(leerNovedades('')).toEqual([]);
    expect(leerNovedades()).toEqual([]);
  });
});
