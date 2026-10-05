/**
 * PLANTILLA · Kit de Acceso · test por app. Se copia, se adaptan las líneas
 * marcadas `← ADAPTAR` (imports, rutas, roles) y recién ahí se corre. Tal cual
 * NO compila: nombra módulos que cada app tiene con su propio nombre.
 * Va en: `<api>/src/acceso/` (al lado de `nucleo/`).
 */
import { describe, it, expect, vi } from 'vitest';
import 'reflect-metadata';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuloRaiz } from '../modulo-raiz'; // ← ADAPTAR: el módulo raíz de Nest de la app, con su nombre y su ruta
import { Aal2Guard, PASO_RECIENTE_CODE, readPasoRecienteMinutos } from './nucleo/aal2.guard';
import { PasoReciente } from './nucleo/paso-reciente.decorator';
import { collectRoutes, contextFor } from './nucleo/cobertura';
import type { VerificadorDeToken } from './nucleo/verificador-de-token';
import { InformesController } from '../informes/informes.controller';  // ← ADAPTAR: lo que exporta los datos del negocio
import { AnalyticsController } from '../analytics/analytics.controller'; // ← ADAPTAR: lo que exporta números del equipo, si hay
import { TeamController } from '../auth/team.controller';             // ← ADAPTAR: el controlador de Equipo
import { RecursosController } from '../recursos/recursos.controller';  // ← ADAPTAR: un controlador de negocio que NO pide código reciente

/**
 * S6 — CÓDIGO RECIENTE PARA LO QUE DE VERDAD DUELE (adaptador).
 *
 * Tener la sesión en `aal2` significa "en algún momento del día puso el código".
 * Para llevarse todos los datos del negocio en un CSV, o para dejar a
 * otra persona sin autenticador, eso no alcanza: alcanza con haberse levantado
 * de una computadora abierta. Estas rutas piden el código otra vez, en el
 * momento.
 *
 * Qué NO lleva código reciente, a propósito: todo lo demás. Pedirlo todo el
 * tiempo entrena a la gente a tipear el código sin mirar, que es exactamente lo
 * contrario de lo que se busca.
 */
/** ← ADAPTAR: las acciones de ESTA app que piden el código otra vez, con su razón. */
const RUTAS_SENSIBLES: ReadonlyArray<{ ruta: string; minutos: number; razon: string }> = [
  {
    ruta: 'GET /informes/export',
    minutos: 5,
    razon: 'se lleva TODOS los datos del negocio en un archivo',
  },
  {
    ruta: 'GET /analytics/export',
    minutos: 5,
    razon: 'se lleva montos y el ranking del equipo con nombres',
  },
  {
    ruta: 'POST /team/:id/reset-2fa',
    minutos: 5,
    razon: 'deja a otra persona sin segundo paso',
  },
];

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const nowSec = () => Math.floor(Date.now() / 1000);
/** Código puesto recién. */
const TOKEN_FRESCO = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() }] });
/** Código de hace 6 minutos: sirve para entrar, no para exportar. */
const TOKEN_VIEJO = makeJwt({
  aal: 'aal2',
  amr: [{ method: 'totp', timestamp: nowSec() - 6 * 60 }],
});
/** Sin `amr` legible: no se puede probar que haya código reciente. */
const TOKEN_SIN_AMR = makeJwt({ aal: 'aal2' });

type Ctor = { new (...args: never[]): object; prototype: Record<string, unknown> };

function contextoDe(controller: Ctor, metodo: string, token: string): ExecutionContext {
  const handler = controller.prototype[metodo];
  if (typeof handler !== 'function') throw new Error(`${controller.name}.${metodo} no existe`);
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }),
    }),
    getHandler: () => handler,
    getClass: () => controller,
  } as unknown as ExecutionContext;
}

function guard(): Aal2Guard {
  const verificador = {
    getUserFromToken: vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' }),
  };
  return new Aal2Guard(verificador as unknown as VerificadorDeToken, new Reflector());
}

async function codigoDeError(promesa: Promise<unknown>): Promise<string | undefined> {
  try {
    await promesa;
    return undefined;
  } catch (e) {
    const respuesta = (e as ForbiddenException).getResponse?.();
    return typeof respuesta === 'object' && respuesta !== null
      ? (respuesta as { code?: string }).code
      : undefined;
  }
}

describe('@PasoReciente — inventario de rutas sensibles', () => {
  const reflector = new Reflector();

  it('las rutas con código reciente son EXACTAMENTE las declaradas acá', () => {
    const encontradas = collectRoutes(ModuloRaiz)
      .map((route) => ({
        ruta: route.label,
        minutos: readPasoRecienteMinutos(reflector, contextFor(route)),
      }))
      .filter((r): r is { ruta: string; minutos: number } => r.minutos !== undefined)
      .sort((a, b) => a.ruta.localeCompare(b.ruta));

    const esperadas = RUTAS_SENSIBLES.map(({ ruta, minutos }) => ({ ruta, minutos })).sort((a, b) =>
      a.ruta.localeCompare(b.ruta),
    );

    expect(
      encontradas,
      'Cambió el inventario de acciones que piden el código otra vez. Si agregaste ' +
        'una, escribila en RUTAS_SENSIBLES con su razón; si sacaste una, borrala.',
    ).toEqual(esperadas);
  });

  it('ninguna razón queda en blanco', () => {
    for (const { ruta, razon } of RUTAS_SENSIBLES) {
      expect(razon.trim(), `${ruta} sin razón`).not.toBe('');
    }
  });

  it('@PasoReciente rechaza minutos inválidos', () => {
    expect(() => PasoReciente(0)).toThrow(/mayor que cero/);
    expect(() => PasoReciente(-1)).toThrow(/mayor que cero/);
    expect(() => PasoReciente(Number.NaN)).toThrow(/mayor que cero/);
  });
});

describe('@PasoReciente — comportamiento, ruta por ruta', () => {
  const casos: ReadonlyArray<{ nombre: string; controller: Ctor; metodo: string }> = [
    { nombre: 'exportar informes', controller: InformesController as Ctor, metodo: 'export' },
    { nombre: 'exportar el análisis', controller: AnalyticsController as Ctor, metodo: 'export' },
    {
      nombre: 'resetear el 2FA de un miembro',
      controller: TeamController as Ctor,
      metodo: 'resetTwoFactor',
    },
  ];

  for (const caso of casos) {
    describe(caso.nombre, () => {
      it('con el código puesto recién, pasa', async () => {
        await expect(
          guard().canActivate(contextoDe(caso.controller, caso.metodo, TOKEN_FRESCO)),
        ).resolves.toBe(true);
      });

      it('con el código de hace 6 minutos, 403 PASO_RECIENTE_REQUERIDO', async () => {
        const codigo = await codigoDeError(
          guard().canActivate(contextoDe(caso.controller, caso.metodo, TOKEN_VIEJO)),
        );
        expect(codigo).toBe(PASO_RECIENTE_CODE);
      });

      it('sin amr legible NO falla-open: se pide el código igual', async () => {
        const codigo = await codigoDeError(
          guard().canActivate(contextoDe(caso.controller, caso.metodo, TOKEN_SIN_AMR)),
        );
        expect(codigo).toBe(PASO_RECIENTE_CODE);
      });
    });
  }

  /**
   * El contraste: la misma sesión con el mismo código viejo entra a lo de todos los días
   * sin problema. El código reciente es para la acción, no para la sesión.
   */
  it('una ruta normal (listar recursos) NO pide el código otra vez', async () => {
    await expect(
      guard().canActivate(contextoDe(RecursosController as Ctor, 'list', TOKEN_VIEJO)),
    ).resolves.toBe(true);
    await expect(
      guard().canActivate(contextoDe(RecursosController as Ctor, 'list', TOKEN_SIN_AMR)),
    ).resolves.toBe(true);
  });
});
