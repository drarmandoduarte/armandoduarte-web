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
 *
 * ── Lo adaptado en Mi espacio (orden #37, PR 2) ──────────────────────────
 * Mi espacio no tiene un guard de sesión: tiene `RolMiddleware`, que valida el
 * token para dejar el rol en el pedido y corre ANTES del guard global (en
 * Nest, el middleware va antes que los guards). Es la misma pareja con el
 * orden al revés, así que el archivo sí se instala: lo que prueba —una sola
 * validación por pedido— vale igual. Los perfiles salen de `rolDe()` del
 * `SupabaseService`, no de un repositorio aparte.
 */
import { describe, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { Aal2Guard } from '../acceso/nucleo/aal2.guard';
import type { VerificadorDeToken } from '../acceso/nucleo/verificador-de-token';
import type { Request, Response } from 'express';
import { RolMiddleware } from '../identidad/rol.middleware';           // ← ADAPTAR: hecho, el «guard de sesión» de Mi espacio
/* ← ADAPTAR: hecho. Sin `ProfilesRepository`: el rol lo lee `rolDe()`. */
import type { SupabaseService } from '../identidad/supabase.service';  // ← ADAPTAR: hecho

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}
const nowSec = () => Math.floor(Date.now() / 1000);
const TOKEN_AAL2 = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() }] });
const OTRO_TOKEN_AAL2 = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() }], sub: 'otro-usuario' });

/** Lo único que el guard y el middleware le piden al verificador. ← ADAPTAR: hecho, más `rolDe`. */
interface VerificadorFalso {
  getUserFromToken: ReturnType<typeof vi.fn>;
  rolDe?: ReturnType<typeof vi.fn>;
}

/** ← ADAPTAR: hecho. Correr el middleware de Mi espacio sobre un pedido. */
async function correrElMiddleware(supabase: VerificadorFalso, request: object): Promise<void> {
  if (!supabase.rolDe) supabase.rolDe = vi.fn().mockResolvedValue('dueno');
  await new RolMiddleware(supabase as unknown as SupabaseService).use(
    request as Request,
    {} as Response,
    () => undefined,
  );
}

/** Igual que en producción: en Mi espacio el middleware corre primero y el guard global después. */
async function correrLosDosGuards(supabase: VerificadorFalso): Promise<void> {
  const aal2 = new Aal2Guard(supabase as unknown as VerificadorDeToken, new Reflector());
  // El MISMO objeto request para los dos, como hace Nest.
  const request = { headers: { authorization: `Bearer ${TOKEN_AAL2}` } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;

  await correrElMiddleware(supabase, request);
  await aal2.canActivate(context);
}

describe('Aal2Guard + RolMiddleware en el mismo pedido', () => {
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
    /* ← ADAPTAR: hecho. En Mi espacio el perfil es `{ role }` y lo resuelve
       `rolDe(token, id)`; el usuario verificado queda en la ranura del núcleo. */
    const rolDe = vi.fn().mockResolvedValue('dueno');
    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${TOKEN_AAL2}` },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
    await correrElMiddleware({ ...supabase, rolDe }, request);
    await new Aal2Guard(supabase as unknown as VerificadorDeToken, new Reflector()).canActivate(
      context,
    );
    expect(request.profile).toEqual({ role: 'dueno' });
    expect(rolDe).toHaveBeenCalledWith(TOKEN_AAL2, 'u1');
    expect(supabase.getUserFromToken).toHaveBeenCalledTimes(1);
  });
});
