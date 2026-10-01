/**
 * «Mis talleres» y el comprobante, en la pantalla, con `App` entera — orden #27 C.1.
 *
 * Supabase y la API simulados, con **datos de prueba**. La subida a Storage se
 * reemplaza por un doble (`subir-comprobante.ts`): lo que se prueba acá es que
 * el archivo se valida **antes** de subir, que si la subida falla la API no se
 * llama, que los estados se dicen con palabras de persona, y que hay un
 * naranja por pantalla. Quién puede declarar qué lo prueba el banco
 * (`packages/db/src/el-comprobante.test.ts`) y la API contra el esquema.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const falso = vi.hoisted(() => ({
  sesion: null as Session | null,
  subidas: [] as { inscripcion: string; nombre: string }[],
  subidaFalla: false,
}));

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
vi.mock('./subir-comprobante', () => ({
  BUCKET_DE_COMPROBANTES: 'comprobantes',
  subirComprobante: async (inscripcion: string, archivo: File) => {
    falso.subidas.push({ inscripcion, nombre: archivo.name });
    if (falso.subidaFalla) throw new Error('sin red');
    return `${inscripcion}/33333333-3333-4333-8333-333333333333.pdf`;
  },
}));

import i18n from '../i18n';
import { App } from '../App';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const sesion = { access_token: `${b64({ alg: 'HS256' })}.${b64({ aal: 'aal1' })}.c2lnbmF0dXJh`, user: { id: 'u' } } as unknown as Session;

const INSC = '11111111-1111-4111-8111-111111111111';
const mio = (campos: Record<string, unknown> = {}) => ({
  referencia: 'AD-0042', inscripto_el: '2026-10-01T16:00:00Z', curso_titulo: 'Taller de prueba', curso_slug: 'taller-de-prueba',
  inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Sede de prueba', ciudad: 'Mérida',
  estado: 'pendiente_de_pago', inscripcion_id: INSC, precio_monto: 1170, precio_moneda: 'MXN', motivo_rechazo: null, tiene_comprobante: false,
  ...campos,
});
const abierto = {
  edicion_id: '22222222-2222-4222-8222-222222222222', curso_slug: 'otro', curso_titulo: 'Otro taller', curso_bajada: null,
  modalidad: 'en_linea', inicio: '2026-11-20T01:00:00Z', fin: '2026-11-20T03:00:00Z', zona: 'America/Merida', sede: 'En línea',
  ciudad: null, pais: 'MX', precio_monto: 450, precio_moneda: 'MXN', lugares: null, mi_referencia: null,
};
const COBRO = { banco: 'Banco de prueba', titular: 'Titular de prueba', clabe: '000000000000000000', concepto_sugerido: null };

let respuestas: { talleres: object; declarar: { status: number; cuerpo: object } };
let pedidos: { ruta: string; cuerpo: unknown }[];

beforeEach(() => {
  falso.sesion = sesion;
  falso.subidas = [];
  falso.subidaFalla = false;
  pedidos = [];
  respuestas = {
    talleres: { abiertos: [], mios: [mio()], cobro: COBRO },
    declarar: { status: 200, cuerpo: { ok: true, estado: 'en_revision' } },
  };
  vi.stubGlobal('fetch', vi.fn(async (url: string, opciones?: { body?: string }) => {
    const ruta = new URL(url, 'http://local').pathname;
    pedidos.push({ ruta, cuerpo: opciones?.body ? JSON.parse(opciones.body) : undefined });
    const json = (cuerpo: object, status = 200) =>
      new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
    if (ruta === '/api/yo') {
      return json({ rol: 'cliente', tipo: 'cliente', persona: { id: 'u', nombre: 'Prueba', apellido: 'Prueba', whatsapp: '+52 999 000 0000', pais: 'MX', zona_horaria: 'America/Merida' } });
    }
    if (ruta === '/api/talleres') return json(respuestas.talleres);
    if (ruta === '/api/pagos/declarar') return json(respuestas.declarar.cuerpo, respuestas.declarar.status);
    return json({});
  }));
  /* #29: «Mis talleres» vive en su propia pantalla. */
  window.history.replaceState(null, '', '/mis-talleres');
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const naranjas = () => [...document.querySelectorAll('.btn--naranja')].map((b) => b.textContent);
const archivo = (nombre: string, tipo: string, tamano?: number) => {
  const f = new File(['%PDF-1.4 prueba'], nombre, { type: tipo });
  if (tamano !== undefined) Object.defineProperty(f, 'size', { value: tamano });
  return f;
};
const abrirPaso = async () => {
  fireEvent.click(await screen.findByRole('button', { name: t('miEspacio.comprobante.subir') }));
  return document.getElementById('comprobante-archivo') as HTMLInputElement;
};

describe('los estados, con palabras de persona', () => {
  it('los cuatro: «Falta tu pago», «Comprobante recibido…», «Tu lugar está confirmado», «Anulada»', async () => {
    respuestas.talleres = {
      abiertos: [], cobro: null,
      mios: ['pendiente_de_pago', 'en_revision', 'confirmada', 'anulada'].map((estado, i) => mio({ referencia: `AD-000${i}`, estado })),
    };
    render(<App />);
    for (const texto of ['Falta tu pago', 'Comprobante recibido, lo estamos revisando', 'Tu lugar está confirmado', 'Anulada']) {
      expect(await screen.findByText(texto)).toBeTruthy();
    }
    /* «Ya transferí» solo en la que falta pagar. */
    expect(screen.getAllByRole('button', { name: t('miEspacio.comprobante.subir') })).toHaveLength(1);
  });

  it('después de un rechazo: el motivo arriba y «Ya transferí» de nuevo', async () => {
    respuestas.talleres = { abiertos: [], cobro: null, mios: [mio({ motivo_rechazo: 'El monto no coincide', tiene_comprobante: true })] };
    render(<App />);
    expect(await screen.findByText(t('miEspacio.comprobante.rechazado', { motivo: 'El monto no coincide' }))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('miEspacio.comprobante.subir') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('miEspacio.comprobante.ver') })).toBeTruthy();
  });
});

describe('el paso de subir', () => {
  it('abre en el mismo lugar con la fecha de hoy, el monto del taller y los datos de cobro para comparar', async () => {
    render(<App />);
    await abrirPaso();
    expect((document.getElementById('comprobante-monto') as HTMLInputElement).value).toBe('1170');
    expect((document.getElementById('comprobante-fecha_transferencia') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const paso = screen.getByRole('form', { name: t('miEspacio.comprobante.titulo') });
    expect(within(paso).getByText('000000000000000000')).toBeTruthy();
    expect(within(paso).getByText('AD-0042')).toBeTruthy();
  });

  it('un archivo de otro tipo se dice ANTES de subir, y no se sube', async () => {
    render(<App />);
    const entrada = await abrirPaso();
    fireEvent.change(entrada, { target: { files: [archivo('foto.heic', 'image/heic')] } });
    expect(await screen.findByText(t('miEspacio.comprobante.errores.tipo'))).toBeTruthy();
    fireEvent.change(document.getElementById('comprobante-banco')!, { target: { value: 'Banco de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: t('miEspacio.comprobante.enviar') }));
    expect(falso.subidas).toEqual([]);
    expect(pedidos.some((p) => p.ruta === '/api/pagos/declarar')).toBe(false);
  });

  it('más de 5 MB se dice ANTES de subir, y no se sube', async () => {
    render(<App />);
    const entrada = await abrirPaso();
    fireEvent.change(entrada, { target: { files: [archivo('grande.pdf', 'application/pdf', 5 * 1024 * 1024 + 1)] } });
    expect(await screen.findByText(t('miEspacio.comprobante.errores.pesado'))).toBeTruthy();
    fireEvent.change(document.getElementById('comprobante-banco')!, { target: { value: 'Banco de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: t('miEspacio.comprobante.enviar') }));
    expect(falso.subidas).toEqual([]);
  });

  it('sin banco no se manda: el campo lo dice', async () => {
    render(<App />);
    const entrada = await abrirPaso();
    fireEvent.change(entrada, { target: { files: [archivo('comprobante.pdf', 'application/pdf')] } });
    fireEvent.click(screen.getByRole('button', { name: t('miEspacio.comprobante.enviar') }));
    expect(await screen.findByText(t('miEspacio.comprobante.errores.banco'))).toBeTruthy();
    expect(falso.subidas).toEqual([]);
  });

  it('todo bien: sube a la carpeta de la inscripción, declara con la ruta y dice «Recibimos tu comprobante»', async () => {
    render(<App />);
    const entrada = await abrirPaso();
    fireEvent.change(entrada, { target: { files: [archivo('comprobante.pdf', 'application/pdf')] } });
    fireEvent.change(document.getElementById('comprobante-banco')!, { target: { value: ' Banco de prueba ' } });
    fireEvent.change(document.getElementById('comprobante-ultimos4_o_folio')!, { target: { value: '0000' } });
    fireEvent.click(screen.getByRole('button', { name: t('miEspacio.comprobante.enviar') }));
    expect(await screen.findByText(t('miEspacio.comprobante.recibido'))).toBeTruthy();
    expect(falso.subidas).toEqual([{ inscripcion: INSC, nombre: 'comprobante.pdf' }]);
    const declarar = pedidos.find((p) => p.ruta === '/api/pagos/declarar');
    expect(declarar?.cuerpo).toMatchObject({
      inscripcion_id: INSC, comprobante_path: `${INSC}/33333333-3333-4333-8333-333333333333.pdf`,
      monto: 1170, moneda: 'MXN', banco: 'Banco de prueba', ultimos4_o_folio: '0000',
    });
  });

  it('si la subida falla, la API NO se llama y se dice qué pasó', async () => {
    falso.subidaFalla = true;
    render(<App />);
    const entrada = await abrirPaso();
    fireEvent.change(entrada, { target: { files: [archivo('comprobante.pdf', 'application/pdf')] } });
    fireEvent.change(document.getElementById('comprobante-banco')!, { target: { value: 'Banco de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: t('miEspacio.comprobante.enviar') }));
    expect(await screen.findByText(t('miEspacio.comprobante.errores.subida'))).toBeTruthy();
    expect(pedidos.some((p) => p.ruta === '/api/pagos/declarar')).toBe(false);
  });
});

describe('un naranja por pantalla (D26)', () => {
  it('con un pago pendiente y un taller abierto: el naranja es «Ya transferí», no «Me anoto» ni «Guardar»', async () => {
    respuestas.talleres = { abiertos: [abierto], mios: [mio()], cobro: COBRO };
    render(<App />);
    await screen.findByRole('button', { name: t('miEspacio.comprobante.subir') });
    expect(naranjas()).toEqual([t('miEspacio.comprobante.subir')]);
  });

  it('con el paso abierto, el naranja pasa a «Enviar comprobante»', async () => {
    respuestas.talleres = { abiertos: [abierto], mios: [mio()], cobro: COBRO };
    render(<App />);
    await abrirPaso();
    expect(naranjas()).toEqual([t('miEspacio.comprobante.enviar')]);
  });

  it('#29: con el pago en revisión, Mis talleres no tiene naranja — no hay nada que pagar', async () => {
    respuestas.talleres = { abiertos: [abierto], mios: [mio({ estado: 'en_revision' })], cobro: COBRO };
    render(<App />);
    await screen.findByText('Comprobante recibido, lo estamos revisando');
    expect(naranjas()).toEqual([]);
  });

  it('#29: «Me anoto» lleva su naranja en Talleres, que es su pantalla, aunque haya un pago pendiente', async () => {
    respuestas.talleres = { abiertos: [abierto], mios: [mio()], cobro: COBRO };
    window.history.replaceState(null, '', '/talleres');
    render(<App />);
    await screen.findAllByRole('button', { name: t('miEspacio.meAnoto') });
    expect(naranjas()).toEqual([t('miEspacio.meAnoto')]);
  });
});
