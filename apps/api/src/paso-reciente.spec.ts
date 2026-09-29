import { describe, it, expect, vi } from 'vitest';
/**
 * ── Adaptado del kit para esta app (orden Códice #15, C) ─────────────────
 * Viene de `Kit de Seguridad 512 v1.1.0 · tests-por-app/`. Lo que cambió son
 * **las rutas y los nombres de esta app**; la lógica que afirma es la del kit y
 * se dejó como estaba. El `LEEME.md` del kit pide exactamente eso: estos tests
 * «se copian pero se adaptan».
 */

import 'reflect-metadata';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Aal2Guard, PASO_RECIENTE_CODE, readPasoRecienteMinutos } from './seguridad-512/nucleo/aal2.guard';
import { PasoReciente } from './seguridad-512/nucleo/paso-reciente.decorator';
import { collectRoutes, contextFor } from './seguridad-512/nucleo/cobertura';
import type { VerificadorDeToken } from './seguridad-512/nucleo/verificador-de-token';
import { RespaldoController } from './respaldo/respaldo.controller';

/**
 * S6 — CÓDIGO RECIENTE PARA LO QUE DE VERDAD DUELE (adaptador).
 *
 * Tener la sesión en `aal2` significa "en algún momento del día puso el código".
 * Para llevarse todos los cierres con sus comisiones en un CSV, o para dejar a
 * otra persona sin autenticador, eso no alcanza: alcanza con haberse levantado
 * de una computadora abierta. Estas rutas piden el código otra vez, en el
 * momento.
 *
 * Qué NO lleva código reciente, a propósito: todo lo demás. Pedirlo todo el
 * tiempo entrena a la gente a tipear el código sin mirar, que es exactamente lo
 * contrario de lo que se busca.
 */
/* Las rutas van SIN el `/api`: `collectRoutes` lee lo que **declara** el
   controlador, y el prefijo lo pone `app.setGlobalPrefix('api')` al arrancar.
   Lo que se ve en el navegador es `/api/respaldo/generar`. */
const RUTAS_SENSIBLES: ReadonlyArray<{ ruta: string; minutos: number; razon: string }> = [
  {
    ruta: 'POST /respaldo/generar',
    minutos: 5,
    razon:
      'regenerar los códigos de respaldo INVALIDA los que la persona tiene guardados. Con la '
      + 'sesión viva alcanza para dejar a la dueña sin su vía de rescate: es el caso exacto de S6.',
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
    const encontradas = collectRoutes(AppModule)
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
    {
      nombre: 'regenerar los códigos de respaldo',
      controller: RespaldoController as Ctor,
      metodo: 'generar',
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
   * El contraste, y es la mitad que hace que lo de arriba signifique algo: la
   * MISMA sesión con el MISMO código viejo entra sin problema a una ruta
   * normal. El código reciente es de la acción, no de la sesión — si `aal2`
   * viejo rebotara en todas partes, esto no sería S6, sería una sesión más
   * corta.
   *
   * En Cenit el contraste era el catálogo de propiedades; acá es contar los
   * códigos que quedan, que es la ruta vecina de la que sí pide el paso
   * reciente y vive en el mismo controlador.
   */
  it('una ruta normal (contar los códigos que quedan) NO pide el código otra vez', async () => {
    await expect(
      guard().canActivate(contextoDe(RespaldoController as Ctor, 'cuantos', TOKEN_VIEJO)),
    ).resolves.toBe(true);
    await expect(
      guard().canActivate(contextoDe(RespaldoController as Ctor, 'cuantos', TOKEN_FRESCO)),
    ).resolves.toBe(true);
  });
});
