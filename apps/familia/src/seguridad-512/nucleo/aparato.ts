import { clave } from './nombres';

/**
 * KIT DE SEGURIDAD 512 · NÚCLEO (S7) — NO se edita en una app.
 *
 * Id de ESTE aparato, para el aviso de "entraste desde un aparato nuevo".
 *
 * Qué es y qué no es: un número al azar que el navegador se genera a sí mismo la
 * primera vez y guarda en su almacenamiento local. No sale de ningún dato de la
 * persona, no viaja entre sitios y no sirve para reconocerla en ningún lado. La
 * única pregunta que contesta es "¿este navegador ya entró antes?". El servidor
 * ni siquiera lo guarda en claro: guarda su hash.
 *
 * Si el almacenamiento no está disponible (ventana privada, permisos), devuelve
 * `null` y el aviso simplemente no se manda: mejor eso que inventar un id nuevo
 * en cada visita y avisar "aparato nuevo" veinte veces por día.
 */
const APARATO_KEY = 'aparato_id';

export function idDeEsteAparato(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const k = clave(APARATO_KEY);
    const guardado = window.localStorage.getItem(k);
    if (guardado && /^[A-Za-z0-9-]{16,64}$/.test(guardado)) return guardado;
    const nuevo = generarId();
    window.localStorage.setItem(k, nuevo);
    return nuevo;
  } catch {
    return null;
  }
}

/** Id al azar, con `crypto` cuando está y un respaldo razonable cuando no. */
function generarId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // seguimos al respaldo
  }
  // Respaldo: no es criptográfico, y no hace falta que lo sea — esto no protege
  // nada, solo distingue aparatos.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`.slice(0, 64);
}
