/**
 * Toda clave que usan los paneles existe en los archivos de idioma.
 *
 * Una clave mal escrita no rompe nada: `t()` devuelve la llave y la persona ve
 * «settings.profile.phot» en pantalla. Este test lee las llamadas `t('…')` con
 * clave literal del código de Ajustes y exige que cada una esté en `es.json`
 * (y por paridad, en los otros dos). Las armadas con variables
 * (`t(\`settings.notifications.channel.${c}\`)`) se revisan aparte, abajo.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TEXTOS } from '@moldes/idiomas';
import { COMUNES } from './secciones.js';
import { claveDelAutenticador } from './filas.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FUENTES = readdirSync(AQUI).filter((n) => /\.(jsx|js)$/.test(n) && !n.includes('.test.')).map((n) => readFileSync(join(AQUI, n), 'utf8')).join('\n');
const LITERALES = [...FUENTES.matchAll(/\bt\(\s*'([a-zA-Z0-9.]+)'/g)].map((m) => m[1]);
/* `fila(t, 'x')` usa la clave y su `.d`; `clave="x"` en FilaDeCampo también. */
const DE_FILA = [...FUENTES.matchAll(/fila\(t,\s*'([a-zA-Z0-9.]+)'\)|clave="([a-zA-Z0-9.]+)"/g)].flatMap((m) => { const c = m[1] || m[2]; return [c, `${c}.d`]; });

describe('las claves de Ajustes existen', () => {
  it('el piso: se leyeron claves', () => {
    expect(LITERALES.length).toBeGreaterThan(40);
    expect(DE_FILA.length).toBeGreaterThan(10);
  });
  it('toda clave literal y de fila está en es.json', () => {
    const faltan = [...new Set([...LITERALES, ...DE_FILA])].filter((c) => !(c in TEXTOS.es));
    expect(faltan).toEqual([]);
  });
  it('las armadas: secciones, canales y el autenticador', () => {
    const armadas = [
      ...COMUNES.map((s) => s.clave), ...COMUNES.map((s) => `${s.clave}.hint`),
      ...['email', 'app', 'whatsapp'].map((c) => `settings.notifications.channel.${c}`),
      claveDelAutenticador({ equipo: true }, { activo: true }), claveDelAutenticador({}, { activo: true }), claveDelAutenticador({}, {}),
    ];
    expect(armadas.filter((c) => !(c in TEXTOS.es))).toEqual([]);
  });
});
