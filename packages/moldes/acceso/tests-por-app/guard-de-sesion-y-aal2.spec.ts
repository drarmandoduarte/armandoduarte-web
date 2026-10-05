/**
 * KIT DE ACCESO · TEST POR APP (se adapta, no es núcleo) · desde v1.2.1
 *
 * Prueba que el guard global `Aal2Guard` y el guard de sesión DE ESTA APP validen
 * el token UNA sola vez por pedido. En la referencia el guard de sesión se llama
 * `SupabaseAuthGuard` y vive en `auth/`; cada app cambia estas tres importaciones
 * por las de su propio guard y repositorio de perfiles. Si la app no tiene guard
 * de sesión aparte del Aal2Guard, este archivo no se instala.
 *
 * PLANTILLA: se copia, se adaptan las líneas `← ADAPTAR` y recién ahí se corre.
 * Va en: `<api>/src/auth/` (o cualquier carpeta un nivel abajo de `src/`).
 */
import { describe, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { Aal2Guard } from '../acceso/nucleo/aal2.guard';
import type { VerificadorDeToken } from '../acceso/nucleo/verificador-de-token';
import { SupabaseAuthGuard } from '../auth/auth.guard';            // ← ADAPTAR
import type { ProfilesRepository } from '../auth/profiles.repository'; // ← ADAPTAR
import type { SupabaseService } from '../shared/supabase.service';     // ← ADAPTAR

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}
const nowSec = () => Math.floor(Date.now() / 1000);
const TOKEN_AAL2 = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() }] });
const OTRO_TOKEN_AAL2 = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() }], sub: 'otro-usuario' });

/** Lo único que los guards le piden al verificador. */
interface VerificadorFalso {
  getUserFromToken: ReturnType<typeof vi.fn>;
}

/** Igual que en producción: el guard global corre primero, el de sesión después. */
async function correrLosDosGuards(supabase: VerificadorFalso): Promise<void> {
  const profiles = {
    findByUserId: vi.fn().mockResolvedValue({ id: 'p1', role: 'dueno', active: true }),
  };
  const aal2 = new Aal2Guard(supabase as unknown as VerificadorDeToken, new Reflector());
  const sesion = new SupabaseAuthGuard(
    supabase as unknown as SupabaseService,
    profiles as unknown as ProfilesRepository,
  );
  // El MISMO objeto request para los dos guards, como hace Nest.
  const request = { headers: { authorization: `Bearer ${TOKEN_AAL2}` } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;

  await aal2.canActivate(context);
  await sesion.canActivate(context);
}

describe('Aal2Guard + SupabaseAuthGuard en el mismo pedido', () => {
  it('validan el token UNA sola vez (antes eran dos viajes a Supabase)', async () => {
    const supabase = {
      getUserFromToken: vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' }),
    };
    await correrLosDosGuards(supabase);
    expect(supabase.getUserFromToken).toHaveBeenCalledTimes(1);
  });

  it('un pedido nuevo con otro token vuelve a validar', async () => {
    const supabase = {
      getUserFromToken: vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' }),
    };
    await correrLosDosGuards(supabase);
    // Segundo pedido, token distinto: request nuevo, nada que reutilizar.
    const request = { headers: { authorization: `Bearer ${OTRO_TOKEN_AAL2}` } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
    await new Aal2Guard(supabase as unknown as VerificadorDeToken, new Reflector()).canActivate(
      context,
    );
    expect(supabase.getUserFromToken).toHaveBeenCalledTimes(2);
    expect(supabase.getUserFromToken).toHaveBeenLastCalledWith(OTRO_TOKEN_AAL2);
  });

  it('el perfil queda resuelto igual que antes (el atajo no se saltea nada)', async () => {
    const supabase = {
      getUserFromToken: vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' }),
    };
    const profiles = {
      findByUserId: vi.fn().mockResolvedValue({ id: 'p1', role: 'dueno', active: true }),
    };
    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${TOKEN_AAL2}` },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
    await new Aal2Guard(supabase as unknown as VerificadorDeToken, new Reflector()).canActivate(
      context,
    );
    await new SupabaseAuthGuard(
      supabase as unknown as SupabaseService,
      profiles as unknown as ProfilesRepository,
    ).canActivate(context);
    expect(request.authUser).toEqual({ id: 'u1', email: 'ana@x.com' });
    expect(request.profile).toEqual({ id: 'p1', role: 'dueno', active: true });
    expect(profiles.findByUserId).toHaveBeenCalledWith('u1');
  });
});
