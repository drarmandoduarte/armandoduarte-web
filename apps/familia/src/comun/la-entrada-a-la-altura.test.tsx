/**
 * La entrada a la altura de la web — orden Códice #18.
 *
 * Lo que se prueba acá es **estructura**, no estética: que las piezas que la
 * orden pide estén, en su orden y con sus enlaces. El aspecto se mide en el
 * navegador (capturas, `check:acento`, `check:contraste`) y está en el informe.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { TELEFONO_GABY, TELEFONO_TALLER } from '@codice/core';

vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: { auth: {} },
}));

import '../i18n';
import { CampoDeCodigo, Pantalla } from './Piezas';
import { Entrar } from '../entrar/Entrar';

/** El `matchMedia` de jsdom siempre dice «no»: acá se elige el ancho. */
function anchoDeEscritorio(es: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: es && q === '(min-width: 1100px)', media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function ConCodigo() {
  const [valor, setValor] = useState('');
  return <CampoDeCodigo id="c" rotulo="Código" valor={valor} alCambiar={setValor} />;
}
const casillas = () => [...document.querySelectorAll<HTMLElement>('[data-casilla]')];

describe('B.8 · el código en seis casillas', () => {
  it('se ven seis casillas, y hay UNA sola entrada para el teclado', () => {
    render(<ConCodigo />);
    expect(casillas()).toHaveLength(6);
    expect(document.querySelectorAll('input')).toHaveLength(1);
    /* Lo que hace que el celular muestre números y que iOS ofrezca el código. */
    const entrada = screen.getByLabelText('Código');
    expect(entrada.getAttribute('autocomplete')).toBe('one-time-code');
    expect(entrada.getAttribute('inputmode')).toBe('numeric');
  });

  it('EL CASO: pegar el código entero lo reparte en las seis, aunque venga con espacios o guion', () => {
    render(<ConCodigo />);
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123 456' } });
    expect(casillas().map((c) => c.textContent)).toEqual(['1', '2', '3', '4', '5', '6']);
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '65-43-21-99' } });
    expect(casillas().map((c) => c.textContent)).toEqual(['6', '5', '4', '3', '2', '1']);
  });

  it('el foco avanza solo: la casilla marcada es la siguiente vacía', () => {
    render(<ConCodigo />);
    const entrada = screen.getByLabelText('Código');
    fireEvent.focus(entrada);
    expect(casillas()[0].className).toContain('casilla--sigue');
    fireEvent.change(entrada, { target: { value: '12' } });
    expect(casillas()[2].className).toContain('casilla--sigue');
    expect(casillas().filter((c) => c.className.includes('casilla--sigue'))).toHaveLength(1);
  });

  it('las casillas son dibujo: el lector de pantalla oye un campo, no seis', () => {
    render(<ConCodigo />);
    expect(document.querySelector('.casillas__fila')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('B y C · el marco', () => {
  it('la cabecera lleva a la web: el wordmark y «Volver a la web»', () => {
    render(<Pantalla><p>x</p></Pantalla>);
    const destinos = [...document.querySelectorAll<HTMLAnchorElement>('header a')].map((a) => a.getAttribute('href'));
    expect(destinos).toEqual(['https://armandoduarte.com', 'https://armandoduarte.com']);
    expect(screen.getByText(/Volver a la web/)).toBeTruthy();
  });

  it('el pie: las dos legales de la web y el WhatsApp de Gaby — nunca el del taller', () => {
    render(<Pantalla><p>x</p></Pantalla>);
    const enlaces = [...document.querySelectorAll<HTMLAnchorElement>('footer a')].map((a) => a.href);
    expect(enlaces).toContain('https://armandoduarte.com/privacidad');
    expect(enlaces).toContain('https://armandoduarte.com/terminos');
    const wa = enlaces.filter((h) => h.includes('wa.me'));
    expect(wa).toHaveLength(1);
    expect(wa[0]).toContain(TELEFONO_GABY);
    expect(wa[0]).not.toContain(TELEFONO_TALLER);
  });

  it('el panel de Armando va SOLO en /entrar; adentro, la columna sola', () => {
    anchoDeEscritorio(true);
    const { unmount } = render(<Pantalla><p>x</p></Pantalla>);
    expect(document.querySelector('.panel')).toBeNull();
    unmount();
    render(<Entrar />);
    expect(document.querySelector('.panel .panel__armando')).not.toBeNull();
  });

  it('EL CASO de Lighthouse: panel o retrato, nunca las dos imágenes a la vez', () => {
    /* A ≥ 1100 el busto y no el retrato; debajo, al revés. Con los dos montados
       el teléfono bajaba 42 KB que no mostraba, y performance caía de 76 a 71. */
    anchoDeEscritorio(true);
    const { unmount } = render(<Entrar />);
    expect(document.querySelectorAll('img[src*="/img/armando/"]')).toHaveLength(1);
    expect(document.querySelector('.retrato-chico')).toBeNull();
    unmount();
    anchoDeEscritorio(false);
    render(<Entrar />);
    expect(document.querySelectorAll('img[src*="/img/armando/"]')).toHaveLength(1);
    expect(document.querySelector('.panel')).toBeNull();
    expect(document.querySelector('.retrato-chico')).not.toBeNull();
  });
});

describe('B · /entrar, de arriba abajo', () => {
  it('Google PRIMERO y con su logo, después el separador, después el correo', () => {
    render(<Entrar />);
    const columna = document.querySelector('.columna')!;
    const google = screen.getByRole('button', { name: /continuar con google/i });
    const correo = screen.getByLabelText(/tu correo/i);
    /* DOCUMENT_POSITION_FOLLOWING = 4: el correo viene DESPUÉS de Google. */
    expect(google.compareDocumentPosition(correo) & 4).toBe(4);
    expect(google.querySelector('img')?.getAttribute('src')).toBe('/img/google.svg');
    expect(columna.querySelector('.separador')).not.toBeNull();
  });

  it('el título lleva «espacio» en teal, y el naranja queda solo en el botón', () => {
    render(<Entrar />);
    expect(document.querySelector('h1 .titulo__palabra')?.textContent).toBe('espacio');
    const naranjas = document.querySelectorAll('.btn--naranja');
    expect(naranjas).toHaveLength(1);
    expect(naranjas[0].textContent).toMatch(/enviarme el código/i);
  });

  it('el aviso legal enlaza las dos páginas de la web', () => {
    render(<Entrar />);
    const aviso = document.querySelector('.aviso-legal')!;
    expect(aviso.textContent).toMatch(/^Al continuar aceptas el Aviso de privacidad y los Términos\.$/);
    expect([...aviso.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      'https://armandoduarte.com/privacidad',
      'https://armandoduarte.com/terminos',
    ]);
  });
});
