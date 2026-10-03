import { describe, expect, it } from 'vitest';
import { PAISES_ISO } from './perfil';
import {
  armarWhatsapp, ejemploNacional, formatearWhatsapp, nacionalMientrasSeEscribe, partirWhatsapp, prefijoDe,
  tienePrefijo, whatsappE164, whatsappValido,
} from './whatsapp';

/* Números de ejemplo, con la forma de cada país — ninguno es de una persona. */
describe('validar por país (orden #32)', () => {
  it('EL CASO: México, Argentina, España y Estados Unidos, escritos como sea, salen en E.164', () => {
    expect(whatsappE164('+52 999 123 4567')).toBe('+529991234567');
    expect(whatsappE164('999 123 4567', 'MX')).toBe('+529991234567');
    expect(whatsappE164('+54 9 11 2345 6789')).toBe('+5491123456789');
    expect(whatsappE164('9 11 2345-6789', 'AR')).toBe('+5491123456789');
    expect(whatsappE164('+34 612 34 56 78')).toBe('+34612345678');
    expect(whatsappE164('612 345 678', 'ES')).toBe('+34612345678');
    expect(whatsappE164('+1 (213) 373-4253')).toBe('+12133734253');
    expect(whatsappE164('213 373 4253', 'US')).toBe('+12133734253');
  });

  it('inválidos: corto, largo, letras, vacío — y uno que no es del país elegido', () => {
    for (const malo of ['+52 999 123', '+52 999 123 45678', 'hola', '', '   ', null, undefined]) {
      expect(whatsappValido(malo), String(malo)).toBe(false);
    }
    /* Un número español de 9 dígitos no es de México. */
    expect(whatsappValido('612 345 678', 'MX')).toBe(false);
    /* La regla vieja («de 8 a 15 dígitos») lo dejaba pasar. */
    expect(whatsappValido('+52 12345678')).toBe(false);
  });

  it('un número viejo sin «+» se lee como de México', () => {
    expect(whatsappE164('9991234567')).toBe('+529991234567');
  });
});

describe('el campo', () => {
  it('prefijo, armado y partido', () => {
    expect(prefijoDe('MX')).toBe('+52');
    expect(prefijoDe('AR')).toBe('+54');
    expect(prefijoDe('XX')).toBe('+52');
    expect(armarWhatsapp('AR', '9 11 2345-6789')).toBe('+5491123456789');
    expect(armarWhatsapp('MX', '')).toBe('');
    expect(partirWhatsapp('+5491123456789')).toEqual({ pais: 'AR', nacional: '91123456789' });
    expect(partirWhatsapp('+12133734253')).toEqual({ pais: 'US', nacional: '2133734253' });
    expect(partirWhatsapp(null, 'ES')).toEqual({ pais: 'ES', nacional: '' });
    expect(partirWhatsapp('+52 999 12', 'MX')).toEqual({ pais: 'MX', nacional: '99912' });
  });

  it('se muestra formateado, y el placeholder es un celular del país', () => {
    expect(formatearWhatsapp('+529991234567')).toBe('+52 999 123 4567');
    expect(formatearWhatsapp('no es un número')).toBe('no es un número');
    expect(nacionalMientrasSeEscribe('9991234567', 'MX')).toBe('999 123 4567');
    expect(ejemploNacional('MX')).toMatch(/^\d{3} \d{3} \d{4}$/);
  });

  it('EL PISO: la metadata conoce casi todos los países de la lista; los que no, se nombran', () => {
    const sin = PAISES_ISO.filter((p) => !tienePrefijo(p));
    expect(PAISES_ISO.length - sin.length).toBeGreaterThan(230);
    expect(sin).toEqual(['AQ', 'BV', 'GS', 'HM', 'PN', 'TF', 'UM']);
  });
});
