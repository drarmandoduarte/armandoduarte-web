import { describe, it, expect, vi } from 'vitest';
/**
 * ── Adaptado del kit para esta app (orden Códice #15, C) ─────────────────
 * Viene de `Kit de Seguridad 512 v1.1.0 · tests-por-app/`. Lo que cambió son
 * **las rutas y los nombres de esta app**; la lógica que afirma es la del kit y
 * se dejó como estaba. El `LEEME.md` del kit pide exactamente eso: estos tests
 * «se copian pero se adaptan».
 */

import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Aal2Guard, readAalClaim, readMfaTimestamp } from './seguridad-512/nucleo/aal2.guard';
import type { SupabaseService } from './identidad/supabase.service';

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

function contextWith(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
  } as unknown as ExecutionContext;
}

describe('readAalClaim', () => {
  it('extrae aal de un JWT bien formado', () => {
    expect(readAalClaim(makeJwt({ aal: 'aal2' }))).toBe('aal2');
    expect(readAalClaim(makeJwt({ aal: 'aal1' }))).toBe('aal1');
  });
  it('devuelve undefined ante un token malformado', () => {
    expect(readAalClaim('no-es-un-jwt')).toBeUndefined();
    expect(readAalClaim(makeJwt({ sub: 'x' }))).toBeUndefined();
  });
});

describe('Aal2Guard', () => {
  function makeGuard() {
    const supabase = {
      getUserFromToken: vi.fn().mockResolvedValue({ id: 'u1', email: 'a@x.com' }),
    };
    return {
      guard: new Aal2Guard(supabase as unknown as SupabaseService, new Reflector()),
      supabase,
    };
  }

  it('deja pasar con aal=aal2 (token verificado)', async () => {
    const { guard, supabase } = makeGuard();
    const token = makeJwt({ aal: 'aal2' });
    await expect(guard.canActivate(contextWith(`Bearer ${token}`))).resolves.toBe(true);
    expect(supabase.getUserFromToken).toHaveBeenCalled();
  });

  it('403 AAL2_REQUIRED con aal=aal1', async () => {
    const { guard } = makeGuard();
    const token = makeJwt({ aal: 'aal1' });
    await expect(guard.canActivate(contextWith(`Bearer ${token}`))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('401 si falta el token', async () => {
    const { guard } = makeGuard();
    await expect(guard.canActivate(contextWith(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('propaga 401 si el token no es auténtico (Supabase lo rechaza)', async () => {
    const supabase = {
      getUserFromToken: vi.fn().mockRejectedValue(new UnauthorizedException('Token inválido.')),
    };
    const guard = new Aal2Guard(supabase as unknown as SupabaseService, new Reflector());
    const token = makeJwt({ aal: 'aal2' });
    await expect(guard.canActivate(contextWith(`Bearer ${token}`))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // — Freshness server-side (step-up real, no confiar en el marcador local) —
  const nowSec = () => Math.floor(Date.now() / 1000);

  it('deja pasar aal2 con verificación 2FA RECIENTE (amr totp fresco)', async () => {
    const { guard } = makeGuard();
    const token = makeJwt({ aal: 'aal2', amr: [{ method: 'totp', timestamp: nowSec() - 60 }] });
    await expect(guard.canActivate(contextWith(`Bearer ${token}`))).resolves.toBe(true);
  });

  it('403 AAL2_REQUIRED con aal2 pero verificación 2FA VENCIDA (amr viejo)', async () => {
    const { guard } = makeGuard();
    // 13 h atrás, mayor que el default de 12 h.
    const token = makeJwt({
      aal: 'aal2',
      amr: [{ method: 'totp', timestamp: nowSec() - 13 * 3600 }],
    });
    await expect(guard.canActivate(contextWith(`Bearer ${token}`))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('fail-open: aal2 SIN amr legible pasa (no trancar a todos por formato inesperado)', async () => {
    const { guard } = makeGuard();
    const token = makeJwt({ aal: 'aal2' }); // sin amr
    await expect(guard.canActivate(contextWith(`Bearer ${token}`))).resolves.toBe(true);
  });
});

describe('readMfaTimestamp', () => {
  it('devuelve el timestamp MFA más reciente del amr', () => {
    const token = makeJwt({
      amr: [
        { method: 'password', timestamp: 100 },
        { method: 'totp', timestamp: 500 },
        { method: 'mfa/totp', timestamp: 900 },
      ],
    });
    expect(readMfaTimestamp(token)).toBe(900);
  });
  it('undefined si no hay método MFA o falta amr', () => {
    expect(
      readMfaTimestamp(makeJwt({ amr: [{ method: 'password', timestamp: 100 }] })),
    ).toBeUndefined();
    expect(readMfaTimestamp(makeJwt({ aal: 'aal2' }))).toBeUndefined();
    expect(readMfaTimestamp('no-jwt')).toBeUndefined();
  });
});
