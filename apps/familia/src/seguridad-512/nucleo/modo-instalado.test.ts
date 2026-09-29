import { describe, it, expect, afterEach, vi } from 'vitest';
import { estaInstalada } from './modo-instalado';

/**
 * De esto depende el ORDEN de los botones de la pantalla de entrada: instalada,
 * el código por mail va primero (en iPhone, Google se abre en Safari por afuera
 * y la sesión no siempre vuelve); en el navegador, Google va primero.
 */
describe('estaInstalada', () => {
  const matchMediaOriginal = window.matchMedia;

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    delete (window.navigator as Navigator & { standalone?: unknown }).standalone;
  });

  function conDisplayMode(standalone: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: standalone && query === '(display-mode: standalone)',
      media: query,
    })) as unknown as typeof window.matchMedia;
  }

  it('display-mode: standalone → instalada', () => {
    conDisplayMode(true);
    expect(estaInstalada()).toBe(true);
  });

  it('en el navegador → no instalada', () => {
    conDisplayMode(false);
    expect(estaInstalada()).toBe(false);
  });

  it('iOS antiguo: navigator.standalone → instalada', () => {
    conDisplayMode(false);
    (window.navigator as Navigator & { standalone?: unknown }).standalone = true;
    expect(estaInstalada()).toBe(true);
  });

  it('sin matchMedia (entorno raro) → no revienta, responde navegador', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(estaInstalada()).toBe(false);
  });
});
