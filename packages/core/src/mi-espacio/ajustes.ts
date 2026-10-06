/**
 * El bloque del usuario de la barra — orden #34 (A.3), y desde la #37 (PR 3)
 * el pie del `<Shell>` del molde.
 *
 * Dos preguntas que no le tocan a un `.tsx` (la app nativa va a hacer las
 * mismas):
 *
 *   · ¿Qué nombre va? — «Nombre Apellido», o el correo si no hay nombre. Las
 *     iniciales del avatar las saca el molde (`AvatarPersona`) de ese nombre.
 *   · ¿Qué rol se escribe debajo? — «Cliente», «Equipo · México», «Equipo ·
 *     Internacional» o «Dueño». Devuelve la **clave** de idioma (`molde.json`,
 *     en los tres idiomas): el texto lo pone la interfaz.
 *
 * Lo de «Tus preferencias.» de la #34 (qué secciones ve quién, con qué entra)
 * se fue con ella: Ajustes es del molde (`mi-espacio/molde.ts`).
 */
import type { Rol, Territorio } from '../panel/equipo';

type PersonaDelAvatar = { nombre?: string | null; apellido?: string | null } | null | undefined;

/** A.3 · el nombre del bloque: «Nombre Apellido», o el correo si no hay nombre. */
export function nombreDelBloque(persona: PersonaDelAvatar, correo: string | null | undefined): string {
  const nombre = [persona?.nombre?.trim(), persona?.apellido?.trim()].filter(Boolean).join(' ');
  return nombre || correo?.trim() || '';
}

/**
 * A.3 · la clave de i18n del rol. Un miembro de equipo con territorio `todos`
 * (que hoy no existe: `todos` es del dueño) se escribe «Equipo» a secas, sin
 * inventarle un territorio.
 */
export function claveDelRol(rol: Rol, territorio: Territorio | null | undefined): string {
  if (rol === 'dueno') return 'mi.rol.dueno';
  if (rol === 'cliente') return 'mi.rol.cliente';
  if (territorio === 'mexico') return 'mi.rol.equipoMexico';
  if (territorio === 'internacional') return 'mi.rol.equipoInternacional';
  return 'mi.rol.equipo';
}
