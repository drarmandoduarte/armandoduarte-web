/**
 * Las reglas de la bienvenida (de la app de origen, textual): «tres pantallas
 * como máximo, cada una con una sola cosa, y "Saltar" siempre visible salvo en
 * la primera. Nada de recorridos con flechas ni carteles que tapan la app.»
 *
 * Y una acotación que el origen aprendió: una pantalla sin la cual la app no
 * funciona (crear la cuenta, por ejemplo) TAMPOCO se salta. La app lo marca con
 * `obligatoria: true`.
 */
export const MAXIMO_DE_PANTALLAS = 3;

/** Los pasos que declara la app, controlados: falla si son más de tres o ninguno. */
export function validarPasos(pasos = []) {
  if (pasos.length === 0) throw new Error('[bienvenida] no hay pasos: la app tiene que declarar al menos uno');
  if (pasos.length > MAXIMO_DE_PANTALLAS) {
    throw new Error(`[bienvenida] ${pasos.length} pantallas: el molde permite ${MAXIMO_DE_PANTALLAS} como máximo, cada una con una sola cosa`);
  }
  return pasos;
}

/** ¿Se puede saltar este paso? Nunca el primero, nunca uno obligatorio. */
export function sePuedeSaltar(pasos, indice) {
  return indice > 0 && !pasos[indice]?.obligatoria;
}

/** ¿Es el último? Ahí el botón dice «Empezar» y no «Siguiente». */
export const esElUltimo = (pasos, indice) => indice === pasos.length - 1;
