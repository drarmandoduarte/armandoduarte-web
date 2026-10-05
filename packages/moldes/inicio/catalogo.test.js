/** El catálogo de widgets como mecanismo: lo que ve cada rol, ajustar, deshacer, como al principio. */
import { describe, expect, it } from 'vitest';
import { registrarCatalogo, widgetsDeInicio, tamanoDe, sanear, alternar, mover, conTamano, deFabrica, panelDeAjuste, llenarFilas } from './catalogo.js';

const W = () => null;
const CAT = registrarCatalogo([
  { id: 'hoy', clave: 'x', admite: ['chico', 'mediano'], nace: 'mediano', Widget: W },
  { id: 'alertas', clave: 'x', admite: ['chico', 'mediano', 'grande'], nace: 'mediano', Widget: W },
  { id: 'caja', clave: 'x', soloManda: true, Widget: W },
  { id: 'pendientes', clave: 'x', admite: ['chico'], nace: 'grande', Widget: W },
], { dueno: ['caja', 'hoy', 'alertas'], recepcion: ['hoy', 'alertas', 'caja'] });
const DUENO = { rol: 'dueno', manda: true };
const RECEPCION = { rol: 'recepcion', manda: false };
const ids = (xs) => xs.map((w) => w.id);

describe('registrar', () => {
  it('un widget sin tamaños nace mediano; si nace en uno que no admite, nace en el primero que admite', () => {
    expect(CAT.widgets.find((w) => w.id === 'caja').nace).toBe('mediano');
    expect(CAT.widgets.find((w) => w.id === 'pendientes').nace).toBe('chico');
  });
  it('un rol que pide un widget que no existe es un error de la app, y se dice', () => {
    expect(() => registrarCatalogo([{ id: 'a', clave: 'x', Widget: W }], { dueno: ['b'] })).toThrow(/no tiene: b/);
  });
});

describe('qué ve cada uno', () => {
  it('sin ajustes, los defaults de su rol en su orden', () => {
    expect(ids(widgetsDeInicio(CAT, DUENO, null))).toEqual(['caja', 'hoy', 'alertas']);
  });
  it('lo de quien manda no lo ve quien no manda, aunque su rol lo pida', () => {
    expect(ids(widgetsDeInicio(CAT, RECEPCION, null))).toEqual(['hoy', 'alertas']);
  });
  it('con ajustes, exactamente lo ajustado', () => {
    expect(ids(widgetsDeInicio(CAT, DUENO, { orden: ['alertas'] }))).toEqual(['alertas']);
  });
  it('un rol sin defaults ve un Inicio vacío, no uno roto', () => {
    expect(widgetsDeInicio(CAT, { rol: 'cliente' }, null)).toEqual([]);
  });
});

describe('ajustar', () => {
  it('ocultar y volver a mostrar (al final)', () => {
    const sin = alternar(CAT, DUENO, null, 'hoy');
    expect(sin.orden).toEqual(['caja', 'alertas']);
    expect(alternar(CAT, DUENO, sin, 'hoy').orden).toEqual(['caja', 'alertas', 'hoy']);
  });
  it('mover un lugar; en los bordes no pasa nada', () => {
    expect(mover(CAT, DUENO, null, 'hoy', -1).orden).toEqual(['hoy', 'caja', 'alertas']);
    expect(mover(CAT, DUENO, null, 'caja', -1).orden).toEqual(['caja', 'hoy', 'alertas']);
    expect(mover(CAT, DUENO, null, 'alertas', +1).orden).toEqual(['caja', 'hoy', 'alertas']);
  });
  it('el tamaño: solo uno que el widget admite', () => {
    const c = conTamano(CAT, DUENO, null, 'alertas', 'grande');
    expect(tamanoDe(CAT.widgets[1], c)).toBe('grande');
    expect(conTamano(CAT, DUENO, null, 'hoy', 'grande').tamanos).toBeUndefined();
  });
  it('como al principio: null, o sea los defaults del rol', () => {
    expect(deFabrica()).toBeNull();
  });
  it('el panel: los puestos primero, en su orden; después los que puede ver y no puso', () => {
    const p = panelDeAjuste(CAT, DUENO, { orden: ['alertas'] });
    expect(p.map((x) => [x.widget.id, x.visible])).toEqual([['alertas', true], ['hoy', false], ['caja', false], ['pendientes', false]]);
  });
});

describe('sanear lo guardado', () => {
  it('fuera ids que no existen, repetidos y tamaños que no se admiten', () => {
    expect(sanear(CAT, { orden: ['hoy', 'viejo', 'hoy', 'alertas'], tamanos: { hoy: 'grande', alertas: 'chico' } }))
      .toEqual({ orden: ['hoy', 'alertas'], tamanos: { alertas: 'chico' } });
  });
  it('lo que no se entiende vale null (los defaults), no una pantalla rota', () => {
    expect(sanear(CAT, 'basura')).toBeNull();
    expect(sanear(CAT, { orden: 'x' })).toBeNull();
  });
});

describe('llenar las filas', () => {
  it('dos medianos y un chico: el chico se estira hasta cerrar su fila', () => {
    expect(llenarFilas([3, 3, 2])).toEqual([3, 3, 6]);
  });
  it('cuando el siguiente no entra, el último de la fila se estira', () => {
    expect(llenarFilas([2, 3, 6])).toEqual([2, 4, 6]);
  });
  it('filas que ya cierran no se tocan', () => {
    expect(llenarFilas([2, 2, 2, 6])).toEqual([2, 2, 2, 6]);
    expect(llenarFilas([])).toEqual([]);
  });
});
