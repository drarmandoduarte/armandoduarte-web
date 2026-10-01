/**
 * El panel del equipo, en pantalla — orden #24 A.
 *
 * Lo que decide la base (quién ve qué filas) se prueba en el banco
 * (`packages/db/src/el-panel-del-equipo.test.ts`). Acá, lo que decide la
 * pantalla: qué botón ve cada rol, que la búsqueda achique lo que llegó y que
 * el CSV salga con BOM. `api()` se reemplaza por un doble: a esta altura lo que
 * se prueba es qué se pinta con lo que contesta, no la consulta.
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
    return falso.respuestas[ruta] ?? { ok: true };
  },
}));
vi.mock('./descargar', () => ({
  descargar: (nombre: string, contenido: string) => { falso.descargas.push({ nombre, contenido }); },
}));
vi.mock('../supabase', () => ({ variablesQueFaltan: () => [], supabase: {} }));

import '../i18n';
import { Panel } from './Panel';
import type { Yo } from '../comun/api';

const CLIENTES = [
  { persona_id: 'u-armando', nombre: 'Armando', apellido: 'Duarte', email: 'armando@x.mx', whatsapp: '+52 999 000 0000', pais: 'MX', alta: '2026-09-29T10:00:00Z', cursos: 0, ultimo_curso: null, ultima_inscripcion: null, rol: 'dueno', territorio: 'todos', activo: true },
  { persona_id: 'u-gabi', nombre: 'Gabi', apellido: 'Ruiz', email: 'gabi@x.mx', whatsapp: null, pais: 'MX', alta: '2026-09-29T11:00:00Z', cursos: 0, ultimo_curso: null, ultima_inscripcion: null, rol: 'equipo', territorio: 'mexico', activo: true },
  { persona_id: 'u-ana', nombre: 'Ana', apellido: 'López', email: 'ana@ejemplo.mx', whatsapp: '+52 999 123 4567', pais: 'MX', alta: '2026-09-30T12:00:00Z', cursos: 1, ultimo_curso: 'El arte de amar a tu adolescente', ultima_inscripcion: '2026-09-30T13:00:00Z', rol: null, territorio: null, activo: null },
];

const yo = (rol: 'dueno' | 'equipo', id: string): Yo => ({
  rol, tipo: 'equipo', persona: { id, nombre: 'X', apellido: null, whatsapp: null, pais: 'MX' },
});

beforeEach(() => {
  falso.pedidos = [];
  falso.descargas = [];
  falso.respuestas = { 'equipo/cursos': { cursos: [] }, 'equipo/clientes': { clientes: CLIENTES } };
  window.history.replaceState(null, '', '/equipo#clientes');
});

describe('Clientes', () => {
  it('el dueño ve «Sumar al equipo» en Ana y «Quitar del equipo» en Gabi; nunca sobre sí mismo', async () => {
    render(<Panel yo={yo('dueno', 'u-armando')} />);
    const ana = (await screen.findByText('Ana López')).closest('tr') as HTMLElement;
    expect(within(ana).getByRole('button', { name: 'Sumar al equipo' })).toBeTruthy();
    const gabi = screen.getByText('Gabi Ruiz').closest('tr') as HTMLElement;
    expect(within(gabi).getByRole('button', { name: 'Quitar del equipo' })).toBeTruthy();
    /* «Armando Duarte» está también en la cabecera: se toma el de la tabla. */
    const armando = screen.getAllByText('Armando Duarte').map((e) => e.closest('tr')).find(Boolean) as HTMLElement;
    expect(within(armando).queryByRole('button')).toBeNull();
  });

  it('sumar pide territorio y confirmación, y manda lo elegido', async () => {
    render(<Panel yo={yo('dueno', 'u-armando')} />);
    const ana = (await screen.findByText('Ana López')).closest('tr') as HTMLElement;
    fireEvent.click(within(ana).getByRole('button', { name: 'Sumar al equipo' }));
    fireEvent.change(within(ana).getByLabelText('Territorio'), { target: { value: 'internacional' } });
    fireEvent.click(within(ana).getByRole('button', { name: 'Sumar a Ana López' }));
    await screen.findByText('Ana López');
    expect(falso.pedidos).toContainEqual({ ruta: 'equipo/miembros', cuerpo: { persona_id: 'u-ana', territorio: 'internacional' } });
  });

  it('el equipo (no dueño) no ve la columna ni ningún botón de equipo', async () => {
    render(<Panel yo={yo('equipo', 'u-gabi')} />);
    await screen.findByText('Ana López');
    expect(screen.queryByRole('columnheader', { name: 'Equipo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sumar al equipo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Quitar del equipo' })).toBeNull();
  });

  it('buscar achica lo que llegó (sin acentos), y exportar baja un CSV con BOM de lo que se ve', async () => {
    render(<Panel yo={yo('equipo', 'u-gabi')} />);
    await screen.findByText('Ana López');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lopez' } });
    expect(screen.queryByText('Gabi Ruiz')).toBeNull();
    expect(screen.getByText('1 de 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    expect(falso.descargas).toHaveLength(1);
    expect(falso.descargas[0].contenido.startsWith('\uFEFF')).toBe(true);
    expect(falso.descargas[0].contenido).toContain('Ana López,ana@ejemplo.mx');
    expect(falso.descargas[0].contenido).not.toContain('Gabi');
  });
});

describe('las pestañas', () => {
  it('son Cursos · Inscriptos · Clientes, en ese orden, y la del hash es la activa', async () => {
    render(<Panel yo={yo('dueno', 'u-armando')} />);
    const pestanas = screen.getAllByRole('tab').map((p) => p.textContent);
    expect(pestanas).toEqual(['Cursos', 'Inscriptos', 'Clientes']);
    expect(screen.getByRole('tab', { name: 'Clientes' }).getAttribute('aria-selected')).toBe('true');
  });
});
