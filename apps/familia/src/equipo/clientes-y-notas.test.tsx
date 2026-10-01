/**
 * Clientes con el perfil y la ficha con notas — orden #27 D.3. `api()` es un
 * doble con datos de prueba; lo que decide la base (territorio, el cliente no
 * lee notas) está probado en el banco y en la API contra el esquema.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

const falso = vi.hoisted(() => ({
  respuestas: {} as Record<string, unknown>,
  pedidos: [] as { ruta: string; cuerpo?: unknown }[],
}));
vi.mock('../comun/api', async (original) => ({
  ...(await original<typeof import('../comun/api')>()),
  api: async (ruta: string, opciones?: { cuerpo?: unknown }) => {
    falso.pedidos.push({ ruta, cuerpo: opciones?.cuerpo });
    return falso.respuestas[ruta] ?? { ok: true };
  },
}));
vi.mock('./descargar', () => ({ descargar: () => {} }));
vi.mock('../supabase', () => ({ variablesQueFaltan: () => [], supabase: {} }));

import i18n from '../i18n';
import { Panel } from './Panel';
import type { Yo } from '../comun/api';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);
const ANA = 'aaaaaaaa-0000-4000-8000-000000000000';
const CLIENTES = [
  { persona_id: ANA, nombre: 'Ana', apellido: 'Prueba', email: 'ana@ejemplo.mx', whatsapp: null, pais: 'MX', ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'licenciatura', cuantas_notas: 1, alta: '2026-09-30T12:00:00Z', cursos: 1, ultimo_curso: 'Taller de prueba', ultima_inscripcion: '2026-09-30T13:00:00Z', rol: null, territorio: null, activo: null },
  { persona_id: 'bbbbbbbb-0000-4000-8000-000000000000', nombre: 'Bea', apellido: 'Prueba', email: 'bea@ejemplo.mx', whatsapp: null, pais: 'MX', ciudad: 'Cancún', anio_nacimiento: null, nivel_educativo: null, cuantas_notas: 0, alta: '2026-09-30T12:00:00Z', cursos: 0, ultimo_curso: null, ultima_inscripcion: null, rol: null, territorio: null, activo: null },
];
const yo: Yo = { rol: 'equipo', tipo: 'equipo', persona: { id: 'u', nombre: 'X', apellido: null, whatsapp: null, pais: 'MX' } };

beforeEach(() => {
  falso.pedidos = [];
  falso.respuestas = {
    'equipo/cursos': { cursos: [] },
    'equipo/clientes': { clientes: CLIENTES },
    [`equipo/clientes/${ANA}`]: {
      inscripciones: [{ inscripcion_id: 'i', referencia: 'AD-0042', curso: 'Taller de prueba', inicio: '2026-11-05T14:30:00Z', zona: 'America/Merida', estado: 'confirmada' }],
      notas: [{ id: 'n', texto: 'Pagó en efectivo en el taller', created_at: '2026-10-01T16:00:00Z', autor: 'Gabi' }],
    },
  };
  window.history.replaceState(null, '', '/equipo#clientes');
});

const filaDe = async (nombre: string) => (await screen.findByText(`${nombre} Prueba`)).closest('tr') as HTMLElement;

describe('Clientes con el perfil', () => {
  it('ciudad, edad calculada (nunca el año) y nivel', async () => {
    render(<Panel yo={yo} />);
    const ana = await filaDe('Ana');
    expect(within(ana).getByText('Mérida')).toBeTruthy();
    expect(within(ana).getByText(String(new Date().getFullYear() - 1984))).toBeTruthy();
    expect(within(ana).getByText(t('miEspacio.niveles.licenciatura'))).toBeTruthy();
    expect(within(ana).queryByText('1984')).toBeNull();
  });

  it('buscar encuentra por ciudad', async () => {
    render(<Panel yo={yo} />);
    await filaDe('Ana');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'cancun' } });
    expect(screen.queryByText('Ana Prueba')).toBeNull();
    expect(screen.getByText('Bea Prueba')).toBeTruthy();
  });
});

describe('la ficha y las notas', () => {
  it('abrir muestra sus inscripciones con estado y las notas firmadas', async () => {
    render(<Panel yo={yo} />);
    fireEvent.click(within(await filaDe('Ana')).getByRole('button', { name: t('equipo.clientes.abrirAria', { nombre: 'Ana Prueba' }) }));
    expect(await screen.findByText('Pagó en efectivo en el taller')).toBeTruthy();
    expect(screen.getByText(/· Gabi$/)).toBeTruthy();
    expect(screen.getByText('AD-0042')).toBeTruthy();
  });

  it('una nota vacía no sale; una con texto se manda a la API', async () => {
    render(<Panel yo={yo} />);
    fireEvent.click(within(await filaDe('Ana')).getByRole('button', { name: t('equipo.clientes.abrirAria', { nombre: 'Ana Prueba' }) }));
    await screen.findByText('Pagó en efectivo en el taller');
    fireEvent.click(screen.getByRole('button', { name: t('equipo.clientes.detalle.agregar') }));
    expect(await screen.findByText(t('equipo.clientes.detalle.errores.nota'))).toBeTruthy();
    expect(falso.pedidos.some((p) => p.ruta.endsWith('/notas'))).toBe(false);
    fireEvent.change(screen.getByLabelText(new RegExp(`^${t('equipo.clientes.detalle.nota')}`)), { target: { value: 'Pidió factura' } });
    fireEvent.click(screen.getByRole('button', { name: t('equipo.clientes.detalle.agregar') }));
    await screen.findByText('Pagó en efectivo en el taller');
    expect(falso.pedidos).toContainEqual({ ruta: `equipo/clientes/${ANA}/notas`, cuerpo: { texto: 'Pidió factura' } });
  });

  it('ninguna pantalla ofrece borrar ni editar una nota', async () => {
    render(<Panel yo={yo} />);
    fireEvent.click(within(await filaDe('Ana')).getByRole('button', { name: t('equipo.clientes.abrirAria', { nombre: 'Ana Prueba' }) }));
    await screen.findByText('Pagó en efectivo en el taller');
    expect(screen.queryByRole('button', { name: /borrar|eliminar|editar/i })).toBeNull();
  });
});
