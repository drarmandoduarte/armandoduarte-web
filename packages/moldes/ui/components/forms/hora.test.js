/**
 * La cuenta de la hora — la hermana de `fecha.test.js`, y por las mismas
 * razones.
 *
 * Lo que fijan estos casos:
 * 1. **24 h en los cuatro idiomas.** Es la razón de existir del campo: el
 *    `<input type=time>` nativo dibuja el reloj del navegador, y en inglés
 *    parte el campo en hora, minutos y un AM/PM. «02:30» sin ese AM/PM son dos
 *    horas distintas, y en la franja de un profesional eso es abrir de
 *    madrugada o abrir después de comer.
 * 2. **Una hora que el reloj no tiene no se acepta.** `24:00` y `09:60` no
 *    existen — y `24:00` es la que se escribe sola cuando alguien piensa «hasta
 *    el final del día».
 * 3. **Escribir a medias no borra lo que había.** `null` (todavía no) y `''`
 *    (no hay hora) son estados distintos, igual que en la fecha.
 * 4. **Los segundos de Postgres no vacían el campo.** Una columna `time` vuelve
 *    como `09:30:00`; el campo tiene que leerla aunque la puerta de datos se
 *    haya olvidado de cortarla.
 */
import { describe, expect, it } from 'vitest';
import { conDosPuntos, esHoraReal, horaATexto, textoAHora } from './hora.js';

describe('horaATexto', () => {
  it('lee la hora tal como se guarda', () => {
    expect(horaATexto('09:30')).toBe('09:30');
    expect(horaATexto('14:00')).toBe('14:00');
  });

  it('los segundos de Postgres no vacían el campo', () => {
    // `time` vuelve del servidor como `09:30:00`. Hoy `equipo/datos.ts` lo
    // corta antes, pero el campo no puede depender de que todas las puertas de
    // datos se acuerden: la que se olvide mostraría vacío sobre un dato que
    // existe, que es la peor manera de perder una hora cargada.
    expect(horaATexto('09:30:00')).toBe('09:30');
  });

  it('sin hora no inventa una', () => {
    expect(horaATexto('')).toBe('');
    expect(horaATexto(undefined)).toBe('');
    expect(horaATexto('cualquier cosa')).toBe('');
  });
});

describe('esHoraReal', () => {
  it('acepta las que el reloj tiene', () => {
    expect(esHoraReal(0, 0)).toBe(true);
    expect(esHoraReal(23, 59)).toBe(true);
  });

  it('rechaza las que no', () => {
    // La medianoche del final del día se escribe 00:00 del día siguiente. Un
    // 24:00 aceptado aquí se guarda y revienta en la base, que es `time`.
    expect(esHoraReal(24, 0)).toBe(false);
    expect(esHoraReal(9, 60)).toBe(false);
    expect(esHoraReal(-1, 0)).toBe(false);
  });
});

describe('textoAHora', () => {
  it('lee HH:MM y completa el cero de adelante', () => {
    expect(textoAHora('09:30')).toBe('09:30');
    expect(textoAHora('9:30')).toBe('09:30');
  });

  it('vacío es vacío, y a medias es todavía no', () => {
    expect(textoAHora('')).toBe('');
    // Quien va por «1» no quiso decir la una de la mañana: devolver `01:00`
    // aquí le pisaría la hora que ya tenía puesta al primer dígito.
    expect(textoAHora('1')).toBe(null);
    expect(textoAHora('09:')).toBe(null);
    expect(textoAHora('09:3')).toBe(null);
  });

  it('una hora que no existe es todavía no, no un valor', () => {
    expect(textoAHora('24:00')).toBe(null);
    expect(textoAHora('09:60')).toBe(null);
  });
});

describe('conDosPuntos', () => {
  it('los pone solos al teclear', () => {
    expect(conDosPuntos('0')).toBe('0');
    expect(conDosPuntos('09')).toBe('09');
    expect(conDosPuntos('093')).toBe('09:3');
    expect(conDosPuntos('0930')).toBe('09:30');
  });

  it('nunca quita ni completa', () => {
    // Quien borra con retroceso pasa por encima de los dos puntos sin que el
    // campo se los devuelva delante del cursor.
    expect(conDosPuntos('09:3')).toBe('09:3');
    expect(conDosPuntos('09:')).toBe('09');
    expect(conDosPuntos('')).toBe('');
  });

  it('lo que sobra se descarta', () => {
    expect(conDosPuntos('093012')).toBe('09:30');
    expect(conDosPuntos('9h30')).toBe('93:0');
  });
});
