import { describe, expect, it } from 'vitest';
import { claveDelRol, formasDeEntrar, inicialesDe, nombreDelBloque, seccionesDeAjustes } from './ajustes';

describe('nombreDelBloque (A.3)', () => {
  it('nombre y apellido; si no hay, el correo', () => {
    expect(nombreDelBloque({ nombre: 'Laura', apellido: 'Pérez' }, 'l@x.mx')).toBe('Laura Pérez');
    expect(nombreDelBloque({ nombre: null, apellido: null }, 'l@x.mx')).toBe('l@x.mx');
  });
});

describe('claveDelRol (A.3)', () => {
  it('los cuatro de la orden', () => {
    expect(claveDelRol('cliente', null)).toBe('mi.rol.cliente');
    expect(claveDelRol('equipo', 'mexico')).toBe('mi.rol.equipoMexico');
    expect(claveDelRol('equipo', 'internacional')).toBe('mi.rol.equipoInternacional');
    expect(claveDelRol('dueno', 'todos')).toBe('mi.rol.dueno');
  });
  it('equipo sin territorio conocido: «Equipo» a secas, sin inventarlo', () => {
    expect(claveDelRol('equipo', 'todos')).toBe('mi.rol.equipo');
    expect(claveDelRol('equipo', null)).toBe('mi.rol.equipo');
  });
});
