import { describe, expect, it } from 'vitest';
import {
  HORAS_DE_ESPERA_DEL_RESCATE, enlaceDelRescate, estadoDelRescate, leerEnlaceDelRescate, reseteoPendiente, venceDelRescate,
  type FilaDeRescate,
} from './rescate';

const PEDIDO = new Date('2026-10-06T10:00:00.000Z');
const VENCE = '2026-10-08T10:00:00.000Z';
const ANTES = new Date('2026-10-08T09:59:59.000Z');
const DESPUES = new Date('2026-10-08T10:00:00.000Z');
const fila = (cambios: Partial<FilaDeRescate> = {}): FilaDeRescate => ({
  vence_el: VENCE, confirmado_el: null, cancelado_el: null, usado_el: null, ...cambios,
});
const ID = '6f1f2d64-6f1a-4a3e-9f6b-2b0f9a1c4d21';
const TOKEN = 'A'.repeat(43);

describe('las 48 horas', () => {
  it('son 48, y vence exactamente 48 horas después del pedido', () => {
    expect(HORAS_DE_ESPERA_DEL_RESCATE).toBe(48);
    expect(venceDelRescate(PEDIDO).toISOString()).toBe(VENCE);
  });
});

describe('estadoDelRescate', () => {
  it('sin confirmar, antes de vencer', () => expect(estadoDelRescate(fila(), ANTES)).toBe('sin-confirmar'));
  it('sin confirmar y vencido: caducado (no vale)', () => expect(estadoDelRescate(fila(), DESPUES)).toBe('caducado'));
  it('confirmado, antes de vencer: en espera', () =>
    expect(estadoDelRescate(fila({ confirmado_el: PEDIDO.toISOString() }), ANTES)).toBe('en-espera'));
  it('confirmado y vencido, al segundo exacto: listo', () =>
    expect(estadoDelRescate(fila({ confirmado_el: PEDIDO.toISOString() }), DESPUES)).toBe('listo'));
  it('cancelado o usado: cerrado, aunque esté confirmado y vencido', () => {
    expect(estadoDelRescate(fila({ confirmado_el: VENCE, cancelado_el: VENCE }), DESPUES)).toBe('cerrado');
    expect(estadoDelRescate(fila({ confirmado_el: VENCE, usado_el: VENCE }), DESPUES)).toBe('cerrado');
  });
});

describe('reseteoPendiente', () => {
  it('sin fila, nada', () => expect(reseteoPendiente(null, ANTES)).toBeNull());
  it('pedido o en espera o listo: pendiente, con su vencimiento', () => {
    expect(reseteoPendiente(fila(), ANTES)).toEqual({ vence: VENCE, confirmado: false });
    expect(reseteoPendiente(fila({ confirmado_el: VENCE }), DESPUES)).toEqual({ vence: VENCE, confirmado: true });
  });
  it('caducado o cerrado: no es pendiente', () => {
    expect(reseteoPendiente(fila(), DESPUES)).toBeNull();
    expect(reseteoPendiente(fila({ cancelado_el: VENCE }), ANTES)).toBeNull();
  });
});

describe('los enlaces del correo', () => {
  it('ida y vuelta: lo que arma enlaceDelRescate lo lee leerEnlaceDelRescate', () => {
    const enlace = enlaceDelRescate('https://familia.armandoduarte.com/', ID, TOKEN, 'cancelar');
    expect(enlace.startsWith('https://familia.armandoduarte.com/rescate?')).toBe(true);
    expect(leerEnlaceDelRescate(new URL(enlace).search)).toEqual({ id: ID, token: TOKEN, accion: 'cancelar' });
  });
  it('un enlace roto, incompleto o con otra acción no es un enlace del rescate', () => {
    expect(leerEnlaceDelRescate('')).toBeNull();
    expect(leerEnlaceDelRescate(`?r=${ID}&t=${TOKEN}`)).toBeNull();
    expect(leerEnlaceDelRescate(`?r=${ID}&t=${TOKEN}&a=borrar`)).toBeNull();
    expect(leerEnlaceDelRescate(`?r=no-es-un-id&t=${TOKEN}&a=confirmar`)).toBeNull();
    expect(leerEnlaceDelRescate(`?r=${ID}&t=corto&a=confirmar`)).toBeNull();
  });
});
