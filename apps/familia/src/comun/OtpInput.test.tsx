/**
 * La casilla de 6 huecos — guion v1 del Kit 512, §3 (orden #35).
 *
 * Los tres primeros bloques son los tests del kit (`OtpInput.test.tsx` de la
 * referencia de Cenit), copiados con el nombre y la etiqueta de esta app. El
 * último es lo que el guion agrega: seis casillas, una sola entrada, y el
 * error que vacía y devuelve el foco a la primera.
 */
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { OtpInput } from './OtpInput';

function Con({ onComplete, errores = 0 }: { onComplete?: (c: string) => void; errores?: number }) {
  const [v, setV] = useState('');
  return (
    <>
      <label htmlFor="c">Código</label>
      <OtpInput id="c" value={v} onChange={setV} onComplete={onComplete} errores={errores} />
    </>
  );
}

describe('OtpInput (del kit)', () => {
  it('dispara onComplete una sola vez al llegar a 6 dígitos', () => {
    const onComplete = vi.fn();
    render(<Con onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('sanitiza no-dígitos y corta a 6', () => {
    const onChange = vi.fn();
    render(<><label htmlFor="c">Código</label><OtpInput id="c" value="" onChange={onChange} /></>);
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '12ab3456789' } });
    expect(onChange).toHaveBeenCalledWith('123456');
  });
});

describe('OtpInput — pegar y autocompletar en el celular (del kit)', () => {
  it('pegar los 6 dígitos de una vez completa el código', () => {
    const onComplete = vi.fn();
    render(<Con onComplete={onComplete} />);
    const input = screen.getByLabelText('Código');
    fireEvent.paste(input, { clipboardData: { getData: () => '123456' } });
    fireEvent.change(input, { target: { value: '123456' } });
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('EL CASO: pegar con basura alrededor («código: 123 456») lo reparte en las seis', () => {
    render(<Con />);
    fireEvent.paste(screen.getByLabelText('Código'), { clipboardData: { getData: () => 'código: 123 456' } });
    expect([...document.querySelectorAll('[data-casilla]')].map((c) => c.textContent)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('pide el teclado numérico y ofrece el código de un solo uso', () => {
    render(<Con />);
    const input = screen.getByLabelText('Código');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
  });
});

describe('OtpInput — lo que agrega el guion (§3)', () => {
  it('seis casillas dibujadas y UNA sola entrada; las casillas no se leen', () => {
    render(<Con />);
    expect(document.querySelectorAll('[data-casilla]')).toHaveLength(6);
    expect(document.querySelectorAll('input')).toHaveLength(1);
    expect([...document.querySelectorAll('[data-casilla]')].every((c) => c.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('la casilla activa es la siguiente vacía', () => {
    render(<Con />);
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '12' } });
    expect(document.querySelector('.otp__casilla--activa')?.getAttribute('data-casilla')).toBe('2');
  });

  it('EL CASO: un error vacía las seis, tiembla, marca el campo y devuelve el foco a la primera', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Con />);
    const input = screen.getByLabelText('Código') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '123456' } });
    rerender(<Con errores={1} />);
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('.otp--tiembla')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(500); });
    expect(document.querySelector('.otp--tiembla'), 'tiembla UNA vez').toBeNull();
    vi.useRealTimers();
  });
});
