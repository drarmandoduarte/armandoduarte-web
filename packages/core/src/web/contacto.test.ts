/**
 * El enlace de WhatsApp tiene que salir carácter por carácter igual al del
 * sitio estático: el guardián de fidelidad compara los `href` en orden, así
 * que una codificación distinta no es un detalle, es la página en rojo.
 *
 * Los cinco `text=` de abajo están copiados de los cuatro HTML tal como Vercel
 * los sirve hoy. Si `enlaceWhatsApp` cambia de manera de codificar, se cae acá
 * —que cuesta un segundo— y no en Playwright.
 */
import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '../i18n/recursos';
import { TELEFONO_VISIBLE, TELEFONO_WHATSAPP, enlaceWhatsApp } from './contacto';

const ESPERADOS: Record<string, string> = {
  general: 'https://wa.me/525555015641?text=Hola%2C%20Armando.%20Te%20escribo%20desde%20tu%20p%C3%A1gina%20web.',
  reservar: 'https://wa.me/525555015641?text=Hola%2C%20quiero%20reservar%20mi%20lugar%20en%20el%20taller%20El%20arte%20de%20amar%20a%20tu%20adolescente.',
  programa: 'https://wa.me/525555015641?text=Hola%2C%20vi%20el%20programa%20del%20taller%20El%20arte%20de%20amar%20a%20tu%20adolescente%20y%20quiero%20reservar%20mi%20lugar.',
  asegurar: 'https://wa.me/525555015641?text=Hola%2C%20quiero%20asegurar%20mi%20lugar%20en%20el%20taller%20El%20arte%20de%20amar%20a%20tu%20adolescente.',
  arco: 'https://wa.me/525555015641?text=Hola%2C%20quiero%20ejercer%20mis%20derechos%20ARCO.',
};

describe('el enlace de WhatsApp', () => {
  it('piso · los cinco mensajes de i18n son los cinco que el sitio usa', () => {
    expect(Object.keys(RECURSOS_I18N.es.web.comun.mensajes).sort()).toEqual(Object.keys(ESPERADOS).sort());
  });

  for (const [clave, esperado] of Object.entries(ESPERADOS)) {
    it(`«${clave}» sale idéntico al del sitio estático`, () => {
      const mensaje = RECURSOS_I18N.es.web.comun.mensajes[clave as keyof typeof RECURSOS_I18N.es.web.comun.mensajes];
      expect(enlaceWhatsApp(mensaje)).toBe(esperado);
    });
  }

  it('el número escrito y el del enlace son el mismo', () => {
    expect(TELEFONO_VISIBLE.replace(/\D/g, '')).toBe(TELEFONO_WHATSAPP);
  });
});
