/**
 * «Tus datos» con el perfil, y la tarjeta «Completa tu perfil» — orden #27 D.2.
 * Desde la #37 (PR 3), el perfil es «Perfil del taller», la sección propia de
 * Mi espacio en Ajustes del molde: cada campo guarda lo suyo.
 *
 * Supabase y la API simulados, con datos de prueba. Lo que la base permite
 * (el cliente edita lo suyo, el año en rango) está probado en el banco
 * (`packages/db/src/el-perfil.test.ts`) y en la API contra el esquema.
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
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null }) },
    },
  },
}));

import i18n from '../i18n';
import { App } from '../App';
import { tDelMolde } from '../molde/arranque';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const sesion = { access_token: `${b64({ alg: 'HS256' })}.${b64({ aal: 'aal1' })}.c2lnbmF0dXJh`, user: { id: 'u' } } as unknown as Session;

const SLUG = 'el-arte-de-amar-a-tu-adolescente';
const taller = {
  edicion_id: '11111111-1111-4111-8111-111111111111', curso_slug: SLUG, curso_titulo: 'Taller de prueba', curso_bajada: null,
  modalidad: 'presencial', inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Sede de prueba',
  ciudad: 'Mérida', pais: 'MX', precio_monto: 1170, precio_moneda: 'MXN', lugares: null, mi_referencia: null,
};
const base = { id: 'u', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 000 0000', pais: 'MX', zona_horaria: 'America/Merida' };

let persona: Record<string, unknown>;
let pedidos: { ruta: string; metodo: string; cuerpo: unknown }[];
let guardarFalla: boolean;

beforeEach(() => {
  falso.sesion = sesion;
  pedidos = [];
  guardarFalla = false;
  persona = { ...base, ciudad: null, anio_nacimiento: null, nivel_educativo: null };
  vi.stubGlobal('fetch', vi.fn(async (url: string, opciones?: { method?: string; body?: string }) => {
    const ruta = new URL(url, 'http://local').pathname;
    const metodo = opciones?.method ?? 'GET';
    pedidos.push({ ruta, metodo, cuerpo: opciones?.body ? JSON.parse(opciones.body) : undefined });
    const json = (cuerpo: object, status = 200) =>
      new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
    if (ruta === '/api/yo' && metodo === 'POST') return guardarFalla ? json({ code: 'NO_VALIDO' }, 400) : json({ ok: true });
    if (ruta === '/api/yo') return json({ rol: 'cliente', tipo: 'cliente', persona });
    if (ruta === '/api/talleres') return json({ abiertos: [taller], mios: [], cobro: null });
    if (ruta === '/api/talleres/inscribirme') return json({ referencia: 'AD-0042', ya_estaba: false, cobro: null });
    return json({});
  }));
  /* #37 PR 3: «Perfil del taller» es una sección de Ajustes del molde. */
  window.history.replaceState(null, '', '/ajustes?s=taller');
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const tm = tDelMolde('es');
/** La fila de un campo de «Perfil del taller»: el campo y su «Guardar». */
const fila = (nombre: string) => screen.getByLabelText(nombre).closest('form') as HTMLFormElement;
const guardarFila = (nombre: string) => fireEvent.click(within(fila(nombre)).getByRole('button', { name: tm('settings.save') }));
const posts = () => pedidos.filter((p) => p.ruta === '/api/yo' && p.metodo === 'POST').map((p) => p.cuerpo);

describe('Ajustes → «Perfil del taller» (la sección propia de Mi espacio, #37 PR 3)', () => {
  it('EL CASO: el cliente la ve en el grupo de la app, con sus campos y los valores de su ficha', async () => {
    persona = { ...base, ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'posgrado' };
    render(<App />);
    expect(await screen.findByRole('heading', { name: /^Perfil del taller/ })).toBeTruthy();
    expect((screen.getByLabelText(tm('mi.campos.apellido.nombre')) as HTMLInputElement).value).toBe('Prueba');
    expect((screen.getByLabelText(tm('mi.campos.ciudad.nombre')) as HTMLInputElement).value).toBe('Mérida');
    expect((screen.getByLabelText(tm('mi.campos.anio.nombre')) as HTMLInputElement).value).toBe('1984');
    /* La edad, al lado del año (nunca se pide la fecha). */
    expect(screen.getByText(tm('mi.campos.anio.edad', { edad: new Date().getFullYear() - 1984 }))).toBeTruthy();
    expect(screen.getByRole('combobox', { name: tm('mi.campos.pais.nombre') })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: tm('mi.campos.nivel.nombre') })).toBeTruthy();
  });

  it('«¿Para qué pedimos esto?» y el enlace al bloque #perfil del aviso de privacidad', async () => {
    render(<App />);
    expect(await screen.findByText(tm('mi.ajustes.taller.paraQue.texto'))).toBeTruthy();
    const enlace = screen.getByRole('link', { name: tm('mi.ajustes.taller.aviso') }) as HTMLAnchorElement;
    expect(enlace.href).toBe('https://armandoduarte.com/privacidad#perfil');
  });

  it('cada campo guarda lo suyo: la ciudad manda solo la ciudad, y dice «Guardado»', async () => {
    render(<App />);
    fireEvent.change(await screen.findByLabelText(tm('mi.campos.ciudad.nombre')), { target: { value: 'Mérida' } });
    guardarFila(tm('mi.campos.ciudad.nombre'));
    expect(await screen.findByText(tm('settings.saved'))).toBeTruthy();
    expect(posts()).toEqual([{ ciudad: 'Mérida' }]);
  });

  it('el año va como número; un año fuera de rango se dice en el campo y no se manda nada', async () => {
    render(<App />);
    fireEvent.change(await screen.findByLabelText(tm('mi.campos.anio.nombre')), { target: { value: '1900' } });
    guardarFila(tm('mi.campos.anio.nombre'));
    expect(await screen.findByText(t('miEspacio.perfil.errores.anio'))).toBeTruthy();
    expect(posts()).toEqual([]);
    fireEvent.change(screen.getByLabelText(tm('mi.campos.anio.nombre')), { target: { value: '1984' } });
    guardarFila(tm('mi.campos.anio.nombre'));
    await waitFor(() => expect(posts()).toEqual([{ anio_nacimiento: 1984 }]));
  });

  it('el nivel educativo se elige de la lista y guarda solo, sin botón', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('combobox', { name: tm('mi.campos.nivel.nombre') }));
    fireEvent.click(screen.getByRole('option', { name: t('miEspacio.niveles.prefiero_no_decir') }));
    await waitFor(() => expect(posts()).toEqual([{ nivel_educativo: 'prefiero_no_decir' }]));
  });

  it('si la API falla, el cartel de la app lo dice y la fila no dice «Guardado»', async () => {
    guardarFalla = true;
    render(<App />);
    fireEvent.change(await screen.findByLabelText(tm('mi.campos.ciudad.nombre')), { target: { value: 'Mérida' } });
    guardarFila(tm('mi.campos.ciudad.nombre'));
    expect(await screen.findByText(tm('mi.ajustes.error'))).toBeTruthy();
    expect(screen.queryByText(tm('settings.saved'))).toBeNull();
  });
});

describe('«Completa tu perfil», después de «Me anoto»', () => {
  const anotarse = async () => {
    window.history.replaceState(null, '', `/me-anoto/${SLUG}`);
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: t('miEspacio.confirmarLugar') }));
    await screen.findByText('AD-0042');
  };

  it('si faltan datos del perfil, la tarjeta suave con el enlace a «Tus datos»; no bloquea nada', async () => {
    await anotarse();
    expect(screen.getByText(t('miEspacio.perfil.completaTitulo'))).toBeTruthy();
    expect((screen.getByRole('link', { name: t('miEspacio.perfil.completaEnlace') }) as HTMLAnchorElement).getAttribute('href')).toBe('/ajustes?s=taller');
  });

  it('con el perfil completo, no aparece', async () => {
    persona = { ...base, ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'posgrado' };
    await anotarse();
    expect(screen.queryByText(t('miEspacio.perfil.completaTitulo'))).toBeNull();
  });
});
