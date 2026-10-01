/**
 * «Tus datos» con el perfil, y la tarjeta «Completa tu perfil» — orden #27 D.2.
 *
 * Supabase y la API simulados, con datos de prueba. Lo que la base permite
 * (el cliente edita lo suyo, el año en rango) está probado en el banco
 * (`packages/db/src/el-perfil.test.ts`) y en la API contra el esquema.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
  window.history.replaceState(null, '', '/mi-espacio');
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const guardar = () => fireEvent.click(screen.getByRole('button', { name: t('miEspacio.guardar') }));

describe('Tus datos: el perfil', () => {
  it('los cuatro campos nuevos, todos vacíos y opcionales; país con México primero', async () => {
    render(<App />);
    const pais = await screen.findByLabelText(t('miEspacio.pais')) as HTMLSelectElement;
    expect([...pais.options].slice(0, 2).map((o) => o.value)).toEqual(['', 'MX']);
    expect(pais.value).toBe('MX');
    expect(screen.getByLabelText(new RegExp(`^${t('miEspacio.ciudad')}`))).toBeTruthy();
    expect(screen.getByLabelText(t('miEspacio.nivelEducativo'))).toBeTruthy();
    expect(document.getElementById('anio_nacimiento')).not.toBeNull();
  });

  it('al escribir el año aparece la edad al lado', async () => {
    render(<App />);
    const anio = await screen.findByLabelText(new RegExp(`^${t('miEspacio.anioNacimiento')}`));
    fireEvent.change(anio, { target: { value: '1984' } });
    expect(screen.getByText(t('miEspacio.edad', { edad: new Date().getFullYear() - 1984 }))).toBeTruthy();
  });

  it('«¿Para qué pedimos esto?» enlaza al bloque #perfil del aviso de privacidad', async () => {
    render(<App />);
    await screen.findByLabelText(t('miEspacio.nivelEducativo'));
    /* El pie también dice «Aviso de privacidad»: se busca dentro de «Tus datos». */
    const enlace = within(document.getElementById('tus-datos')!).getByRole('link', { name: t('miEspacio.perfil.aviso') }) as HTMLAnchorElement;
    expect(enlace.href).toBe('https://armandoduarte.com/privacidad#perfil');
    expect(screen.getByText(t('miEspacio.perfil.paraQue'))).toBeTruthy();
  });

  it('Guardar manda todo junto a POST /api/yo, con vacío como null y el año como número', async () => {
    render(<App />);
    fireEvent.change(await screen.findByLabelText(new RegExp(`^${t('miEspacio.ciudad')}`)), { target: { value: 'Mérida' } });
    fireEvent.change(screen.getByLabelText(new RegExp(`^${t('miEspacio.anioNacimiento')}`)), { target: { value: '1984' } });
    fireEvent.change(screen.getByLabelText(t('miEspacio.nivelEducativo')), { target: { value: 'prefiero_no_decir' } });
    guardar();
    expect(await screen.findByText(t('miEspacio.guardado'))).toBeTruthy();
    expect(pedidos.find((p) => p.ruta === '/api/yo' && p.metodo === 'POST')?.cuerpo).toEqual({
      nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 000 0000', pais: 'MX',
      ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'prefiero_no_decir',
    });
  });

  it('un año fuera de rango se dice en el campo, y no se manda nada', async () => {
    render(<App />);
    fireEvent.change(await screen.findByLabelText(new RegExp(`^${t('miEspacio.anioNacimiento')}`)), { target: { value: '1900' } });
    guardar();
    expect(await screen.findByText(t('miEspacio.perfil.errores.anio'))).toBeTruthy();
    expect(pedidos.some((p) => p.ruta === '/api/yo' && p.metodo === 'POST')).toBe(false);
  });

  it('si la API falla, se dice', async () => {
    guardarFalla = true;
    render(<App />);
    await screen.findByLabelText(t('miEspacio.nivelEducativo'));
    guardar();
    expect(await screen.findByText(t('miEspacio.errorAlGuardar'))).toBeTruthy();
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
    expect((screen.getByRole('link', { name: t('miEspacio.perfil.completaEnlace') }) as HTMLAnchorElement).getAttribute('href')).toBe('#tus-datos');
  });

  it('con el perfil completo, no aparece', async () => {
    persona = { ...base, ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'posgrado' };
    await anotarse();
    expect(screen.queryByText(t('miEspacio.perfil.completaTitulo'))).toBeNull();
  });
});
