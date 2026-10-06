import { describe, expect, it } from 'vitest';
import {
  INICIO_POR_ROL, alertasDeMiEspacio, contextoDeAjustes, contextoDeInicio, diasHasta, modulosDe, pasosDeBienvenida,
} from './molde';

/* Un martes de octubre, 10:00 en Mérida (16:00 UTC). */
const AHORA = new Date('2026-10-06T16:00:00Z');
const enDias = (n: number, hora = '15:00:00') => {
  const d = new Date(AHORA.getTime() + n * 86_400_000);
  return `${d.toISOString().slice(0, 10)}T${hora}Z`;
};
const mio = (o: Partial<{ referencia: string; inicio: string; fin: string; estado: string; motivo_rechazo: string | null }>) => ({
  referencia: 'AD-0001', curso_titulo: 'El arte de amar', curso_slug: 'el-arte', zona: 'America/Merida',
  inicio: enDias(20), fin: enDias(20, '20:00:00'), estado: 'confirmada', motivo_rechazo: null, ...o,
});
const abierto = (o: Partial<{ edicion_id: string; lugares: number | null; mi_referencia: string | null }> = {}) => ({
  edicion_id: 'e-1', curso_titulo: 'Matrimonios', curso_slug: 'matrimonios', inicio: enDias(30), zona: 'America/Merida',
  lugares: 20, mi_referencia: null, ...o,
});

describe('quién es, para el molde', () => {
  it('Ajustes: solo el dueño manda; el autenticador es obligatorio para el equipo y el dueño', () => {
    expect(contextoDeAjustes('dueno')).toEqual({ manda: true, equipo: true, dueno: true, asistente: false });
    expect(contextoDeAjustes('equipo')).toEqual({ manda: false, equipo: true, dueno: false, asistente: false });
    expect(contextoDeAjustes('cliente')).toEqual({ manda: false, equipo: false, dueno: false, asistente: false });
  });

  it('Inicio: lo del panel lo ve el equipo entero y nunca un cliente', () => {
    expect(contextoDeInicio('equipo').manda).toBe(true);
    expect(contextoDeInicio('dueno').manda).toBe(true);
    expect(contextoDeInicio('cliente').manda).toBe(false);
  });
});

describe('la barra', () => {
  it('EL CASO: el cliente ve Talleres y Mis talleres; el equipo, además el Panel; Equipo, solo el dueño', () => {
    expect(modulosDe('cliente')).toEqual({ modulos: ['talleres', 'misTalleres'], transversales: [], principal: 'talleres' });
    expect(modulosDe('equipo')).toEqual({ modulos: ['talleres', 'misTalleres', 'panel'], transversales: [], principal: 'talleres' });
    expect(modulosDe('dueno')).toEqual({ modulos: ['talleres', 'misTalleres', 'panel'], transversales: ['equipo'], principal: 'talleres' });
  });

  it('Inicio por rol: el cliente, su próximo taller, sus datos y ayuda; el equipo, el panel primero', () => {
    expect(INICIO_POR_ROL.cliente).toEqual(['proximo', 'datos', 'ayuda']);
    expect(INICIO_POR_ROL.equipo).toEqual(['panel', 'proximo']);
    expect(INICIO_POR_ROL.dueno).toEqual(['panel', 'proximo']);
  });
});

describe('los días hasta un taller', () => {
  it('se cuentan en la zona del taller, por día de calendario', () => {
    expect(diasHasta('2026-10-06T23:30:00Z', 'America/Merida', AHORA)).toBe(0);
    // 01:30 UTC del 7 son las 19:30 del 6 en Mérida: todavía es hoy allá.
    expect(diasHasta('2026-10-07T01:30:00Z', 'America/Merida', AHORA)).toBe(0);
    expect(diasHasta('2026-10-07T15:00:00Z', 'America/Merida', AHORA)).toBe(1);
  });
});

describe('las alertas, en sus cuatro tonos', () => {
  it('EL CASO DEL CLIENTE: rechazado → crítico; hoy → hoy; en 5 días → próximamente; abierto → oportunidad', () => {
    const a = alertasDeMiEspacio({
      rol: 'cliente',
      mios: [
        mio({ referencia: 'AD-1', estado: 'pendiente_de_pago', motivo_rechazo: 'El monto no coincide.' }),
        mio({ referencia: 'AD-2', inicio: enDias(0, '20:00:00'), fin: enDias(0, '23:00:00') }),
        mio({ referencia: 'AD-3', inicio: enDias(5), fin: enDias(5, '20:00:00') }),
      ],
      abiertos: [abierto()],
      ahora: AHORA,
    });
    expect(a.map((x) => [x.id, x.tono])).toEqual([
      ['rechazado-AD-1', 'critico'],
      ['hoy-AD-2', 'hoy'],
      ['pronto-AD-3', 'proximamente'],
      ['abierto-e-1', 'oportunidades'],
    ]);
    expect(a[0].detalle).toEqual({ texto: 'El monto no coincide.' });
    expect(a[2].titulo.variables).toEqual({ taller: 'El arte de amar', n: 5 });
  });

  it('lo que ya pasó, lo anulado y lo de más de 7 días no avisan', () => {
    const a = alertasDeMiEspacio({
      rol: 'cliente',
      mios: [
        mio({ referencia: 'A', inicio: enDias(-2), fin: enDias(-2, '20:00:00') }),
        mio({ referencia: 'B', estado: 'anulada', inicio: enDias(1), fin: enDias(1, '20:00:00') }),
        mio({ referencia: 'C', inicio: enDias(8), fin: enDias(8, '20:00:00') }),
      ],
      abiertos: [],
      ahora: AHORA,
    });
    expect(a).toEqual([]);
  });

  it('un taller abierto al que ya se anotó, o sin lugares, no es oportunidad', () => {
    const a = alertasDeMiEspacio({ rol: 'cliente', mios: [], abiertos: [abierto({ mi_referencia: 'AD-9' }), abierto({ edicion_id: 'e-2', lugares: 0 })], ahora: AHORA });
    expect(a).toEqual([]);
  });

  it('EL CASO DEL EQUIPO: su reseteo es crítico; los comprobantes por revisar y los talleres del panel, sin nombres de nadie', () => {
    const a = alertasDeMiEspacio({
      rol: 'equipo', mios: [], abiertos: [abierto()],
      reseteoPendiente: { vence: '2026-10-08T16:00:00Z' },
      enRevision: 3,
      ediciones: [
        { id: 'e-hoy', titulo: 'Mérida', inicio: enDias(0, '20:00:00'), fin: enDias(0, '23:00:00'), zona: 'America/Merida', estado: 'abierta' },
        { id: 'e-3', titulo: 'CDMX', inicio: enDias(3), fin: enDias(3, '20:00:00'), zona: 'America/Mexico_City', estado: 'abierta' },
        { id: 'e-cerrada', titulo: 'Cerrada', inicio: enDias(2), fin: enDias(2, '20:00:00'), zona: 'America/Merida', estado: 'cerrada' },
      ],
      ahora: AHORA,
    });
    expect(a.map((x) => [x.id, x.tono])).toEqual([
      ['reseteo', 'critico'],
      ['equipo-hoy-e-hoy', 'hoy'],
      ['equipo-pronto-e-3', 'proximamente'],
      ['en-revision', 'proximamente'],
    ]);
    expect(a.find((x) => x.id === 'en-revision')?.titulo.variables).toEqual({ n: 3 });
    // El equipo no recibe «oportunidades» de anotarse.
    expect(a.some((x) => x.tono === 'oportunidades')).toBe(false);
  });

  it('LA MUTACIÓN: sin comprobantes por revisar (0 o sin leer) no hay alerta de revisión', () => {
    expect(alertasDeMiEspacio({ rol: 'dueno', mios: [], abiertos: [], enRevision: 0, ahora: AHORA })).toEqual([]);
    expect(alertasDeMiEspacio({ rol: 'dueno', mios: [], abiertos: [], enRevision: null, ahora: AHORA })).toEqual([]);
  });

  it('cada alerta lleva su clave de idioma de la familia `mi.alertas.*`', () => {
    const a = alertasDeMiEspacio({ rol: 'cliente', mios: [mio({ estado: 'pendiente_de_pago', motivo_rechazo: 'x' })], abiertos: [abierto()], reseteoPendiente: { vence: 'x' }, ahora: AHORA });
    expect(a.length).toBeGreaterThan(0);
    for (const x of a) {
      expect(x.titulo.clave).toMatch(/^mi\.alertas\./);
      if (x.accion) expect(x.accion.clave).toMatch(/^mi\.alertas\./);
    }
  });
});

describe('la Bienvenida', () => {
  it('EL CASO: dos pasos para el cliente; tres para el equipo sin autenticador; dos si ya lo tiene', () => {
    expect(pasosDeBienvenida('cliente', false)).toEqual(['datos', 'lugar']);
    expect(pasosDeBienvenida('equipo', false)).toEqual(['datos', 'lugar', 'autenticador']);
    expect(pasosDeBienvenida('dueno', true)).toEqual(['datos', 'lugar']);
  });

  it('nunca más de tres (el molde lo exige)', () => {
    for (const rol of ['cliente', 'equipo', 'dueno'] as const) {
      for (const activo of [true, false]) expect(pasosDeBienvenida(rol, activo).length).toBeLessThanOrEqual(3);
    }
  });
});
