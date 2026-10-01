/**
 * El marco con barra lateral — orden #29, A y D.
 *
 * `App` entera, con Supabase y la API simulados (como `me-anoto.test.tsx`). Lo
 * que se afirma es lo que ve la persona: los ítems de la barra para un cliente
 * (4) y para el equipo (5), cuál está activo según la ruta, que plegar se
 * recuerda, que un clic navega sin recargar, y que en el teléfono la barra es
 * un cajón con el foco adentro que se cierra con Esc.
 *
 * El ancho lo decide `matchMedia`, que jsdom no tiene: acá se elige.
 * Lo que necesita un navegador de verdad (cómo se ve, el contraste, un naranja
 * por pantalla medido sobre lo pintado) está en `check/capturas-29.mjs`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null }) },
    },
  },
}));

import i18n from '../i18n';
import { App } from '../App';
import { itemsDeLaBarra, rutaDelItemActivo } from './Marco';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = (aal: string) => `${b64({ alg: 'HS256' })}.${b64({ aal })}.c2lnbmF0dXJh`;
const sesionDe = (aal: string) => ({ access_token: token(aal), user: { id: 'u', email: 'ana@ejemplo.mx' } }) as unknown as Session;

/** El equipo pasa por el segundo paso: sin una verificación reciente, la decisión no es «pasar». */
function comoEquipo(persona: object = ficha) {
  yo = { rol: 'equipo', tipo: 'equipo', persona };
  falso.sesion = sesionDe('aal2');
  window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
  window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
}

const ficha = { id: 'u', nombre: 'Ana', apellido: 'Pérez', whatsapp: '+52 999 123 4567', pais: 'MX', ciudad: null };
let yo: object;
let pedidos: string[];

function ancho(escritorio: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: escritorio && /min-width: (900|1100)px/.test(q), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  falso.sesion = sesionDe('aal1');
  yo = { rol: 'cliente', tipo: 'cliente', persona: ficha };
  pedidos = [];
  ancho(true);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const ruta = new URL(url, 'http://local').pathname;
    pedidos.push(ruta);
    const json = (cuerpo: object) => new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (ruta === '/api/yo') return json(yo);
    if (ruta === '/api/talleres') return json({ abiertos: [], mios: [], cobro: null });
    if (ruta === '/api/equipo/cursos') return json({ cursos: [] });
    if (ruta === '/api/respaldo/cuantos') return json({ quedan: 10 });
    return json({});
  }));
  window.history.replaceState(null, '', '/mi-espacio');
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const barra = async () => within(await screen.findByRole('navigation', { name: t('marco.navegacion') }));
const nombres = (nav: ReturnType<typeof within>) => nav.getAllByRole('link').map((a: HTMLElement) => a.textContent);

describe('la barra: qué ítems y cuál está activo', () => {
  it('EL CASO: un cliente ve cuatro — Inicio, Talleres, Mis talleres, Mis datos — y no el panel', async () => {
    render(<App />);
    const nav = await barra();
    expect(nombres(nav)).toEqual([t('marco.inicio'), t('marco.talleres'), t('marco.misTalleres'), t('marco.misDatos')]);
    expect(nav.queryByRole('link', { name: t('marco.panel') })).toBeNull();
  });

  it('el equipo ve cinco: el panel, después de un separador', async () => {
    comoEquipo();
    render(<App />);
    const nav = await barra();
    expect(nombres(nav)).toEqual([t('marco.inicio'), t('marco.talleres'), t('marco.misTalleres'), t('marco.misDatos'), t('marco.panel')]);
    expect(document.querySelector('.lateral__separador')).not.toBeNull();
  });

  it('el activo sigue a la ruta; /me-anoto/<slug> es Talleres', async () => {
    for (const [ruta, activo] of [['/mi-espacio', 'marco.inicio'], ['/talleres', 'marco.talleres'], ['/mis-talleres', 'marco.misTalleres'], ['/mis-datos', 'marco.misDatos'], ['/me-anoto/el-arte', 'marco.talleres']]) {
      window.history.replaceState(null, '', ruta);
      render(<App />);
      const nav = await barra();
      const actual = nav.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.textContent);
      expect(actual, ruta).toEqual([t(activo)]);
      cleanup();
    }
    expect(rutaDelItemActivo('/me-anoto/el-arte')).toBe('/talleres');
    expect(itemsDeLaBarra(false).equipo).toEqual([]);
  });

  it('abajo: el correo de la sesión, «Salir» y «Volver a la web»', async () => {
    render(<App />);
    await barra();
    expect(screen.getByText('ana@ejemplo.mx')).toBeTruthy();
    expect(screen.getByRole('button', { name: t('marco.salir') })).toBeTruthy();
    expect((screen.getByRole('link', { name: new RegExp(t('marco.volverALaWeb')) }) as HTMLAnchorElement).href).toBe('https://armandoduarte.com/');
  });
});

describe('navegar sin recargar', () => {
  it('un clic en «Mis datos» cambia la URL y la pantalla, sin volver a preguntar quién es', async () => {
    render(<App />);
    const nav = await barra();
    const antes = pedidos.filter((p) => p === '/api/yo').length;
    fireEvent.click(nav.getByRole('link', { name: t('marco.misDatos') }));
    expect(window.location.pathname).toBe('/mis-datos');
    expect(await screen.findByLabelText(t('miEspacio.nivelEducativo'))).toBeTruthy();
    expect(pedidos.filter((p) => p === '/api/yo').length, 'no se recargó la sesión').toBe(antes);
  });

  it('el «atrás» del navegador vuelve a la pantalla anterior', async () => {
    render(<App />);
    fireEvent.click((await barra()).getByRole('link', { name: t('marco.talleres') }));
    expect(window.location.pathname).toBe('/talleres');
    window.history.replaceState(null, '', '/mi-espacio');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(await screen.findByText(t('inicio.proximoTitulo'))).toBeTruthy();
  });
});

describe('plegar la barra', () => {
  it('el chevron la pliega a solo íconos, y se recuerda al volver', async () => {
    render(<App />);
    await barra();
    fireEvent.click(screen.getByRole('button', { name: t('marco.plegar') }));
    expect(document.querySelector('.lateral--plegada')).not.toBeNull();
    /* Plegada: los ítems siguen nombrados (para el lector), pero sin texto a la vista. */
    expect(document.querySelectorAll('.lateral__item span')).toHaveLength(0);
    expect(window.localStorage.getItem('codice.barra-plegada')).toBe('1');
    cleanup();
    render(<App />);
    await barra();
    expect(document.querySelector('.lateral--plegada'), 'al volver, sigue plegada').not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t('marco.desplegar') }));
    expect(document.querySelector('.lateral--plegada')).toBeNull();
    expect(window.localStorage.getItem('codice.barra-plegada')).toBe('0');
  });
});

describe('en el teléfono: un cajón', () => {
  beforeEach(() => ancho(false));

  it('sin barra a la vista; «Menú» abre el cajón con el foco adentro, Esc lo cierra y el foco vuelve a «Menú»', async () => {
    render(<App />);
    const menu = await screen.findByRole('button', { name: t('marco.menu') });
    expect(screen.queryByRole('navigation', { name: t('marco.navegacion') }), 'cerrado no hay nav').toBeNull();
    fireEvent.click(menu);
    const cajon = screen.getByRole('dialog', { name: t('marco.navegacion') });
    expect(cajon.getAttribute('aria-modal')).toBe('true');
    expect(cajon.contains(document.activeElement), 'el foco entra al cajón').toBe(true);

    /* Atrapado: Tab desde el último vuelve al primero; Shift+Tab desde el primero, al último. */
    const enfocables = [...cajon.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    enfocables.at(-1)!.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(enfocables[0]);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(enfocables.at(-1));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(menu));
  });

  it('navegar desde el cajón lo cierra', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('marco.menu') }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('link', { name: t('marco.misTalleres') }));
    expect(window.location.pathname).toBe('/mis-talleres');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Inicio', () => {
  it('«Hola, Ana» y las tres tarjetas; los datos dicen lo que falta', async () => {
    render(<App />);
    expect(await screen.findByText(t('inicio.proximoTitulo'))).toBeTruthy();
    expect(screen.getByText(t('inicio.datosTitulo'))).toBeTruthy();
    expect(screen.getByText(t('inicio.ayudaTitulo'))).toBeTruthy();
    expect(screen.queryByRole('heading', { name: t('inicio.panelTitulo') })).toBeNull();
    expect(screen.getByText(t('inicio.datosFaltan', { lista: t('inicio.campos.ciudad') }))).toBeTruthy();
  });

  it('el equipo ve la cuarta: el panel, con cuántos esperan revisión', async () => {
    comoEquipo({ ...ficha, ciudad: 'Mérida' });
    render(<App />);
    /* «Panel del equipo» también es un ítem de la barra: se busca la tarjeta. */
    expect(await screen.findByRole('heading', { name: t('inicio.panelTitulo') })).toBeTruthy();
    expect(await screen.findByText(t('inicio.sinRevision'))).toBeTruthy();
    expect(screen.getByText(t('inicio.datosCompletos'))).toBeTruthy();
  });

  it('«N en revisión» cuenta solo las ediciones que no terminaron, y solo lo que está en revisión', async () => {
    comoEquipo();
    const edicion = (id: string, fin: string) => ({ id, fin, inicio: fin, zona: 'America/Merida', estado: 'publicada' });
    const filas: Record<string, { estado: string }[]> = {
      viva: [{ estado: 'en_revision' }, { estado: 'en_revision' }, { estado: 'confirmada' }],
      vieja: [{ estado: 'en_revision' }],
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const ruta = new URL(url, 'http://local').pathname;
      const json = (cuerpo: object) => new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (ruta === '/api/yo') return json(yo);
      if (ruta === '/api/equipo/cursos') return json({ cursos: [{ id: 'c', ediciones: [edicion('viva', '2099-01-01T00:00:00Z'), edicion('vieja', '2020-01-01T00:00:00Z')] }] });
      if (ruta.startsWith('/api/equipo/inscriptos/')) return json({ inscriptos: filas[ruta.split('/').pop()!] });
      return json({ abiertos: [], mios: [], cobro: null });
    }));
    render(<App />);
    expect(await screen.findByText(t('inicio.enRevision', { count: 2 }))).toBeTruthy();
  });
});
