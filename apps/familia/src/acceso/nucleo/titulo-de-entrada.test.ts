import { describe, it, expect } from 'vitest';
import { tituloDeEntrada } from './titulo-de-entrada';

const GENERICO = { es: 'Entra a *App*.', en: 'Sign in to *App*.', pt: 'Entre no *App*.' };

describe('Kit de Acceso — el título de entrada (frase de marca en tres idiomas)', () => {
  it('con la frase en los tres idiomas, va la del idioma de la pantalla', () => {
    const frase = { es: 'Tu próxima *casa*.', en: 'Your next *home*.', pt: 'Sua próxima *casa*.' };
    expect(tituloDeEntrada(frase, 'en', GENERICO.en)).toBe('Your next *home*.');
    expect(tituloDeEntrada(frase, 'pt', GENERICO.pt)).toBe('Sua próxima *casa*.');
  });
  it('un texto suelto es español: en EN y PT va el genérico, nunca la frase en español', () => {
    expect(tituloDeEntrada('Tu próxima *casa*.', 'es', GENERICO.es)).toBe('Tu próxima *casa*.');
    expect(tituloDeEntrada('Tu próxima *casa*.', 'en', GENERICO.en)).toBe('Sign in to *App*.');
  });
  it('si falta el idioma, el genérico de ese idioma', () => {
    expect(tituloDeEntrada({ es: 'Hola *ahí*.' }, 'pt', GENERICO.pt)).toBe('Entre no *App*.');
  });
  it('sin frase, el genérico', () => {
    expect(tituloDeEntrada(undefined, 'es', GENERICO.es)).toBe('Entra a *App*.');
    expect(tituloDeEntrada(null, 'en', GENERICO.en)).toBe('Sign in to *App*.');
  });
});
