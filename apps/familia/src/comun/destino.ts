import { rutaInternaSegura } from '@codice/core';
import { RUTAS } from '../rutas';

/**
 * Dónde se guarda el `?ir=` de `/entrar` mientras la persona entra — orden #24 B.
 *
 * ── Por qué `sessionStorage` y no el `redirectTo` de Google ─────────────
 * La vuelta de Google cae en la raíz (`redirectTo: origin`). Meter el destino
 * en esa URL obligaría a que cada ruta posible esté en las «Redirect URLs» de
 * Supabase, que es configuración de dirección (D17). La pestaña es la misma a
 * la ida y a la vuelta, y `sessionStorage` vive lo que vive la pestaña: alcanza
 * para el código por correo y para Google sin tocar ninguna cuenta.
 *
 * Qué se acepta lo decide `rutaInternaSegura()` de `core`, al guardar **y** al
 * usar (`rutaQueCorresponde()` lo vuelve a mirar): un valor que alguien haya
 * puesto a mano en el almacenamiento tampoco saca a nadie de la app.
 *
 * Todo con `try`: en una ventana privada o con el almacenamiento bloqueado
 * `sessionStorage` tira, y eso no puede impedir entrar. Sin destino, se va a
 * Mi espacio, que es el comportamiento de antes.
 */
const CLAVE = 'codice.destino-despues-de-entrar';

/** Si la URL actual es la entrada (`/login`, o `/entrar` de antes de la #35), guarda su `?ir=` (válido) o borra el viejo. */
export function guardarDestinoDeLaUrl(): void {
  if (window.location.pathname !== RUTAS.login && window.location.pathname !== RUTAS.entrar) return;
  const ir = rutaInternaSegura(new URLSearchParams(window.location.search).get('ir'));
  try {
    if (ir) window.sessionStorage.setItem(CLAVE, ir);
    else window.sessionStorage.removeItem(CLAVE);
  } catch {
    /* Sin almacenamiento: se entra igual y se cae en Mi espacio. */
  }
}

export function destinoGuardado(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function olvidarDestino(): void {
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {
    /* Nada que olvidar. */
  }
}
