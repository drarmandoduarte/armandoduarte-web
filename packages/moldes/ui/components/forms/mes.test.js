/**
 * La cuadrícula del mes. Los casos son los cuatro que rompen todo calendario:
 * el mes que arranca domingo (el peor con semana que empieza el lunes), el
 * febrero de 28 días justos, el cruce de año, y el mes que necesita seis
 * semanas para entrar.
 *
 * Corre con `TZ=America/Montevideo` por contrato del repo.
 */
import { describe, expect, it } from 'vitest';
import { diasDeMes, inicialesDeSemana, mismoDia, mismoMes, primeroDelMes, soloDia } from './mes.js';

const clave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('siempre seis filas', () => {
  it('todos los meses de un año entero dan 42 casillas', () => {
    for (let m = 0; m < 12; m += 1) {
      expect(diasDeMes(new Date(2026, m, 1))).toHaveLength(42);
    }
  });

  it('febrero de 28 días que arranca lunes también: el alto no cambia de mes a mes', () => {
    // Febrero de 2027 arranca lunes y tiene 28 días: entra justo en cuatro
    // semanas, y aun así se dibujan seis.
    const febrero = diasDeMes(new Date(2027, 1, 1));
    expect(febrero).toHaveLength(42);
    expect(clave(febrero[0])).toBe('2027-02-01');
  });
});

describe('la semana empieza el lunes', () => {
  it('la primera casilla es siempre un lunes', () => {
    for (let m = 0; m < 12; m += 1) {
      expect(diasDeMes(new Date(2026, m, 1))[0].getDay()).toBe(1);
    }
  });

  it('un mes que arranca domingo retrocede seis días, no avanza uno', () => {
    // El 1 de noviembre de 2026 es domingo: la grilla arranca el lunes 26 de
    // octubre. Es el caso que un `getDay()` sin corregir manda una semana entera
    // al lugar equivocado.
    const noviembre = diasDeMes(new Date(2026, 10, 1));
    expect(clave(noviembre[0])).toBe('2026-10-26');
    expect(clave(noviembre[6])).toBe('2026-11-01');
  });

  it('con el domingo como primer día, la primera casilla es domingo', () => {
    expect(diasDeMes(new Date(2026, 7, 1), 0)[0].getDay()).toBe(0);
  });
});

describe('los bordes del calendario', () => {
  it('enero trae los últimos días de diciembre del año anterior', () => {
    const enero = diasDeMes(new Date(2027, 0, 1));
    expect(enero[0].getFullYear()).toBe(2026);
    expect(enero[0].getMonth()).toBe(11);
  });

  it('diciembre trae los primeros de enero del año siguiente', () => {
    const diciembre = diasDeMes(new Date(2026, 11, 1));
    const ultimo = diciembre[41];
    expect(ultimo.getFullYear()).toBe(2027);
    expect(ultimo.getMonth()).toBe(0);
  });

  it('las casillas son días corridos, sin saltos ni repeticiones', () => {
    const dias = diasDeMes(new Date(2026, 9, 1));
    for (let i = 1; i < dias.length; i += 1) {
      const salto = (dias[i].getTime() - dias[i - 1].getTime()) / 3_600_000;
      // Entre 23 y 25 horas: el día que cambia la hora dura 23 o 25 y sigue
      // siendo el día siguiente.
      expect(salto).toBeGreaterThanOrEqual(23);
      expect(salto).toBeLessThanOrEqual(25);
    }
  });

  it('agosto de 2026 contiene sus 31 días y ni uno más', () => {
    const propios = diasDeMes(new Date(2026, 7, 1)).filter((d) => mismoMes(d, new Date(2026, 7, 1)));
    expect(propios).toHaveLength(31);
  });
});

describe('comparar días sin que la hora se meta', () => {
  it('el mismo día a distinta hora es el mismo día', () => {
    expect(mismoDia(new Date(2026, 7, 11, 0, 1), new Date(2026, 7, 11, 23, 59))).toBe(true);
  });

  it('un año distinto con el mismo día y mes no es el mismo día', () => {
    expect(mismoDia(new Date(2026, 7, 11), new Date(2025, 7, 11))).toBe(false);
  });

  it('soloDia deja la medianoche local, no la de UTC', () => {
    const d = soloDia(new Date(2026, 7, 11, 22, 30));
    expect(d.getHours()).toBe(0);
    expect(d.getDate()).toBe(11);
  });

  it('primeroDelMes va al 1, venga de donde venga', () => {
    expect(clave(primeroDelMes(new Date(2026, 7, 31)))).toBe('2026-08-01');
  });
});

describe('las iniciales de la semana', () => {
  it('son siete y arrancan por el lunes', () => {
    const es = inicialesDeSemana('es');
    expect(es).toHaveLength(7);
    expect(es[0]).toBe(new Intl.DateTimeFormat('es', { weekday: 'narrow' }).format(new Date(1970, 0, 5)));
  });

  it('cambian de idioma sin tocar i18n', () => {
    expect(inicialesDeSemana('en')).not.toEqual(inicialesDeSemana('fr'));
  });

  it('con el domingo primero, arrancan por el domingo', () => {
    const es = inicialesDeSemana('es', 0);
    expect(es[0]).toBe(new Intl.DateTimeFormat('es', { weekday: 'narrow' }).format(new Date(1970, 0, 4)));
  });
});
