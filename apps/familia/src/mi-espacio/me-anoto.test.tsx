/**
 * «Me anoto» en la pantalla, con `App` entera — orden #24 B.
 *
 * Supabase simulado (como en `nunca-un-momento-eterno.test.tsx`) y la API
 * respondiendo con **datos de prueba**. Lo que se afirma es lo que ve la
 * persona: que `/me-anoto/<slug>` abre el paso con ese taller, que pide solo lo
 * que falta, que la confirmación muestra la referencia y —sin datos de cobro—
 * el enlace a Gaby, que «sin lugares» se dice en claro, y que hay **un**
 * naranja por pantalla.
 *
 * Lo que la base decide (cupo, cerrada, duplicado) está probado en el banco:
 * `packages/db/src/me-anoto.test.ts`. Acá la API se simula.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const falso = vi.hoisted(() => ({ sesion: null as Session | null }));

vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: falso.sesion }, error: null }),
      onAuthStateChange: (_cb: (e: AuthChangeEvent, s: Session | null) => void) =>
        ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null }) },
    },
  },
}));

import i18n from '../i18n';
import { App } from '../App';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const sesion = { access_token: `${b64({ alg: 'HS256' })}.${b64({ aal: 'aal1' })}.c2lnbmF0dXJh`, user: { id: 'u' } } as unknown as Session;

const SLUG = 'el-arte-de-amar-a-tu-adolescente';
const taller = (campos: Record<string, unknown> = {}) => ({
  edicion_id: '11111111-1111-4111-8111-111111111111', curso_slug: SLUG, curso_titulo: 'El arte de amar a tu adolescente',
  curso_bajada: null, modalidad: 'presencial', inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z',
  zona: 'America/Merida', sede: 'Sede de prueba', ciudad: 'Mérida', pais: 'MX', precio_monto: 1170, precio_moneda: 'MXN',
  lugares: 12, mi_referencia: null, ...campos,
});
const otro = taller({ edicion_id: '22222222-2222-4222-8222-222222222222', curso_slug: 'otro-taller', curso_titulo: 'Otro taller', lugares: null });

let respuestas: { yo: object; talleres: object; inscribirme: { status: number; cuerpo: object }; guardarYo?: () => void };
let pedidos: { ruta: string; cuerpo: unknown }[];

beforeEach(() => {
  falso.sesion = sesion;
  pedidos = [];
  respuestas = {
    /* Ficha completa: desde la #29 C, sin nombre, apellido o WhatsApp se pasa
       antes por `/empezar` (lo prueba el último bloque de este archivo). */
    yo: { rol: 'cliente', tipo: 'cliente', persona: { id: 'u', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 123 4567', pais: 'MX', zona_horaria: 'America/Merida' } },
    talleres: { abiertos: [taller(), otro], mios: [] },
    inscribirme: { status: 200, cuerpo: { referencia: 'AD-0042', ya_estaba: false, cobro: null } },
  };
  vi.stubGlobal('fetch', vi.fn(async (url: string, opciones?: { body?: string }) => {
    const ruta = new URL(url, 'http://local').pathname;
    pedidos.push({ ruta, cuerpo: opciones?.body ? JSON.parse(opciones.body) : undefined });
    const json = (cuerpo: object, status = 200) =>
      new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
    if (ruta === '/api/yo' && opciones?.body) { respuestas.guardarYo?.(); return json({ ok: true }); }
    if (ruta === '/api/yo') return json(respuestas.yo);
    if (ruta === '/api/talleres') return json(respuestas.talleres);
    if (ruta === '/api/talleres/inscribirme') return json(respuestas.inscribirme.cuerpo, respuestas.inscribirme.status);
    return json({});
  }));
  window.history.replaceState(null, '', `/me-anoto/${SLUG}`);
  window.sessionStorage.clear();
  /* jsdom no implementa `scrollTo`; la confirmación sube la página al aparecer. */
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const naranjas = () => document.querySelectorAll('.btn--naranja').length;

describe('/me-anoto/<slug> abre «Me anoto» con ese taller', () => {
  it('el paso viene abierto y, con la ficha completa (#29 C), no pide ningún dato', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: t('miEspacio.confirmarLugar') })).toBeTruthy();
    for (const id of ['anotarse-nombre', 'anotarse-apellido', 'anotarse-whatsapp']) {
      expect(document.getElementById(id), id).toBeNull();
    }
    /* «Quedan 12» se dice (≤ 15); del otro, sin tope, no se dice número. */
    expect(screen.getByText(t('miEspacio.quedanLugares', { count: 12 }))).toBeTruthy();
    expect(naranjas(), 'un solo naranja: «Confirmar mi lugar»').toBe(1);
  });

  it('confirmar manda la edición y muestra la referencia; sin cobro, el enlace a Gaby', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('miEspacio.confirmarLugar') }));

    expect(await screen.findByText('AD-0042')).toBeTruthy();
    expect(screen.getByText(t('miEspacio.listo'))).toBeTruthy();
    const pedido = pedidos.find((p) => p.ruta === '/api/talleres/inscribirme');
    expect(pedido?.cuerpo).toEqual({ edicion_id: taller().edicion_id });

    expect(screen.getByText(t('miEspacio.cobroPorWhatsapp'))).toBeTruthy();
    const gaby = screen.getByRole('link', { name: t('miEspacio.escribirAGaby') }) as HTMLAnchorElement;
    expect(gaby.href).toMatch(/^https:\/\/wa\.me\/524621993143\?text=/);
    expect(decodeURIComponent(gaby.href)).toContain('AD-0042');
    expect(screen.queryByText(t('miEspacio.clabe'))).toBeNull();
  });

  it('con datos de cobro, la CLABE y su botón de copiar', async () => {
    respuestas.yo = { ...respuestas.yo, persona: { id: 'u', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 123 4567', pais: 'MX' } };
    respuestas.inscribirme.cuerpo = {
      referencia: 'AD-0043', ya_estaba: false,
      cobro: { banco: 'Banco de prueba', titular: 'Titular de prueba', clabe: '000000000000000000', concepto_sugerido: null },
    };
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('miEspacio.confirmarLugar') }));
    expect(await screen.findByText('000000000000000000')).toBeTruthy();
    expect(screen.getByRole('button', { name: t('miEspacio.copiarClabe') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('miEspacio.copiarReferencia') })).toBeTruthy();
  });

  it('sin lugares: el mensaje claro, no un error genérico', async () => {
    respuestas.inscribirme = { status: 409, cuerpo: { code: 'SIN_LUGARES', message: 'x' } };
    respuestas.yo = { ...respuestas.yo, persona: { id: 'u', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 123 4567', pais: 'MX' } };
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('miEspacio.confirmarLugar') }));
    expect(await screen.findByText(t('miEspacio.errores.sinLugares'))).toBeTruthy();
  });

  it('ya anotada: su referencia en la tarjeta y ningún «Me anoto» para ese taller', async () => {
    respuestas.talleres = { abiertos: [taller({ mi_referencia: 'AD-0007' })], mios: [] };
    render(<App />);
    expect(await screen.findByText(t('miEspacio.yaTienesTuLugar', { referencia: 'AD-0007' }))).toBeTruthy();
    expect(screen.queryByRole('button', { name: t('miEspacio.meAnoto') })).toBeNull();
  });
});

describe('sin slug: Talleres con la lista (#29: su propia pantalla)', () => {
  it('ningún paso abierto, el primer «Me anoto» en naranja y el otro en contorno: un naranja', async () => {
    window.history.replaceState(null, '', '/talleres');
    render(<App />);
    const botones = await screen.findAllByRole('button', { name: t('miEspacio.meAnoto') });
    expect(botones).toHaveLength(2);
    expect(botones[0].className).toContain('btn--naranja');
    expect(botones[1].className).not.toContain('btn--naranja');
    expect(naranjas()).toBe(1);
  });

  it('sin talleres abiertos, se dice, y la pantalla no tiene naranja (no hay nada que hacer)', async () => {
    window.history.replaceState(null, '', '/talleres');
    respuestas.talleres = { abiertos: [], mios: [] };
    render(<App />);
    expect(await screen.findByText(t('miEspacio.talleresVacio'))).toBeTruthy();
    expect(naranjas()).toBe(0);
  });
});

describe('?ir= (orden #24 B, a)', () => {
  it('sin sesión en /me-anoto/<slug>: a /login?ir= (#35) y el destino queda guardado', async () => {
    falso.sesion = null;
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(new URLSearchParams(window.location.search).get('ir')).toBe(`/me-anoto/${SLUG}`);
    expect(window.sessionStorage.getItem('codice.destino-despues-de-entrar')).toBe(`/me-anoto/${SLUG}`);
  });

  it('con sesión y un destino guardado (la vuelta de Google cae en /), va ahí y lo olvida', async () => {
    window.history.replaceState(null, '', '/');
    window.sessionStorage.setItem('codice.destino-despues-de-entrar', `/me-anoto/${SLUG}`);
    render(<App />);
    expect(await screen.findByRole('button', { name: t('miEspacio.confirmarLugar') })).toBeTruthy();
    expect(window.location.pathname).toBe(`/me-anoto/${SLUG}`);
    expect(window.sessionStorage.getItem('codice.destino-despues-de-entrar')).toBeNull();
  });

  it('LA MUTACIÓN DE LA ORDEN: /entrar?ir=https://otro.sitio con sesión → Mi espacio', async () => {
    window.history.replaceState(null, '', '/entrar?ir=https://otro.sitio');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/mi-espacio'));
    expect(window.location.host).toBe('localhost:3000');
  });
});

describe('#29 C: sin los tres datos, primero /empezar — y el taller espera', () => {
  it('EL CASO: llega a /me-anoto/<slug> sin apellido ni WhatsApp → /empezar; al guardar, de vuelta al taller', async () => {
    respuestas.yo = { rol: 'cliente', tipo: 'cliente', persona: { id: 'u', nombre: 'Prueba', apellido: null, whatsapp: null, pais: 'MX' } };
    respuestas.guardarYo = () => {
      respuestas.yo = { rol: 'cliente', tipo: 'cliente', persona: { id: 'u', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 123 4567', pais: 'MX' } };
    };
    window.history.replaceState(null, '', '/entrar?ir=%2Fme-anoto%2F' + SLUG);
    render(<App />);
    expect(await screen.findByRole('button', { name: t('empezar.guardar') })).toBeTruthy();
    await waitFor(() => expect(window.location.pathname).toBe('/empezar'));
    /* El destino no se olvidó: espera a que termine /empezar. */
    expect(window.sessionStorage.getItem('codice.destino-despues-de-entrar')).toBe(`/me-anoto/${SLUG}`);
    expect(naranjas(), 'un botón: «Guardar y entrar»').toBe(1);

    fireEvent.change(document.getElementById('empezar-apellido')!, { target: { value: 'Prueba' } });
    fireEvent.change(document.getElementById('empezar-whatsapp')!, { target: { value: '+52 999 123 4567' } });
    fireEvent.click(screen.getByRole('button', { name: t('empezar.guardar') }));

    expect(await screen.findByRole('button', { name: t('miEspacio.confirmarLugar') })).toBeTruthy();
    expect(window.location.pathname).toBe(`/me-anoto/${SLUG}`);
    /* #32: el WhatsApp viaja en E.164. */
    expect(pedidos.find((p) => p.ruta === '/api/yo' && p.cuerpo)?.cuerpo).toEqual({
      nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+529991234567', pais: 'MX',
    });
  });

  it('los tres son obligatorios: sin ellos no se manda nada y cada campo lo dice', async () => {
    respuestas.yo = { rol: 'cliente', tipo: 'cliente', persona: { id: 'u', nombre: null, apellido: null, whatsapp: null, pais: null } };
    window.history.replaceState(null, '', '/mi-espacio');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('empezar.guardar') }));
    expect(await screen.findByText(t('miEspacio.errores.nombre'))).toBeTruthy();
    expect(screen.getByText(t('miEspacio.errores.apellido'))).toBeTruthy();
    expect(screen.getByText(t('miEspacio.errores.whatsapp'))).toBeTruthy();
    expect(pedidos.some((p) => p.ruta === '/api/yo' && p.cuerpo)).toBe(false);
    /* País, México por defecto. */
    expect((document.getElementById('empezar-pais') as HTMLSelectElement).value).toBe('MX');
  });

  it('con los tres datos, /empezar escrita a mano va a Inicio', async () => {
    window.history.replaceState(null, '', '/empezar');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/mi-espacio'));
    expect(screen.queryByRole('button', { name: t('empezar.guardar') })).toBeNull();
  });
});
