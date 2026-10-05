/**
 * Ningún color que diga un estado se lee como tinta.
 *
 * `razonDeContraste` dice si una letra se lee; no dice si se distingue de la
 * tinta. Un verde muy hondo pasa AA y se ve negro: la cifra «verde» deja de
 * decir «salió bien». OKLab sí ve el tono, y la banda en la que un color deja de
 * leerse como color y se lee como tinta está medida en 0,18.
 *
 * Si un `design.json` real cae acá, no es el kit el que está mal: es la paleta,
 * y se avisa a Dirección antes de pintarla.
 */
import { describe, expect, it } from 'vitest';
import { distanciaPerceptual } from '../../design/contraste.js';
import { DISENOS, TEMAS, resolvedorDe } from './medir.js';

const BANDA = 0.18;
const ESTADOS = ['--primary-text', '--warning-text', '--danger-text', '--success-text'];
const CASOS = DISENOS.flatMap(([nombre, design]) => TEMAS.map((tema) => [nombre, tema, resolvedorDe(design)]));

describe('los colores de estado se distinguen de la tinta', () => {
  it.each(CASOS)('%s · %s', (nombre, tema, res) => {
    const tinta = res.hex(tema, '--text');
    for (const estado of ESTADOS) {
      const d = distanciaPerceptual(res.hex(tema, estado), tinta);
      expect(d, `${nombre} ${tema} · ${estado} a ${d.toFixed(3)} de la tinta`).toBeGreaterThanOrEqual(BANDA);
    }
  });

  it.each(CASOS)('%s · %s: confirmar y actuar no son el mismo color', (nombre, tema, res) => {
    expect(res.hex(tema, '--success')).not.toBe(res.hex(tema, '--primary'));
  });

  it.each(CASOS)('%s · %s: las cuatro columnas de alertas son cuatro colores', (nombre, tema, res) => {
    const cuatro = ['--alerta-critico', '--alerta-hoy', '--alerta-proximamente', '--alerta-oportunidades'].map((t) => res.hex(tema, t));
    expect(new Set(cuatro).size, cuatro.join(' · ')).toBe(4);
  });
});
