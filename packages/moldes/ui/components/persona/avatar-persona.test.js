/**
 * El avatar de una persona: relleno del acento, iniciales que se leen encima,
 * en los dos temas y con cualquier `design.json`.
 *
 * Se pide AA de texto (4,5:1) porque cuando no hay foto las iniciales SON lo que
 * identifica a la persona. El par es `--primary` + `--on-primary`, y si alguien
 * invirtiera uno sin mirar el otro el círculo quedaría ilegible en un tema y
 * perfecto en el otro — que es lo que este test caza.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { razonDeContraste } from '../../../design/contraste.js';
import { DISENOS, TEMAS, resolvedorDe } from '../../tokens/medir.js';

const FUENTE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'AvatarPersona.jsx'), 'utf8');

describe('el avatar se viste con tokens', () => {
  it('pinta con --primary y escribe con --on-primary', () => {
    expect(FUENTE).toContain("background: 'var(--primary)'");
    expect(FUENTE).toContain("color: 'var(--on-primary)'");
  });
});

describe('las iniciales se leen sobre el acento', () => {
  const CASOS = DISENOS.flatMap(([nombre, design]) => TEMAS.map((tema) => [nombre, tema, resolvedorDe(design)]));
  it.each(CASOS)('%s · %s: AA de texto', (nombre, tema, res) => {
    const r = razonDeContraste(res.hex(tema, '--primary'), res.hex(tema, '--on-primary'));
    expect(r, `${nombre} ${tema}: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});
