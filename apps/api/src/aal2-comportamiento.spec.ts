import { describe, it, expect, vi } from 'vitest';
import 'reflect-metadata';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Aal2Guard, AAL2_REQUIRED_CODE, PASO_RECIENTE_CODE } from './seguridad-512/nucleo/aal2.guard';
import { SaludController } from './salud.controller';
import { YoController } from './yo/yo.controller';
import { RespaldoController } from './respaldo/respaldo.controller';
import { SesionesController } from './sesiones/sesiones.controller';
import { PagosController } from './pagos/pagos.controller';
import type { SupabaseService } from './identidad/supabase.service';

/**
 * EL GUARD, SOBRE LAS RUTAS DE VERDAD DE ESTA APP.
 *
 * ── Por qué éste se reescribió y no se adaptó ───────────────────────────
 * El kit trae `tests-por-app/aal2-comportamiento.spec.ts`, pero está escrito
 * contra los controladores de Cenit —`TeamController.invite`,
 * `MeController.updateProfile`, `POST /team/:id/reset-2fa`— que acá no existen
 * ni van a existir. Cambiarle los nombres habría dejado un test que **parece**
 * probar algo y no prueba nada: la mitad de sus casos son sobre rutas de otra
 * app. Y no está entre los que el `LEEME.md` del kit enumera como «se copian y
 * se adaptan» (nombra cobertura, roles, el guard, paso reciente y el guardián).
 *
 * Así que lo que se copió es **la idea**: preguntarle al guard lo mismo que le
 * va a preguntar Nest, con la ruta real, y mirar qué contesta. Los casos son
 * los de esta app.
 *
 * ── Qué agrega sobre `aal2-cobertura.spec.ts` ───────────────────────────
 * Aquél lee **metadata**: qué rutas están declaradas como excepción. Éste
 * **ejecuta el guard**. Son dos cosas distintas y la diferencia importa: una
 * ruta puede estar correctamente declarada y el guard igual dejarla pasar por
 * un error adentro. El inventario dice qué se decidió; esto dice qué pasa.
 */

const ahora = () => Math.floor(Date.now() / 1000);

/** Un JWT sin firmar: el guard solo decodifica el payload DESPUÉS de que el
 *  verificador validó el token, y acá el verificador es de mentira. */
function jwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sinfirma`;
}

const TOKEN_AAL1 = jwt({ sub: 'persona-1', aal: 'aal1' });
const TOKEN_AAL2 = jwt({ sub: 'persona-1', aal: 'aal2', amr: [{ method: 'totp', timestamp: ahora() }] });
/** `aal2` puesto hace seis horas: sirve para el guard, no para `@PasoReciente(5)`. */
const TOKEN_AAL2_VIEJO = jwt({
  sub: 'persona-1', aal: 'aal2', amr: [{ method: 'totp', timestamp: ahora() - 6 * 60 * 60 }],
});

type Ctor = new (...args: never[]) => object;

/** El contexto mínimo con la ruta REAL, como lo arma el núcleo del kit. */
function contexto(controlador: Ctor, metodo: string, token?: string, rol?: string): ExecutionContext {
  const pedido: Record<string, unknown> = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
  if (rol !== undefined) pedido.profile = { role: rol };
  return {
    getHandler: () => (controlador.prototype as unknown as Record<string, unknown>)[metodo],
    getClass: () => controlador,
    switchToHttp: () => ({ getRequest: () => pedido }),
  } as unknown as ExecutionContext;
}

function guardConVerificador() {
  const verificador = { getUserFromToken: vi.fn().mockResolvedValue({ id: 'persona-1' }) };
  const guard = new Aal2Guard(verificador as unknown as SupabaseService, new Reflector());
  return { guard, verificador };
}

describe('el guard global, sobre las rutas de esta app', () => {
  it('GET /api/salud pasa sin token siquiera: es la única ruta pública', async () => {
    const { guard, verificador } = guardConVerificador();
    await expect(guard.canActivate(contexto(SaludController as unknown as Ctor, 'salud'))).resolves.toBe(true);
    expect(verificador.getUserFromToken, 'salud no debería ni mirar el token').not.toHaveBeenCalled();
  });

  it('GET /api/yo, con una cuenta de CLIENTE en aal1, pasa', async () => {
    /* Es el caso que la clasificación de roles existe para permitir: la mamá
       que se inscribió a un taller no tiene por qué configurar un autenticador
       para ver su propia inscripción. El rol se lo deja `RolMiddleware`. */
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(YoController as unknown as Ctor, 'yo', TOKEN_AAL1, 'cliente')),
    ).resolves.toBe(true);
  });

  it('GET /api/yo, con una cuenta de EQUIPO en aal1, pide el segundo paso', async () => {
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(YoController as unknown as Ctor, 'yo', TOKEN_AAL1, 'equipo')),
    ).rejects.toMatchObject({ response: { code: AAL2_REQUIRED_CODE } });
  });

  it('GET /api/yo SIN rol resuelto falla cerrado: pide el segundo paso', async () => {
    /* Si `RolMiddleware` no llegó a correr —token vencido, la base no
       contestó—, el guard no sabe qué cuenta es. «No sé» tiene que costar un
       código de más, nunca un dato de más. */
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(YoController as unknown as Ctor, 'yo', TOKEN_AAL1)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('GET /api/yo, equipo con aal2, pasa', async () => {
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(YoController as unknown as Ctor, 'yo', TOKEN_AAL2, 'equipo')),
    ).resolves.toBe(true);
  });

  it('POST /api/respaldo/usar pasa en aal1: es la vía de quien perdió el celular', async () => {
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(RespaldoController as unknown as Ctor, 'usar', TOKEN_AAL1, 'equipo')),
    ).resolves.toBe(true);
  });

  it('…y sus VECINAS del mismo controlador NO heredan esa excepción', async () => {
    /* El agujero clásico: la excepción se declara en el handler y alguien cree
       que es del controlador. `cuantos` y `generar` viven en la misma clase que
       `usar` y tienen que seguir exigiendo el segundo paso. */
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(RespaldoController as unknown as Ctor, 'cuantos', TOKEN_AAL1, 'equipo')),
    ).rejects.toMatchObject({ response: { code: AAL2_REQUIRED_CODE } });
    await expect(
      guard.canActivate(contexto(RespaldoController as unknown as Ctor, 'generar', TOKEN_AAL1, 'equipo')),
    ).rejects.toMatchObject({ response: { code: AAL2_REQUIRED_CODE } });
  });

  it('POST /api/respaldo/generar con aal2 VIEJO pide un código reciente, no el segundo paso', async () => {
    /* La diferencia entre los dos códigos es lo que la pantalla usa para saber
       si mandar al reto o pedir el código en el momento. Si los dos fueran
       `AAL2_REQUIRED`, regenerar códigos cerraría la sesión en vez de pedir
       seis dígitos. */
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(RespaldoController as unknown as Ctor, 'generar', TOKEN_AAL2_VIEJO, 'equipo')),
    ).rejects.toMatchObject({ response: { code: PASO_RECIENTE_CODE, minutos: 5 } });
  });

  it('POST /api/respaldo/generar con aal2 RECIÉN puesto pasa', async () => {
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(RespaldoController as unknown as Ctor, 'generar', TOKEN_AAL2, 'equipo')),
    ).resolves.toBe(true);
  });

  it('POST /api/sesiones/cerrar-las-otras exige el segundo paso', async () => {
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(SesionesController as unknown as Ctor, 'cerrarLasOtras', TOKEN_AAL1, 'equipo')),
    ).rejects.toMatchObject({ response: { code: AAL2_REQUIRED_CODE } });
  });

  it('#27 C · POST /api/pagos/resolver con una cuenta de EQUIPO en aal1: 403 AAL2_REQUIRED', async () => {
    /* La orden lo pide con estas palabras: «`resolver` sin `aal2` → 403
       `AAL2_REQUIRED`». Lo da el guard global, antes de que el controlador
       llegue a preguntar el rol. */
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(PagosController as unknown as Ctor, 'resolver', TOKEN_AAL1, 'equipo')),
    ).rejects.toMatchObject({ response: { code: AAL2_REQUIRED_CODE } });
    await expect(
      guard.canActivate(contexto(PagosController as unknown as Ctor, 'resolver', TOKEN_AAL2, 'equipo')),
    ).resolves.toBe(true);
  });

  it('#27 C · declarar y ver el comprobante: el CLIENTE pasa en aal1; el EQUIPO, solo con aal2', async () => {
    const { guard } = guardConVerificador();
    for (const metodo of ['declarar', 'comprobante']) {
      await expect(
        guard.canActivate(contexto(PagosController as unknown as Ctor, metodo, TOKEN_AAL1, 'cliente')),
      ).resolves.toBe(true);
      await expect(
        guard.canActivate(contexto(PagosController as unknown as Ctor, metodo, TOKEN_AAL1, 'equipo')),
      ).rejects.toMatchObject({ response: { code: AAL2_REQUIRED_CODE } });
    }
  });

  it('sin token, una ruta protegida da 401 y no 403', async () => {
    /* Son dos cosas distintas y la pantalla las trata distinto: 401 es «vuelve
       a entrar», 403 con `AAL2_REQUIRED` es «escribe el código». */
    const { guard } = guardConVerificador();
    await expect(
      guard.canActivate(contexto(YoController as unknown as Ctor, 'yo', undefined, 'equipo')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('el token se valida UNA sola vez por pedido', async () => {
    /* Es la propiedad que afirmaba `nucleo/usuario-del-pedido.spec.ts`, que no
       se puede correr acá porque importa archivos de Cenit (ver
       `vitest.config.ts`). Se recupera así: dos pasadas del guard sobre el
       MISMO objeto de pedido tienen que producir **una** validación. */
    const { guard, verificador } = guardConVerificador();
    const ctx = contexto(YoController as unknown as Ctor, 'yo', TOKEN_AAL2, 'equipo');
    await guard.canActivate(ctx);
    await guard.canActivate(ctx);
    expect(verificador.getUserFromToken).toHaveBeenCalledTimes(1);
  });

  it('…pero un token DISTINTO en el mismo pedido se vuelve a validar', async () => {
    /* La otra mitad, y la que hace que la de arriba no sea un atajo: la ranura
       se reusa solo si el token es exactamente el mismo. */
    const { guard, verificador } = guardConVerificador();
    const pedido: Record<string, unknown> = {
      headers: { authorization: `Bearer ${TOKEN_AAL2}` },
      profile: { role: 'equipo' },
    };
    const ctx = {
      getHandler: () => (YoController.prototype as unknown as Record<string, unknown>).yo,
      getClass: () => YoController,
      switchToHttp: () => ({ getRequest: () => pedido }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);
    pedido.headers = { authorization: `Bearer ${TOKEN_AAL2_VIEJO}` };
    await guard.canActivate(ctx);
    expect(verificador.getUserFromToken).toHaveBeenCalledTimes(2);
  });
});
