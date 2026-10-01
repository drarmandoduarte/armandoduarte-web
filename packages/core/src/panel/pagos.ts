/**
 * Inscriptos: revisar un pago — orden #27 C.2.
 *
 * Qué filas muestra cada filtro, cuál filtro arranca, qué acciones lleva cada
 * fila y qué falta para resolver. **Nada de acá decide si se puede**: confirmar
 * y rechazar los deja hacer la base (`libro_el_equipo_resuelve`, 003) y anular
 * lo frena además la API para quien no es dueño. Esto decide qué se dibuja.
 */
import type { Rol } from './equipo';

/** Los cuatro filtros, en el orden de la orden. «Anuladas» solo aparece en «Todos». */
export const FILTROS_DE_INSCRIPTOS = ['todos', 'en_revision', 'confirmada', 'pendiente_de_pago'] as const;
export type FiltroDeInscriptos = (typeof FILTROS_DE_INSCRIPTOS)[number];

export function filtrarPorEstado<T extends { estado: string }>(filas: T[], filtro: FiltroDeInscriptos): T[] {
  return filtro === 'todos' ? filas : filas.filter((f) => f.estado === filtro);
}

/** «En revisión» si hay alguna esperando; si no, «Todos». */
export function filtroInicial(filas: { estado: string }[]): FiltroDeInscriptos {
  return filas.some((f) => f.estado === 'en_revision') ? 'en_revision' : 'todos';
}

export interface AccionesDePago {
  ver: boolean;
  confirmar: boolean;
  rechazar: boolean;
  anular: boolean;
}

/**
 * Las acciones de una fila. «Ver» cuando hay comprobante; «Confirmar» y
 * «Rechazar» solo en revisión; «Anular» solo para el dueño y sobre lo que no
 * está anulado. Quien no es del equipo no tiene ninguna.
 */
export function accionesDePago(rol: Rol, fila: { estado: string; comprobante_path: string | null }): AccionesDePago {
  if (rol === 'cliente') return { ver: false, confirmar: false, rechazar: false, anular: false };
  const enRevision = fila.estado === 'en_revision';
  return {
    ver: Boolean(fila.comprobante_path),
    confirmar: enRevision,
    rechazar: enRevision,
    anular: rol === 'dueno' && fila.estado !== 'anulada',
  };
}

/** El motivo es lo que el cliente va a leer: corto y obligatorio para rechazar o anular. */
export const MOTIVO_MAXIMO = 500;

export function validarResolucion(tipo: 'confirmado' | 'rechazado' | 'anulado', nota: string): string | null {
  const limpia = nota.trim();
  if (tipo !== 'confirmado' && limpia === '') return 'equipo.inscriptos.pago.errores.motivo';
  if (limpia.length > MOTIVO_MAXIMO) return 'equipo.inscriptos.pago.errores.largo';
  return null;
}

/** El punto de color de cada estado (C.2): teal, ámbar, gris y tinta. */
export function tonoDeEstado(estado: string): 'confirmada' | 'en_revision' | 'pendiente' | 'anulada' {
  if (estado === 'confirmada') return 'confirmada';
  if (estado === 'en_revision') return 'en_revision';
  if (estado === 'anulada') return 'anulada';
  return 'pendiente';
}
