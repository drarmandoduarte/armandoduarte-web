/**
 * Las dos cuentas del `Selector`.
 *
 * Lo que fijan: que el umbral sea una regla y no un número suelto, que forzar el
 * modo gane siempre, y que aplanar los grupos no pierda ni reordene una sola
 * opción. Esto último es lo que se rompe en silencio: una opción que se cae al
 * aplanar no da error, da una lista donde falta un producto.
 */
import { describe, expect, it } from 'vitest';
import {
  aplanarOpciones, modoDeSeleccion, segmentarPorGrupo, TOPE_DESPLEGABLE,
} from './opciones.js';

describe('qué modo le toca a una lista', () => {
  it('hasta siete, desplegable', () => {
    for (const n of [0, 1, 5, 7]) expect(modoDeSeleccion(n), String(n)).toBe('desplegable');
  });

  it('de ocho en adelante, búsqueda', () => {
    for (const n of [8, 32, 700]) expect(modoDeSeleccion(n), String(n)).toBe('busqueda');
  });

  it('el umbral es siete y está escrito una sola vez', () => {
    expect(TOPE_DESPLEGABLE).toBe(7);
    expect(modoDeSeleccion(TOPE_DESPLEGABLE)).toBe('desplegable');
    expect(modoDeSeleccion(TOPE_DESPLEGABLE + 1)).toBe('busqueda');
  });

  it('`libre` gana sobre todo: si se puede escribir, hay dónde escribir', () => {
    // Una especialidad sin lista curada: cero opciones, y el campo tiene
    // que seguir funcionando.
    expect(modoDeSeleccion(0, undefined, true)).toBe('busqueda');
    expect(modoDeSeleccion(3, false, true)).toBe('busqueda');
  });

  it('forzar gana siempre, en los dos sentidos', () => {
    // Un vocabulario de seis que se escribe mejor.
    expect(modoDeSeleccion(3, true)).toBe('busqueda');
    // Y los días de la semana, que no se buscan: se ven.
    expect(modoDeSeleccion(200, false)).toBe('desplegable');
  });
});

describe('aplanar los grupos', () => {
  const GRUPOS = [
    { label: 'Kinesiología', options: [{ value: 'p1', label: 'Evaluación inicial' }, { value: 'p2', label: 'Masoterapia' }] },
    { label: 'Odontología', options: [{ value: 'g1', label: 'Limpieza' }] },
  ];

  it('no pierde ni reordena ninguna opción', () => {
    const planas = aplanarOpciones([], GRUPOS);
    expect(planas.map((o) => o.value)).toEqual(['p1', 'p2', 'g1']);
  });

  it('cada opción se lleva el nombre de su grupo', () => {
    const planas = aplanarOpciones([], GRUPOS);
    expect(planas.map((o) => o.grupo)).toEqual(['Kinesiología', 'Kinesiología', 'Odontología']);
  });

  it('las sueltas van primero, que es el orden en que se escriben', () => {
    const planas = aplanarOpciones([{ value: 'x', label: 'Sin grupo' }], GRUPOS);
    expect(planas[0].value).toBe('x');
    expect(planas[0].grupo).toBeUndefined();
  });

  it('sin grupos ni opciones no explota', () => {
    expect(aplanarOpciones()).toEqual([]);
    expect(aplanarOpciones(undefined, [{ label: 'Vacío' }])).toEqual([]);
  });

  it('no toca las opciones originales', () => {
    const original = [{ value: 'p1', label: 'Evaluación inicial' }];
    aplanarOpciones([], [{ label: 'Kinesiología', options: original }]);
    expect(original[0].grupo).toBeUndefined();
  });
});

describe('la lista partida en tramos', () => {
  it('un tramo por grupo, con todas sus opciones adentro', () => {
    const planas = aplanarOpciones([], [
      { label: 'Kinesiología', options: [{ value: 'p1', label: 'A' }, { value: 'p2', label: 'B' }] },
      { label: 'Odontología', options: [{ value: 'g1', label: 'C' }] },
    ]);
    const tramos = segmentarPorGrupo(planas);
    expect(tramos.map((t) => [t.grupo, t.opciones.length])).toEqual([['Kinesiología', 2], ['Odontología', 1]]);
  });

  it('el índice es el de la lista completa, no el del tramo', () => {
    // Es lo que usa el teclado para saber cuál está activa: renumerar al partir
    // haría que la flecha abajo salte al primero del grupo en vez de al
    // siguiente.
    const planas = aplanarOpciones([], [
      { label: 'Kinesiología', options: [{ value: 'p1', label: 'A' }, { value: 'p2', label: 'B' }] },
      { label: 'Odontología', options: [{ value: 'g1', label: 'C' }] },
    ]);
    expect(segmentarPorGrupo(planas)[1].opciones[0].indice).toBe(2);
  });

  it('un grupo que la búsqueda dejó sin opciones no da tramo', () => {
    const filtradas = [{ value: 'g1', label: 'Limpieza', grupo: 'Odontología' }];
    expect(segmentarPorGrupo(filtradas).map((t) => t.grupo)).toEqual(['Odontología']);
  });

  it('sin grupos es un solo tramo sin nombre', () => {
    const tramos = segmentarPorGrupo([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]);
    expect(tramos).toHaveLength(1);
    expect(tramos[0].grupo).toBeUndefined();
    expect(tramos[0].opciones).toHaveLength(2);
  });

  it('las sueltas y las agrupadas conviven sin mezclarse', () => {
    const planas = aplanarOpciones(
      [{ value: 'x', label: 'Sin grupo' }],
      [{ label: 'Kinesiología', options: [{ value: 'p1', label: 'A' }] }],
    );
    expect(segmentarPorGrupo(planas).map((t) => t.grupo)).toEqual([undefined, 'Kinesiología']);
  });

  it('una lista vacía no da tramos', () => {
    expect(segmentarPorGrupo([])).toEqual([]);
    expect(segmentarPorGrupo()).toEqual([]);
  });
});
