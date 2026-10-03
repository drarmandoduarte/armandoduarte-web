/**
 * La barra y los ajustes de Mi espacio — orden #34.
 *
 * Tres preguntas del bloque del usuario y de «Tus preferencias.» que no le
 * tocan a un `.tsx` (la app nativa va a hacer las mismas):
 *
 *   · ¿Qué iniciales van en el avatar? — nombre + apellido; si no hay, la
 *     primera letra del correo (A.3).
 *   · ¿Qué rol se escribe debajo del nombre? — «Cliente», «Equipo · México»,
 *     «Equipo · Internacional» o «Dueño» (A.3). Devuelve la **clave** de i18n:
 *     el texto lo pone la interfaz.
 *   · ¿Con qué entra? — Google o el código por correo (B.2), según los
 *     proveedores que trae la sesión.
 *
 * Y una cuarta, de ruteo: qué secciones de Ajustes ve quién (B, Seguridad solo
 * para el equipo).
 */
import type { Rol, Territorio } from '../panel/equipo';

type PersonaDelAvatar = { nombre?: string | null; apellido?: string | null } | null | undefined;

/** La primera letra visible de un texto, en mayúscula. Respeta acentos y la ñ. */
function primeraLetra(texto: string | null | undefined): string {
  const limpio = (texto ?? '').trim();
  const letra = [...limpio].find((c) => /\p{L}|\p{N}/u.test(c));
  return letra ? letra.toLocaleUpperCase('es-MX') : '';
}

/**
 * A.3 · las iniciales del avatar. Nombre + apellido («AP»); con uno solo, esa
 * letra; sin ninguno, la primera del correo; sin nada, «?» (nunca un círculo
 * vacío).
 */
export function inicialesDe(persona: PersonaDelAvatar, correo: string | null | undefined): string {
  const iniciales = primeraLetra(persona?.nombre) + primeraLetra(persona?.apellido);
  if (iniciales) return iniciales;
  return primeraLetra(correo) || '?';
}

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
  if (rol === 'dueno') return 'marco.rol.dueno';
  if (rol === 'cliente') return 'marco.rol.cliente';
  if (territorio === 'mexico') return 'marco.rol.equipoMexico';
  if (territorio === 'internacional') return 'marco.rol.equipoInternacional';
  return 'marco.rol.equipo';
}

export const FORMAS_DE_ENTRAR = ['google', 'codigo'] as const;
export type FormaDeEntrar = (typeof FORMAS_DE_ENTRAR)[number];

/**
 * B.2 · «Entras con»: los proveedores de la sesión (`app_metadata.providers`
 * de Supabase), traducidos a las dos formas que existen en Mi espacio. `email`
 * es el código por correo (S2: sin contraseñas). Sin datos, el código: es la
 * forma que tiene toda cuenta.
 */
export function formasDeEntrar(proveedores: readonly string[] | null | undefined): FormaDeEntrar[] {
  const lista = proveedores ?? [];
  const formas: FormaDeEntrar[] = [];
  if (lista.includes('google')) formas.push('google');
  if (lista.includes('email') || formas.length === 0) formas.push('codigo');
  return formas;
}

/** B · las secciones de «Tus preferencias.», en el orden de la orden. */
export const SECCIONES_DE_AJUSTES = ['perfil', 'cuenta', 'notificaciones', 'seguridad', 'sesiones', 'privacidad'] as const;
export type SeccionDeAjustes = (typeof SECCIONES_DE_AJUSTES)[number];

/** B.4 · Seguridad es solo del equipo: un cliente no ve esa entrada. */
export function seccionesDeAjustes(esEquipo: boolean): SeccionDeAjustes[] {
  return SECCIONES_DE_AJUSTES.filter((s) => s !== 'seguridad' || esEquipo);
}
