/**
 * Las secciones y las filas de Ajustes contra el guion v1.2 y docs/reglas-pr-3.md.
 * Son datos: se prueban sin dibujar nada.
 */
import { describe, expect, it } from 'vitest';
import { seccionesVisibles, resolverSeccion, COMUNES } from './secciones.js';
import { claveDelAutenticador, filasDeCuenta, filasDelAsistente, filasDeEquipo, HORA_DEL_RESUMEN, muestraHoraDelResumen } from './filas.js';

const DUENO = { manda: true, equipo: true, dueno: true };
const RECEPCION = { manda: false, equipo: true };
const CLIENTE = { manda: false, equipo: false };
const TODO = { asistente: { nivel: 4 }, integraciones: [{ id: 'cal', nombre: 'Calendario' }], avisos: { filas: [] } };
const ids = (xs) => xs.map((s) => s.id);

describe('el orden del guion v1.2', () => {
  it('quien manda, con todo: Tú · {App} · suelto', () => {
    expect(ids(seccionesVisibles(DUENO, TODO))).toEqual([
      'perfil', 'cuenta', 'apariencia', 'idioma', 'notificaciones', 'asistente', 'integraciones', 'privacidad',
      'datos', 'avisos',
      'plan', 'acerca',
    ]);
  });
  it('los grupos: Tú, {App}, y Plan y Acerca de sueltos', () => {
    const g = Object.fromEntries(seccionesVisibles(DUENO, TODO).map((s) => [s.id, s.grupo ?? 'suelto']));
    expect(g.perfil).toBe('tu');
    expect(g.privacidad).toBe('tu');
    expect(g.datos).toBe('app');
    expect(g.plan).toBe('suelto');
    expect(g.acerca).toBe('suelto');
  });
  it('Seguridad no es una sección y Equipo no está en Ajustes (reglas-pr-3 §1 y §2)', () => {
    const todas = ids(COMUNES);
    expect(todas).not.toContain('seguridad');
    expect(todas).not.toContain('equipo');
  });
  it('Acerca de va siempre al final', () => {
    for (const ctx of [DUENO, RECEPCION, CLIENTE]) expect(ids(seccionesVisibles(ctx, TODO)).at(-1)).toBe('acerca');
  });
});

describe('quién ve qué', () => {
  it('quien no manda no ve el grupo {App} ni Plan', () => {
    const r = ids(seccionesVisibles(RECEPCION, TODO));
    for (const id of ['datos', 'avisos', 'plan']) expect(r).not.toContain(id);
    expect(r).toContain('cuenta');
  });
  it('lo que la app no tiene no aparece: sin asistente, sin integraciones, sin avisos', () => {
    const r = ids(seccionesVisibles(DUENO, {}));
    for (const id of ['asistente', 'integraciones', 'avisos']) expect(r).not.toContain(id);
  });
  it('el rol sin asistente no ve la sección aunque la app lo tenga', () => {
    expect(ids(seccionesVisibles({ ...RECEPCION, asistente: false }, TODO))).not.toContain('asistente');
  });
  it('la app elige qué comunes usa', () => {
    expect(ids(seccionesVisibles(DUENO, { comunes: ['perfil', 'cuenta', 'acerca'] }))).toEqual(['perfil', 'cuenta', 'acerca']);
  });
});

describe('las secciones propias de la app', () => {
  const propias = [{ id: 'lugares', etiqueta: 'Lugares' }, { id: 'sala', etiqueta: 'Sala de espera', paraTodos: true }];
  it('van en el grupo {App}, entre Datos y Avisos, en el orden de la app', () => {
    expect(ids(seccionesVisibles(DUENO, { ...TODO, propias }))).toEqual([
      'perfil', 'cuenta', 'apariencia', 'idioma', 'notificaciones', 'asistente', 'integraciones', 'privacidad',
      'datos', 'lugares', 'sala', 'avisos', 'plan', 'acerca',
    ]);
  });
  it('sin Avisos, van antes de lo suelto', () => {
    expect(ids(seccionesVisibles(DUENO, { propias }))).toEqual(['perfil', 'cuenta', 'apariencia', 'idioma', 'notificaciones', 'privacidad', 'datos', 'lugares', 'sala', 'plan', 'acerca']);
  });
  it('quien no manda ve solo las paraTodos («lo que el equipo tiene que ver aunque no edite»)', () => {
    const r = seccionesVisibles(RECEPCION, { propias });
    expect(ids(r)).toContain('sala');
    expect(ids(r)).not.toContain('lugares');
    expect(r.find((s) => s.id === 'sala').grupo).toBe('app');
  });
});

describe('resolverSeccion', () => {
  const v = seccionesVisibles(DUENO, TODO);
  it('los ids viejos del molde aterrizan donde la cosa está ahora', () => {
    expect(resolverSeccion('seguridad', v)).toBe('cuenta');
    expect(resolverSeccion('sesiones', v)).toBe('cuenta');
    expect(resolverSeccion('facturacion', v)).toBe('plan');
  });
  it('los alias propios de la app se suman', () => {
    expect(resolverSeccion('precios', v, 'perfil', { precios: 'datos' })).toBe('datos');
  });
  it('equipo no tiene alias: Equipo vive en el menú', () => {
    expect(resolverSeccion('equipo', v)).toBe('perfil');
  });
  it('lo que no existe o no se puede ver cae en el defecto (la primera; en celular, la lista)', () => {
    expect(resolverSeccion('plan', seccionesVisibles(RECEPCION, TODO))).toBe('perfil');
    expect(resolverSeccion(undefined, v, null)).toBeNull();
  });
});

describe('las filas', () => {
  it('el autenticador: obligatorio para el equipo, opcional para el cliente, y si no está, inactivo (reglas-pr-3 §6)', () => {
    expect(claveDelAutenticador(RECEPCION, { activo: true })).toBe('settings.security.totp.d.obligatorio');
    expect(claveDelAutenticador(CLIENTE, { activo: true })).toBe('settings.security.totp.d.opcional');
    expect(claveDelAutenticador(CLIENTE, { activo: false })).toBe('settings.security.totp.d.inactivo');
  });
  it('Cuenta y seguridad: el correo primero, Actividad solo para quien manda (reglas-pr-3 §2 y §3)', () => {
    const v = { totp: { activo: true } };
    expect(filasDeCuenta(DUENO, v)).toEqual(['email', 'totp', 'totpSecond', 'backup', 'devices', 'signOutAll', 'activity']);
    expect(filasDeCuenta(RECEPCION, v)).not.toContain('activity');
  });
  it('sin autenticador no hay segundo ni respaldo; con reseteo pendiente aparece su fila', () => {
    expect(filasDeCuenta(CLIENTE, {})).toEqual(['email', 'totp', 'devices', 'signOutAll']);
    expect(filasDeCuenta(CLIENTE, { reseteoPendiente: { vence: 'x' } })).toContain('resetPending');
  });
  it('el asistente de noche: solo el dueño y solo en el nivel 4', () => {
    expect(filasDelAsistente(DUENO, { nivel: 4 })).toContain('night');
    expect(filasDelAsistente(DUENO, { nivel: 3 })).not.toContain('night');
    expect(filasDelAsistente({ ...DUENO, dueno: false }, { nivel: 4 })).not.toContain('night');
  });
  it('Equipo: resetear el autenticador se oculta con rescate solo (reglas-pr-3 §5)', () => {
    expect(filasDeEquipo(DUENO, { rescate: 'dueno' })).toContain('reset2fa');
    expect(filasDeEquipo(DUENO, { rescate: 'solo' })).not.toContain('reset2fa');
    expect(filasDeEquipo(DUENO, { rescate: 'solo' })).toEqual(['list', 'invite', 'role', 'suspend']);
    expect(filasDeEquipo(RECEPCION, {})).toEqual([]);
  });
});

describe('la hora del resumen (Dirección, PR 4)', () => {
  it('por defecto, las 8:00', () => expect(HORA_DEL_RESUMEN).toBe('08:00'));
  it('se pregunta solo si hay resumen', () => {
    expect(muestraHoraDelResumen('diario')).toBe(true);
    expect(muestraHoraDelResumen('semanal')).toBe(true);
    expect(muestraHoraDelResumen('no')).toBe(false);
  });
});
