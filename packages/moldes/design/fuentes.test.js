/**
 * Fuentes autoalojadas: la parte que no toca la red. La descarga real se probó
 * a mano contra Google (ver el PR 2) y no corre en los tests, que no tienen red.
 */
import { describe, expect, it } from 'vitest';
import { asignarArchivos, filtrarCaras, hojaDeFuentes, leerHojaDeGoogle, nombreDeArchivo } from './fuentes.js';
import { aplicarDesign } from './aplicar.js';
import { readFileSync } from 'node:fs';

/* La forma exacta en que responde Google (css2, con navegador moderno), recortada. */
const HOJA = `/* cyrillic */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/outfit/v11/cyr.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F;
}
/* latin-ext */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/outfit/v11/ext.woff2) format('woff2');
  unicode-range: U+0100-02BA;
}
/* latin */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/outfit/v11/lat.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/outfit/v11/lat.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin */
@font-face {
  font-family: 'Instrument Serif';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/is/v1/it.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}`;

describe('leer la hoja de Google', () => {
  const caras = leerHojaDeGoogle(HOJA);
  it('lee las cinco caras con su subconjunto', () => {
    expect(caras.map((c) => c.subconjunto)).toEqual(['cyrillic', 'latin-ext', 'latin', 'latin', 'latin']);
    expect(caras[4]).toMatchObject({ familia: 'Instrument Serif', estilo: 'italic', peso: '400' });
  });
  it('se queda con latin y latin-ext (es, en, pt)', () => {
    expect(filtrarCaras(caras).map((c) => c.subconjunto)).toEqual(['latin-ext', 'latin', 'latin', 'latin']);
  });
  it('nombra cada archivo sin espacios ni mayúsculas', () => {
    expect(nombreDeArchivo(caras[4])).toBe('instrument-serif-italic-400-latin.woff2');
  });
  it('una fuente variable (misma URL en dos pesos) se baja una sola vez', () => {
    const a = asignarArchivos(filtrarCaras(caras));
    expect(new Set(a.map((c) => c.archivo)).size).toBe(3);
    expect(a[1].archivo).toBe(a[2].archivo);
  });
});

describe('la hoja propia', () => {
  const hoja = hojaDeFuentes(asignarArchivos(filtrarCaras(leerHojaDeGoogle(HOJA))), '/fuentes/');
  it('apunta a la carpeta propia y nunca a Google', () => {
    expect(hoja).toContain("src:url('/fuentes/outfit-normal-400-latin.woff2') format('woff2');");
    expect(hoja).not.toMatch(/gstatic|googleapis/);
  });
  it('conserva el rango, usa swap y no usa local()', () => {
    expect(hoja).toContain('unicode-range:U+0000-00FF;');
    expect(hoja).toContain('font-display:swap;');
    expect(hoja).not.toContain('local(');
  });
});

describe('aplicarDesign', () => {
  /* Un documento mínimo: lo justo para ver qué se escribe y qué se enlaza. */
  function documento() {
    const nodos = {};
    const creados = [];
    const head = { prepend: (n) => { nodos[n.id] = n; } };
    return {
      head, nodos, creados,
      getElementById: (id) => nodos[id] || null,
      createElement: (etiqueta) => { creados.push(etiqueta); return { etiqueta, remove() { delete nodos[this.id]; } }; },
    };
  }
  const design = JSON.parse(readFileSync(new URL('./disenos/consultorio.design.json', import.meta.url), 'utf8'));

  it('por defecto enlaza /design.css y las fuentes propias, y no escribe ningún <style>', () => {
    const d = documento();
    aplicarDesign(design, { documento: d });
    expect(d.nodos['design-molde']).toMatchObject({ etiqueta: 'link', rel: 'stylesheet', href: '/design.css' });
    expect(d.nodos['design-molde-fuentes']).toMatchObject({ etiqueta: 'link', rel: 'stylesheet', href: '/fuentes/fuentes.css' });
    expect(d.creados).toEqual(['link', 'link']);
    expect(Object.values(d.nodos).some((n) => 'textContent' in n)).toBe(false);
  });
  it('las rutas se pueden cambiar (una app servida en una subcarpeta)', () => {
    const d = documento();
    aplicarDesign(design, { documento: d, hoja: './design/consultorio.css', hojaDeFuentes: './fuentes/consultorio/fuentes.css' });
    expect(d.nodos['design-molde'].href).toBe('./design/consultorio.css');
    expect(d.nodos['design-molde-fuentes'].href).toBe('./fuentes/consultorio/fuentes.css');
  });
  it('Google Fonts ya no es un modo: con fuentes: google no enlaza nada de afuera', () => {
    const d = documento();
    aplicarDesign(design, { documento: d, fuentes: 'google' });
    expect(Object.values(d.nodos).map((n) => n.href)).toEqual(['/design.css']);
  });
  it('con fuentes: ninguna, no enlaza fuentes; y dos llamadas no duplican', () => {
    const d = documento();
    aplicarDesign(design, { documento: d });
    aplicarDesign(design, { documento: d, fuentes: 'ninguna' });
    expect(d.nodos['design-molde-fuentes']).toBeUndefined();
    expect(Object.keys(d.nodos)).toEqual(['design-molde']);
    expect(d.creados).toEqual(['link', 'link']);
  });
});
