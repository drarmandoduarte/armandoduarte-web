/**
 * «Tus preferencias.» — orden #34, B.
 *
 * `App` entera, con Supabase y la API simulados (la forma de `el-marco.test`).
 * Lo que se afirma es lo que ve la persona: las secciones del sub-nav para un
 * cliente (5) y para el equipo (6), cuál está activa según la ruta, que
 * Seguridad no existe para un cliente (ni escribiéndola), que `/mis-datos` lleva
 * a Perfil, que Cuenta cierra en todos los dispositivos, que el interruptor
 * guarda —y vuelve atrás si falla—, y Privacidad con los derechos ARCO.
 *
 * Cómo se ve, el contraste y un naranja por ruta: `check/capturas-34.mjs`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const falso = vi.hoisted(() => ({ sesion: null as Session | null, salidas: [] as unknown[] }));

vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: falso.sesion }, error: null }),
      onAuthStateChange: (_cb: (e: AuthChangeEvent, s: Session | null) => void) =>
        ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async (opciones?: unknown) => { falso.salidas.push(opciones ?? 'local'); return { error: null }; },
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null }),
        listFactors: async () => ({ data: { totp: [{ id: 'f-1' }] }, error: null }),
        challenge: async () => ({ data: { id: 'ch-1' }, error: null }),
        verify: async (o: { code: string }) => { falso.salidas.push(`verify:${o.code}`); return { error: null }; },
      },
    },
  },
}));

import i18n from '../i18n';
import { App } from '../App';
import { tDelMolde } from '../molde/arranque';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
/* #37 PR 2: los textos de las pantallas de acceso (P5, P8) son los del molde. */
const tm = (clave: string) => tDelMolde('es')(clave);
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = (aal: string) => `${b64({ alg: 'HS256' })}.${b64({ aal })}.c2lnbmF0dXJh`;
const sesionDe = (aal: string, proveedores = ['google']) =>
  ({ access_token: token(aal), user: { id: 'u', email: 'ana@ejemplo.mx', app_metadata: { providers: proveedores } } }) as unknown as Session;

const ficha = { id: 'u', nombre: 'Ana', apellido: 'Pérez', whatsapp: '+529991234567', pais: 'MX', ciudad: 'Mérida', avisos_por_correo: true };
let yo: Record<string, unknown>;
let pedidos: { ruta: string; cuerpo: unknown }[];
let yoFalla: boolean;
/** #35: cuántas veces más contesta `respaldo/generar` con PASO_RECIENTE_REQUERIDO. */
let pasoRecienteFaltan: number;

function comoEquipo() {
  yo = { rol: 'equipo', tipo: 'equipo', territorio: 'mexico', persona: ficha };
  falso.sesion = sesionDe('aal2');
  window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
  window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  falso.sesion = sesionDe('aal1');
  falso.salidas = [];
  yo = { rol: 'cliente', tipo: 'cliente', territorio: null, persona: ficha };
  pedidos = [];
  yoFalla = false;
  pasoRecienteFaltan = 0;
  window.matchMedia = ((q: string) => ({
    matches: /min-width: (900|1100)px/.test(q), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const ruta = new URL(url, 'http://local').pathname;
    pedidos.push({ ruta, cuerpo: init?.body ? JSON.parse(String(init.body)) : undefined });
    const json = (cuerpo: object, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
    if (ruta === '/api/yo' && init?.method === 'POST') return yoFalla ? json({ code: 'DESCONOCIDO' }, 400) : json({ ok: true });
    if (ruta === '/api/yo') return json(yo);
    if (ruta === '/api/talleres') return json({ abiertos: [], mios: [], cobro: null });
    if (ruta === '/api/equipo/cursos') return json({ cursos: [] });
    if (ruta === '/api/respaldo/cuantos') return json({ quedan: 10 });
    if (ruta === '/api/respaldo/generar') {
      if (pasoRecienteFaltan > 0) { pasoRecienteFaltan -= 1; return json({ code: 'PASO_RECIENTE_REQUERIDO' }, 403); }
      return json({ codigos: ['AAAA-11111', 'BBBB-22222', 'CCCC-33333', 'DDDD-44444', 'EEEE-55555', 'FFFF-66666', 'GGGG-77777', 'HHHH-88888', 'IIII-99999', 'JJJJ-00000'] });
    }
    return json({ ok: true });
  }));
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const subnav = async () => within(await screen.findByRole('navigation', { name: t('ajustes.secciones') }));
const ir = (ruta: string) => window.history.replaceState(null, '', ruta);

describe('el sub-nav', () => {
  it('EL CASO: un cliente ve cinco secciones, sin Seguridad; el equipo, seis', async () => {
    ir('/ajustes/perfil');
    render(<App />);
    const cinco = (await subnav()).getAllByRole('link').map((a) => a.textContent);
    expect(cinco).toEqual(['perfil', 'cuenta', 'notificaciones', 'sesiones', 'privacidad'].map((s) => t(`ajustes.nav.${s}`)));
    cleanup();
    comoEquipo();
    ir('/ajustes/perfil');
    render(<App />);
    const seis = (await subnav()).getAllByRole('link').map((a) => a.textContent);
    expect(seis).toEqual(['perfil', 'cuenta', 'notificaciones', 'seguridad', 'sesiones', 'privacidad'].map((s) => t(`ajustes.nav.${s}`)));
  });

  it('el activo sigue a la ruta, y el título de la sección también', async () => {
    for (const s of ['perfil', 'cuenta', 'notificaciones', 'sesiones', 'privacidad']) {
      ir(`/ajustes/${s}`);
      render(<App />);
      const activos = (await subnav()).getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
      expect(activos.map((a) => a.textContent), s).toEqual([t(`ajustes.nav.${s}`)]);
      expect(screen.getByRole('heading', { level: 2, name: t(`ajustes.${s}.titulo`) })).toBeTruthy();
      expect(screen.getByRole('heading', { level: 1, name: t('ajustes.titulo') })).toBeTruthy();
      cleanup();
    }
  });

  it('un clic en el sub-nav navega sin recargar', async () => {
    ir('/ajustes/perfil');
    render(<App />);
    fireEvent.click((await subnav()).getByRole('link', { name: t('ajustes.nav.privacidad') }));
    expect(window.location.pathname).toBe('/ajustes/privacidad');
    expect(await screen.findByRole('heading', { level: 2, name: t('ajustes.privacidad.titulo') })).toBeTruthy();
  });
});

describe('las rutas', () => {
  it('EL CASO: un cliente que escribe /ajustes/seguridad va a Inicio y no ve Seguridad', async () => {
    ir('/ajustes/seguridad');
    render(<App />);
    expect(await screen.findByText(t('inicio.proximoTitulo'))).toBeTruthy();
    await waitFor(() => expect(window.location.pathname).toBe('/mi-espacio'));
    expect(screen.queryByText(t('respaldo.regenerarTitulo'))).toBeNull();
  });

  it('el equipo sí: Seguridad con los códigos de respaldo', async () => {
    comoEquipo();
    ir('/ajustes/seguridad');
    render(<App />);
    expect(await screen.findByText(t('respaldo.regenerarTitulo'))).toBeTruthy();
    expect(window.location.pathname).toBe('/ajustes/seguridad');
  });

  it('/mis-datos y /ajustes a secas llevan a Perfil', async () => {
    for (const desde of ['/mis-datos', '/ajustes']) {
      ir(desde);
      render(<App />);
      expect(await screen.findByLabelText(t('miEspacio.nivelEducativo')), desde).toBeTruthy();
      await waitFor(() => expect(window.location.pathname).toBe('/ajustes/perfil'));
      cleanup();
    }
  });
});

describe('las secciones', () => {
  it('Perfil: Mis datos entero, con el WhatsApp de la #32 y la bajada de la orden', async () => {
    ir('/ajustes/perfil');
    render(<App />);
    expect(await screen.findByText(t('ajustes.perfil.bajada'))).toBeTruthy();
    expect(screen.getByLabelText(t('miEspacio.nombre'))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('miEspacio.guardar') })).toBeTruthy();
    expect(screen.getByText(t('miEspacio.perfil.paraQue'))).toBeTruthy();
  });

  it('Cuenta: el correo, con qué entra, y «Cerrar sesión en todos los dispositivos» → signOut global', async () => {
    ir('/ajustes/cuenta');
    render(<App />);
    expect((await screen.findByText('ana@ejemplo.mx')).closest('[data-correo]')).not.toBeNull();
    expect(screen.queryByRole('textbox'), 'el correo es solo lectura').toBeNull();
    expect(document.querySelector('[data-entra-con]')?.textContent).toBe(t('ajustes.cuenta.google'));
    fireEvent.click(screen.getByRole('button', { name: t('ajustes.cuenta.cerrarTodo') }));
    await waitFor(() => expect(falso.salidas).toEqual([{ scope: 'global' }]));
  });

  it('Notificaciones · EL CASO: encendido por defecto; al tocarlo guarda `false` y queda apagado', async () => {
    ir('/ajustes/notificaciones');
    render(<App />);
    const interruptor = await screen.findByRole('switch', { name: t('ajustes.notificaciones.avisos') });
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(interruptor);
    expect(await screen.findByText(t('ajustes.notificaciones.guardado'))).toBeTruthy();
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
    expect(pedidos.filter((p) => p.cuerpo !== undefined).map((p) => p.cuerpo)).toEqual([{ avisos_por_correo: false }]);
  });

  it('Notificaciones: si guardar falla, vuelve a como estaba y lo dice', async () => {
    yoFalla = true;
    ir('/ajustes/notificaciones');
    render(<App />);
    const interruptor = await screen.findByRole('switch');
    fireEvent.click(interruptor);
    expect(await screen.findByText(t('ajustes.notificaciones.error'))).toBeTruthy();
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
  });

  it('Notificaciones: apagado en la ficha, se ve apagado', async () => {
    yo = { ...yo, persona: { ...ficha, avisos_por_correo: false } };
    ir('/ajustes/notificaciones');
    render(<App />);
    expect((await screen.findByRole('switch')).getAttribute('aria-checked')).toBe('false');
  });

  it('Sesiones: este dispositivo y «Cerrar las otras sesiones»', async () => {
    ir('/ajustes/sesiones');
    render(<App />);
    expect(await screen.findByText(t('ajustes.sesiones.esteDispositivo'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('miEspacio.cerrarOtrasSesiones') }));
    expect(await screen.findByText(t('miEspacio.otrasSesionesCerradas'))).toBeTruthy();
    expect(pedidos.map((p) => p.ruta)).toContain('/api/sesiones/cerrar-las-otras');
  });

  it('Privacidad: el aviso, los términos y los derechos ARCO por WhatsApp con Gaby', async () => {
    ir('/ajustes/privacidad');
    render(<App />);
    expect((await screen.findByRole('link', { name: new RegExp(t('ajustes.privacidad.aviso')) })).getAttribute('href')).toBe('https://armandoduarte.com/privacidad');
    expect(screen.getByRole('link', { name: new RegExp(t('ajustes.privacidad.terminos')) }).getAttribute('href')).toBe('https://armandoduarte.com/terminos');
    const arco = screen.getByRole('link', { name: new RegExp(t('ajustes.privacidad.arco').replace(/[()]/g, '\\$&')) }).getAttribute('href')!;
    expect(arco).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(decodeURIComponent(arco.split('text=')[1])).toBe(t('ajustes.privacidad.arcoMensaje'));
  });
});

describe('#35 · regenerar los códigos: P8 si la verificación no es reciente, y después P5', () => {
  it('EL CASO: PASO_RECIENTE_REQUERIDO → P8 con la casilla de 6 → verifica sola → reintenta → P5', async () => {
    comoEquipo();
    pasoRecienteFaltan = 1;
    ir('/ajustes/seguridad');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('respaldo.regenerar') }));
    const mismo = (esperado: string) => (nombre: string) => nombre.replace(/\s+/g, '') === esperado.replace(/[\s*]/g, '');
    expect(await screen.findByRole('heading', { level: 1, name: mismo(tm('auth.stepup.title')) })).toBeTruthy();
    expect(document.querySelectorAll('[data-casilla]')).toHaveLength(6);
    fireEvent.change(screen.getByLabelText(tm('auth.code.label')), { target: { value: '123456' } });
    await waitFor(() => expect(falso.salidas).toContain('verify:123456'));
    /* Reintentó y llegaron los diez: P5, con «Listo» apagado hasta guardarlos. */
    expect(await screen.findByRole('heading', { level: 1, name: mismo(tm('auth.backup.title')) })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    const listo = screen.getByRole('button', { name: new RegExp(tm('auth.backup.done'), 'i') }) as HTMLButtonElement;
    expect(listo.disabled).toBe(true);
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => {}) } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(tm('auth.backup.copy'), 'i') }));
    await waitFor(() => expect(listo.disabled).toBe(false));
  });

  it('«Cancelar» en P8 vuelve a Seguridad sin códigos nuevos', async () => {
    comoEquipo();
    pasoRecienteFaltan = 1;
    ir('/ajustes/seguridad');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('respaldo.regenerar') }));
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(tm('auth.stepup.cancel'), 'i') }));
    expect(await screen.findByText(t('respaldo.regenerarTitulo'))).toBeTruthy();
  });
});

describe('Inicio', () => {
  it('«Tus datos» lleva a Ajustes → Perfil', async () => {
    ir('/mi-espacio');
    render(<App />);
    const tarjeta = (await screen.findByText(t('inicio.datosTitulo'))).closest('section')!;
    expect(within(tarjeta).getByRole('link').getAttribute('href')).toBe('/ajustes/perfil');
  });
});

describe('#37 PR 2 · «Reseteo pendiente» (rescate solo, fase-2 §8)', () => {
  it('EL CASO: con un reseteo pedido, Seguridad lo dice con el texto del molde y la fecha en que vence', async () => {
    comoEquipo();
    yo = { ...yo, reseteoPendiente: { vence: '2026-10-08T15:00:00.000Z', confirmado: true } };
    ir('/ajustes/seguridad');
    render(<App />);
    expect(await screen.findByText(tm('settings.security.resetPending'))).toBeTruthy();
    expect(screen.getByText(/Pediste resetear el autenticador\. Vence el .*8 de octubre/)).toBeTruthy();
  });

  it('sin reseteo pedido, no hay línea', async () => {
    comoEquipo();
    ir('/ajustes/seguridad');
    render(<App />);
    await screen.findByText(t('respaldo.regenerarTitulo'));
    expect(screen.queryByText(tm('settings.security.resetPending'))).toBeNull();
  });
});
