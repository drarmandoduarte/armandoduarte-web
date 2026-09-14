/**
 * Las rutas son el contrato entre el router, el prerender y el guardián de
 * fidelidad. Este test es chico a propósito: no prueba React, prueba que la
 * lista no se descuadre.
 */
import { describe, expect, it } from 'vitest';
import { RUTAS } from './rutas';
import { RECURSOS_I18N } from '@codice/core';

describe('las rutas de la web pública', () => {
  it('son las cuatro del sitio estático', () => {
    expect(RUTAS.map((r) => r.ruta)).toEqual(['/', '/taller', '/privacidad', '/terminos']);
  });

  it('cada una escribe un archivo distinto', () => {
    expect(new Set(RUTAS.map((r) => r.archivo)).size).toBe(RUTAS.length);
  });

  it('cada una tiene su `<head>` escrito en i18n', () => {
    for (const { pagina } of RUTAS) {
      const textos = RECURSOS_I18N.es.web as Record<string, { head?: { title: string; description: string } }>;
      expect(textos[pagina]?.head?.title, `${pagina}: falta el title`).toBeTruthy();
      expect(textos[pagina]?.head?.description, `${pagina}: falta la description`).toBeTruthy();
    }
  });
});
