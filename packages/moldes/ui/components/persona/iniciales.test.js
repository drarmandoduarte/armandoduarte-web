/**
 * Las iniciales de un nombre: hasta dos letras, con los casos raros cubiertos
 * (un solo nombre, espacios de más, nombres compuestos, tildes).
 */
import { describe, expect, it } from 'vitest';
import { inicialesDeNombre as letrasDe } from './iniciales.js';

describe('las iniciales del avatar', () => {
  it('un nombre solo da una letra, y dos palabras dan dos', () => {
    expect(letrasDe('Ferreira')).toBe('F');
    expect(letrasDe('Luna Bella')).toBe('LB');
  });

  it('con más de dos palabras se queda con las dos primeras', () => {
    expect(letrasDe('Rey de la Casa')).toBe('RD');
  });

  it('los espacios de más no cuentan como palabra', () => {
    expect(letrasDe('  Toby   Jr  ')).toBe('TJ');
  });

  it('una letra fuera del plano básico entra entera, no partida', () => {
    // Con `charAt` esto devolvía media letra, que el avatar dibuja como un
    // rombo negro. Es raro en un nombre, pero pasa una vez y se ve.
    expect(letrasDe('𝒜rgos')).toBe('𝒜');
  });

  it('sin nombre, avatar liso: mejor vacío que un signo de pregunta', () => {
    expect(letrasDe('')).toBe('');
    expect(letrasDe('   ')).toBe('');
    expect(letrasDe(undefined)).toBe('');
  });
});
