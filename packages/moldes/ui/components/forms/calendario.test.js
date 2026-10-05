/**
 * La cuenta del calendario propio.
 *
 * Corre con `TZ=America/Montevideo`, que es el huso fijo del gate desde la orden
 * su regla, y **aquí eso no es una formalidad**: los dos primeros casos de este
 * archivo no se reproducen en UTC. Un calendario probado en UTC da tranquilidad
 * falsa, que es peor que no tenerlo.
 *
 * Por eso el huso se fija acá, antes de cualquier `Date`, y no se le pide a la
 * máquina: en CI (Vercel, GitHub Actions) la máquina está en UTC. El `pnpm test`
 * del molde corre todo también con `TZ=UTC` para que esto no se olvide.
 */
process.env.TZ = 'America/Montevideo';
import { describe, expect, it } from 'vitest';
import {
  anclaDelMes, casillasDeMes, correrMes, diaDeIso, esElegible,
  hayMesAnterior, hayMesSiguiente, isoDeDia, mesQueAbre,
} from './calendario.js';

describe('el borde: ISO afuera, `Date` adentro, y una sola conversión', () => {
  it('el ISO sale del día LOCAL, no del de UTC', () => {
    // A las 21:00 de Montevideo, en UTC ya es mañana: `toISOString()` sobre este
    // mismo día devuelve `2026-08-20`. Un calendario que hace eso guarda el día
    // siguiente al que se apretó, y de noche.
    const tarde = new Date(2026, 7, 19, 21, 0);
    expect(tarde.toISOString().slice(0, 10)).toBe('2026-08-20'); // el bug, escrito
    expect(isoDeDia(tarde)).toBe('2026-08-19'); // la cura
  });

  it('el ISO se lee con el constructor de componentes, no con `new Date(string)`', () => {
    // Esto es lo que D8 prohíbe: `new Date('2026-08-01')` es medianoche UTC, y
    // en Montevideo eso es el 31 de julio.
    expect(new Date('2026-08-01').getDate()).toBe(31); // el bug, escrito
    const dia = diaDeIso('2026-08-01');
    expect(dia.getDate()).toBe(1); // la cura
    expect(dia.getMonth()).toBe(7);
    expect(dia.getFullYear()).toBe(2026);
  });

  it('ida y vuelta sin perder el día, incluido el 29 de febrero', () => {
    for (const iso of ['2026-01-01', '2026-08-19', '2026-12-31', '2028-02-29']) {
      expect(isoDeDia(diaDeIso(iso))).toBe(iso);
    }
  });

  it('media fecha no es un día', () => {
    // El campo puede tener «10/0» escrito mientras alguien teclea.
    expect(diaDeIso('')).toBeNull();
    expect(diaDeIso('2026-08')).toBeNull();
    expect(diaDeIso(undefined)).toBeNull();
  });
});

describe('qué día se puede elegir', () => {
  it('`min` y `max` son inclusivos los dos', () => {
    expect(esElegible('2026-08-10', '2026-08-10', '2026-08-20')).toBe(true);
    expect(esElegible('2026-08-20', '2026-08-10', '2026-08-20')).toBe(true);
    expect(esElegible('2026-08-09', '2026-08-10', '2026-08-20')).toBe(false);
    expect(esElegible('2026-08-21', '2026-08-10', '2026-08-20')).toBe(false);
  });

  it('sin tope, todo entra', () => {
    expect(esElegible('1998-03-04')).toBe(true);
    expect(esElegible('2098-03-04', undefined, undefined)).toBe(true);
  });

  it('un tope solo alcanza con la mitad que hay', () => {
    // La fecha de nacimiento de una persona tiene `max` (hoy) y no tiene `min`.
    expect(esElegible('2020-01-01', undefined, '2026-08-19')).toBe(true);
    expect(esElegible('2030-01-01', undefined, '2026-08-19')).toBe(false);
  });

  it('la nada no es un día elegible', () => {
    expect(esElegible('')).toBe(false);
  });
});

describe('navegar de mes', () => {
  it('corre desde cualquier día y cae siempre en el 1', () => {
    expect(correrMes('2026-08-19', 1)).toBe('2026-09-01');
    expect(correrMes('2026-08-19', -1)).toBe('2026-07-01');
  });

  it('cruza el fin de año sola, en las dos direcciones', () => {
    expect(correrMes('2026-12-15', 1)).toBe('2027-01-01');
    expect(correrMes('2027-01-15', -1)).toBe('2026-12-01');
  });

  it('el ancla es el día 1 del mes de esa fecha', () => {
    expect(anclaDelMes('2026-08-19')).toBe('2026-08-01');
    expect(anclaDelMes('2026-08-01')).toBe('2026-08-01');
    expect(anclaDelMes('')).toBe('');
  });
});

describe('qué mes abre — la decisión de «qué pasa si falta el dato»', () => {
  const HOY = '2026-08-19';

  it('con fecha elegida, la suya', () => {
    expect(mesQueAbre('2019-03-04', HOY)).toBe('2019-03-01');
  });

  it('con fecha elegida FUERA del rango, la suya igual', () => {
    // Lo que ya está guardado se muestra: abrir en otro mes haría creer que el
    // campo está vacío.
    expect(mesQueAbre('2019-03-04', HOY, '2026-01-01', '2026-12-31')).toBe('2019-03-01');
  });

  it('sin nada elegido, el mes de hoy', () => {
    expect(mesQueAbre('', HOY)).toBe('2026-08-01');
  });

  it('sin nada elegido y con hoy ANTES del mínimo, el mes del mínimo', () => {
    // Abrir en agosto con todo apagado deja una rejilla muerta, y quien la ve
    // piensa que el campo está roto en vez de buscar la flecha.
    expect(mesQueAbre('', HOY, '2026-11-02')).toBe('2026-11-01');
  });

  it('sin nada elegido y con hoy DESPUÉS del máximo, el mes del máximo', () => {
    expect(mesQueAbre('', HOY, undefined, '2026-03-15')).toBe('2026-03-01');
  });

  it('con hoy dentro del rango, el mes de hoy y no el del borde', () => {
    expect(mesQueAbre('', HOY, '2026-01-01', '2026-12-31')).toBe('2026-08-01');
  });
});

describe('cuándo se apaga una flecha', () => {
  it('sin topes, las dos siempre vivas', () => {
    expect(hayMesAnterior('2026-08-01')).toBe(true);
    expect(hayMesSiguiente('2026-08-01')).toBe(true);
  });

  it('hacia atrás se mira contra el día 1 del mes visible, no contra `min` a secas', () => {
    // Con `min` el 14 de agosto, agosto todavía tiene días elegibles pero julio
    // no tiene ninguno: la flecha no debe llevar a un mes muerto.
    expect(hayMesAnterior('2026-08-01', '2026-08-14')).toBe(false);
    expect(hayMesAnterior('2026-08-01', '2026-08-01')).toBe(false);
    expect(hayMesAnterior('2026-08-01', '2026-07-31')).toBe(true);
  });

  it('hacia adelante se mira contra el final del mes visible', () => {
    expect(hayMesSiguiente('2026-08-01', '2026-08-31')).toBe(false);
    expect(hayMesSiguiente('2026-08-01', '2026-09-01')).toBe(true);
  });
});

describe('las 42 casillas', () => {
  const AGOSTO = casillasDeMes('2026-08-01', {
    hoy: '2026-08-19', valor: '2026-08-19', min: '2026-08-10', max: '2026-08-20',
  });

  it('siempre son 42, para que el panel no cambie de alto al pasar de mes', () => {
    expect(AGOSTO).toHaveLength(42);
    // Febrero de 2027 empieza lunes y tiene 28 días justos: cinco semanas
    // clavadas. Es el mes que delataría una rejilla que se achica.
    expect(casillasDeMes('2027-02-01')).toHaveLength(42);
  });

  it('la semana abre en lunes, y el relleno es del mes vecino', () => {
    // El 1 de agosto de 2026 cae sábado, así que la rejilla arranca el lunes 27
    // de julio y termina el domingo 6 de septiembre.
    expect(AGOSTO[0].iso).toBe('2026-07-27');
    expect(AGOSTO[0].delMes).toBe(false);
    expect(AGOSTO[5].iso).toBe('2026-08-01');
    expect(AGOSTO[5].delMes).toBe(true);
    expect(AGOSTO[41].iso).toBe('2026-09-06');
    expect(AGOSTO[41].delMes).toBe(false);
  });

  it('el número que se escribe es el del día, no el índice', () => {
    expect(AGOSTO[0].dia).toBe(27);
    expect(AGOSTO[5].dia).toBe(1);
  });

  it('hoy y lo elegido se marcan por separado', () => {
    const hoy = AGOSTO.find((c) => c.iso === '2026-08-19');
    expect(hoy.esHoy).toBe(true);
    expect(hoy.elegido).toBe(true);
    // Son dos cosas distintas: mirar otro mes deja hoy sin marcar y lo elegido
    // marcado, o al revés.
    const otro = casillasDeMes('2026-08-01', { hoy: '2026-08-19', valor: '2026-08-03' });
    expect(otro.find((c) => c.iso === '2026-08-19').elegido).toBe(false);
    expect(otro.find((c) => c.iso === '2026-08-03').esHoy).toBe(false);
  });

  it('el relleno del mes vecino se puede elegir: va apagado, no muerto', () => {
    // Apretar el 31 de julio desde la rejilla de agosto elige el 31 de julio.
    const sinTopes = casillasDeMes('2026-08-01');
    expect(sinTopes[0].delMes).toBe(false);
    expect(sinTopes[0].elegible).toBe(true);
  });

  it('`min` y `max` apagan las casillas de los bordes', () => {
    expect(AGOSTO.find((c) => c.iso === '2026-08-09').elegible).toBe(false);
    expect(AGOSTO.find((c) => c.iso === '2026-08-10').elegible).toBe(true);
    expect(AGOSTO.find((c) => c.iso === '2026-08-20').elegible).toBe(true);
    expect(AGOSTO.find((c) => c.iso === '2026-08-21').elegible).toBe(false);
  });

  it('acepta cualquier día del mes como ancla, no solo el 1', () => {
    expect(casillasDeMes('2026-08-19')[0].iso).toBe('2026-07-27');
  });

  it('sin ancla no inventa un mes', () => {
    // Es lo que llega si alguien abre el panel con el campo a medio escribir.
    expect(casillasDeMes('')).toEqual([]);
  });
});
