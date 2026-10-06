/**
 * Inscriptos: revisar pagos, en pantalla — orden #27 C.2.
 *
 * `api()` es un doble con **datos de prueba**. Lo que se afirma es lo que
 * decide la pantalla: el filtro y su arranque, qué acciones ve cada rol, que
 * rechazar sin motivo no sale, que confirmar manda lo declarado, y el CSV con
 * las columnas nuevas. Que la base lo deje hacer está probado en el banco y en
 * la API contra el esquema.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

const falso = vi.hoisted(() => ({
  respuestas: {} as Record<string, unknown>,
  pedidos: [] as { ruta: string; cuerpo?: unknown }[],
  descargas: [] as { nombre: string; contenido: string }[],
}));

vi.mock('../comun/api', async (original) => ({
  ...(await original<typeof import('../comun/api')>()),
  api: async (ruta: string, opciones?: { cuerpo?: unknown }) => {
    falso.pedidos.push({ ruta, cuerpo: opciones?.cuerpo });
    return falso.respuestas[ruta] ?? { ok: true, correo: 'enviado' };
  },
}));
vi.mock('./descargar', () => ({
  descargar: (nombre: string, contenido: string) => { falso.descargas.push({ nombre, contenido }); },
}));
vi.mock('../supabase', () => ({ variablesQueFaltan: () => [], supabase: {} }));

import i18n from '../i18n';
import { Panel } from './Panel';
import type { Yo } from '../comun/api';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
const EDICION = '99999999-9999-4999-8999-999999999999';
const CURSOS = [{
  id: 'c', slug: 'taller-de-prueba', titulo: 'Taller de prueba', bajada: null, descripcion: null, modalidad: 'presencial', estado: 'publicado',
  ediciones: [{ id: EDICION, inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: null, ciudad: 'Mérida', pais: 'MX', cupo: null, precio_monto: 1170, precio_moneda: 'MXN', inscripciones_hasta: null, estado: 'abierta', inscriptos: 3 }],
}];
const libroVacio = {
  ultimo_tipo: null, ultimo_el: null, ultimo_por: null, ultima_nota: null, monto_declarado: null, moneda_declarada: null,
  fecha_transferencia: null, banco: null, ultimos4_o_folio: null, comprobante_path: null, monto_confirmado: null, moneda_confirmada: null,
};
const fila = (id: string, nombre: string, estado: string, libro: Record<string, unknown> = {}) => ({
  inscripcion_id: id, referencia: `AD-${id.slice(0, 4)}`, nombre, apellido: 'Prueba', email: `${nombre.toLowerCase()}@ejemplo.mx`,
  whatsapp: null, pais: 'MX', inscripto_el: '2026-10-01T16:00:00Z', estado, ...libroVacio, ...libro,
});
const INSCRIPTOS = [
  fila('aaaa1111-0000-4000-8000-000000000000', 'Ana', 'en_revision', {
    ultimo_tipo: 'declarado', ultimo_el: '2026-10-02T15:00:00Z', ultimo_por: 'Ana', monto_declarado: '1170.00', moneda_declarada: 'MXN',
    fecha_transferencia: '2026-10-02', banco: 'Banco de prueba', comprobante_path: 'aaaa/x.pdf',
  }),
  fila('bbbb2222-0000-4000-8000-000000000000', 'Bea', 'confirmada', {
    ultimo_tipo: 'confirmado', ultimo_el: '2026-10-02T16:00:00Z', ultimo_por: 'Gabi', monto_declarado: '1170.00', monto_confirmado: '1170.00', moneda_confirmada: 'MXN', comprobante_path: 'bbbb/x.pdf',
  }),
  fila('cccc3333-0000-4000-8000-000000000000', 'Cata', 'pendiente_de_pago', {
    ultimo_tipo: 'rechazado', ultimo_el: '2026-11-03T16:00:00Z', ultimo_por: 'Diana', ultima_nota: 'El monto no coincide', comprobante_path: 'cccc/x.pdf',
  }),
];

const yo = (rol: 'dueno' | 'equipo'): Yo => ({ rol, tipo: 'equipo', persona: { id: 'u', nombre: 'X', apellido: null, whatsapp: null, pais: 'MX' } });

beforeEach(() => {
  falso.pedidos = [];
  falso.descargas = [];
  falso.respuestas = { 'equipo/cursos': { cursos: CURSOS }, [`equipo/inscriptos/${EDICION}`]: { inscriptos: INSCRIPTOS } };
  window.history.replaceState(null, '', '/equipo#inscriptos');
});

const filaDe = async (nombre: string) => (await screen.findByText(`${nombre} Prueba`)).closest('tr') as HTMLElement;

describe('el filtro', () => {
  it('arranca en «En revisión» porque hay una, y muestra solo esa', async () => {
    render(<Panel yo={yo('equipo')} />);
    await filaDe('Ana');
    const activo = screen.getByRole('button', { pressed: true });
    expect(activo.textContent).toContain(t('panel.inscriptos.filtros.en_revision'));
    expect(screen.queryByText('Bea Prueba')).toBeNull();
  });

  it('«Todos» muestra las tres, con el historial corto («Rechazado el … por Diana · motivo»)', async () => {
    render(<Panel yo={yo('equipo')} />);
    await filaDe('Ana');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${t('panel.inscriptos.filtros.todos')}`) }));
    const cata = await filaDe('Cata');
    expect(within(cata).getByText(/^Rechazado el .* por Diana · El monto no coincide$/)).toBeTruthy();
    expect(screen.getByText('Bea Prueba')).toBeTruthy();
  });

  it('sin ninguna en revisión, arranca en «Todos»', async () => {
    falso.respuestas[`equipo/inscriptos/${EDICION}`] = { inscriptos: INSCRIPTOS.slice(1) };
    render(<Panel yo={yo('equipo')} />);
    await filaDe('Bea');
    expect(screen.getByRole('button', { pressed: true }).textContent).toContain(t('panel.inscriptos.filtros.todos'));
  });
});

describe('las acciones', () => {
  it('en revisión: Ver, Confirmar (teal) y Rechazar; el equipo no ve Anular', async () => {
    render(<Panel yo={yo('equipo')} />);
    const ana = await filaDe('Ana');
    expect(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.ver') })).toBeTruthy();
    expect(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.confirmar') }).className).toContain('btn--teal');
    expect(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.rechazar') }).className).not.toContain('btn--naranja');
    expect(within(ana).queryByRole('button', { name: t('panel.inscriptos.pago.anular') })).toBeNull();
    expect(document.querySelectorAll('.btn--naranja')).toHaveLength(0);
  });

  it('el dueño ve Anular', async () => {
    render(<Panel yo={yo('dueno')} />);
    const ana = await filaDe('Ana');
    expect(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.anular') })).toBeTruthy();
  });

  it('rechazar sin motivo NO sale: lo dice en el mismo lugar', async () => {
    render(<Panel yo={yo('equipo')} />);
    const ana = await filaDe('Ana');
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.rechazar') }));
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.siRechazar') }));
    expect(await within(ana).findByText(t('panel.inscriptos.pago.errores.motivo'))).toBeTruthy();
    expect(falso.pedidos.some((p) => p.ruta === 'pagos/resolver')).toBe(false);
  });

  it('rechazar con motivo manda el tipo y la nota', async () => {
    render(<Panel yo={yo('equipo')} />);
    const ana = await filaDe('Ana');
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.rechazar') }));
    fireEvent.change(within(ana).getByLabelText(new RegExp(`^${t('panel.inscriptos.pago.motivo')}`)), { target: { value: 'El monto no coincide' } });
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.siRechazar') }));
    await screen.findByText(t('panel.inscriptos.pago.hecho'));
    expect(falso.pedidos).toContainEqual({
      ruta: 'pagos/resolver',
      cuerpo: { inscripcion_id: INSCRIPTOS[0].inscripcion_id, tipo: 'rechazado', monto: null, nota: 'El monto no coincide' },
    });
  });

  it('confirmar pide confirmación en el mismo lugar, con el monto declarado prellenado', async () => {
    render(<Panel yo={yo('equipo')} />);
    const ana = await filaDe('Ana');
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.confirmar') }));
    expect((within(ana).getByLabelText(t('panel.inscriptos.pago.monto')) as HTMLInputElement).value).toBe('1170');
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.siConfirmar') }));
    await screen.findByText(t('panel.inscriptos.pago.hecho'));
    expect(falso.pedidos).toContainEqual({
      ruta: 'pagos/resolver',
      cuerpo: { inscripcion_id: INSCRIPTOS[0].inscripcion_id, tipo: 'confirmado', monto: 1170, nota: null },
    });
  });

  it('si el correo no salió, la pantalla lo dice: quedó hecho igual', async () => {
    falso.respuestas['pagos/resolver'] = { ok: true, correo: 'no_enviado' };
    render(<Panel yo={yo('equipo')} />);
    const ana = await filaDe('Ana');
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.confirmar') }));
    fireEvent.click(within(ana).getByRole('button', { name: t('panel.inscriptos.pago.siConfirmar') }));
    expect(await screen.findByText(t('panel.inscriptos.pago.correoNoSalio'))).toBeTruthy();
  });
});

describe('el CSV', () => {
  it('suma estado, último movimiento, monto declarado y monto confirmado', async () => {
    render(<Panel yo={yo('equipo')} />);
    await filaDe('Ana');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${t('panel.inscriptos.filtros.todos')}`) }));
    fireEvent.click(screen.getByRole('button', { name: t('panel.inscriptos.exportar') }));
    const [encabezado, , bea] = falso.descargas[0].contenido.replace('﻿', '').split('\r\n');
    expect(encabezado).toBe('Referencia,Nombre,Correo,WhatsApp,País,Inscripción,Estado,Último movimiento,Monto declarado,Monto confirmado');
    expect(bea).toContain('Confirmada,2026-10-02T16:00:00Z,1170.00,1170.00');
  });
});
