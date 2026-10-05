/**
 * `@moldes/design`: el validador dice lo que está mal en palabras, y el resolver
 * escribe lo que promete — los nueve colores en los dos temas, los derivados
 * medidos, las tres familias y los tres radios.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validar, avisos, fraseDeMarca, COLORES } from './validar.js';
import { aCss, aVariables, urlDeFuentes, escalonDeLetra, mezclar } from './resolver.js';
import { razonDeContraste, distanciaPerceptual } from './contraste.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (r) => JSON.parse(readFileSync(join(AQUI, r), 'utf8'));
const DISENOS = [['ejemplo', leer('design.ejemplo.json')],
  ...readdirSync(join(AQUI, 'disenos')).filter((n) => n.endsWith('.json')).map((n) => [n, leer(join('disenos', n))])];
const clon = (o) => JSON.parse(JSON.stringify(o));

describe('validar', () => {
  it.each(DISENOS)('%s cumple el esquema', (_, d) => expect(validar(d)).toEqual([]));

  it('dice qué falta, con la clave', () => {
    const d = clon(DISENOS[0][1]);
    delete d.color.acento; d.radio.boton = 12.5; d.app.espanol = 'rioplatense'; d.app.frase = 'Sin acento.';
    const p = validar(d);
    expect(p).toContain('color.acento: falta o no es un hex de seis cifras');
    expect(p).toContain('radio.boton: tiene que ser un entero entre 0 y 999');
    expect(p.some((x) => x.startsWith('app.espanol'))).toBe(true);
    expect(p.some((x) => x.startsWith('app.frase'))).toBe(true);
  });

  it('rechaza una clave que no es del esquema', () => {
    const d = clon(DISENOS[0][1]); d.color.violeta = '#663399';
    expect(validar(d)).toContain('color.violeta: no es una clave del esquema');
  });

  it('rechaza un texto secundario que no se lee', () => {
    const d = clon(DISENOS[0][1]); d.color.texto2 = '#C9C3B8';
    expect(validar(d).some((x) => x.includes('texto2 sobre fondo'))).toBe(true);
  });
});

describe('resolver', () => {
  it.each(DISENOS)('%s: los nueve colores en los dos temas, tal cual', (_, d) => {
    const v = aVariables(d);
    for (const c of COLORES) {
      expect(v.claro[`--c-${c}`]).toBe(d.color[c].toUpperCase());
      expect(v.oscuro[`--c-${c}`]).toBe(d.colorOscuro[c].toUpperCase());
    }
    expect(v.comunes['--r-boton']).toBe(`${d.radio.boton}px`);
    expect(v.comunes['--f-sans'].startsWith(`"${d.tipografia.sans}"`)).toBe(true);
  });

  it.each(DISENOS)('%s: cada escalón de letra pasa AA contra fondo y papel', (_, d) => {
    for (const [tema, c] of Object.entries({ claro: aVariables(d).claro, oscuro: aVariables(d).oscuro })) {
      for (const k of ['acento', 'error', 'ok', 'aviso', 'info']) {
        for (const p of ['--c-fondo', '--c-papel']) {
          expect(razonDeContraste(c[`--c-${k}-texto`], c[p]), `${tema} ${k} sobre ${p}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('un color que ya cumple no se toca', () => {
    expect(escalonDeLetra('#1F4E6B', ['#FFFFFF'], '#000000')).toBe('#1F4E6B');
  });

  it('un ámbar claro de noche se aleja de la tinta crema sin dejar de leerse', () => {
    const r = escalonDeLetra('#E0B47C', ['#242424', '#1A1A1A'], '#EDE8DC', '#242424');
    expect(distanciaPerceptual(r, '#EDE8DC')).toBeGreaterThanOrEqual(0.18);
    expect(razonDeContraste(r, '#242424')).toBeGreaterThanOrEqual(4.5);
  });

  it('mezclar es color-mix(in srgb)', () => {
    expect(mezclar('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('la hoja trae los dos bloques en la forma que lee el resolvedor de tokens', () => {
    const css = aCss(DISENOS[0][1]);
    expect(css).toMatch(/^:root\{/);
    expect(css).toContain('\n[data-theme="dark"]{');
  });

  it('la URL de fuentes pide las tres y omite las del sistema', () => {
    const d = clon(DISENOS[0][1]);
    expect(urlDeFuentes(d)).toContain('family=Instrument+Serif');
    d.tipografia = { sans: 'system', serif: 'system', mono: 'system' };
    expect(urlDeFuentes(d)).toBeNull();
  });
});

describe('la frase de marca en tres idiomas', () => {
  const base = DISENOS[0][1];
  const conFrase = (frase) => ({ ...clon(base), app: { ...base.app, frase } });

  it('acepta un texto o un objeto por idioma', () => {
    expect(validar(conFrase('Tu frase de *marca*.'))).toEqual([]);
    expect(validar(conFrase({ es: 'Tu *casa*.', en: 'Your *home*.', pt: 'Sua *casa*.' }))).toEqual([]);
    expect(validar(conFrase({ en: 'Your *home*.' }))).toEqual([]);
  });
  it('rechaza un idioma que no es del molde, una frase sin acento o un objeto vacío', () => {
    expect(validar(conFrase({ es: 'Tu *casa*.', fr: 'Ta *maison*.' }))).toContain('app.frase.fr: no es un idioma del molde (es, en, pt)');
    expect(validar(conFrase({ es: 'Sin acento.' }))).toContain('app.frase.es: no marca la palabra acentuada entre asteriscos');
    expect(validar(conFrase({}))).toContain('app.frase: el objeto está vacío');
  });
  it('avisa (no es error) cuando la frase está en un solo idioma', () => {
    const d = conFrase('Tu *casa*.');
    expect(validar(d)).toEqual([]);
    expect(avisos(d)).toEqual(['app.frase: está solo en «es»; en «en» y «pt» la pantalla de entrada muestra el título genérico del molde']);
    expect(avisos(conFrase({ es: 'a *b*', en: 'a *b*', pt: 'a *b*' }))).toEqual([]);
  });
  it('fraseDeMarca: la del idioma, y si falta, null — nunca la de otro idioma', () => {
    expect(fraseDeMarca(conFrase('Tu *casa*.'), 'es')).toBe('Tu *casa*.');
    expect(fraseDeMarca(conFrase('Tu *casa*.'), 'en')).toBeNull();
    const tres = conFrase({ es: 'Tu *casa*.', pt: 'Sua *casa*.' });
    expect(fraseDeMarca(tres, 'pt')).toBe('Sua *casa*.');
    expect(fraseDeMarca(tres, 'en')).toBeNull();
  });
});
