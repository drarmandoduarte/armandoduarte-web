/**
 * Después del login, la app pregunta quién es — orden Códice #15, punto 4.
 *
 * ── El defecto, medido en F.4 cuarta corrida (30/9/2026) ────────────────
 * Correo → código → «Entrar»: `POST /auth/v1/verify` 200, la sesión existía, y
 * **no salía ningún `GET /api/yo`**. La pantalla decía «No pudimos confirmar tu
 * cuenta»; «Volver a intentar» llegaba a Mi espacio. Dos cosas mal juntas en
 * `sesion.ts`: montar sin sesión se anotaba como «la API no contestó», y el
 * `onAuthStateChange` solo guardaba la sesión nueva sin volver a preguntar.
 *
 * Se monta `App` entera, con Supabase y `fetch` simulados, porque el defecto
 * no estaba en ninguna pieza sola sino en cómo se encadenaban.
 *
 * Mutaciones (en el informe): sacar el `recargar()` del callback → caen
 * «EL CASO» y «se espera». Volver el estado sin sesión a `'no-contesto'` → cae
 * «se espera», que es donde ese valor hacía daño: sin sesión `App` pinta la
 * entrada sin mirar la decisión, así que «montar sin sesión» pasa igual y está
 * para que eso siga siendo cierto.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

/* ── Supabase, simulado ─────────────────────────────────────────────────
   Guarda la sesión «actual» y el callback de `onAuthStateChange`, para poder
   disparar el evento como lo dispara supabase-js después de `verifyOtp`. */
const falso = vi.hoisted(() => ({
  sesion: null as Session | null,
  avisar: null as ((evento: AuthChangeEvent, sesion: Session | null) => void) | null,
}));

vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: falso.sesion }, error: null }),
      onAuthStateChange: (cb: (evento: AuthChangeEvent, sesion: Session | null) => void) => {
        falso.avisar = cb;
        return { data: { subscription: { unsubscribe: () => { falso.avisar = null; } } } };
      },
      signOut: async () => ({ error: null }),
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({
          data: { currentLevel: 'aal1', nextLevel: 'aal1', currentAuthenticationMethods: [] },
          error: null,
        }),
      },
    },
  },
}));

import i18n from '../i18n';
import { design } from '../molde/arranque';
import { App } from '../App';

/** Un JWT con `aal: aal1`. La firma no importa: la app no la verifica. */
function token(): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ aal: 'aal1', sub: 'u-1' })}.firma`;
}

const sesionNueva = { access_token: token(), user: { id: 'u-1' } } as unknown as Session;

const pedidos: string[] = [];

beforeEach(() => {
  falso.sesion = null;
  falso.avisar = null;
  pedidos.length = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    pedidos.push(url);
    if (url === '/api/yo') {
      return new Response(JSON.stringify({
        rol: 'cliente',
        tipo: 'cliente',
        /* Ficha completa: si no, la pantalla sería `/empezar` (#29 C). */
        persona: { id: 'p-1', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 000 0000', pais: 'MX' },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const t = (clave: string) => i18n.t(clave);
/* El título de /login (P1) es la frase de marca del design.json (#37 PR 2),
   con su palabra entre asteriscos: se busca como encabezado, sin ellos. */
const sinEspacios = (s: string) => s.replace(/[\s*]/g, '');
/* jsdom arma el nombre accesible con espacios alrededor del `<span>` de la
   palabra; el navegador no. Se compara sin espacios para medir lo que importa. */
const tituloDeEntrar = () => screen.findByRole('heading', {
  name: (nombre) => sinEspacios(nombre) === sinEspacios((design.app.frase as { es: string }).es),
});
const pedidosDeYo = () => pedidos.filter((u) => u === '/api/yo').length;

describe('la sesión, después de entrar', () => {
  it('montar sin sesión → la pantalla de entrada, nunca el error', async () => {
    render(<App />);
    expect(await tituloDeEntrar()).toBeTruthy();
    expect(screen.queryByText(t('comun.noConfirmamos'))).toBeNull();
    expect(pedidosDeYo()).toBe(0);
  });

  it('EL CASO: llega SIGNED_IN → sale UN `GET /api/yo` y la pantalla es Mi espacio', async () => {
    render(<App />);
    await tituloDeEntrar();

    /* Lo que hace supabase-js al terminar `verifyOtp`: la sesión ya está
       guardada y avisa. */
    await act(async () => {
      falso.sesion = sesionNueva;
      falso.avisar?.('SIGNED_IN', sesionNueva);
    });

    expect(await screen.findByText(t('miEspacio.bajada'))).toBeTruthy();
    expect(screen.queryByText(t('comun.noConfirmamos'))).toBeNull();
    expect(pedidosDeYo()).toBe(1);
  });

  it('entre el aviso y la respuesta se espera: ni error, ni enrolar', async () => {
    /* La ventana entre el SIGNED_IN y el `/api/yo`. Con `rol: undefined`, el
       kit diría `enrolar` — el defecto del 29/9 por otra puerta. */
    render(<App />);
    await tituloDeEntrar();

    act(() => {
      falso.sesion = sesionNueva;
      falso.avisar?.('SIGNED_IN', sesionNueva);
    });

    expect(screen.getByRole('status').textContent).toBe(t('comun.cargando'));
    expect(screen.queryByText(t('comun.noConfirmamos'))).toBeNull();
    await screen.findByText(t('miEspacio.bajada'));
  });

  it('salir → vuelve a la entrada, no al error', async () => {
    falso.sesion = sesionNueva;
    render(<App />);
    await screen.findByText(t('miEspacio.bajada'));

    await act(async () => {
      falso.sesion = null;
      falso.avisar?.('SIGNED_OUT', null);
    });

    expect(await tituloDeEntrar()).toBeTruthy();
    expect(screen.queryByText(t('comun.noConfirmamos'))).toBeNull();
  });
});
