// @vitest-environment jsdom
/**
 * La casilla de 6 huecos contra el guion de pantallas §3. Los casos de la app de
 * origen (tipeo, pegado, limpieza, tope, foco, reset) más los que el guion pide
 * y ella no tenía: el temblor al fallar y la casilla activa que sigue al cursor.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useRef, useState } from 'react';
import { OtpInput } from './OtpInput.jsx';

afterEach(cleanup);

function Arnes({ onCompleto, inicial = '', error, disabled }) {
  const [valor, setValor] = useState(inicial);
  return React.createElement('div', null,
    React.createElement(OtpInput, { value: valor, onChange: setValor, onCompleto, error, disabled, 'aria-label': 'codigo' }),
    React.createElement('span', { 'data-testid': 'valor' }, valor));
}

function ArnesReset({ inicial = '' }) {
  const [valor, setValor] = useState(inicial);
  const ref = useRef(null);
  return React.createElement('div', null,
    React.createElement(OtpInput, { ref, value: valor, onChange: setValor, 'aria-label': 'codigo' }),
    React.createElement('button', { type: 'button', onClick: () => ref.current.reset() }, 'reset'));
}

const input = () => screen.getByLabelText('codigo');
const casillas = () => Array.from(document.querySelectorAll('[data-casilla]'));
const valor = () => screen.getByTestId('valor').textContent;

describe('OtpInput', () => {
  it('es un solo input real, numérico y con autocompletado del teléfono', () => {
    render(React.createElement(Arnes));
    const el = input();
    expect(el.getAttribute('inputmode')).toBe('numeric');
    expect(el.getAttribute('autocomplete')).toBe('one-time-code');
    expect(el.maxLength).toBe(6);
    expect(casillas()).toHaveLength(6);
  });

  it('cada cifra cae en su casilla', () => {
    render(React.createElement(Arnes));
    fireEvent.change(input(), { target: { value: '12' } });
    expect(casillas().map((c) => c.textContent)).toEqual(['1', '2', '', '', '', '']);
  });

  it('pegar seis los reparte y llama onCompleto una sola vez', () => {
    const onCompleto = vi.fn();
    render(React.createElement(Arnes, { onCompleto }));
    fireEvent.change(input(), { target: { value: '123456' } });
    expect(casillas().map((c) => c.textContent)).toEqual(['1', '2', '3', '4', '5', '6']);
    fireEvent.change(input(), { target: { value: '123456' } });
    expect(onCompleto).toHaveBeenCalledTimes(1);
    expect(onCompleto).toHaveBeenCalledWith('123456');
  });

  it('descarta lo que no es dígito, también al pegar con separadores', () => {
    const onCompleto = vi.fn();
    render(React.createElement(Arnes, { onCompleto }));
    fireEvent.change(input(), { target: { value: '1a2 3-4' } });
    expect(valor()).toBe('1234');
    fireEvent.change(input(), { target: { value: '' } });
    fireEvent.paste(input(), { clipboardData: { getData: (t) => (t === 'text' ? '123-456' : '') } });
    expect(valor()).toBe('123456');
    expect(onCompleto).toHaveBeenCalledTimes(1);
  });

  it('nueve dígitos guardan los primeros seis', () => {
    render(React.createElement(Arnes));
    fireEvent.change(input(), { target: { value: '123456789' } });
    expect(valor()).toBe('123456');
  });

  it('borrar y volver a completar verifica de nuevo', () => {
    const onCompleto = vi.fn();
    render(React.createElement(Arnes, { onCompleto, inicial: '12345' }));
    fireEvent.change(input(), { target: { value: '123456' } });
    fireEvent.change(input(), { target: { value: '12345' } });
    fireEvent.change(input(), { target: { value: '123456' } });
    expect(onCompleto).toHaveBeenCalledTimes(2);
  });

  it('enfocar con el código completo selecciona todo (el tope no traba)', () => {
    render(React.createElement(Arnes, { inicial: '444444' }));
    act(() => input().focus());
    expect([input().selectionStart, input().selectionEnd]).toEqual([0, 6]);
  });

  it('la casilla activa es la del cursor: las flechas la mueven', () => {
    render(React.createElement(Arnes, { inicial: '123' }));
    act(() => input().focus());
    expect(casillas().findIndex((c) => c.dataset.activa)).toBe(3);
    act(() => { input().setSelectionRange(1, 1); fireEvent.select(input()); });
    expect(casillas().findIndex((c) => c.dataset.activa)).toBe(1);
  });

  it('con error: aria-invalid, y tiembla una vez', () => {
    const { rerender } = render(React.createElement(Arnes, { inicial: '12' }));
    expect(input().getAttribute('aria-invalid')).toBeNull();
    rerender(React.createElement(Arnes, { inicial: '12', error: true }));
    expect(input().getAttribute('aria-invalid')).toBe('true');
    const caja = input().parentElement;
    expect(caja.className).toContain('molde-tiembla');
    // jsdom no trae `AnimationEvent`, así que React escucha el nombre con prefijo:
    // se disparan los dos, que es lo que haría un navegador de verdad con uno.
    act(() => {
      caja.dispatchEvent(new Event('animationend', { bubbles: true }));
      caja.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
    });
    expect(caja.className).not.toContain('molde-tiembla');
  });

  it('reset() vacía y devuelve el foco', async () => {
    render(React.createElement(ArnesReset, { inicial: '444444' }));
    fireEvent.click(screen.getByText('reset'));
    expect(input().value).toBe('');
    await waitFor(() => expect(document.activeElement).toBe(input()));
  });

  it('deshabilitado no deja escribir', () => {
    render(React.createElement(Arnes, { disabled: true }));
    expect(input().disabled).toBe(true);
  });
});
