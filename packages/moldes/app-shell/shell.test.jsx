// @vitest-environment jsdom
/** El esqueleto y las pantallas del menú. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { crearT } from '@moldes/idiomas';
import { Shell, filasDeNavegacion, pestanasDelCelular, etiquetaQueEntra } from './Shell.jsx';
import { CentroDeAlertas, Papelera, Equipo, repartirAlertas, diasQueQuedan } from './pantallas.jsx';

const t = crearT({ comunes: { app: 'Rivera' } });
const APP = { nombre: 'Rivera' };
const MODULOS = [{ id: 'propiedades', etiqueta: 'Propiedades', icono: 'house' }, { id: 'clientes', etiqueta: 'Clientes', icono: 'users' }];
const ventana = (ancho) => { window.matchMedia = (q) => ({ matches: /max-width: 599px/.test(q) ? ancho < 600 : false, addEventListener() {}, removeEventListener() {} }); };

beforeEach(() => ventana(1440));
afterEach(cleanup);

describe('la navegación, como dato', () => {
  it('el orden del molde: Pregúntale, Inicio, módulos, alertas, papelera, transversales', () => {
    const f = filasDeNavegacion({ t, app: APP, modulos: MODULOS, transversales: [{ id: 'pagos', etiqueta: 'Pagos' }], alertas: 3, conAsistente: true });
    expect(f.map((x) => x.id)).toEqual(['preguntar', 'inicio', 'propiedades', 'clientes', 'alertas', 'papelera', 'pagos']);
    expect(f[0]).toMatchObject({ etiqueta: 'Pregúntale a Rivera', atajo: '⌘K' });
    expect(f.find((x) => x.id === 'alertas').cuenta).toBe(3);
  });
  it('sin asistente no hay «Pregúntale»: una puerta que no abre nada es peor que ninguna', () => {
    expect(filasDeNavegacion({ t, app: APP }).map((x) => x.id)).toEqual(['inicio', 'alertas', 'papelera']);
  });
  it('en celular, cuatro pestañas: Inicio, el principal, Pregúntale, Ajustes', () => {
    expect(pestanasDelCelular({ t, modulos: MODULOS, principal: 'clientes', conAsistente: true }).map((x) => x.id)).toEqual(['inicio', 'clientes', 'preguntar', 'ajustes']);
  });
});

describe('decisiones de Dirección (PR 5)', () => {
  it('«Pregúntale a {app}» pasa a «Pregúntale» cuando no entra', () => {
    expect(etiquetaQueEntra({ larga: 'Pregúntale a Rivera', corta: 'Pregúntale', entra: true })).toBe('Pregúntale a Rivera');
    expect(etiquetaQueEntra({ larga: 'Pregúntale a Consultorio Sur', corta: 'Pregúntale', entra: false })).toBe('Pregúntale');
    expect(etiquetaQueEntra({ larga: 'Inicio', entra: false })).toBe('Inicio');
    const f = filasDeNavegacion({ t, app: APP, conAsistente: true });
    expect(f[0].etiquetaCorta).toBe('Pregúntale');
  });
  it('mide de verdad: si el texto no entra en su lugar, muestra el corto', () => {
    const anchos = { scrollWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth'), clientWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth') };
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get() { return this.textContent.length * 10; } });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 150; } });
    try {
      render(<Shell t={t} app={{ nombre: 'Consultorio Sur' }} onPreguntar={() => {}} />);
      const fila = document.querySelector('[data-fila="preguntar"]');
      expect(fila.textContent).toContain('Pregúntale');
      expect(fila.textContent).not.toContain('Consultorio');
    } finally {
      for (const [k, d] of Object.entries(anchos)) { if (d) Object.defineProperty(HTMLElement.prototype, k, d); else delete HTMLElement.prototype[k]; }
    }
  });
  it('la marca va sola en su línea, con los íconos en la fila de abajo', () => {
    render(<Shell t={t} app={APP} onPreguntar={() => {}} />);
    const marca = document.querySelector('[data-marca]');
    expect(marca.parentElement.style.flexDirection).toBe('column');
    expect(marca.nextElementSibling.querySelector('[aria-label="Contraer la barra"]')).toBeTruthy();
  });
});

describe('el shell en escritorio', () => {
  it('marca, campana con el número, fila activa, y el pie con el usuario y el engranaje', () => {
    const onIr = vi.fn();
    render(<Shell t={t} app={APP} modulos={MODULOS} activo="propiedades" alertas={7} usuario={{ nombre: 'Ana Rivas', plan: 'Plan Pro' }} onIr={onIr} onSalir={() => {}}>contenido</Shell>);
    expect(screen.getByRole('button', { name: 'Centro de alertas, 7 nuevas' })).toBeTruthy();
    expect(document.querySelector('[data-fila="propiedades"]').getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Plan Pro')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }));
    expect(onIr).toHaveBeenCalledWith('ajustes');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir tu perfil' }));
    expect(onIr).toHaveBeenCalledWith('perfil');
    expect(screen.getByText('contenido')).toBeTruthy();
  });
  it('⌘K y Ctrl+K abren el asistente', () => {
    const onPreguntar = vi.fn();
    render(<Shell t={t} app={APP} onPreguntar={onPreguntar} />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    fireEvent.keyDown(window, { key: 'K', ctrlKey: true });
    expect(onPreguntar).toHaveBeenCalledTimes(2);
  });
  it('contraer deja los íconos con su nombre accesible', () => {
    render(<Shell t={t} app={APP} modulos={MODULOS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Contraer la barra' }));
    expect(document.querySelector('aside').dataset.contraida).toBe('true');
    expect(within(screen.getByRole('navigation')).getByRole('button', { name: 'Propiedades' })).toBeTruthy();
  });
});

describe('el shell en celular', () => {
  beforeEach(() => ventana(390));
  it('barra de arriba con menú y campana, y la pestaña inferior de cuatro', () => {
    render(<Shell t={t} app={APP} modulos={MODULOS} onPreguntar={() => {}} />);
    expect(document.querySelector('[data-shell="celular"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Menú' })).toBeTruthy();
    const abajo = [...document.querySelectorAll('[data-clave]')].map((n) => n.dataset.clave);
    expect(abajo).toEqual(['inicio', 'propiedades', 'preguntar', 'ajustes']);
  });
});

describe('Centro de alertas', () => {
  it('cuatro columnas en su orden; un tono desconocido cae en Hoy', () => {
    const c = repartirAlertas([{ id: 1, tono: 'critico' }, { id: 2, tono: 'raro' }, { id: 3, tono: 'oportunidades' }]);
    expect(Object.keys(c)).toEqual(['critico', 'hoy', 'proximamente', 'oportunidades']);
    expect(c.hoy.map((a) => a.id)).toEqual([2]);
  });
  it('vacío, lo dice', () => {
    render(<CentroDeAlertas t={t} alertas={[]} />);
    expect(screen.getByText('Nada que mirar hoy. Así da gusto.')).toBeTruthy();
  });
});

describe('Papelera', () => {
  it('cuenta los días que quedan, y nunca menos de cero', () => {
    expect(diasQueQuedan('2026-10-01', '2026-10-04')).toBe(27);
    expect(diasQueQuedan('2026-08-01', '2026-10-04')).toBe(0);
  });
  it('restaurar llama a la app con el id', () => {
    const onRestaurar = vi.fn();
    render(<Papelera t={t} hoy="2026-10-04" onRestaurar={onRestaurar} items={[{ id: 'x', nombre: 'Rivera 1234', borradoEl: '2026-10-02', fechaTexto: '2/10', persona: 'Ana' }]} />);
    expect(screen.getByText('Se borra en 28 días', { exact: false })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(onRestaurar).toHaveBeenCalledWith('x');
  });
});

describe('Equipo (reglas-pr-3 §2 y §5)', () => {
  const personas = [{ id: 'yo', nombre: 'Ana', yo: true, estado: 'activa' }, { id: 'b', nombre: 'Luis', estado: 'activa', rol: 'recepcion' }];
  const acciones = { invitar: () => {}, suspender: () => {}, resetearAutenticador: () => {} };
  it('quien manda invita, suspende y resetea; nadie se toca a sí mismo', () => {
    render(<Equipo t={t} ctx={{ manda: true }} kit={{ rescate: 'dueno' }} personas={personas} acciones={acciones} />);
    expect(screen.getByRole('button', { name: 'Invitar' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Suspender' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Resetear autenticador' })).toHaveLength(1);
  });
  it('con rescate solo, no existe resetear el autenticador de otro', () => {
    render(<Equipo t={t} ctx={{ manda: true }} kit={{ rescate: 'solo' }} personas={personas} acciones={acciones} />);
    expect(screen.queryByRole('button', { name: 'Resetear autenticador' })).toBeNull();
  });
  it('quien no manda ve la lista y nada más', () => {
    render(<Equipo t={t} ctx={{ manda: false }} personas={personas} acciones={acciones} />);
    expect(screen.getByText('Luis')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Invitar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Suspender' })).toBeNull();
  });
});
