/**
 * `generar-css.mjs`: el `design.css` que una app sirve desde su dominio dice
 * exactamente lo mismo que el resolver, en los dos temas, y un `design.json`
 * que no cumple el esquema no escribe nada.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { aCss, hojaDeDesign } from './resolver.js';

const SCRIPT = new URL('./generar-css.mjs', import.meta.url).pathname;
const RUTA = new URL('./disenos/consultorio.design.json', import.meta.url).pathname;
const design = JSON.parse(readFileSync(RUTA, 'utf8'));
const carpetas = [];
const carpeta = () => { const c = mkdtempSync(join(tmpdir(), 'generar-css-')); carpetas.push(c); return c; };
afterEach(() => { while (carpetas.length) rmSync(carpetas.pop(), { recursive: true, force: true }); });

describe('generar-css.mjs', () => {
  it('escribe public/design.css con las variables de claro y oscuro', () => {
    const publica = join(carpeta(), 'public');
    execFileSync(process.execPath, [SCRIPT, RUTA, publica]);
    const hoja = readFileSync(join(publica, 'design.css'), 'utf8');
    expect(hoja).toBe(hojaDeDesign(design));
    expect(hoja.endsWith(aCss(design))).toBe(true);
    expect(hoja).toContain(':root{');
    expect(hoja).toContain('[data-theme="dark"]{');
    expect(hoja).toContain(`--c-acento:${design.color.acento.toUpperCase()};`);
    expect(hoja).toContain(`--c-acento:${design.colorOscuro.acento.toUpperCase()};`);
  });

  it('la cabecera dice de dónde sale y que no se edita a mano', () => {
    expect(hojaDeDesign(design).split('\n')[0]).toMatch(/^\/\* Generado por @moldes\/design · generar-css\.mjs .* No se edita a mano/);
  });

  it('un design.json que no cumple el esquema frena y no escribe nada', () => {
    const base = carpeta();
    const malo = join(base, 'malo.json');
    writeFileSync(malo, JSON.stringify({ ...design, color: { ...design.color, acento: 'rojo' } }));
    let salida = null;
    try { execFileSync(process.execPath, [SCRIPT, malo, join(base, 'public')], { stdio: 'pipe' }); } catch (e) { salida = e; }
    expect(salida?.status).toBe(1);
    expect(String(salida.stderr)).toContain('color.acento');
    expect(existsSync(join(base, 'public', 'design.css'))).toBe(false);
  });
});
