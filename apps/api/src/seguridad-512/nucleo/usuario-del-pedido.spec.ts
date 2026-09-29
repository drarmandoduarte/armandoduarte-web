import { describe, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { usuarioDelPedido } from './usuario-del-pedido';
import { Aal2Guard } from './aal2.guard';
import type { VerificadorDeToken } from './verificador-de-token';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import type { ProfilesRepository } from '../../auth/profiles.repository';
import type { SupabaseService } from '../../shared/supabase.service';

/**
 * UNA sola validación del token por pedido.
 *
 * Desde que `Aal2Guard` es global (S3), las rutas que además usan
 * `SupabaseAuthGuard` validaban el MISMO token contra Supabase dos veces por
 * pedido: dos viajes de red idénticos, uno al lado del otro. El catálogo de
 * propiedades es donde más se nota.
 */

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const nowSec = () => Math.floor(Date.now() / 1000);
const TOKEN_AAL2 = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() }] });
const OTRO_TOKEN_AAL2 = makeJwt({
  aal: 'aal2',
  amr: [{ method: 'totp', timestamp: nowSec() }],
  sub: 'otro-usuario',
});

describe('usuarioDelPedido', () => {
  it('valida una vez y reutiliza dentro del MISMO pedido', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    const pedido = {};
    const a = await usuarioDelPedido(pedido, 'tok', { getUserFromToken: verificar });
    const b = await usuarioDelPedido(pedido, 'tok', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('un token DISTINTO se vuelve a validar aunque sea el mismo pedido', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    const pedido = {};
    await usuarioDelPedido(pedido, 'tok-a', { getUserFromToken: verificar });
    await usuarioDelPedido(pedido, 'tok-b', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(2);
  });

  it('NO hay caché entre pedidos: otro pedido con el mismo token revalida', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    await usuarioDelPedido({}, 'tok', { getUserFromToken: verificar });
    await usuarioDelPedido({}, 'tok', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(2);
  });

  it('si el pedido no admite guardar nada, valida siempre (falla hacia la validación)', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    await usuarioDelPedido(null, 'tok', { getUserFromToken: verificar });
    await usuarioDelPedido(null, 'tok', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(2);
  });

  it('propaga el error del verificador (no se inventa un usuario)', async () => {
    const verificar = vi.fn().mockRejectedValue(new Error('token inválido'));
    await expect(usuarioDelPedido({}, 'tok', { getUserFromToken: verificar })).rejects.toThrow(
      'token inválido',
    );
  });
});

/** Lo único que los guards le piden al verificador. */
interface VerificadorFalso {
  getUserFromToken: ReturnType<typeof vi.fn>;
}

/** Igual que en producción: el guard global corre primero, el de sesión después. */
async function correrLosDosGuards(supabase: VerificadorFalso): Promise<void> {
  const profiles = {
    findByUserId: vi.fn().mockResolvedValue({ id: 'p1', role: 'owner', active: true }),
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
      findByUserId: vi.fn().mockResolvedValue({ id: 'p1', role: 'owner', active: true }),
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
    expect(request.profile).toEqual({ id: 'p1', role: 'owner', active: true });
    expect(profiles.findByUserId).toHaveBeenCalledWith('u1');
  });
});
