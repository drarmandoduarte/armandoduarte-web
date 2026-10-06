import { SetMetadata, type CustomDecorator } from '@nestjs/common';

/**
 * KIT DE ACCESO · NÚCLEO (S6) — NO se edita en una app. Una mejora se
 * hace en el kit, sube la versión y se regeneran las huellas.
 */

/** Clave de metadata que lee `Aal2Guard` para exigir un código RECIENTE. */
export const PASO_RECIENTE_KEY = 'paso_reciente_minutos';

/** Código que devuelve el backend cuando hace falta re-verificar el autenticador. */
export const PASO_RECIENTE_CODE = 'PASO_RECIENTE_REQUERIDO';

/**
 * Exige que el segundo paso se haya verificado hace POCO para esta ruta.
 *
 * Tener la sesión en `aal2` significa "en algún momento del día puso el código".
 * Para lo que de verdad duele —llevarse los cierres en un CSV, dejar a otra
 * persona sin autenticador— eso no alcanza: si alguien se levanta de una
 * computadora abierta, la sesión sigue siendo válida. Acá se pide el código otra
 * vez, en el momento, y solo para estas acciones.
 *
 * Es lo que hacen GitHub ("sudo mode"), Google y los bancos. No se le pide a la
 * persona todo el tiempo: se le pide cuando la acción lo justifica.
 *
 * Reutiliza la lectura del `amr` que `Aal2Guard` ya hace: ni un guard más, ni un
 * parseo más del token.
 *
 * @param minutos Cuán reciente tiene que ser el código. Tiene que ser > 0.
 */
export function PasoReciente(minutos: number): CustomDecorator<string> {
  if (!Number.isFinite(minutos) || minutos <= 0) {
    throw new Error('@PasoReciente exige una cantidad de minutos mayor que cero.');
  }
  return SetMetadata(PASO_RECIENTE_KEY, minutos);
}
