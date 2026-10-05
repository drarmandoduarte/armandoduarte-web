/**
 * Los archivos de idioma: las mismas claves en los tres, las mismas variables,
 * la palabra acentuada bien cerrada, el español neutro sin voseo colado, y la
 * capa de voseo con solo lo que cambia. Y `t()` hace lo que dice.
 */
import { describe, expect, it } from 'vitest';
import { TEXTOS, VOSEO, crearT, elegirIdioma, interpolar } from './t.js';

const variables = (s) => [...new Set([...s.matchAll(/\{(\w+)(?:\|[^}]*)?\}/g)].map((m) => m[1]))].sort();
const CLAVES_ES = Object.keys(TEXTOS.es);

describe('el piso', () => {
  it('hay textos, y de los cuatro espacios del molde', () => {
    expect(CLAVES_ES.length).toBeGreaterThan(200);
    for (const espacio of ['auth.', 'settings.', 'asistente.', 'inicio.', 'comun.']) {
      expect(CLAVES_ES.some((c) => c.startsWith(espacio)), espacio).toBe(true);
    }
  });
});

describe('los tres idiomas son el mismo archivo traducido', () => {
  it.each(['en', 'pt'])('%s tiene exactamente las claves de es', (idioma) => {
    const otras = Object.keys(TEXTOS[idioma]);
    expect(otras.filter((c) => !(c in TEXTOS.es)), 'sobran').toEqual([]);
    expect(CLAVES_ES.filter((c) => !(c in TEXTOS[idioma])), 'faltan').toEqual([]);
  });

  it.each(['en', 'pt'])('%s usa las mismas variables que es, clave por clave', (idioma) => {
    const distintas = CLAVES_ES.filter((c) => variables(TEXTOS.es[c]).join() !== variables(TEXTOS[idioma][c]).join());
    expect(distintas.map((c) => `${c}: es ${variables(TEXTOS.es[c])} · ${idioma} ${variables(TEXTOS[idioma][c])}`)).toEqual([]);
  });

  it.each(['es', 'en', 'pt'])('%s: ningún texto vacío y los asteriscos cerrados', (idioma) => {
    for (const [c, v] of Object.entries(TEXTOS[idioma])) {
      expect(v.trim(), `${idioma} ${c}`).not.toBe('');
      expect((v.match(/\*/g) || []).length % 2, `${idioma} ${c}: asterisco sin cerrar`).toBe(0);
    }
  });

  it('si un título lleva palabra acentuada en es, la lleva en los tres', () => {
    const con = CLAVES_ES.filter((c) => TEXTOS.es[c].includes('*'));
    expect(con.length).toBeGreaterThan(10);
    for (const c of con) for (const i of ['en', 'pt']) expect(TEXTOS[i][c], `${i} ${c}`).toMatch(/\*[^*]+\*/);
  });
});

describe('español neutro, y el voseo aparte', () => {
  const VOS = /\b(sos|vos|tenés|querés|podés|perdés|entrá|escribí|pedí|llegás|firmás|permitís|marcá|preguntá|preguntale|revisala|abrila|tocá|arrastrá|acomodá|elegí|aceptás|escribís|escribinos|verificá|ingresá|activá|guardá|usá|confirmá|revisá|escaneá|recibís)\b/i;

  it('es.json no tiene voseo', () => {
    const colados = CLAVES_ES.filter((c) => VOS.test(TEXTOS.es[c]));
    expect(colados.map((c) => `${c}: ${TEXTOS.es[c]}`)).toEqual([]);
  });

  it('el detector de voseo ve lo que dice ver', () => {
    expect(VOS.test('Si perdés el teléfono')).toBe(true);
    expect(VOS.test('Si pierdes el teléfono')).toBe(false);
  });

  it('es-UY trae solo claves de es, cada una distinta, con las mismas variables', () => {
    expect(Object.keys(VOSEO).length).toBeGreaterThan(20);
    for (const [c, v] of Object.entries(VOSEO)) {
      expect(c in TEXTOS.es, `${c} no está en es`).toBe(true);
      expect(v, `${c} es igual que en neutro: no hace falta en es-UY`).not.toBe(TEXTOS.es[c]);
      expect(variables(v).join(), c).toBe(variables(TEXTOS.es[c]).join());
    }
  });
});

describe('t()', () => {
  it('reemplaza variables y deja el acento', () => {
    const t = crearT({ comunes: { app: 'Rivera' } });
    expect(t('auth.code.subtitle', { email: 'a@b.c' })).toBe('Te enviamos un código de 6 dígitos a a@b.c.');
    expect(t('auth.login.titleDefault')).toBe('Entra a *Rivera*.');
  });
  it('plural por n', () => {
    const t = crearT();
    expect(t('auth.code.wrong', { n: 1 })).toBe('Código incorrecto. Te queda 1 intento.');
    expect(t('auth.code.wrong', { n: 4 })).toBe('Código incorrecto. Te quedan 4 intentos.');
  });
  it('voseo solo si el español es voseo, y solo en es', () => {
    expect(crearT({ espanol: 'voseo' })('auth.backup.subtitle')).toMatch(/^Si perdés/);
    expect(crearT()('auth.backup.subtitle')).toMatch(/^Si pierdes/);
    expect(crearT({ idioma: 'en', espanol: 'voseo' })('auth.backup.subtitle')).toMatch(/^If you lose/);
  });
  it('los textos de la app se suman, y el voseo de la app también', () => {
    const t = crearT({ espanol: 'voseo', extras: { es: { 'propiedades.nueva': 'Nueva propiedad' }, 'es-UY': { 'propiedades.cargar': 'Cargá una' } } });
    expect(t('propiedades.nueva')).toBe('Nueva propiedad');
    expect(t('propiedades.cargar')).toBe('Cargá una');
  });
  it('una clave que falta se ve como clave', () => {
    expect(crearT()('no.existe')).toBe('no.existe');
  });
  it('una variable que no llega queda visible', () => {
    expect(interpolar('Hola, {nombre}.')).toBe('Hola, {nombre}.');
  });
  it('un idioma que no existe cae en es', () => {
    expect(crearT({ idioma: 'fr' }).idioma).toBe('es');
  });
});

describe('elegirIdioma (spec B.4)', () => {
  it('gana el perfil, después el aparato, después el navegador, y si no, es', () => {
    expect(elegirIdioma({ perfil: 'pt', aparato: 'en', navegador: 'es-UY' })).toBe('pt');
    expect(elegirIdioma({ aparato: 'en', navegador: 'pt-BR' })).toBe('en');
    expect(elegirIdioma({ navegador: 'pt-BR' })).toBe('pt');
    expect(elegirIdioma({ navegador: 'fr-FR' })).toBe('es');
    expect(elegirIdioma()).toBe('es');
  });
});
