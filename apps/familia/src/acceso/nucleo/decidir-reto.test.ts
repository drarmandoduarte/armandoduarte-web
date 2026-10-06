import { describe, it, expect } from 'vitest';
import { decidirReto, type Decision, type EstadoDeLaSesion } from './decidir-reto';
import { ACCESO } from '../acceso.config';

/**
 * La decisión del gate, en tabla. Antes vivía enredada dentro de un componente
 * con efectos y llamadas; aquí se lee de un vistazo qué pasa en cada caso.
 */
const CASOS: ReadonlyArray<{ nombre: string; estado: EstadoDeLaSesion; espera: Decision }> = [
  {
    nombre: 'sin factor enrolado → enrolamiento obligatorio',
    estado: { nivelActual: 'aal1', nivelPosible: 'aal1', rol: 'owner', ventanaVencida: false },
    espera: 'enrolar',
  },
  {
    nombre: 'sin factor Y con la ventana vencida → primero enrolar, no cerrar',
    estado: { nivelActual: 'aal1', nivelPosible: 'aal1', rol: 'owner', ventanaVencida: true },
    espera: 'enrolar',
  },
  {
    nombre: 'con factor pero sesión en aal1 (login fresco) → pedir el código',
    estado: { nivelActual: 'aal1', nivelPosible: 'aal2', rol: 'agent', ventanaVencida: false },
    espera: 'reto',
  },
  {
    nombre: 'sesión en aal1 y ventana vencida → primero el reto (la ventana ni empezó)',
    estado: { nivelActual: 'aal1', nivelPosible: 'aal2', rol: 'agent', ventanaVencida: true },
    espera: 'reto',
  },
  {
    nombre: 'aal2 con 30 min sin actividad → se CIERRA la sesión, no se re-pide el código',
    estado: { nivelActual: 'aal2', nivelPosible: 'aal2', rol: 'owner', ventanaVencida: true },
    espera: 'cerrar-sesion',
  },
  {
    nombre: 'aal2 y ventana vigente → pasa',
    estado: { nivelActual: 'aal2', nivelPosible: 'aal2', rol: 'owner', ventanaVencida: false },
    espera: 'pasar',
  },
];

describe('decidirReto', () => {
  for (const caso of CASOS) {
    it(caso.nombre, () => {
      expect(decidirReto(caso.estado)).toBe(caso.espera);
    });
  }

  it('falla CERRADO: sin rol conocido igual se exige el segundo paso', () => {
    expect(decidirReto({ nivelActual: 'aal1', nivelPosible: 'aal2', ventanaVencida: false })).toBe(
      'reto',
    );
    expect(
      decidirReto({
        nivelActual: 'aal1',
        nivelPosible: 'aal2',
        rol: 'rol_que_nadie_clasifico',
        ventanaVencida: false,
      }),
    ).toBe('reto');
  });

  /**
   * En Cenit este caso no se da (los dos roles son equipo). Queda probado para
   * el día que exista un rol de cliente — un portal del propietario, digamos.
   */
  it('una cuenta de cliente no pasa por el segundo paso (hoy Cenit no tiene ninguna)', () => {
    // No se toca la config real de forma permanente: se agrega un rol
    // hipotético y se lo saca en el `finally`.
    const roles = ACCESO.roles as Record<string, 'equipo' | 'cliente'>;
    roles.propietario = 'cliente';
    try {
      expect(
        decidirReto({
          nivelActual: 'aal1',
          nivelPosible: 'aal1',
          rol: 'propietario',
          ventanaVencida: true,
        }),
      ).toBe('pasar');
    } finally {
      delete roles.propietario;
    }
  });
});
