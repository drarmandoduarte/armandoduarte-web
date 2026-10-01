/**
 * `CampoWhatsApp` — orden #32.
 *
 * El campo solo, con un formulario mínimo que valida con `core` como las tres
 * pantallas que lo usan (`/empezar`, Mis datos, «Me anoto»). Lo que se afirma
 * es lo que ve y hace la persona: un solo borde, abrir con clic y con teclado,
 * buscar «arg», elegir con Enter, el prefijo que cambia, el número formateado,
 * el error en español con el nombre del país, y el prefijo que sigue a País
 * mientras no se lo toque.
 *
 * Lo que se ve de verdad (la hairline, la sombra, el contraste, un naranja)
 * se mide en el navegador: `check/capturas-32.mjs`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { validarDatosParaAnotarse } from '@codice/core';
import i18n from '../i18n';
import { CampoWhatsApp } from './CampoWhatsApp';

const t = (clave: string, o?: Record<string, unknown>) => i18n.t(clave, o);

let ultimo = '';
function Formulario({ inicial = '', pais = 'MX' }: { inicial?: string; pais?: string }) {
  const [valor, setValor] = useState(inicial);
  const [paisDelForm, setPaisDelForm] = useState(pais);
  const [error, setError] = useState<string | undefined>();
  ultimo = valor;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setError(validarDatosParaAnotarse({ whatsapp: valor }, ['whatsapp']).whatsapp); }}>
      <select aria-label="País" value={paisDelForm} onChange={(e) => setPaisDelForm(e.target.value)}>
        {['MX', 'AR', 'ES', 'US'].map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <CampoWhatsApp id="w" rotulo="WhatsApp" valor={valor} alCambiar={setValor} error={error} paisSugerido={paisDelForm} />
      <button type="submit">Guardar</button>
    </form>
  );
}

afterEach(() => cleanup());

const boton = () => document.getElementById('w-pais') as HTMLButtonElement;
const numero = () => document.getElementById('w') as HTMLInputElement;

describe('se ve como un solo campo', () => {
  it('un solo borde: el país y el número viven en la misma caja; México por defecto', () => {
    render(<Formulario />);
    const cajas = document.querySelectorAll('[data-whatsapp]');
    expect(cajas).toHaveLength(1);
    expect(cajas[0].contains(boton())).toBe(true);
    expect(cajas[0].contains(numero())).toBe(true);
    expect(boton().textContent).toContain('+52');
    expect(boton().querySelector('img')?.getAttribute('src')).toBe('/banderas/mx.svg');
    expect(numero().getAttribute('inputmode')).toBe('tel');
    expect(numero().placeholder).toMatch(/^\d{3} \d{3} \d{4}$/);
  });
});

describe('el selector', () => {
  it('EL CASO: clic, buscar «arg», Enter → Argentina, +54, y el foco vuelve al número', () => {
    render(<Formulario />);
    fireEvent.click(boton());
    const buscar = screen.getByRole('combobox', { name: t('miEspacio.whatsappCampo.buscar') });
    expect(document.activeElement).toBe(buscar);
    fireEvent.change(buscar, { target: { value: 'arg' } });
    const opciones = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(opciones[0].textContent).toContain('Argentina');
    expect(buscar.getAttribute('aria-activedescendant')).toBe('w-op-AR');
    fireEvent.keyDown(buscar, { key: 'Enter' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(boton().textContent).toContain('+54');
    expect(boton().querySelector('img')?.getAttribute('src')).toBe('/banderas/ar.svg');
    expect(document.activeElement).toBe(numero());
  });

  it('con teclado: flecha abajo abre, México primero, las flechas mueven, Esc cierra y devuelve el foco', () => {
    render(<Formulario />);
    fireEvent.keyDown(boton(), { key: 'ArrowDown' });
    const lista = screen.getByRole('listbox');
    const opciones = within(lista).getAllByRole('option');
    expect(opciones[0].textContent).toContain('México');
    expect(opciones.length).toBeGreaterThan(230);
    const buscar = screen.getByRole('combobox', { name: t('miEspacio.whatsappCampo.buscar') });
    expect(buscar.getAttribute('aria-activedescendant')).toBe('w-op-MX');
    fireEvent.keyDown(buscar, { key: 'ArrowDown' });
    expect(buscar.getAttribute('aria-activedescendant')).not.toBe('w-op-MX');
    fireEvent.keyDown(buscar, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(boton());
    expect(boton().textContent).toContain('+52');
  });

  it('tipear sobre el botón abre buscando; un clic afuera cierra sin elegir', () => {
    render(<Formulario />);
    fireEvent.keyDown(boton(), { key: 'e' });
    expect((screen.getByRole('combobox', { name: t('miEspacio.whatsappCampo.buscar') }) as HTMLInputElement).value).toBe('e');
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('el número', () => {
  it('se formatea mientras se escribe y sube en internacional', () => {
    render(<Formulario />);
    fireEvent.change(numero(), { target: { value: '9991234567' } });
    expect(numero().value).toBe('999 123 4567');
    expect(ultimo).toBe('+529991234567');
  });

  it('pegado con «+», el país sale del número', () => {
    render(<Formulario />);
    fireEvent.change(numero(), { target: { value: '+34 612 34 56 78' } });
    expect(boton().textContent).toContain('+34');
    expect(ultimo).toBe('+34612345678');
  });

  it('LA MUTACIÓN DE LA ORDEN: un número corto da el error en español, con el país', () => {
    render(<Formulario />);
    fireEvent.change(numero(), { target: { value: '999 123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('alert').textContent).toBe(t('miEspacio.errores.whatsappPais', { pais: 'México' }));
    expect(numero().getAttribute('aria-invalid')).toBe('true');
  });

  it('un número guardado se abre partido —Argentina, sus dígitos— y País no lo pisa (ni al montar ni al cambiar)', () => {
    render(<Formulario inicial="+5491123456789" />);
    expect(boton().textContent).toContain('+54');
    expect(numero().value.replace(/\D/g, '')).toBe('91123456789');
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'ES' } });
    expect(boton().textContent).toContain('+54');
  });
});

describe('el enlace con «País»', () => {
  it('mientras no se tocó, el prefijo sigue al País; si se tocó, se respeta', () => {
    render(<Formulario />);
    const pais = screen.getByLabelText('País');
    fireEvent.change(pais, { target: { value: 'ES' } });
    expect(boton().textContent).toContain('+34');
    /* Ahora se elige a mano: Argentina. */
    fireEvent.click(boton());
    fireEvent.change(screen.getByRole('combobox', { name: t('miEspacio.whatsappCampo.buscar') }), { target: { value: 'argentina' } });
    fireEvent.keyDown(screen.getByRole('combobox', { name: t('miEspacio.whatsappCampo.buscar') }), { key: 'Enter' });
    fireEvent.change(pais, { target: { value: 'US' } });
    expect(boton().textContent).toContain('+54');
  });
});
