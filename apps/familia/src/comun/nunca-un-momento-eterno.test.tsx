/**
 * Nunca un «Un momento…» eterno — orden Códice #22.
 *
 * El caso, del 30/9: si `getAuthenticatorAssuranceLevel()` fallaba, nadie
 * atrapaba la excepción, `cargando` no bajaba nunca y la pantalla quedaba en
 * «Un momento…» para siempre. Se monta `App` entera, con Supabase simulado.
 *
 * Mutaciones (en el informe de la #22): sin el `finally` que baja `cargando`
 * → cae (a); sin el tope → cae (b).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const falso = vi.hoisted(() => ({
  sesion: null as Session | null,
  niveles: (() => Promise.resolve({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null })) as () => Promise<unknown>,
}));

vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: falso.sesion }, error: null }),
      onAuthStateChange: (_cb: (e: AuthChangeEvent, s: Session | null) => void) =>
        ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      mfa: { getAuthenticatorAssuranceLevel: () => falso.niveles() },
    },
  },
}));

import i18n from '../i18n';
import { App } from '../App';
import { TOPE_DE_ESPERA_MS } from './sesion';

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const sesion = { access_token: `${b64({ alg: 'HS256' })}.${b64({ aal: 'aal1' })}.c2lnbmF0dXJh`, user: { id: 'u' } } as unknown as Session;

const t = (clave: string) => i18n.t(clave);

beforeEach(() => {
  falso.sesion = sesion;
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    /* Con la ficha completa: sin nombre, apellido o WhatsApp la pantalla sería
       `/empezar` (#29 C), y lo que se prueba acá es la espera, no la ficha. */
    rol: 'cliente', tipo: 'cliente',
    persona: { id: 'p-1', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 000 0000', pais: 'MX' },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('nunca un «Un momento…» eterno', () => {
  it('(a) EL CASO: si leer los niveles falla, la pantalla de error — no la espera', async () => {
    falso.niveles = () => Promise.reject(new Error('JWT not in base64url format'));
    render(<App />);
    expect(await screen.findByText(t('comun.noConfirmamos'))).toBeTruthy();
    expect(screen.queryByText(t('comun.cargando'))).toBeNull();
    /* Y es la pantalla que ya existía: con sus dos salidas. */
    expect(screen.getByRole('button', { name: t('comun.reintentar') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('comun.cerrarSesion') })).toBeTruthy();
  });

  it(`(b) si nunca contesta, a los ${TOPE_DE_ESPERA_MS / 1000} s la pantalla de error`, async () => {
    vi.useFakeTimers();
    falso.niveles = () => new Promise(() => {});
    render(<App />);
    await act(async () => { await vi.advanceTimersByTimeAsync(TOPE_DE_ESPERA_MS - 1); });
    /* Un milisegundo antes del tope, todavía se espera: el tope no se adelanta. */
    expect(screen.getByRole('status').textContent).toBe(t('comun.cargando'));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(screen.getByText(t('comun.noConfirmamos'))).toBeTruthy();
    expect(screen.queryByText(t('comun.cargando'))).toBeNull();
  });

  it('y cuando todo contesta, nada cambió: Mi espacio', async () => {
    falso.niveles = () => Promise.resolve({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null });
    render(<App />);
    expect(await screen.findByRole('heading', { name: /^Hola/ })).toBeTruthy();
  });
});
