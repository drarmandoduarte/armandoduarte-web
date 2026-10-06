/**
 * El rescate solo — orden #37, PR 2 (fase-2 §8 del molde). Las reglas que la
 * pantalla necesita y que no le tocan a un `.tsx`.
 *
 * Mi espacio es de **rescate solo**: nadie resetea el autenticador de otra
 * persona. Quien perdió el teléfono y los códigos de respaldo pide el reseteo,
 * lo confirma desde el enlace del correo y, **48 horas después**, entra con el
 * código por correo y configura un autenticador nuevo. Mientras tanto, el
 * correo de aviso trae el enlace para cancelarlo.
 *
 * Las mismas reglas las sostienen, cada una a su manera, la API (la consulta de
 * `POST /api/rescate/aplicar` solo toma un rescate confirmado, sin cancelar,
 * sin usar y vencido; la API no puede importar este paquete) y la base (la
 * `013`: `vence_el = pedido_el + 48 h`, uno abierto por persona, «solo se
 * cierra»). Acá vive la versión que la pantalla lee, con su test.
 */

/** Las horas de espera. No son configurables: son la regla del rescate solo. */
export const HORAS_DE_ESPERA_DEL_RESCATE = 48;

/** Cuándo se puede usar un rescate pedido en `pedido`. */
export function venceDelRescate(pedido: Date): Date {
  return new Date(pedido.getTime() + HORAS_DE_ESPERA_DEL_RESCATE * 60 * 60 * 1000);
}

/** Una fila de `rescates`, como la lee la API (fechas ISO o nulas). */
export interface FilaDeRescate {
  vence_el: string;
  confirmado_el: string | null;
  cancelado_el: string | null;
  usado_el: string | null;
}

/**
 * En qué está un rescate:
 *
 *  · `sin-confirmar` — pedido, todavía nadie abrió el enlace de confirmación;
 *  · `en-espera` — confirmado, corren las 48 horas;
 *  · `listo` — confirmado y vencido: al entrar con el código por correo, el
 *    autenticador viejo se borra y se configura uno nuevo;
 *  · `caducado` — pasaron las 48 horas sin que nadie lo confirmara: no vale, y
 *    un pedido nuevo lo cierra;
 *  · `cerrado` — cancelado o usado.
 */
export type EstadoDelRescate = 'sin-confirmar' | 'en-espera' | 'listo' | 'caducado' | 'cerrado';

export function estadoDelRescate(fila: FilaDeRescate, ahora: Date): EstadoDelRescate {
  if (fila.cancelado_el || fila.usado_el) return 'cerrado';
  const vencido = ahora.getTime() >= new Date(fila.vence_el).getTime();
  if (!fila.confirmado_el) return vencido ? 'caducado' : 'sin-confirmar';
  return vencido ? 'listo' : 'en-espera';
}

/**
 * «Reseteo pendiente» de Cuenta y seguridad (`valores.reseteoPendiente` de
 * Ajustes del molde): hay uno pedido que todavía puede terminar en un
 * autenticador nuevo. Un caducado o un cerrado no es pendiente.
 */
export function reseteoPendiente(fila: FilaDeRescate | null, ahora: Date): { vence: string; confirmado: boolean } | null {
  if (!fila) return null;
  const estado = estadoDelRescate(fila, ahora);
  if (estado === 'cerrado' || estado === 'caducado') return null;
  return { vence: fila.vence_el, confirmado: fila.confirmado_el !== null };
}

/** Las dos cosas que se hacen desde un enlace del correo. */
export type AccionDelRescate = 'confirmar' | 'cancelar';

/** La ruta de Mi espacio que abren los enlaces del correo. */
export const RUTA_DEL_RESCATE = '/rescate';

/**
 * El enlace de un correo del rescate. `base` es la de la app (`APP_FAMILIA`).
 * La página que abre **no hace nada sola**: muestra un botón, y recién el botón
 * llama a la API. Así un lector de correo que abre los enlaces por su cuenta
 * (para revisarlos) no confirma ni cancela nada.
 */
export function enlaceDelRescate(base: string, id: string, token: string, accion: AccionDelRescate): string {
  const q = new URLSearchParams({ r: id, t: token, a: accion });
  return `${base.replace(/\/+$/, '')}${RUTA_DEL_RESCATE}?${q.toString()}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** Lo que trae la dirección de `/rescate`, o `null` si no es un enlace del rescate. */
export function leerEnlaceDelRescate(busqueda: string): { id: string; token: string; accion: AccionDelRescate } | null {
  const q = new URLSearchParams(busqueda);
  const id = q.get('r') ?? '';
  const token = q.get('t') ?? '';
  const accion = q.get('a');
  if (!UUID.test(id) || !TOKEN.test(token)) return null;
  if (accion !== 'confirmar' && accion !== 'cancelar') return null;
  return { id, token, accion };
}
