// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { crearT } from '@moldes/idiomas';
import { Bienvenida } from './Bienvenida.jsx';
import { validarPasos, sePuedeSaltar } from './reglas.js';

const t = crearT();
const P = (id, extra = {}) => ({ id, titulo: `Paso *${id}*.`, ...extra });
afterEach(cleanup);

describe('las reglas', () => {
  it('tres pantallas como máximo, y al menos una', () => {
    expect(() => validarPasos([P('a'), P('b'), P('c'), P('d')])).toThrow(/3 como máximo/);
    expect(() => validarPasos([])).toThrow(/al menos uno/);
  });
  it('«Saltar» nunca en la primera ni en una obligatoria', () => {
    const pasos = [P('a'), P('b', { obligatoria: true }), P('c')];
    expect([0, 1, 2].map((i) => sePuedeSaltar(pasos, i))).toEqual([false, false, true]);
  });
});

describe('la pantalla', () => {
  it('Paso n de m, Siguiente que guarda, y Empezar en la última', async () => {
    const guardar = vi.fn(() => Promise.resolve());
    const onTerminar = vi.fn();
    render(<Bienvenida t={t} pasos={[P('nombre', { alSeguir: guardar }), P('equipo')]} onTerminar={onTerminar} />);
    expect(screen.getByText('§ · ', { exact: false }).textContent).toContain('Paso 1 de 2');
    expect(screen.queryByText('Saltar')).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Siguiente/ })); });
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('§ · ', { exact: false }).textContent).toContain('Paso 2 de 2');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Empezar' })); });
    expect(onTerminar).toHaveBeenCalledTimes(1);
  });
  it('si guardar falla, no avanza', async () => {
    const guardar = vi.fn(() => Promise.reject(new Error('no')));
    render(<Bienvenida t={t} pasos={[P('a', { alSeguir: guardar }), P('b')]} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Siguiente/ })); });
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(document.querySelector('main').dataset.paso).toBe('a');
  });
  it('«Siguiente» apagado mientras el paso no esté listo; Saltar no guarda', async () => {
    const guardar = vi.fn();
    render(<Bienvenida t={t} pasos={[P('a'), P('b', { listo: false, alSeguir: guardar }), P('c')]} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Siguiente/ })); });
    expect(screen.getByRole('button', { name: /Siguiente/ }).disabled).toBe(true);
    await act(async () => { fireEvent.click(screen.getByText('Saltar')); });
    expect(guardar).not.toHaveBeenCalled();
    expect(document.querySelector('main').dataset.paso).toBe('c');
  });
});
