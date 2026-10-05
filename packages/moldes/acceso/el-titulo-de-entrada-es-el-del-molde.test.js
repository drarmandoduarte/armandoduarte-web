/**
 * El título de entrada del núcleo y `fraseDeMarca()` de `@moldes/design` dicen lo
 * mismo. El núcleo no la importa (se copia solo a cada app), así que la regla
 * está escrita dos veces: esto es lo que impide que se separen.
 */
import { describe, expect, it } from 'vitest';
import { fraseDeMarca } from '@moldes/design';
import { tituloDeEntrada } from './nucleo/frontend/titulo-de-entrada.ts';

const GENERICO = 'GENERICO';
const FRASES = [
  'Tu próxima *casa*.',
  { es: 'Tu *casa*.', en: 'Your *home*.', pt: 'Sua *casa*.' },
  { es: 'Solo *español*.' },
  { en: 'Only *English*.' },
  {},
  undefined,
];

describe('una sola regla para la frase de marca', () => {
  it.each(FRASES.flatMap((f) => ['es', 'en', 'pt'].map((i) => [JSON.stringify(f) ?? 'undefined', i, f])))(
    'frase %s en %s',
    (_, idioma, frase) => {
      const delMolde = fraseDeMarca({ app: { frase } }, idioma) ?? GENERICO;
      expect(tituloDeEntrada(frase, idioma, GENERICO)).toBe(delMolde);
    },
  );
});
