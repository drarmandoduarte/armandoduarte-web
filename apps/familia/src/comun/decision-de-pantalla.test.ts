/**
 * La pantalla no enrola a quien no conoce — orden Códice #15, punto 3.
 *
 * La tabla de nueve casos del kit la prueba el kit
 * (`seguridad-512/nucleo/decidir-reto.test.ts`). Acá se prueba **lo que esta app
 * le agrega**: que un `/api/yo` que no contestó no se lea como «cuenta de equipo
 * sin factor».
 */
import { describe, expect, it } from 'vitest';
import { decidirPantalla, type RespuestaDeYo } from './decision-de-pantalla';

/** El caso real del 29/9: sesión recién creada, sin factor, y sin rol. */
const reciénEntrada = {
  nivelActual: 'aal1' as const,
  nivelPosible: 'aal1' as const,
  rol: undefined,
  ventanaVencida: false,
};

describe('decidirPantalla', () => {
  it('EL CASO: `/api/yo` en 500 manda a `error`, nunca a `enrolar`', () => {
    /* Con `respuestaDeYo: 'no-contesto'` el kit ni se entera. Si esta línea se
       borra, el mismo estado da `enrolar` —lo afirma el test de abajo— y una
       clienta termina instalando Google Authenticator. */
    expect(decidirPantalla({ ...reciénEntrada, respuestaDeYo: 'no-contesto' })).toBe('error');
  });

  it('y el estado es EXACTAMENTE el mismo que sin el arreglo daría `enrolar`', () => {
    /* La otra mitad, y va separada a propósito: sin esto, el test de arriba
       podría estar pasando porque el estado no producía `enrolar` de todos
       modos, y entonces no estaría midiendo nada. */
    expect(decidirPantalla({ ...reciénEntrada, respuestaDeYo: 'falta-el-segundo-paso' })).toBe('enrolar');
  });

  it('un 403 AAL2_REQUIRED sí es una respuesta: la decisión la toma el kit', () => {
    /* Es la diferencia que hace el arreglo: «no sé quién es» ≠ «el servidor me
       dijo que falta el segundo paso». En el segundo, `esEquipo(undefined) ===
       true` es la regla correcta del kit y se la deja trabajar. */
    expect(decidirPantalla({
      nivelActual: 'aal1', nivelPosible: 'aal2', rol: undefined, ventanaVencida: false,
      respuestaDeYo: 'falta-el-segundo-paso',
    })).toBe('reto');
  });

  it('con respuesta, cada rol llega a donde el kit dice', () => {
    const con = (rol: string | undefined, respuestaDeYo: RespuestaDeYo = 'respondio') =>
      decidirPantalla({
        nivelActual: 'aal1', nivelPosible: 'aal1', rol, ventanaVencida: false, respuestaDeYo,
      });
    expect(con('cliente')).toBe('pasar');
    expect(con('dueno')).toBe('enrolar');
    expect(con('equipo')).toBe('enrolar');
  });

  it('«no contestó» gana sobre cualquier otra condición, incluida la ventana vencida', () => {
    /* Va primero a propósito: cerrarle la sesión a alguien por inactividad
       cuando en realidad no se pudo leer su cuenta es contar otra historia. */
    expect(decidirPantalla({
      nivelActual: 'aal2', nivelPosible: 'aal2', rol: 'dueno', ventanaVencida: true,
      respuestaDeYo: 'no-contesto',
    })).toBe('error');
    expect(decidirPantalla({
      nivelActual: 'aal2', nivelPosible: 'aal2', rol: 'dueno', ventanaVencida: true,
      respuestaDeYo: 'respondio',
    })).toBe('cerrar-sesion');
  });

  it('«sin sesión» no es error: con la sesión recién llegada, se espera a `/api/yo`', () => {
    /* F.4 cuarta corrida, 30/9: el estado inicial se anotaba `no-contesto` y
       el login terminaba en error. Y tampoco se le pregunta al kit: con
       `rol: undefined` diría `enrolar`. */
    expect(decidirPantalla({ ...reciénEntrada, respuestaDeYo: 'sin-sesion' })).toBe('esperando');
  });
});
