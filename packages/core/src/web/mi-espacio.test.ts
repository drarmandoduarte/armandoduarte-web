import { describe, expect, it } from 'vitest';
import { APP_FAMILIA, RUTA_RESERVAR_MERIDA, baseDeLaApp, enlaceAMiEspacio } from './mi-espacio';

describe('la puerta a Mi espacio (orden #25, A)', () => {
  it('la dirección de la app es el subdominio de Armando', () => {
    expect(APP_FAMILIA).toBe('https://familia.armandoduarte.com');
  });

  it('sin destino, a /entrar; con destino, /entrar?ir= con la ruta codificada', () => {
    expect(enlaceAMiEspacio()).toBe('https://familia.armandoduarte.com/entrar');
    expect(enlaceAMiEspacio(RUTA_RESERVAR_MERIDA))
      .toBe('https://familia.armandoduarte.com/entrar?ir=%2Fme-anoto%2Fel-arte-de-amar-a-tu-adolescente');
  });

  it('un destino que no es ruta interna no se arma: queda /entrar a secas', () => {
    for (const malo of ['https://otro.sitio', '//otro.sitio', '/\\otro.sitio', 'me-anoto']) {
      expect(enlaceAMiEspacio(malo), malo).toBe('https://familia.armandoduarte.com/entrar');
    }
  });

  it('la base del preview entra solo con forma de https://host; lo demás vuelve al subdominio', () => {
    expect(baseDeLaApp('https://preview.ejemplo.com')).toBe('https://preview.ejemplo.com');
    expect(enlaceAMiEspacio('/mi-espacio', 'https://preview.ejemplo.com'))
      .toBe('https://preview.ejemplo.com/entrar?ir=%2Fmi-espacio');
    for (const malo of ['', undefined, null, 'http://x.com', 'https://x.com/', 'https://x.com/entrar', 'javascript:alert(1)']) {
      expect(baseDeLaApp(malo), String(malo)).toBe(APP_FAMILIA);
    }
  });
});
