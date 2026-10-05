/**
 * Ningún texto que vea una persona está escrito en un componente del molde
 * (spec Kit UI + Idiomas, B.1).
 *
 * Barre el CÓDIGO de `@moldes/ui/components` (sin comentarios: la prosa explica en
 * español y está bien que lo haga) y busca cadenas que parezcan texto en
 * español: con tilde, ñ, ¿ o ¡, o con palabras comunes del idioma. Los avisos a
 * la consola (`console.*`) y los errores que se lanzan cuando LA APP está mal
 * configurada (`new Error(…)`) quedan afuera: los lee quien programa, no la persona.
 *
 * Qué NO ve, dicho para que nadie lo lea como «todo»: un texto de una sola
 * palabra sin tilde y en minúscula («cerrar») no se distingue de un nombre de
 * propiedad. Para eso está la segunda mitad: ningún valor por defecto de una
 * prop puede ser una palabra con mayúscula.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { soloCodigoPorRenglon } from '../ui/herramientas/soloCodigo.js';

const PAQUETES = join(dirname(fileURLToPath(import.meta.url)), '..');
/* Los paquetes de pantalla del molde: el kit y los que arman pantallas. */
const PAQUETES_DE_PANTALLA = ['ajustes', 'inicio', 'app-shell', 'bienvenida'];
const RAICES = [join(PAQUETES, 'ui', 'components'), ...PAQUETES_DE_PANTALLA.map((p) => join(PAQUETES, p))];
const fuentes = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const r = join(d, e.name);
  if (e.isDirectory()) return fuentes(r);
  if (e.name === 'node_modules') return [];
  return /\.(jsx|js)$/.test(e.name) && !/\.test\./.test(e.name) ? [r] : [];
});
/** El código sin comentarios y sin las llamadas a la consola, renglón por renglón. */
function codigo(archivo) {
  return soloCodigoPorRenglon(readFileSync(archivo, 'utf8'))
    .replace(/console\.\w+\([\s\S]*?\);/g, (bloque) => bloque.replace(/[^\n]/g, ' '))
    .replace(/new Error\([\s\S]*?\);/g, (bloque) => bloque.replace(/[^\n]/g, ' '))
    .split('\n');
}
const ARCHIVOS = RAICES.flatMap((raiz) => fuentes(raiz).map((f) => [relative(PAQUETES, f), codigo(f)]));
/* El texto suelto entre etiquetas de JSX (`<p>Hola</p>`): no es una cadena con
   comillas, y en un paquete escrito con JSX es donde un texto se esconde. */
const TEXTO_JSX = />\s*([A-Za-zÁÉÍÓÚÑáéíóúñ¿¡][^<>{}]*[a-záéíóúñ.][^<>{}]*)\s*</g;
const textosJsx = (renglon) => [...renglon.matchAll(TEXTO_JSX)].map((m) => m[1].trim()).filter((x) => /[a-záéíóúñ]{3,}/i.test(x));

const CADENA = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`([^`]*)`/g;
const PARECE_ESPANOL = /[áéíóúñÁÉÍÓÚÑ¿¡]|\b(el|la|los|las|de|del|que|con|para|por|una|sin|tus?|mis?|hoy|nada|hay|esta|este|no)\s+[a-záéíóúñ]/i;
const DEFAULT_CON_MAYUSCULA = /\b\w+\s*=\s*'[A-ZÁÉÍÓÚÑ¿¡][a-záéíóúñ]+[^']*'/;

function textosEn(renglon) {
  return [...renglon.matchAll(CADENA)].map((m) => m[1] ?? m[2] ?? m[3]).filter((s) => s && PARECE_ESPANOL.test(s));
}

describe('el piso', () => {
  it('se leyeron los componentes y Ajustes', () => {
    expect(ARCHIVOS.length).toBeGreaterThan(60);
    for (const p of PAQUETES_DE_PANTALLA) expect(ARCHIVOS.some(([n]) => n.startsWith(`${p}/`)), p).toBe(true);
  });
  it('el detector de JSX ve el texto entre etiquetas y no el código', () => {
    expect(textosJsx('<p>Todavía no hay facturas.</p>')).toHaveLength(1);
    expect(textosJsx('<p>{t(\'x\')}</p>')).toHaveLength(0);
    expect(textosJsx('<Bloque>{filas}</Bloque>')).toHaveLength(0);
  });
  it('el detector ve lo que dice ver', () => {
    expect(textosEn("label: 'Código de 6 dígitos'")).toHaveLength(1);
    expect(textosEn("label: 'Sin resultados'")).toHaveLength(1);
    expect(textosEn("x = 'sin'")).toHaveLength(0);
    expect(textosEn("x = 'no hay nada'")).toHaveLength(1);
    expect(textosEn("border: 'var(--border-w) solid var(--border)'")).toHaveLength(0);
    expect(DEFAULT_CON_MAYUSCULA.test("closeLabel = 'Cerrar',")).toBe(true);
    expect(DEFAULT_CON_MAYUSCULA.test("tone = 'neutral',")).toBe(false);
  });
});

describe('los componentes del molde no traen textos', () => {
  it('ninguna cadena en español en el código', () => {
    const hallados = ARCHIVOS.flatMap(([n, renglones]) => renglones.flatMap((r, i) => textosEn(r).map((s) => `${n}:${i + 1}  «${s}»`)));
    expect(hallados, hallados.join('\n')).toEqual([]);
  });
  it('ningún texto suelto dentro de JSX', () => {
    const hallados = ARCHIVOS.flatMap(([n, renglones]) => renglones.flatMap((r, i) => textosJsx(r).map((s) => `${n}:${i + 1}  «${s}»`)));
    expect(hallados, hallados.join('\n')).toEqual([]);
  });
  it('ningún valor por defecto de una prop es una palabra para leer', () => {
    const hallados = ARCHIVOS.flatMap(([n, renglones]) => renglones.map((r, i) => (DEFAULT_CON_MAYUSCULA.test(r) ? `${n}:${i + 1}  ${r.trim().slice(0, 90)}` : null)).filter(Boolean));
    expect(hallados, hallados.join('\n')).toEqual([]);
  });
});
