/* Recursos de i18n de Códice. `es` es la fuente.
   Ningún texto de la interfaz vive fuera de estos archivos.

   Hoy hay un solo idioma y un solo namespace, y las dos cosas son a propósito:
   la web pública es de Armando, que escribe en español de México, y D13 pide
   es/en/pt para la plataforma — cuando entre, `en/` y `pt/` son dos carpetas
   hermanas de `es/` y `scripts/check-i18n-parity.mjs` empieza a compararlas sin
   tocar una línea. Mientras tanto no se quejan: el guardián tolera un idioma
   solo, y lo dice. */
import esWeb from './es/web.json';

export const IDIOMAS = ['es'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const RECURSOS_I18N = {
  es: { web: esWeb },
} as const;
