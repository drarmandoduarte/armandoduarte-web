// @vitest-environment jsdom
/** Inicio armado: el saludo, las acciones, los widgets, primeros pasos y ajustar. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { crearT } from '@moldes/idiomas';
import { Inicio } from './Inicio.jsx';
import { registrarCatalogo } from './catalogo.js';
import { WIDGETS_DEL_MOLDE } from './widgets.jsx';

const t = crearT({ comunes: { app: 'Rivera' } });
const CAT = registrarCatalogo(WIDGETS_DEL_MOLDE, { dueno: ['alertas', 'hoy', 'pendientes'] });
const ctx = { rol: 'dueno', manda: true };
const DATOS = {
  hoy: [{ id: 1, hora: '10:00', titulo: 'Visita a Rivera 1234' }],
  alertas: [{ id: 'a', tono: 'hoy', titulo: 'Contrato por vencer' }, { id: 'b', tono: 'critico', titulo: 'Pago rechazado' }],
  pendientes: [],
};
const orden = () => [...document.querySelectorAll('[data-widget]')].map((n) => n.dataset.widget);

beforeEach(() => { window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }); });
afterEach(cleanup);

describe('Inicio', () => {
  it('«Hola, *nombre*.» con el nombre acentuado, y hasta tres acciones', () => {
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} nombre="Ana" acciones={[1, 2, 3, 4].map((n) => ({ texto: `A${n}` }))} datos={DATOS} />);
    expect(screen.getByRole('heading', { level: 1 }).innerHTML).toBe('Hola, <em>Ana</em>.');
    expect(screen.queryByText('A4')).toBeNull();
    expect(screen.getByText('A3')).toBeTruthy();
  });

  it('los widgets del rol, en su orden, con sus datos; las alertas, de la más urgente a la menos', () => {
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} datos={DATOS} />);
    expect(orden()).toEqual(['alertas', 'hoy', 'pendientes']);
    const alertas = [...document.querySelectorAll('[data-widget="alertas"] li')].map((li) => li.textContent);
    expect(alertas).toEqual(['Pago rechazado', 'Contrato por vencer']);
    expect(screen.getByText('No hay pendientes.')).toBeTruthy();
  });

  it('lo que no se pudo leer se dice: un cero no es un silencio', () => {
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} datos={DATOS} noCargo={['la agenda']} />);
    expect(screen.getByRole('alert').textContent).toContain('No se pudo leer: la agenda.');
  });

  it('primeros pasos: se ven mientras falte uno, y desaparecen solos', () => {
    const pasos = [{ id: 'a', texto: 'Cargar la primera ficha', hecho: true }, { id: 'b', texto: 'Sumar al equipo' }];
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} primerosPasos={pasos} />);
    expect(screen.getByText('1 de 2')).toBeTruthy();
    cleanup();
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} primerosPasos={pasos.map((p) => ({ ...p, hecho: true }))} />);
    expect(screen.queryByText('Para empezar')).toBeNull();
  });

  it('el hueco del asistente va arriba de todo', () => {
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} mientras={<p>Mandé 3 recordatorios.</p>} />);
    expect(screen.getByText('§ · ', { exact: false }).textContent).toContain('Mientras no estabas');
  });
});

describe('Ajustar', () => {
  it('nada se guarda hasta «Listo»; ocultar, subir y guardar', async () => {
    const onGuardarConfig = vi.fn(() => Promise.resolve());
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} datos={DATOS} onGuardarConfig={onGuardarConfig} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }));
    fireEvent.click(screen.getByLabelText('Mostrar Pendientes'));
    fireEvent.click(screen.getByRole('button', { name: 'Subir Hoy' }));
    expect(orden()).toEqual(['hoy', 'alertas']);
    expect(onGuardarConfig).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Listo' })); });
    expect(onGuardarConfig).toHaveBeenCalledWith({ orden: ['hoy', 'alertas'] });
  });

  it('«Deshacer cambios» vuelve a como estaba al abrir; «Como al principio» guarda null', async () => {
    const onGuardarConfig = vi.fn(() => Promise.resolve());
    render(<Inicio t={t} ctx={ctx} catalogo={CAT} config={{ orden: ['hoy'] }} onGuardarConfig={onGuardarConfig} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }));
    fireEvent.click(screen.getByLabelText('Mostrar Centro de alertas'));
    expect(orden()).toEqual(['hoy', 'alertas']);
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer cambios' }));
    expect(orden()).toEqual(['hoy']);
    fireEvent.click(screen.getByRole('button', { name: 'Como al principio' }));
    expect(orden()).toEqual(['alertas', 'hoy', 'pendientes']);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Listo' })); });
    expect(onGuardarConfig).toHaveBeenCalledWith(null);
  });
});
