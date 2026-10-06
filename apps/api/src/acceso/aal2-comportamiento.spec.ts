/**
 * PLANTILLA · Kit de Acceso · test por app. Se copia, se adaptan las líneas
 * marcadas `← ADAPTAR` (imports, rutas, roles) y recién ahí se corre. Tal cual
 * NO compila: nombra módulos que cada app tiene con su propio nombre.
 * Va en: `<api>/src/auth/` (al lado del controlador de Equipo). En Mi espacio:
 * `apps/api/src/acceso/`, al lado de los otros tests por app.
 *
 * ── Lo adaptado en Mi espacio (orden #37, PR 2) ──────────────────────────
 * Las puertas son las de esta app (el panel del equipo, resolver un pago,
 * regenerar los códigos). Las excepciones son las suyas (salud, el código de
 * respaldo y el rescate solo). **«S5 · B2 · quién puede resetear el
 * autenticador de otro» se borró**: Mi espacio es de rescate solo y no tiene
 * esa ruta; en su lugar va la prueba de que no existe. Al final, en su propio
 * bloque, los casos propios de la app que ya estaban (cliente/equipo, el
 * paso reciente, pagos, una sola validación por pedido).
 */
import { describe, it, expect, vi } from 'vitest';
import 'reflect-metadata';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Aal2Guard, AAL2_REQUIRED_CODE, PASO_RECIENTE_CODE } from './nucleo/aal2.guard';
import { EquipoController } from '../equipo/equipo.controller';          // ← ADAPTAR: hecho, el controlador de Equipo (el panel)
import { YoController } from '../yo/yo.controller';                      // ← ADAPTAR: hecho, el de /yo (el perfil propio)
import { SaludController } from '../salud.controller';                   // ← ADAPTAR: hecho, el healthcheck
/* ← ADAPTAR: hecho. Mi espacio no tiene integraciones externas: ese caso se borró. */
import { PagosController } from '../pagos/pagos.controller';             // ← ADAPTAR: hecho, un controlador de negocio
import { RespaldoController } from '../respaldo/respaldo.controller';    // ← ADAPTAR: hecho, el de los códigos de respaldo
import { RescateController } from '../rescate/rescate.controller';       // ← ADAPTAR: hecho, el rescate solo (§8)
import { SesionesController } from '../sesiones/sesiones.controller';    // ← ADAPTAR: hecho, cerrar las otras sesiones
import type { SupabaseService } from '../identidad/supabase.service';    // ← ADAPTAR: hecho, el verificador de token de Mi espacio
/* ← ADAPTAR: hecho. `TeamService`, `AuthRequest` y `Profile` eran del caso de
   resetear a otro, que en Mi espacio no existe (rescate solo). */

/**
 * COMPORTAMIENTO del segundo paso, con el guard REAL sobre las rutas REALES.
 *
 * El agujero que cierra (encontrado en la app de origen el 28/09/2026): `team`
 * (invitar miembros y cambiarles el rol), una integración y un controlador de
 * negocio solo tenían el guard de sesión. Con una contraseña robada y SIN el
 * celular, alguien podía llamar la API directo y sumarse al equipo como dueño.
 *
 * Acá no se mockea el guard: se instancia el de producción con un Reflector de
 * verdad y se le pasan el handler y la clase reales de cada ruta, que es
 * exactamente lo que le pasa Nest en runtime.
 */

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const nowSec = () => Math.floor(Date.now() / 1000);
/** Login fresco: contraseña verificada, segundo paso todavía NO. */
const TOKEN_AAL1 = makeJwt({ aal: 'aal1', amr: [{ method: 'password', timestamp: nowSec() }] });
/** Segundo paso verificado recién. */
const TOKEN_AAL2 = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() }] });

type Ctor = { new (...args: never[]): object; prototype: Record<string, unknown> };

/** Contexto igual al que arma Nest: header + handler real + controlador real. */
function contextFor(controller: Ctor, method: string, token?: string): ExecutionContext {
  const handler = controller.prototype[method];
  if (typeof handler !== 'function') throw new Error(`${controller.name}.${method} no existe`);
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: token ? { authorization: `Bearer ${token}` } : {} }),
    }),
    getHandler: () => handler,
    getClass: () => controller,
  } as unknown as ExecutionContext;
}

function makeGuard() {
  const supabase = {
    // El token es auténtico (firma válida); lo que se discute es su nivel.
    getUserFromToken: vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' }),
  };
  return new Aal2Guard(supabase as unknown as SupabaseService, new Reflector());
}

/** ← ADAPTAR: hecho. Las rutas de Mi espacio que no pueden quedar abiertas. */
const PUERTAS: ReadonlyArray<{ nombre: string; controller: Ctor; metodo: string }> = [
  { nombre: 'POST /equipo/miembros', controller: EquipoController as unknown as Ctor, metodo: 'sumar' },
  { nombre: 'POST /equipo/miembros/:id/quitar', controller: EquipoController as unknown as Ctor, metodo: 'quitar' },
  { nombre: 'GET /equipo/clientes', controller: EquipoController as unknown as Ctor, metodo: 'clientes' },
  { nombre: 'POST /pagos/resolver', controller: PagosController as unknown as Ctor, metodo: 'resolver' },
  { nombre: 'POST /respaldo/generar', controller: RespaldoController as unknown as Ctor, metodo: 'generar' },
  { nombre: 'POST /sesiones/cerrar-las-otras', controller: SesionesController as unknown as Ctor, metodo: 'cerrarLasOtras' },
];

describe('Segundo paso obligatorio en las rutas que estaban abiertas', () => {
  for (const puerta of PUERTAS) {
    it(`${puerta.nombre} — con token AAL1 válido devuelve 403 AAL2_REQUIRED`, async () => {
      const guard = makeGuard();
      const context = contextFor(puerta.controller, puerta.metodo, TOKEN_AAL1);

      await expect(guard.canActivate(context)).rejects.toSatisfy((err: unknown) => {
        if (!(err instanceof ForbiddenException)) return false;
        const body = err.getResponse() as { code?: string };
        return body.code === AAL2_REQUIRED_CODE;
      });
    });

    it(`${puerta.nombre} — con token AAL2 pasa`, async () => {
      const guard = makeGuard();
      const context = contextFor(puerta.controller, puerta.metodo, TOKEN_AAL2);
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  }
});

describe('Las excepciones declaradas sí pasan en AAL1', () => {
  it('GET /salud pasa sin token siquiera (healthcheck del deploy)', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(SaludController as unknown as Ctor, 'salud')),
    ).resolves.toBe(true);
  });

  /* ← ADAPTAR: hecho. En Mi espacio `GET /yo` NO es excepción: un cliente pasa
     en aal1 por su rol (abajo), y una cuenta de equipo sin segundo paso no. */
  it('GET /yo NO es excepción: sin rol resuelto, exige AAL2', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(YoController as unknown as Ctor, 'yo', TOKEN_AAL1)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('POST /respaldo/usar pasa en AAL1 (esa es toda la gracia)', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(RespaldoController as unknown as Ctor, 'usar', TOKEN_AAL1)),
    ).resolves.toBe(true);
  });

  it('el rescate solo: pedir, confirmar y cancelar pasan SIN token; aplicar, en AAL1', async () => {
    const guard = makeGuard();
    for (const metodo of ['pedir', 'confirmar', 'cancelar']) {
      await expect(
        guard.canActivate(contextFor(RescateController as unknown as Ctor, metodo)),
        `rescate.${metodo}`,
      ).resolves.toBe(true);
    }
    await expect(
      guard.canActivate(contextFor(RescateController as unknown as Ctor, 'aplicar', TOKEN_AAL1)),
    ).resolves.toBe(true);
  });

  it('POST /yo NO hereda nada: sigue exigiendo AAL2', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(YoController as unknown as Ctor, 'guardar', TOKEN_AAL1)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('GET /respaldo/cuantos NO es excepción: exige AAL2', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(RespaldoController as unknown as Ctor, 'cuantos', TOKEN_AAL1)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// — S5 · B2: quién puede resetear el autenticador de otro —
// ← ADAPTAR: hecho. Mi espacio es de rescate solo (fase-2 §8): NADIE resetea
// el autenticador de otra persona. En vez de probar quién puede, se prueba que
// no hay con qué: ningún método del controlador de Equipo lo hace.

describe('Rescate solo: nadie resetea el autenticador de otra persona', () => {
  it('el controlador de Equipo no tiene ningún método para resetear el segundo paso', () => {
    const metodos = Object.getOwnPropertyNames(EquipoController.prototype);
    const sospechosos = metodos.filter((m) => /reset|2fa|totp|autenticador|factor|rescate/i.test(m));
    expect(metodos.length, 'el barrido no vio los métodos del controlador').toBeGreaterThan(5);
    expect(sospechosos).toEqual([]);
  });
});

/* ── Lo propio de Mi espacio (orden #15, C; #27 C) ─────────────────────────
   Los casos que la app ya tenía, con sus propias herramientas: el rol que deja
   `RolMiddleware` en el pedido, el paso reciente de `/respaldo/generar` y una
   sola validación del token por pedido. */
const ahora = () => Math.floor(Date.now() / 1000);

/** Un JWT sin firmar: el guard solo decodifica el payload DESPUÉS de que el
 *  verificador validó el token, y acá el verificador es de mentira. */
function jwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sinfirma`;
}

/* `TOKEN_AAL1` y `TOKEN_AAL2` son los de la plantilla, de arriba: el verificador es de mentira y no mira el `sub`. */
/** `aal2` puesto hace seis horas: sirve para el guard, no para `@PasoReciente(5)`. */
const TOKEN_AAL2_VIEJO = jwt({
  sub: 'persona-1', aal: 'aal2', amr: [{ method: 'totp', timestamp: ahora() - 6 * 60 * 60 }],
});


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
    /* Es la propiedad que afirma `nucleo/usuario-del-pedido.spec.ts` (desde el
       1.3.0 corre acá también). Ésta la prueba sobre el guard de esta app: dos
       pasadas sobre el MISMO objeto de pedido producen **una** validación. */
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
