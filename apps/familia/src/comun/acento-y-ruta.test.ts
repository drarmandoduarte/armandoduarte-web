/**
 * Las dos funciones puras de la #18: la palabra en teal de cada título (B.2, C)
 * y la URL que corresponde después de entrar (F).
 */
import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '@codice/core';
import { partirAcento } from './acento';
import { rutaQueCorresponde } from './ruta-que-corresponde';

describe('partirAcento', () => {
  it('parte el título de /entrar en tres, con «espacio» como la palabra', () => {
    expect(partirAcento('Entra a tu [espacio].')).toEqual({ antes: 'Entra a tu ', palabra: 'espacio', despues: '.' });
  });

  it('sin corchetes, el título queda entero y sin acento', () => {
    expect(partirAcento('Hola')).toEqual({ antes: 'Hola', palabra: null, despues: '' });
  });

  it('una sola palabra por título: el segundo par queda como texto', () => {
    expect(partirAcento('Uno [dos] y [tres]')).toEqual({ antes: 'Uno ', palabra: 'dos', despues: ' y [tres]' });
  });

  it('corchetes vacíos o sin cerrar no inventan un acento', () => {
    expect(partirAcento('Hola, []').palabra).toBeNull();
    expect(partirAcento('Hola, [Ana').palabra).toBeNull();
  });

  it('los cinco títulos de familia.json llevan exactamente una palabra marcada', () => {
    /* Si alguien edita un título y se come un corchete, la palabra pierde el
       teal sin que nada lo diga. Esto lo dice. */
    const f = RECURSOS_I18N.es.familia;
    for (const titulo of [f.entrar.titulo, f.enrolar.titulo, f.reto.titulo, f.respaldo.titulo, f.miEspacio.saludo]) {
      expect(partirAcento(titulo).palabra, titulo).not.toBeNull();
      expect(titulo.split('[').length - 1, titulo).toBe(1);
    }
  });
});

describe('rutaQueCorresponde', () => {
  const base = { cargando: false, haySesion: true, hayYo: true, decision: 'pasar' as const, rutaActual: '/entrar' };

  it('EL CASO: con sesión, rol y `pasar`, desde /entrar se va a /mi-espacio', () => {
    expect(rutaQueCorresponde(base)).toBe('/mi-espacio');
  });

  it('ya en /mi-espacio, no se navega', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/mi-espacio' })).toBeNull();
  });

  it('también desde / (la vuelta de Google cae en la raíz)', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/' })).toBe('/mi-espacio');
  });

  it('sin sesión, a /entrar — también desde /mi-espacio', () => {
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/mi-espacio' })).toBe('/entrar');
  });

  it('#24 A: el equipo se queda en /equipo; un cliente que escribe /equipo va a /mi-espacio', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/equipo', esEquipo: true })).toBeNull();
    expect(rutaQueCorresponde({ ...base, rutaActual: '/equipo', esEquipo: false })).toBe('/mi-espacio');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/equipo' })).toBe('/mi-espacio');
    /* Y sin sesión, /equipo manda a la entrada como cualquier otra. */
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/equipo' })).toBe('/entrar');
  });

  it('#24 B: sin sesión en /me-anoto/<slug>, a /entrar con ?ir= para no perder el taller', () => {
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/me-anoto/el-arte' }))
      .toBe('/entrar?ir=%2Fme-anoto%2Fel-arte');
    /* Ya en /entrar (con o sin ?ir=), no se toca: el ?ir= se queda en la barra. */
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/entrar' })).toBeNull();
  });

  it('#24 B: después de entrar, al destino guardado y no a /mi-espacio — también desde / (Google)', () => {
    expect(rutaQueCorresponde({ ...base, destinoGuardado: '/me-anoto/el-arte' })).toBe('/me-anoto/el-arte');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/', destinoGuardado: '/me-anoto/el-arte' })).toBe('/me-anoto/el-arte');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/me-anoto/el-arte', destinoGuardado: '/me-anoto/el-arte' })).toBeNull();
  });

  it('#24 B · LA MUTACIÓN DE LA ORDEN: ?ir=https://otro.sitio (y sus disfraces) → Mi espacio', () => {
    for (const malo of ['https://otro.sitio', '//otro.sitio', '/\\otro.sitio', 'javascript:alert(1)', '/entrar']) {
      expect(rutaQueCorresponde({ ...base, destinoGuardado: malo }), malo).toBe('/mi-espacio');
    }
  });

  it('#24 B: con sesión, /me-anoto/<slug> es un lugar; un slug sin forma no lo es', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/me-anoto/el-arte' })).toBeNull();
    expect(rutaQueCorresponde({ ...base, rutaActual: '/me-anoto/El Arte' })).toBe('/mi-espacio');
  });

  it('#24 B: el destino guardado espera al segundo paso: en el reto no se navega', () => {
    expect(rutaQueCorresponde({ ...base, decision: 'reto', destinoGuardado: '/me-anoto/el-arte' })).toBeNull();
  });

  it('los estados intermedios no mueven la URL', () => {
    expect(rutaQueCorresponde({ ...base, cargando: true })).toBeNull();
    expect(rutaQueCorresponde({ ...base, hayYo: false, decision: 'esperando' })).toBeNull();
    for (const decision of ['reto', 'enrolar', 'error', 'cerrar-sesion'] as const) {
      expect(rutaQueCorresponde({ ...base, decision }), decision).toBeNull();
    }
  });
});
