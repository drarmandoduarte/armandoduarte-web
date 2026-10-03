import { describe, expect, it } from 'vitest';
import { claveDelRol, formasDeEntrar, inicialesDe, nombreDelBloque, seccionesDeAjustes } from './ajustes';

describe('inicialesDe (A.3)', () => {
  it('EL CASO: nombre + apellido', () => {
    expect(inicialesDe({ nombre: 'Laura', apellido: 'Pérez' }, 'laura@ejemplo.mx')).toBe('LP');
  });
  it('acentos y ñ, en mayúscula', () => {
    expect(inicialesDe({ nombre: 'ángela', apellido: 'ñúñez' }, null)).toBe('ÁÑ');
  });
  it('con uno solo, esa letra', () => {
    expect(inicialesDe({ nombre: 'Laura', apellido: null }, 'x@y.mx')).toBe('L');
  });
  it('sin nombre ni apellido, la primera del correo; sin nada, «?»', () => {
    expect(inicialesDe({ nombre: '  ', apellido: null }, 'gaby@ejemplo.mx')).toBe('G');
    expect(inicialesDe(null, null)).toBe('?');
  });
});

describe('nombreDelBloque (A.3)', () => {
  it('nombre y apellido; si no hay, el correo', () => {
    expect(nombreDelBloque({ nombre: 'Laura', apellido: 'Pérez' }, 'l@x.mx')).toBe('Laura Pérez');
    expect(nombreDelBloque({ nombre: null, apellido: null }, 'l@x.mx')).toBe('l@x.mx');
  });
});

describe('claveDelRol (A.3)', () => {
  it('los cuatro de la orden', () => {
    expect(claveDelRol('cliente', null)).toBe('marco.rol.cliente');
    expect(claveDelRol('equipo', 'mexico')).toBe('marco.rol.equipoMexico');
    expect(claveDelRol('equipo', 'internacional')).toBe('marco.rol.equipoInternacional');
    expect(claveDelRol('dueno', 'todos')).toBe('marco.rol.dueno');
  });
  it('equipo sin territorio conocido: «Equipo» a secas, sin inventarlo', () => {
    expect(claveDelRol('equipo', 'todos')).toBe('marco.rol.equipo');
    expect(claveDelRol('equipo', null)).toBe('marco.rol.equipo');
  });
});

describe('formasDeEntrar (B.2)', () => {
  it('Google, el código, o las dos', () => {
    expect(formasDeEntrar(['google'])).toEqual(['google']);
    expect(formasDeEntrar(['email'])).toEqual(['codigo']);
    expect(formasDeEntrar(['email', 'google'])).toEqual(['google', 'codigo']);
  });
  it('sin datos, el código: toda cuenta lo tiene', () => {
    expect(formasDeEntrar(undefined)).toEqual(['codigo']);
    expect(formasDeEntrar([])).toEqual(['codigo']);
  });
});

describe('seccionesDeAjustes (B)', () => {
  it('EL CASO: el cliente no ve Seguridad; el equipo, las seis en orden', () => {
    expect(seccionesDeAjustes(false)).toEqual(['perfil', 'cuenta', 'notificaciones', 'sesiones', 'privacidad']);
    expect(seccionesDeAjustes(true)).toEqual(['perfil', 'cuenta', 'notificaciones', 'seguridad', 'sesiones', 'privacidad']);
  });
});
