/**
 * Las pantallas de acceso del guion v1 del Kit 512 — orden #35.
 *
 * `App` entera, con Supabase y la API simulados. Lo que se afirma es lo que el
 * guion fija (§2–§4): la anatomía, el orden de los elementos, los textos
 * `auth.*`, la casilla de 6 que verifica sola, el error con los intentos, las
 * direcciones de cada pantalla, el selector de idioma que cambia y se
 * recuerda, y que no hay fotos ni naranja. Cómo se ve, el contraste y el
 * acento se miden en el navegador (`check/capturas-35.mjs`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const falso = vi.hoisted(() => ({
  sesion: null as Session | null,
  siguiente: 'aal1' as 'aal1' | 'aal2',
  otpOk: false,
  totpOk: false,
  llamadas: [] as string[],
}));

vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: falso.sesion }, error: null }),
      onAuthStateChange: (_cb: (e: AuthChangeEvent, s: Session | null) => void) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => { falso.llamadas.push('signOut'); return { error: null }; },
      signInWithOtp: async (o: { email: string }) => { falso.llamadas.push(`otp:${o.email}`); return { error: null }; },
      verifyOtp: async (o: { token: string }) => { falso.llamadas.push(`verifyOtp:${o.token}`); return { error: falso.otpOk ? null : { message: 'x' } }; },
      signInWithOAuth: async () => { falso.llamadas.push('google'); return { error: null }; },
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal1', nextLevel: falso.siguiente }, error: null }),
        listFactors: async () => ({ data: { totp: [{ id: 'f-1' }] }, error: null }),
        challenge: async () => ({ data: { id: 'ch-1' }, error: null }),
        verify: async (o: { code: string }) => { falso.llamadas.push(`verify:${o.code}`); return { error: falso.totpOk ? null : { message: 'x' } }; },
        enroll: async () => ({ data: { id: 'f-2', totp: { qr_code: 'data:image/svg+xml;utf8,<svg/>', secret: 'ABCD', uri: 'otpauth://totp/x' } }, error: null }),
      },
    },
  },
}));

import i18n from '../i18n';
import { App } from '../App';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
const auth = (clave: string, vars: Record<string, string | number> = {}) =>
  t(`auth.${clave}`).replace(/\{(\w+)\}/g, (m: string, n: string) => (n in vars ? String(vars[n]) : n === 'app' ? 'Armando Duarte' : m));
const sinAsteriscos = (s: string) => s.replace(/\*/g, '');
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const sesionDe = (aal: string) => ({ access_token: `${b64({ alg: 'HS256' })}.${b64({ aal })}.c2ln`, user: { id: 'u', email: 'gaby@ejemplo.mx' } }) as unknown as Session;

let yoRespuesta: { status: number; cuerpo: object };
let pedidos: string[];
let rescate: { status: number; cuerpo: object };

beforeEach(async () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  await i18n.changeLanguage('es');
  falso.sesion = null;
  falso.siguiente = 'aal1';
  falso.otpOk = false;
  falso.totpOk = false;
  falso.llamadas = [];
  pedidos = [];
  rescate = { status: 404, cuerpo: { code: 'NO_EXISTE' } };
  yoRespuesta = { status: 403, cuerpo: { code: 'AAL2_REQUIRED' } };
  window.history.replaceState(null, '', '/login');
  window.matchMedia = ((q: string) => ({ matches: true, media: q, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const ruta = new URL(url, 'http://local').pathname;
    pedidos.push(ruta);
    const json = (c: object, status = 200) => new Response(JSON.stringify(c), { status, headers: { 'Content-Type': 'application/json' } });
    if (ruta === '/api/yo') return json(yoRespuesta.cuerpo, yoRespuesta.status);
    if (ruta === '/api/rescate/pedir') return json(rescate.cuerpo, rescate.status);
    return json({ ok: true });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const titulo = () => screen.findByRole('heading', { level: 1 });
const escribirCodigo = (valor: string) => fireEvent.change(screen.getByLabelText(auth('code.label')), { target: { value: valor } });

describe('P1 · Entrada (/login)', () => {
  it('EL CASO: la anatomía del guion, en orden — volver, idiomas, título, subtítulo, Google, línea, correo, botón, pie legal', async () => {
    render(<App />);
    const h1 = await titulo();
    expect(h1.textContent).toBe(sinAsteriscos(auth('login.title')));
    expect(h1.querySelector('em')?.textContent).toBe('espacio');
    const volver = screen.getByRole('link', { name: '← Armando Duarte' });
    expect(volver.getAttribute('href')).toBe('https://armandoduarte.com');
    const google = screen.getByRole('button', { name: auth('google') });
    const correo = screen.getByLabelText(auth('email.label'));
    const enviar = screen.getByRole('button', { name: new RegExp(auth('login.send')) });
    expect(volver.compareDocumentPosition(google) & 4).toBe(4);
    expect(google.compareDocumentPosition(correo) & 4).toBe(4);
    expect(correo.compareDocumentPosition(enviar) & 4).toBe(4);
    expect(enviar.textContent).toContain('→');
    expect(correo.getAttribute('placeholder')).toBe(auth('email.placeholder'));
    expect(document.querySelector('.acceso__separador')).not.toBeNull();
    expect(screen.getByText(auth('login.subtitle'))).toBeTruthy();
    const legal = document.querySelector('.acceso__legal')!;
    expect(legal.textContent).toBe(auth('legal'));
    expect([...legal.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['https://armandoduarte.com/terminos', 'https://armandoduarte.com/privacidad']);
  });

  it('sin fotos, sin naranja, sin antetítulo', async () => {
    render(<App />);
    await titulo();
    expect(document.querySelectorAll('img[src*="/img/armando/"]')).toHaveLength(0);
    expect(document.querySelectorAll('.btn--naranja')).toHaveLength(0);
    expect(document.querySelector('.acceso__antetitulo')).toBeNull();
  });

  it('el selector de idioma: ES activo; EN cambia en el momento, se recuerda, y el resto de la app sigue en español', async () => {
    render(<App />);
    await titulo();
    expect(screen.getByRole('button', { name: 'ES' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect((await titulo()).textContent).toBe('Enter your space.');
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
    expect(window.localStorage.getItem('codice.idioma')).toBe('en');
    expect(t('comun.errorGenerico'), 'fuera de auth.* cae al español').toBe(i18n.getFixedT('es')('comun.errorGenerico'));
    cleanup();
    fireEvent.click(document.body);
  });

  it('el pie legal enlaza también en EN y PT', async () => {
    for (const idioma of ['en', 'pt']) {
      await i18n.changeLanguage(idioma);
      render(<App />);
      await titulo();
      expect(document.querySelectorAll('.acceso__legal a'), idioma).toHaveLength(2);
      cleanup();
    }
  });
});

describe('P2 · Código por mail (/login/codigo)', () => {
  async function hastaElCodigo() {
    render(<App />);
    await titulo();
    fireEvent.change(screen.getByLabelText(auth('email.label')), { target: { value: 'ana@ejemplo.mx' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(auth('login.send')) }));
    await screen.findByText(auth('code.subtitle', { email: 'ana@ejemplo.mx' }));
  }

  it('EL CASO: manda el código, va a /login/codigo con la casilla de 6, y al llenar la sexta verifica SOLO', async () => {
    await hastaElCodigo();
    expect(window.location.pathname).toBe('/login/codigo');
    expect(falso.llamadas).toContain('otp:ana@ejemplo.mx');
    expect(document.querySelectorAll('[data-casilla]')).toHaveLength(6);
    expect(screen.getByText(`§ · ${auth('code.eyebrow')}`)).toBeTruthy();
    escribirCodigo('123456');
    await waitFor(() => expect(falso.llamadas.filter((l) => l.startsWith('verifyOtp'))).toEqual(['verifyOtp:123456']));
  });

  it('un código mal: «Te quedan 4 intentos.», se vacía; al quinto, la casilla se apaga', async () => {
    await hastaElCodigo();
    escribirCodigo('111111');
    expect(await screen.findByText(auth('code.wrong', { n: 4 }))).toBeTruthy();
    await waitFor(() => expect((screen.getByLabelText(auth('code.label')) as HTMLInputElement).value).toBe(''));
    for (let n = 3; n >= 0; n -= 1) {
      escribirCodigo('111111');
      expect(await screen.findByText(auth('code.wrong', { n }))).toBeTruthy();
      await waitFor(() => expect((screen.getByLabelText(auth('code.label')) as HTMLInputElement).value).toBe(''));
    }
    expect((screen.getByLabelText(auth('code.label')) as HTMLInputElement).disabled).toBe(true);
  });

  it('«Reenviar» espera con cuenta regresiva; «Usar otro correo» vuelve a P1', async () => {
    await hastaElCodigo();
    expect(screen.getByText(/Reenviar en \d+ s/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: auth('code.otherEmail') }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('login.title')));
    expect(window.location.pathname).toBe('/login');
  });

  it('recargar en /login/codigo, sin correo en memoria, vuelve a P1', async () => {
    window.history.replaceState(null, '', '/login/codigo');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
  });
});

describe('P7 · Sesión cerrada', () => {
  it('después de 30 min sin actividad: el cartel, y «Volver a entrar» lleva a P1', async () => {
    window.sessionStorage.setItem('armando-duarte.inactivity_logout', '1');
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('session.title')));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(auth('session.again')) }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('login.title')));
  });
});

describe('P3 · Verificación (/auth/2fa) y P6 · P6b', () => {
  beforeEach(() => { falso.sesion = sesionDe('aal1'); falso.siguiente = 'aal2'; });

  it('EL CASO: el equipo con factor va a /auth/2fa; la casilla verifica sola contra el autenticador', async () => {
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('totp.title')));
    await waitFor(() => expect(window.location.pathname).toBe('/auth/2fa'));
    escribirCodigo('654321');
    await waitFor(() => expect(falso.llamadas).toContain('verify:654321'));
    expect(await screen.findByText(auth('code.wrong', { n: 4 }))).toBeTruthy();
    expect(screen.getByRole('button', { name: auth('signout') })).toBeTruthy();
  });

  it('«No tengo el teléfono» → P6 (campo monoespaciado) → «Tampoco tengo los códigos» → P6b', async () => {
    render(<App />);
    await titulo();
    fireEvent.click(screen.getByRole('link', { name: auth('totp.lost') }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('recover.title')));
    expect(window.location.pathname).toBe('/auth/2fa/recuperar');
    expect(document.querySelector('.acceso__campo--mono')).not.toBeNull();
    expect(document.querySelectorAll('[data-casilla]'), 'el respaldo NO usa la casilla de 6').toHaveLength(0);
    fireEvent.click(screen.getByRole('link', { name: auth('recover.noCodes') }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('reset.title')));
    expect(window.location.pathname).toBe('/auth/2fa/reseteo');
  });

  it('P6b sin backend (el kit v1.1.0 no trae el auto-rescate): pedirlo dice el error genérico, sin inventar una espera', async () => {
    window.history.replaceState(null, '', '/auth/2fa/reseteo');
    render(<App />);
    await screen.findByRole('button', { name: auth('reset.request') });
    fireEvent.click(screen.getByRole('button', { name: auth('reset.request') }));
    expect(await screen.findByText(t('comun.errorGenerico'))).toBeTruthy();
    expect(pedidos).toContain('/api/rescate/pedir');
  });

  it('P6b con backend: la espera con la fecha y la hora en que vence', async () => {
    rescate = { status: 200, cuerpo: { vence: '2026-10-05T15:30:00Z' } };
    window.history.replaceState(null, '', '/auth/2fa/reseteo');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: auth('reset.request') }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('reset.waitTitle')));
    expect(screen.getByText(/5 de octubre/)).toBeTruthy();
  });
});

describe('P4 · Activar (/auth/2fa/activar) y P5 · Respaldo', () => {
  it('EL CASO: el equipo sin factor va a P4: QR, «Abrir en mi app», «Copiar la clave», casilla, y sin forma de saltearla', async () => {
    falso.sesion = sesionDe('aal1');
    falso.siguiente = 'aal1';
    yoRespuesta = { status: 200, cuerpo: { rol: 'equipo', tipo: 'equipo', persona: null } };
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(auth('enroll.title')));
    await waitFor(() => expect(window.location.pathname).toBe('/auth/2fa/activar'));
    expect(await screen.findByRole('link', { name: auth('enroll.open') })).toBeTruthy();
    expect(screen.getByRole('button', { name: auth('enroll.copy') })).toBeTruthy();
    expect(screen.getByLabelText(auth('enroll.confirmLabel'))).toBeTruthy();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).not.toContain(t('comun.continuar'));
  });
});

describe('§3 · la casilla de 6 en P2, P3, P4 y P8; el respaldo nunca', () => {
  it('P3 la usa (P2 y P4 están arriba; P8 en `los-ajustes`)', async () => {
    falso.sesion = sesionDe('aal1');
    falso.siguiente = 'aal2';
    render(<App />);
    await titulo();
    expect(document.querySelectorAll('[data-casilla]')).toHaveLength(6);
    expect(within(document.querySelector('.acceso__codigo') as HTMLElement).getAllByRole('textbox')).toHaveLength(1);
  });
});
