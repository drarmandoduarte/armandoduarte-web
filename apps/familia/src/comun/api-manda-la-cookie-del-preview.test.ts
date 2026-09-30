/**
 * El `fetch` de la app manda la cookie del mismo origen — F.4, tercera corrida.
 *
 * ── El caso, del 29/9/2026 ──────────────────────────────────────────────
 * Los previews de Vercel están detrás de *Vercel Authentication*, que protege el
 * despliegue con una cookie. El navegador la tenía —por eso la pantalla
 * cargaba—, pero cada llamada de `api()` salía con `credentials: 'omit'`,
 * llegaba al borde **sin** esa cookie y volvía **503**. La app se veía y no
 * funcionaba, y la causa no estaba en la API.
 *
 * Es el modo de falla de la casa otra vez —una opción de transporte que nadie
 * mira hasta que está publicada, como el `X-Robots-Tag` de la #08 o el `exports`
 * de la #15— y el costo acá era peor que un 503 suelto: **sin esto F.4 no se
 * puede correr nunca contra un preview**, y F.4 es lo que dice si la #15 sirve.
 *
 * ── Qué afirma, y qué no ────────────────────────────────────────────────
 * Que la opción viaje en el `fetch`, que es lo único que esta app decide. Que
 * Vercel acepte la cookie es de Vercel y se mide en F.4, contra el preview.
 *
 * No afirma `'include'`: sería otra cosa —cookies hacia cualquier origen— y no
 * hace falta, porque el pedido es a `/api/…`, el mismo origen que la pantalla.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* El cliente de Supabase no se toca en este archivo: lo único que `api()` le
   pide es el token de la sesión, y acá se lo da un doble. Montar el cliente de
   verdad traería `import.meta.env` y una conexión que no se usa. */
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'un-token-cualquiera' } } }),
    },
  },
}));

const { api } = await import('./api');

/** Lo que el `fetch` recibió en la última llamada. */
let ultimaLlamada: { url: string; init: RequestInit } | null = null;

beforeEach(() => {
  ultimaLlamada = null;
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    ultimaLlamada = { url, init };
    return Promise.resolve({ ok: true, json: async () => ({ rol: 'cliente' }) } as Response);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api()', () => {
  it('manda las cookies del mismo origen, que es lo que el preview de Vercel exige', async () => {
    await api('yo');

    /* EL PISO, PRIMERO: sin esto, «credentials es same-origin» sobre una
       llamada que nunca ocurrió se leería igual de verde. */
    expect(ultimaLlamada, 'api() no llamó a fetch').not.toBeNull();
    expect(ultimaLlamada!.url).toBe('/api/yo');

    expect(
      ultimaLlamada!.init.credentials,
      'con `omit` el fetch llega al borde de Vercel sin la cookie de Vercel Authentication y '
      + 'vuelve 503: la pantalla carga y nada funciona. Con `include` viajarían también hacia '
      + 'otros orígenes, que no hace falta porque el pedido es al propio.',
    ).toBe('same-origin');
  });

  it('y el token sigue yendo en el header, que es lo que autoriza de verdad', async () => {
    /* La otra mitad, y va separada: la cookie es del borde de Vercel, no de
       nuestra autenticación. Si algún día alguien leyera este archivo como «la
       sesión viaja en cookie», este test dice que no. */
    await api('yo');
    const cabeceras = ultimaLlamada!.init.headers as Record<string, string>;
    expect(cabeceras.Authorization).toBe('Bearer un-token-cualquiera');
  });

  it('un POST con cuerpo manda las mismas cookies', async () => {
    /* Porque la opción está escrita una sola vez y vale para los dos verbos;
       si alguien la moviera a un `if`, esto lo dice. */
    await api('respaldo/generar', { metodo: 'POST', cuerpo: { algo: 1 } });
    expect(ultimaLlamada!.init.method).toBe('POST');
    expect(ultimaLlamada!.init.credentials).toBe('same-origin');
  });
});
