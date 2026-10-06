import { describe, expect, it } from 'vitest';
import { HORAS_DE_ESPERA_DEL_RESCATE, RECURSOS_I18N, leerEnlaceDelRescate, APP_FAMILIA } from '@codice/core';
import { TEXTOS_DEL_RESCATE } from '../correo/textos';
import { BASE_DE_LA_APP, HORAS_DE_ESPERA, enlace, fechaDelCorreo, hashDelToken } from './rescate.controller';

/**
 * Lo que la API del rescate tiene escrito dos veces, contra su fuente.
 *
 * La API no puede importar `@codice/core` en lo que se despliega (ver
 * `correo/textos.ts`), así que copia tres cosas: los textos de los dos correos,
 * las 48 horas y la forma del enlace. Un test sí puede importarlo, y acá se
 * comparan: si alguien cambia una copia y no la otra, cae.
 */
describe('las copias de la API del rescate, contra @codice/core', () => {
  it('los dos correos, en los tres idiomas, son los de familia.json (auth.reset.mail)', () => {
    for (const idioma of ['es', 'en', 'pt'] as const) {
      const fuente = (RECURSOS_I18N[idioma].familia as unknown as { auth: { reset: { mail: unknown } } }).auth.reset.mail;
      expect(TEXTOS_DEL_RESCATE[idioma], idioma).toEqual(fuente);
    }
  });

  it('las 48 horas son las mismas', () => {
    expect(HORAS_DE_ESPERA).toBe(HORAS_DE_ESPERA_DEL_RESCATE);
  });

  it('el enlace del correo es el que la pantalla de /rescate sabe leer, y va a la app', () => {
    const id = '6f1f2d64-6f1a-4a3e-9f6b-2b0f9a1c4d21';
    const token = 'A'.repeat(43);
    expect(BASE_DE_LA_APP).toBe(APP_FAMILIA);
    for (const accion of ['confirmar', 'cancelar'] as const) {
      const url = new URL(enlace(id, token, accion));
      expect(url.origin + url.pathname).toBe(`${APP_FAMILIA}/rescate`);
      expect(leerEnlaceDelRescate(url.search)).toEqual({ id, token, accion });
    }
  });
});

describe('las piezas del rescate', () => {
  it('el hash del token es SHA-256 en hex, como lo exige la 013', () => {
    expect(hashDelToken('x')).toMatch(/^[0-9a-f]{64}$/);
    expect(hashDelToken('x')).not.toBe(hashDelToken('y'));
  });

  it('la fecha del correo va en la zona de la persona y en su idioma; con una zona rota, la de México', () => {
    const vence = new Date('2026-10-08T15:00:00.000Z');
    expect(fechaDelCorreo(vence, 'es', 'America/Merida')).toMatch(/jueves.*8 de octubre.*9:00/);
    expect(fechaDelCorreo(vence, 'en', 'Europe/Madrid')).toMatch(/Thursday.*October 8.*5:00/);
    expect(fechaDelCorreo(vence, 'pt', 'no/existe')).toMatch(/quinta-feira/);
  });
});
