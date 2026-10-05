/**
 * La cuenta de la fecha — los primeros tests de `packages/ui`.
 *
 * El paquete no tuvo corredor de tests al principio, y hasta entonces todo lo que
 * se mudaba aquí dentro perdía su red: le pasó a las iniciales del avatar en el
 * bloque D, dos horas antes de esto. Una fecha es más delicada que unas
 * iniciales —el 8 de octubre y el 10 de agosto son el mismo `08/10` mal leído—
 * así que el paquete estrena vitest, que ya estaba en el monorepo.
 *
 * Lo que fijan estos casos:
 * 1. **dd/mm/aaaa en los cuatro idiomas.** Es la razón de existir del
 *    componente: el nativo mostraba el formato del navegador y decía
 *    «mm/dd/yyyy» en un formulario en español.
 * 2. **Una fecha que no existe no se acepta**, bisiestos incluidos.
 * 3. **Escribir a medias no borra lo que había.** `null` (todavía no) y `''`
 *    (no hay fecha) son estados distintos, y confundirlos vacía el campo de
 *    quien está tecleando.
 */
import { describe, expect, it } from 'vitest';
import { conBarras, esFechaReal, isoATexto, textoAIso } from './fecha.js';

describe('isoATexto', () => {
  it('pone el día adelante, siempre', () => {
    expect(isoATexto('2026-08-10')).toBe('10/08/2026');
    expect(isoATexto('2026-10-08')).toBe('08/10/2026');
  });

  it('sin fecha no inventa una', () => {
    expect(isoATexto('')).toBe('');
    expect(isoATexto(undefined)).toBe('');
    expect(isoATexto('cualquier cosa')).toBe('');
  });
});

describe('textoAIso', () => {
  it('lee dd/mm/aaaa y devuelve ISO', () => {
    expect(textoAIso('10/08/2026')).toBe('2026-08-10');
    expect(textoAIso('8/10/2026')).toBe('2026-10-08');
  });

  it('acepta el guion y el punto, que es como teclea mucha gente', () => {
    expect(textoAIso('10-08-2026')).toBe('2026-08-10');
    expect(textoAIso('10.08.2026')).toBe('2026-08-10');
  });

  it('vacío es vacío, y es un estado legítimo', () => {
    expect(textoAIso('')).toBe('');
    expect(textoAIso('   ')).toBe('');
  });

  it('lo escrito a medias devuelve null, que no es lo mismo que vacío', () => {
    // Esta distinción es la que impide que el campo se borre solo mientras
    // alguien teclea. Si las dos devolvieran '', el valor de arriba se
    // limpiaría en la primera tecla.
    expect(textoAIso('10/0')).toBeNull();
    expect(textoAIso('10/08/20')).toBeNull();
    expect(textoAIso('10/08')).toBeNull();
  });

  it('un día que no existe no pasa', () => {
    expect(textoAIso('31/02/2026')).toBeNull();
    expect(textoAIso('31/04/2026')).toBeNull();
    expect(textoAIso('00/08/2026')).toBeNull();
    expect(textoAIso('10/13/2026')).toBeNull();
  });

  it('el 29 de febrero existe en año bisiesto y no en el otro', () => {
    expect(textoAIso('29/02/2024')).toBe('2024-02-29');
    expect(textoAIso('29/02/2026')).toBeNull();
  });

  it('un año que no se puede confundir: siempre cuatro dígitos', () => {
    // '10/08/26' sería 1926 o 2026 según quién lo mire, y una fecha de
    // nacimiento con cien años de diferencia no es un detalle.
    expect(textoAIso('10/08/26')).toBeNull();
  });
});

describe('esFechaReal', () => {
  it('el último día de cada mes lo decide el calendario, no una tabla', () => {
    expect(esFechaReal(31, 1, 2026)).toBe(true);
    expect(esFechaReal(30, 4, 2026)).toBe(true);
    expect(esFechaReal(31, 4, 2026)).toBe(false);
    expect(esFechaReal(29, 2, 2000)).toBe(true);  // bisiesto de siglo
    expect(esFechaReal(29, 2, 1900)).toBe(false); // el que no lo es
  });
});

describe('conBarras', () => {
  it('las pone solas mientras se teclea', () => {
    expect(conBarras('1')).toBe('1');
    expect(conBarras('10')).toBe('10');
    expect(conBarras('100')).toBe('10/0');
    expect(conBarras('10082026')).toBe('10/08/2026');
  });

  it('no acumula de más: ocho dígitos y se corta', () => {
    expect(conBarras('100820269999')).toBe('10/08/2026');
  });

  it('lo que ya tiene barras no las duplica', () => {
    expect(conBarras('10/08/2026')).toBe('10/08/2026');
  });

  it('nunca completa lo que falta', () => {
    // Quien borra con retroceso tiene que poder pasar por encima de una barra
    // sin que el campo se la devuelva delante del cursor.
    expect(conBarras('10/0')).toBe('10/0');
    expect(conBarras('10/')).toBe('10');
  });
});
