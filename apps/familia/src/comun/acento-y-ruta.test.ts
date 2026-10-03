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

  it('el saludo de Inicio lleva exactamente una palabra marcada (los del acceso usan *asteriscos*, #35)', () => {
    /* Si alguien edita un título y se come un corchete, la palabra pierde el
       teal sin que nada lo diga. Esto lo dice. */
    const f = RECURSOS_I18N.es.familia;
    for (const titulo of [f.miEspacio.saludo]) {
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

  it('sin sesión, a /login (#35) — también desde /mi-espacio', () => {
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/mi-espacio' })).toBe('/login');
  });

  it('#24 A: el equipo se queda en /equipo; un cliente que escribe /equipo va a /mi-espacio', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/equipo', esEquipo: true })).toBeNull();
    expect(rutaQueCorresponde({ ...base, rutaActual: '/equipo', esEquipo: false })).toBe('/mi-espacio');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/equipo' })).toBe('/mi-espacio');
    /* Y sin sesión, /equipo manda a la entrada como cualquier otra. */
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/equipo' })).toBe('/login');
  });

  it('#24 B: sin sesión en /me-anoto/<slug>, a /login con ?ir= para no perder el taller', () => {
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/me-anoto/el-arte' }))
      .toBe('/login?ir=%2Fme-anoto%2Fel-arte');
    /* Ya en /login o en /login/codigo (con o sin ?ir=), no se toca: el ?ir= se queda en la barra. */
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/login' })).toBeNull();
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/login/codigo' })).toBeNull();
  });

  it('#35 · EL CASO: /entrar de antes va a /login, con su ?ir=', () => {
    const sinSesion = { ...base, haySesion: false, hayYo: false, decision: null };
    expect(rutaQueCorresponde({ ...sinSesion, rutaActual: '/entrar', busqueda: '?ir=%2Fme-anoto%2Fel-arte' })).toBe('/login?ir=%2Fme-anoto%2Fel-arte');
    expect(rutaQueCorresponde({ ...sinSesion, rutaActual: '/entrar' })).toBe('/login');
    /* Y sin sesión, ninguna pantalla del segundo paso: a /login. */
    expect(rutaQueCorresponde({ ...sinSesion, rutaActual: '/auth/2fa' })).toBe('/login');
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

  it('#24 B: el destino guardado espera al segundo paso: en el reto se queda en P3, no se va al taller', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/auth/2fa', decision: 'reto', destinoGuardado: '/me-anoto/el-arte' })).toBeNull();
    expect(rutaQueCorresponde({ ...base, decision: 'reto', destinoGuardado: '/me-anoto/el-arte' })).toBe('/auth/2fa');
  });

  it('#29: /talleres y /mis-talleres son lugares; una ruta inventada va a Inicio', () => {
    for (const lugar of ['/talleres', '/mis-talleres', '/mi-espacio']) {
      expect(rutaQueCorresponde({ ...base, rutaActual: lugar }), lugar).toBeNull();
    }
    expect(rutaQueCorresponde({ ...base, rutaActual: '/preferencias' })).toBe('/mi-espacio');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/ajustes/apariencia' })).toBe('/mi-espacio');
    /* Sin sesión, cualquiera de ellas manda a la entrada. */
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/mis-datos' })).toBe('/login');
  });

  it('#34: las secciones de /ajustes son lugares; /ajustes a secas y /mis-datos van a Perfil', () => {
    for (const lugar of ['/ajustes/perfil', '/ajustes/cuenta', '/ajustes/notificaciones', '/ajustes/sesiones', '/ajustes/privacidad']) {
      expect(rutaQueCorresponde({ ...base, rutaActual: lugar }), lugar).toBeNull();
    }
    expect(rutaQueCorresponde({ ...base, rutaActual: '/ajustes' })).toBe('/ajustes/perfil');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/mis-datos' })).toBe('/ajustes/perfil');
    expect(rutaQueCorresponde({ ...base, haySesion: false, hayYo: false, decision: null, rutaActual: '/ajustes/perfil' })).toBe('/login');
  });

  it('#34 · EL CASO: /ajustes/seguridad es del equipo; un cliente va a Inicio', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/ajustes/seguridad', esEquipo: true })).toBeNull();
    expect(rutaQueCorresponde({ ...base, rutaActual: '/ajustes/seguridad', esEquipo: false })).toBe('/mi-espacio');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/ajustes/seguridad' })).toBe('/mi-espacio');
  });

  it('#29 C · EL CASO: sin nombre, apellido o WhatsApp, primero /empezar — desde cualquier ruta, también el equipo', () => {
    for (const desde of ['/entrar', '/', '/mi-espacio', '/talleres', '/ajustes/perfil', '/me-anoto/el-arte']) {
      expect(rutaQueCorresponde({ ...base, rutaActual: desde, faltanDatos: true }), desde).toBe('/empezar');
    }
    expect(rutaQueCorresponde({ ...base, rutaActual: '/equipo', esEquipo: true, faltanDatos: true })).toBe('/empezar');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/empezar', faltanDatos: true })).toBeNull();
  });

  it('#29 C: el ?ir= sobrevive a /empezar — primero los datos, después el taller', () => {
    expect(rutaQueCorresponde({ ...base, destinoGuardado: '/me-anoto/el-arte', faltanDatos: true })).toBe('/empezar');
    /* Ya completos, desde /empezar se va al destino guardado. */
    expect(rutaQueCorresponde({ ...base, rutaActual: '/empezar', destinoGuardado: '/me-anoto/el-arte', faltanDatos: false }))
      .toBe('/me-anoto/el-arte');
  });

  it('#29 C: con los datos completos, /empezar nunca — escrita a mano, va a Inicio', () => {
    expect(rutaQueCorresponde({ ...base, rutaActual: '/empezar', faltanDatos: false })).toBe('/mi-espacio');
    expect(rutaQueCorresponde({ ...base, rutaActual: '/mi-espacio', faltanDatos: false })).toBeNull();
  });

  it('#29 C: en los estados intermedios tampoco se manda a /empezar', () => {
    expect(rutaQueCorresponde({ ...base, decision: 'reto', faltanDatos: true })).toBe('/auth/2fa');
    expect(rutaQueCorresponde({ ...base, hayYo: false, decision: 'esperando', faltanDatos: true })).toBeNull();
  });

  it('cargando, esperando, el error y el cierre no mueven la URL', () => {
    expect(rutaQueCorresponde({ ...base, cargando: true })).toBeNull();
    expect(rutaQueCorresponde({ ...base, hayYo: false, decision: 'esperando' })).toBeNull();
    for (const decision of ['error', 'cerrar-sesion'] as const) {
      expect(rutaQueCorresponde({ ...base, decision }), decision).toBeNull();
    }
  });

  it('#35 · las pantallas del segundo paso tienen la dirección del guion, y la URL sigue a la decisión', () => {
    /* reto → P3; P6 y P6b son suyas; cualquier otra, a P3. */
    expect(rutaQueCorresponde({ ...base, decision: 'reto', rutaActual: '/mi-espacio' })).toBe('/auth/2fa');
    for (const suya of ['/auth/2fa', '/auth/2fa/recuperar', '/auth/2fa/reseteo']) {
      expect(rutaQueCorresponde({ ...base, decision: 'reto', rutaActual: suya }), suya).toBeNull();
    }
    expect(rutaQueCorresponde({ ...base, decision: 'reto', rutaActual: '/auth/2fa/activar' })).toBe('/auth/2fa');
    /* Sin rol todavía (403 AAL2_REQUIRED), igual va a P3. */
    expect(rutaQueCorresponde({ ...base, hayYo: false, decision: 'reto', rutaActual: '/login' })).toBe('/auth/2fa');
    /* enrolar → P4, desde donde sea, también desde P3 escrita a mano. */
    expect(rutaQueCorresponde({ ...base, decision: 'enrolar', rutaActual: '/auth/2fa' })).toBe('/auth/2fa/activar');
    expect(rutaQueCorresponde({ ...base, decision: 'enrolar', rutaActual: '/auth/2fa/activar' })).toBeNull();
    /* Los códigos en pantalla → P5, antes que nada. */
    expect(rutaQueCorresponde({ ...base, mostrandoCodigos: true, rutaActual: '/auth/2fa/activar' })).toBe('/auth/2fa/respaldo');
    expect(rutaQueCorresponde({ ...base, mostrandoCodigos: true, rutaActual: '/auth/2fa/respaldo' })).toBeNull();
  });

  it('#35 · EL CASO: con la sesión en `pasar`, escribir una pantalla de acceso a mano no muestra nada: a Inicio', () => {
    for (const a of ['/login', '/login/codigo', '/auth/2fa', '/auth/2fa/activar', '/auth/2fa/respaldo', '/auth/2fa/recuperar', '/auth/2fa/reseteo']) {
      expect(rutaQueCorresponde({ ...base, rutaActual: a }), a).toBe('/mi-espacio');
    }
    /* Y el ?ir= guardado desde /login no puede ser /login. */
    expect(rutaQueCorresponde({ ...base, rutaActual: '/', destinoGuardado: '/login' })).toBe('/mi-espacio');
  });
});
