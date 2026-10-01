/**
 * Las reglas del marco de Mi espacio — orden #29.
 *
 * Tres preguntas que la pantalla hace y que no le toca contestar a un `.tsx`
 * (la app nativa va a hacer las mismas):
 *
 *   · ¿Tiene que pasar por `/empezar`? — si le falta nombre, apellido o un
 *     WhatsApp que sirva. Es la misma regla que «Me anoto» (#24 B): sin esos
 *     tres no hay forma de avisarle de su lugar.
 *   · ¿Qué le falta de la ficha? — para la tarjeta «Tus datos» de Inicio.
 *   · ¿Cuál es su próximo taller? — para la tarjeta «Tu próximo taller».
 */
import { DATOS_PARA_ANOTARSE, datosQueFaltan, validarDatosParaAnotarse } from './me-anoto';
import { validarPerfil } from './perfil';
import { telefonoParaWa } from '../panel/listas';

type PersonaDeLaFicha = {
  nombre?: string | null;
  apellido?: string | null;
  whatsapp?: string | null;
  pais?: string | null;
  ciudad?: string | null;
} | null | undefined;

/** C.1: falta nombre, apellido o WhatsApp → primero `/empezar`. Vale también para el equipo. */
export function necesitaEmpezar(persona: PersonaDeLaFicha): boolean {
  return datosQueFaltan(persona ?? null).length > 0;
}

/** Los datos de la ficha que mira la tarjeta de Inicio, en el orden en que se nombran. */
export const DATOS_DE_LA_FICHA = ['nombre', 'apellido', 'whatsapp', 'pais', 'ciudad'] as const;
export type DatoDeLaFicha = (typeof DATOS_DE_LA_FICHA)[number];

/**
 * Lo que le falta a la ficha: los cinco de `/empezar` (los tres obligatorios,
 * país y ciudad). Año de nacimiento y nivel educativo no cuentan: son opcionales
 * y viven en Mis datos (C.3). Un WhatsApp que no sirve cuenta como faltante.
 */
export function faltanEnLaFicha(persona: PersonaDeLaFicha): DatoDeLaFicha[] {
  return DATOS_DE_LA_FICHA.filter((campo) => {
    if (campo === 'whatsapp') return !telefonoParaWa(persona?.whatsapp);
    return !persona?.[campo]?.trim();
  });
}

/**
 * La inscripción más próxima que todavía no terminó y no está anulada. Si
 * empiezan a la misma hora, la primera de la lista. `null` si no hay.
 */
export function proximoTaller<T extends { inicio: string; fin: string; estado: string }>(
  mios: readonly T[],
  ahora: Date = new Date(),
): T | null {
  let elegido: T | null = null;
  for (const m of mios) {
    if (m.estado === 'anulada') continue;
    if (new Date(m.fin).getTime() < ahora.getTime()) continue;
    if (!elegido || new Date(m.inicio).getTime() < new Date(elegido.inicio).getTime()) elegido = m;
  }
  return elegido;
}

/** Las ediciones que cuentan para «N en revisión»: las que no terminaron. */
export function edicionesVigentes<T extends { fin: string }>(ediciones: readonly T[], ahora: Date = new Date()): T[] {
  return ediciones.filter((e) => new Date(e.fin).getTime() >= ahora.getTime());
}

/* ── `/empezar` (C.2) ─────────────────────────────────────────────────────── */

/** Lo que pide `/empezar`: los tres obligatorios, país y ciudad. Todo texto, como sale del formulario. */
export interface EmpezarEntrada {
  nombre: string;
  apellido: string;
  whatsapp: string;
  pais: string;
  ciudad: string;
}
export type CampoDeEmpezar = keyof EmpezarEntrada;

/**
 * Errores por campo, como claves de `familia.json`. Nombre, apellido y WhatsApp
 * con la misma regla que «Me anoto» (`validarDatosParaAnotarse`); país y
 * ciudad, la de «Tus datos» (`validarPerfil`).
 */
export function validarEmpezar(d: EmpezarEntrada): Partial<Record<CampoDeEmpezar, string>> {
  const errores: Partial<Record<CampoDeEmpezar, string>> = {
    ...validarDatosParaAnotarse(d, DATOS_PARA_ANOTARSE),
  };
  const perfil = validarPerfil({ ...d, anio_nacimiento: '', nivel_educativo: '' });
  if (perfil.pais) errores.pais = perfil.pais;
  if (perfil.ciudad) errores.ciudad = perfil.ciudad;
  return errores;
}

/**
 * El cuerpo de `POST /api/yo` desde `/empezar`. La ciudad vacía **no viaja**:
 * para la API, `null` borra, y `/empezar` no tiene por qué borrar nada que la
 * persona haya cargado antes en Mis datos.
 */
export function empezarParaEnviar(d: EmpezarEntrada): Record<string, string> {
  const cuerpo: Record<string, string> = {
    nombre: d.nombre.trim(),
    apellido: d.apellido.trim(),
    whatsapp: d.whatsapp.trim(),
    pais: d.pais,
  };
  if (d.ciudad.trim() !== '') cuerpo.ciudad = d.ciudad.trim();
  return cuerpo;
}
