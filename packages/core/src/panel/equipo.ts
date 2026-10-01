/**
 * Quién puede sumar o quitar a alguien del equipo — orden #24 A.3.
 *
 * La base ya lo impide (policies `miembros_dueno_*` de la 001: solo el dueño,
 * con segundo paso). Esto decide **qué botón se dibuja**, para que el equipo no
 * vea un botón que le va a devolver un error.
 */

export const TERRITORIOS = ['mexico', 'internacional', 'todos'] as const;
export type Territorio = (typeof TERRITORIOS)[number];

export type Rol = 'dueno' | 'equipo' | 'cliente';

export interface FilaDePersona {
  persona_id: string;
  rol: string | null;
  activo: boolean | null;
}

/**
 * `'sumar'`, `'quitar'` o `null` (ningún botón).
 *
 * · Solo el dueño gestiona el equipo.
 * · Nadie se gestiona a sí mismo: el dueño que se quita se queda sin panel y sin
 *   nadie que pueda devolvérselo.
 * · A otro dueño no se lo quita desde acá: es un cambio de dirección, no de
 *   panel.
 * · Un miembro desactivado se puede volver a sumar.
 */
export function accionDeEquipo(rolDeQuienPide: Rol, idDeQuienPide: string, fila: FilaDePersona): 'sumar' | 'quitar' | null {
  if (rolDeQuienPide !== 'dueno') return null;
  if (fila.persona_id === idDeQuienPide) return null;
  if (fila.rol === 'dueno') return null;
  return fila.rol === 'equipo' && fila.activo ? 'quitar' : 'sumar';
}

export function esTerritorio(valor: string): valor is Territorio {
  return (TERRITORIOS as readonly string[]).includes(valor);
}
