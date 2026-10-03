/**
 * El marco de las pantallas de Mi espacio fuera del acceso — orden Códice #18.
 *
 * Desde la #35 la entrada (`/login` y el resto del acceso) es la del guion v1
 * del Kit 512 y se prueba en `acceso/el-acceso-del-guion.test.tsx`. Acá queda
 * lo que sigue vivo de la #18: el marco con cabecera y pie, y Armando de pie
 * en `/empezar`, que no es pantalla de acceso (orden #35).
 *
 * Lo que se prueba acá es **estructura**, no estética: que las piezas que la
 * orden pide estén, en su orden y con sus enlaces. El aspecto se mide en el
 * navegador (capturas, `check:acento`, `check:contraste`) y está en el informe.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TELEFONO_GABY, TELEFONO_TALLER } from '@codice/core';

vi.mock('../supabase', () => ({
  variablesQueFaltan: () => [],
  supabase: { auth: {} },
}));

import '../i18n';
import { Pantalla } from './Piezas';

/** El `matchMedia` de jsdom siempre dice «no»: acá se elige el ancho. */
function anchoDeEscritorio(es: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: es && q === '(min-width: 1100px)', media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

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

  it('Armando y la firma van SOLO en /empezar (`conArmando`); en las demás pantallas, la columna sola', () => {
    anchoDeEscritorio(true);
    const { unmount } = render(<Pantalla><p>x</p></Pantalla>);
    expect(document.querySelector('.de-pie')).toBeNull();
    expect(document.querySelector('.firma')).toBeNull();
    unmount();
    render(<Pantalla conArmando><p>x</p></Pantalla>);
    expect(document.querySelector('.de-pie .de-pie__img')).not.toBeNull();
    /* #31: la firma encabeza el formulario, en el lugar del rótulo. */
    expect(document.querySelector('.columna > .firma')?.textContent).toBe('Construyendo familias fuertes');
  });

  it('EL CASO de Lighthouse: la foto solo a dos columnas; apilado, la firma y ninguna imagen (#30, #31)', () => {
    /* A ≥ 1100 la silueta; debajo, ninguna imagen de Armando: la firma arriba
       del formulario. Con dos montadas el teléfono bajaba 42 KB que no
       mostraba, y performance caía de 76 a 71. */
    anchoDeEscritorio(true);
    const { unmount } = render(<Pantalla conArmando><p>x</p></Pantalla>);
    expect(document.querySelectorAll('img[src*="/img/armando/"]')).toHaveLength(1);
    expect(document.querySelectorAll('.firma')).toHaveLength(1);
    unmount();
    anchoDeEscritorio(false);
    render(<Pantalla conArmando><p>x</p></Pantalla>);
    expect(document.querySelectorAll('img[src*="/img/armando/"]')).toHaveLength(0);
    expect(document.querySelector('.de-pie')).toBeNull();
    expect(document.querySelector('.firma')?.textContent).toBe('Construyendo familias fuertes');
  });
});
