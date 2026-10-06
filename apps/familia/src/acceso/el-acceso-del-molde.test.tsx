/**
 * Las pantallas de acceso con las piezas del molde — orden #37, PR 2 (Kit de
 * Acceso 1.3.0). Reemplaza al test de las pantallas de la #35.
 *
 * `App` entera, con Supabase y la API simulados. Lo que se afirma: la
 * anatomía de cada pantalla (la de la galería del molde), los textos del molde
 * en los tres idiomas (con sus plurales), la casilla de seis del molde que
 * verifica sola, el error con los intentos, las direcciones de cada pantalla, el
 * selector de idioma que cambia y se recuerda, y el rescate solo con su
 * backend: P6b pide el reseteo con el correo de la sesión, y `/rescate` no hace
 * nada hasta que se toca el botón. Cómo se ve, el contraste y la CSP se miden en
 * el navegador (`check/capturas-37-pr2.mjs`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import { tDelMolde } from '../molde/arranque';

const t = (clave: string, vars: Record<string, string | number> = {}) => tDelMolde('es')(clave, vars);
const sinAsteriscos = (s: string) => s.replace(/\*/g, '');
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const sesionDe = (aal: string) => ({ access_token: `${b64({ alg: 'HS256' })}.${b64({ aal })}.c2ln`, user: { id: 'u', email: 'gaby@ejemplo.mx' } }) as unknown as Session;

let yoRespuesta: { status: number; cuerpo: object };
let pedidos: { ruta: string; cuerpo: unknown }[];
let respuestas: Record<string, { status: number; cuerpo: object }>;

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
  respuestas = { '/api/rescate/aplicar': { status: 200, cuerpo: { aplicado: false } } };
  yoRespuesta = { status: 403, cuerpo: { code: 'AAL2_REQUIRED' } };
  window.history.replaceState(null, '', '/login');
  window.matchMedia = ((q: string) => ({ matches: true, media: q, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const ruta = new URL(url, 'http://local').pathname;
    pedidos.push({ ruta, cuerpo: init?.body ? JSON.parse(String(init.body)) : null });
    const json = (c: object, status = 200) => new Response(JSON.stringify(c), { status, headers: { 'Content-Type': 'application/json' } });
    if (ruta === '/api/yo') return json(yoRespuesta.cuerpo, yoRespuesta.status);
    const r = respuestas[ruta];
    return r ? json(r.cuerpo, r.status) : json({ code: 'NO_EXISTE' }, 404);
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const titulo = () => screen.findByRole('heading', { level: 1 });
/** Espera a que el título sea ése (la palabra en cursiva cambia el nombre accesible; se compara el texto). */
const tituloSea = (texto: string) => waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(texto));
const casilla = () => screen.getByLabelText(t('auth.code.label')) as HTMLInputElement;
const escribirCodigo = (valor: string) => fireEvent.change(casilla(), { target: { value: valor } });
const casillas = () => document.querySelectorAll('[data-casilla]');

describe('P1 · Entrada (/login)', () => {
  it('EL CASO: la anatomía de la galería del molde, en orden — volver, idiomas, título, subtítulo, Google, línea, correo, botón, pie legal', async () => {
    render(<App />);
    const h1 = await titulo();
    /* La frase de marca del design.json, en el idioma de la pantalla. */
    expect(h1.textContent).toBe('Entra a tu espacio.');
    expect(h1.querySelector('em')?.textContent).toBe('espacio');
    const volver = screen.getByRole('link', { name: '← Armando Duarte' });
    expect(volver.getAttribute('href')).toBe('https://armandoduarte.com');
    const google = screen.getByRole('button', { name: t('auth.google') });
    const correo = screen.getByLabelText(t('auth.email.label'));
    const enviar = screen.getByRole('button', { name: new RegExp(t('auth.login.send'), 'i') });
    expect(volver.compareDocumentPosition(google) & 4).toBe(4);
    expect(google.compareDocumentPosition(correo) & 4).toBe(4);
    expect(correo.compareDocumentPosition(enviar) & 4).toBe(4);
    expect(enviar.textContent).toContain('→');
    expect(correo.getAttribute('placeholder')).toBe(t('auth.email.placeholder'));
    expect(screen.getByRole('separator')).toBeTruthy();
    expect(screen.getByText(t('auth.login.subtitle'))).toBeTruthy();
    const legal = screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === t('auth.legal'));
    expect([...legal.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['https://armandoduarte.com/terminos', 'https://armandoduarte.com/privacidad']);
  });

  it('sin fotos, sin naranja, sin antetítulo', async () => {
    render(<App />);
    await titulo();
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(document.querySelectorAll('.btn--naranja')).toHaveLength(0);
    expect(screen.queryByText(/^§ ·/)).toBeNull();
  });

  it('el selector de idioma del molde: ES activo; EN cambia en el momento, con su frase, y se recuerda', async () => {
    render(<App />);
    await titulo();
    expect(screen.getByRole('button', { name: 'es' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'en' }));
    expect((await titulo()).textContent).toBe('Enter your space.');
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
    expect(window.localStorage.getItem('codice.idioma')).toBe('en');
  });

  it('en PT, la frase en portugués y el pie legal con sus dos enlaces', async () => {
    await i18n.changeLanguage('pt');
    render(<App />);
    expect((await titulo()).textContent).toBe('Entre no seu espaço.');
    const legal = screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === tDelMolde('pt')('auth.legal'));
    expect(legal.querySelectorAll('a')).toHaveLength(2);
  });
});

describe('P2 · Código por mail (/login/codigo)', () => {
  async function hastaElCodigo() {
    render(<App />);
    await titulo();
    fireEvent.change(screen.getByLabelText(t('auth.email.label')), { target: { value: 'ana@ejemplo.mx' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t('auth.login.send'), 'i') }));
    await screen.findByText(t('auth.code.subtitle', { email: 'ana@ejemplo.mx' }));
  }

  it('EL CASO: manda el código, va a /login/codigo con la casilla de 6 del molde, y al llenar la sexta verifica SOLO', async () => {
    await hastaElCodigo();
    expect(window.location.pathname).toBe('/login/codigo');
    expect(falso.llamadas).toContain('otp:ana@ejemplo.mx');
    expect(casillas()).toHaveLength(6);
    expect(screen.getByText(`§ · ${t('auth.code.eyebrow')}`)).toBeTruthy();
    escribirCodigo('123456');
    await waitFor(() => expect(falso.llamadas.filter((l) => l.startsWith('verifyOtp'))).toEqual(['verifyOtp:123456']));
  });

  it('un código mal: «Te quedan 4 intentos.», se vacía; con uno, «Te queda 1 intento.»; al quinto, la casilla se apaga', async () => {
    await hastaElCodigo();
    escribirCodigo('111111');
    expect(await screen.findByText('Código incorrecto. Te quedan 4 intentos.')).toBeTruthy();
    await waitFor(() => expect(casilla().value).toBe(''));
    for (let n = 3; n >= 0; n -= 1) {
      escribirCodigo('111111');
      expect(await screen.findByText(t('auth.code.wrong', { n }))).toBeTruthy();
      if (n === 1) expect(screen.getByText('Código incorrecto. Te queda 1 intento.')).toBeTruthy();
      await waitFor(() => expect(casilla().value).toBe(''));
    }
    expect(casilla().disabled).toBe(true);
  });

  it('«Reenviar» espera con cuenta regresiva; «Usar otro correo» vuelve a P1', async () => {
    await hastaElCodigo();
    expect(screen.getByText(/Reenviar en \d+ s/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('auth.code.otherEmail') }));
    expect((await titulo()).textContent).toBe('Entra a tu espacio.');
    expect(window.location.pathname).toBe('/login');
  });

  it('recargar en /login/codigo, sin correo en memoria, vuelve a P1', async () => {
    window.history.replaceState(null, '', '/login/codigo');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
  });
});

describe('P7 · Sesión cerrada y P9 · Pasó un tiempo (el Cartel del molde)', () => {
  it('después de 30 min sin actividad: el cartel, y «Volver a entrar» lleva a P1', async () => {
    window.sessionStorage.setItem('armando-duarte.inactivity_logout', '1');
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.session.title')));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t('auth.session.again'), 'i') }));
    expect((await titulo()).textContent).toBe('Entra a tu espacio.');
  });
});

describe('P3 · Verificación (/auth/2fa), P6 y P6b', () => {
  beforeEach(() => { falso.sesion = sesionDe('aal1'); falso.siguiente = 'aal2'; });

  it('EL CASO: el equipo con factor va a /auth/2fa; la casilla del molde verifica sola contra el autenticador', async () => {
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.totp.title')));
    await waitFor(() => expect(window.location.pathname).toBe('/auth/2fa'));
    expect(casillas()).toHaveLength(6);
    escribirCodigo('654321');
    await waitFor(() => expect(falso.llamadas).toContain('verify:654321'));
    expect(await screen.findByText(t('auth.code.wrong', { n: 4 }))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('auth.signout') })).toBeTruthy();
  });

  it('al llegar al reto, la pantalla le pregunta a la API si hay un rescate listo para aplicar', async () => {
    render(<App />);
    await titulo();
    await waitFor(() => expect(pedidos.map((p) => p.ruta)).toContain('/api/rescate/aplicar'));
  });

  it('«No tengo el teléfono» → P6 (campo monoespaciado, sin casillas) → «Tampoco tengo los códigos» → P6b', async () => {
    render(<App />);
    await titulo();
    fireEvent.click(screen.getByRole('link', { name: t('auth.totp.lost') }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.recover.title')));
    expect(window.location.pathname).toBe('/auth/2fa/recuperar');
    expect(screen.getByLabelText(t('auth.recover.label'))).toBeTruthy();
    expect(casillas(), 'el respaldo NO usa la casilla de 6').toHaveLength(0);
    fireEvent.click(screen.getByRole('link', { name: t('auth.recover.noCodes') }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.reset.title')));
    expect(window.location.pathname).toBe('/auth/2fa/reseteo');
  });

  it('P6b, con backend: pide el reseteo con el correo de la sesión y el idioma, y muestra la espera con la fecha', async () => {
    respuestas['/api/rescate/pedir'] = { status: 200, cuerpo: { vence: '2026-10-05T15:30:00Z' } };
    window.history.replaceState(null, '', '/auth/2fa/reseteo');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(t('auth.reset.request'), 'i') }));
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.reset.waitTitle')));
    expect(screen.getByText(/5 de octubre/)).toBeTruthy();
    expect(pedidos.find((p) => p.ruta === '/api/rescate/pedir')?.cuerpo).toEqual({ correo: 'gaby@ejemplo.mx', idioma: 'es' });
  });

  it('P6b, si la API falla: el error, sin inventar una espera', async () => {
    respuestas['/api/rescate/pedir'] = { status: 500, cuerpo: {} };
    window.history.replaceState(null, '', '/auth/2fa/reseteo');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(t('auth.reset.request'), 'i') }));
    expect(await screen.findByText(t('auth.error.generic'))).toBeTruthy();
    expect(screen.queryByText(sinAsteriscos(t('auth.reset.waitTitle')))).toBeNull();
  });
});

describe('P4 · Activar (/auth/2fa/activar)', () => {
  it('EL CASO: el equipo sin factor va a P4: QR, «Abrir en mi app», «Copiar la clave», casilla, y sin forma de saltearla', async () => {
    falso.sesion = sesionDe('aal1');
    falso.siguiente = 'aal1';
    yoRespuesta = { status: 200, cuerpo: { rol: 'equipo', tipo: 'equipo', persona: null } };
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.enroll.title')));
    await waitFor(() => expect(window.location.pathname).toBe('/auth/2fa/activar'));
    expect(await screen.findByRole('link', { name: t('auth.enroll.open') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('auth.enroll.copy') })).toBeTruthy();
    expect(screen.getByLabelText(t('auth.enroll.confirmLabel'))).toBeTruthy();
    expect(casillas()).toHaveLength(6);
    const botones = screen.getAllByRole('button').map((b) => b.textContent);
    expect(botones.some((b) => /continuar|después|saltar/i.test(b ?? ''))).toBe(false);
  });
});

describe('/rescate · los enlaces de los correos (rescate solo)', () => {
  const ID = '6f1f2d64-6f1a-4a3e-9f6b-2b0f9a1c4d21';
  const TOKEN = 'A'.repeat(43);

  it('EL CASO: confirmar NO hace nada solo; con el botón, confirma y dice cuándo', async () => {
    respuestas['/api/rescate/confirmar'] = { status: 200, cuerpo: { vence: '2026-10-08T15:00:00Z' } };
    window.history.replaceState(null, '', `/rescate?r=${ID}&t=${TOKEN}&a=confirmar`);
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.reset.confirm.title')));
    expect(pedidos.map((p) => p.ruta), 'abrir el enlace no llama a la API').not.toContain('/api/rescate/confirmar');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t('auth.reset.confirm.button'), 'i') }));
    await tituloSea(sinAsteriscos(t('auth.reset.confirmed.title')));
    expect(pedidos.find((p) => p.ruta === '/api/rescate/confirmar')?.cuerpo).toEqual({ id: ID, token: TOKEN });
    expect(screen.getByText(/8 de octubre/)).toBeTruthy();
    expect(window.location.pathname, 'sin sesión, /rescate no manda a la entrada').toBe('/rescate');
  });

  it('cancelar desde el aviso: con el botón, cancela', async () => {
    respuestas['/api/rescate/cancelar'] = { status: 200, cuerpo: { ok: true } };
    window.history.replaceState(null, '', `/rescate?r=${ID}&t=${TOKEN}&a=cancelar`);
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(t('auth.reset.cancel.button'), 'i') }));
    await tituloSea(sinAsteriscos(t('auth.reset.cancelled.title')));
  });

  it('un enlace roto, o uno que la API ya no acepta: «Este enlace ya no sirve.»', async () => {
    window.history.replaceState(null, '', '/rescate?r=nada&a=confirmar');
    render(<App />);
    expect((await titulo()).textContent).toBe(sinAsteriscos(t('auth.reset.invalid.title')));
    cleanup();
    respuestas['/api/rescate/confirmar'] = { status: 400, cuerpo: { code: 'RESCATE_INVALIDO' } };
    window.history.replaceState(null, '', `/rescate?r=${ID}&t=${TOKEN}&a=confirmar`);
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(t('auth.reset.confirm.button'), 'i') }));
    await tituloSea(sinAsteriscos(t('auth.reset.invalid.title')));
  });
});

describe('rescate solo: nadie ve ni puede usar un botón para resetear a otra persona', () => {
  /*
   * Un barrido del código de la pantalla, no de una pantalla dibujada: lo que se
   * afirma es que **no existe** ese botón en ningún lugar de la app, y eso se
   * prueba mirando todas, no una. Lo que busca: cualquier llamada a la API del
   * rescate y cualquier texto de reseteo. Dónde: `apps/familia/src`, sin tests.
   * Lo que no busca: el servidor —ahí lo afirma `aal2-cobertura.spec.ts`, con la
   * lista exacta de rutas, y `aal2-comportamiento.spec.ts`, que revisa que el
   * controlador de Equipo no tenga ningún método de reseteo—.
   */
  it('la API del rescate solo se llama desde P6b, /rescate y el reto propio; y siempre sobre la cuenta de quien la usa', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join, relative } = await import('node:path');
    const SRC = join(__dirname, '..');
    const archivos: string[] = [];
    const recorrer = (d: string) => {
      for (const n of readdirSync(d)) {
        const r = join(d, n);
        if (statSync(r).isDirectory()) { if (n !== 'nucleo') recorrer(r); } else if (/\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n)) archivos.push(r);
      }
    };
    recorrer(SRC);
    expect(archivos.length, 'el barrido vio la app').toBeGreaterThan(30);
    const usan = archivos.filter((a) => /['`]rescate\//.test(readFileSync(a, 'utf8'))).map((a) => relative(SRC, a)).sort();
    expect(usan).toEqual(['App.tsx', 'acceso/Rescate.tsx', 'acceso/Reseteo.tsx']);
    /* Ninguna de las tres manda el id de otra persona: P6b manda el correo de la
       sesión; `/rescate`, el id y el token del enlace; `aplicar`, nada (el
       servidor usa el token de la sesión). */
    const reseteo = readFileSync(join(SRC, 'acceso', 'Reseteo.tsx'), 'utf8');
    expect(reseteo).toMatch(/cuerpo: \{ correo, idioma \}/);
    expect(readFileSync(join(SRC, 'App.tsx'), 'utf8')).toMatch(/api<\{ aplicado: boolean \}>\('rescate\/aplicar', \{ metodo: 'POST' \}\)/);
    /* Y el panel del equipo no tiene ningún texto de reseteo. */
    const panel = archivos.filter((a) => a.includes(`${'/equipo/'}`));
    expect(panel.length, 'el barrido vio el panel').toBeGreaterThan(3);
    expect(panel.filter((a) => /reset|autenticador/i.test(readFileSync(a, 'utf8'))).map((a) => relative(SRC, a))).toEqual([]);
  });
});
