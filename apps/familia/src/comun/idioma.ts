import { IDIOMAS, type Idioma } from '@codice/core';

/**
 * El idioma elegido en el selector del acceso — orden #35 (guion v1, §2: «se
 * recuerda»). Por navegador, como la barra plegada. Con `try` porque en una
 * ventana privada el almacenamiento puede tirar, y eso no impide entrar: se
 * arranca en español.
 */
const CLAVE = 'codice.idioma';

export function idiomaGuardado(): Idioma {
  try {
    const v = window.localStorage.getItem(CLAVE);
    return (IDIOMAS as readonly string[]).includes(v ?? '') ? (v as Idioma) : 'es';
  } catch {
    return 'es';
  }
}

export function guardarIdioma(idioma: Idioma): void {
  try {
    window.localStorage.setItem(CLAVE, idioma);
  } catch {
    /* Sin almacenamiento: cambia igual, y la próxima vez arranca en español. */
  }
}
