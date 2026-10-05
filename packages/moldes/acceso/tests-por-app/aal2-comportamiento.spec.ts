/**
 * PLANTILLA · Kit de Acceso · test por app. Se copia, se adaptan las líneas
 * marcadas `← ADAPTAR` (imports, rutas, roles) y recién ahí se corre. Tal cual
 * NO compila: nombra módulos que cada app tiene con su propio nombre.
 * Va en: `<api>/src/auth/` (al lado del controlador de Equipo).
 */
import { describe, it, expect, vi } from 'vitest';
import 'reflect-metadata';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Aal2Guard, AAL2_REQUIRED_CODE } from '../acceso/nucleo/aal2.guard';
import { TeamController } from './team.controller';                              // ← ADAPTAR: el controlador de Equipo
import { MeController } from './me.controller';                                  // ← ADAPTAR: el de /me (el perfil propio)
import { SaludController } from '../salud/salud.controller';                     // ← ADAPTAR: el controlador público que la app tenga (healthcheck)
import { IntegracionController } from '../integraciones/integracion.controller'; // ← ADAPTAR: una integración externa, si la app tiene
import { RecursosController } from '../recursos/recursos.controller';            // ← ADAPTAR: un controlador de negocio de la app
import { TwoFactorController } from '../two-factor/two-factor.controller';       // ← ADAPTAR: el del autenticador y la recuperación
import type { TeamService } from './team.service';                               // ← ADAPTAR
import type { SupabaseService } from '../shared/supabase.service';               // ← ADAPTAR: el verificador de token de la app
import type { AuthRequest } from './auth.guard';                                 // ← ADAPTAR
import type { Profile } from './auth.types';                                     // ← ADAPTAR

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

/** ← ADAPTAR: las rutas de ESTA app que no pueden quedar abiertas, con su método. */
const PUERTAS: ReadonlyArray<{ nombre: string; controller: Ctor; metodo: string }> = [
  { nombre: 'POST /team/invite', controller: TeamController as unknown as Ctor, metodo: 'invite' },
  { nombre: 'PATCH /team/:id', controller: TeamController as unknown as Ctor, metodo: 'update' },
  {
    nombre: 'POST /integraciones/sync',
    controller: IntegracionController as unknown as Ctor,
    metodo: 'sync',
  },
  {
    nombre: 'POST /recursos',
    controller: RecursosController as unknown as Ctor,
    metodo: 'create',
  },
  {
    nombre: 'POST /team/:id/reset-2fa',
    controller: TeamController as unknown as Ctor,
    metodo: 'resetTwoFactor',
  },
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
      guard.canActivate(contextFor(SaludController as unknown as Ctor, 'check')),
    ).resolves.toBe(true);
  });

  it('GET /me pasa en AAL1 (la app lo pide antes de montar el gate)', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(MeController as unknown as Ctor, 'me', TOKEN_AAL1)),
    ).resolves.toBe(true);
  });

  it('POST /auth/2fa/recover pasa en AAL1 (esa es toda la gracia)', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(TwoFactorController as unknown as Ctor, 'recover', TOKEN_AAL1)),
    ).resolves.toBe(true);
  });

  it('PATCH /me/profile NO hereda la excepción del GET: sigue exigiendo AAL2', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(MeController as unknown as Ctor, 'updateProfile', TOKEN_AAL1)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('POST /auth/2fa/backup-codes/verify NO es excepción: exige AAL2', async () => {
    const guard = makeGuard();
    await expect(
      guard.canActivate(contextFor(TwoFactorController as unknown as Ctor, 'verify', TOKEN_AAL1)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// — S5 · B2: quién puede resetear el autenticador de otro —

/** ← ADAPTAR: los campos del `Profile` de esta app y sus roles. */
function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'dueno-1',
    user_id: 'user-1',
    role: 'dueno',
    full_name: 'Ana',
    email: 'ana@x.com',
    active: true,
    locale: 'es',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    ...over,
  } as Profile;
}

describe('POST /team/:id/reset-2fa — solo quien manda', () => {
  const MEMBER_ID = '6f1f2d64-6f1a-4a3e-9f6b-2b0f9a1c4d21';

  it('alguien de recepción recibe 403 y el servicio ni se llama', async () => {
    const team = { resetTwoFactor: vi.fn() };
    const controller = new TeamController(team as unknown as TeamService);
    const req: AuthRequest = { profile: makeProfile({ id: 'recepcion-2', role: 'recepcion' }) };

    await expect(controller.resetTwoFactor(req, MEMBER_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(team.resetTwoFactor).not.toHaveBeenCalled();
  });

  it('el dueño llega al servicio con su perfil y el id del miembro', async () => {
    const team = { resetTwoFactor: vi.fn().mockResolvedValue({ ok: true }) };
    const controller = new TeamController(team as unknown as TeamService);
    const dueno = makeProfile();
    const req: AuthRequest = { profile: dueno };

    await expect(controller.resetTwoFactor(req, MEMBER_ID)).resolves.toEqual({ ok: true });
    expect(team.resetTwoFactor).toHaveBeenCalledWith(dueno, MEMBER_ID);
  });
});
