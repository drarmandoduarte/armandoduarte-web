/* Las dos cuentas del `Selector`, sin pantalla y con test propio.

   Van aparte del componente por la razón de siempre: **el modo lo decide una
   regla, no un `if` perdido dentro de un render**. Si mañana el umbral cambia,
   cambia aquí y con su prueba al lado; si viviera adentro del componente, el día
   que alguien copie medio `Selector` para otra cosa se llevaría medio criterio. */

/**
 * Hasta cuántas opciones entra un desplegable sin búsqueda.
 *
 * **Siete**, y no es un número redondo elegido de memoria: es lo que entra en la
 * lista flotante sin scrollear, y es donde una lista deja de recorrerse con el
 * ojo y empieza a recorrerse con el dedo. Por debajo, buscar es más trabajo que
 * mirar —escribir «efectivo» cuando hay cinco medios de pago a la vista es una
 * ceremonia—; por arriba, mirar es más trabajo que buscar.
 *
 * Es el DEFAULT y no la ley: cada uso puede forzar su modo con `buscable`.
 * Hay vocabularios de seis que se escriben mejor y otros que jamás —los días de
 * la semana no se buscan, se ven.
 */
export const TOPE_DESPLEGABLE = 7;

/**
 * Qué modo le toca a esta lista.
 *
 * `buscable` manda cuando viene dicho: `true` fuerza la búsqueda aunque haya
 * tres opciones, `false` fuerza el desplegable aunque haya doscientas. Sin
 * decir nada, decide el tamaño.
 *
 * **`libre` gana sobre todo lo demás**, y no es una preferencia: si el campo
 * admite lo que la lista no tiene, hay que poder escribirlo. Un desplegable
 * «libre» sería un campo que promete texto y no tiene dónde ponerlo — y la
 * especialidad de un externo es exactamente ese caso: la lista curada no las
 * tiene todas, y ahí el campo tiene que seguir funcionando igual.
 */
export function modoDeSeleccion(cuantas, buscable, libre) {
  if (libre) return 'busqueda';
  if (buscable === true) return 'busqueda';
  if (buscable === false) return 'desplegable';
  return cuantas > TOPE_DESPLEGABLE ? 'busqueda' : 'desplegable';
}

/**
 * Las opciones en una sola lista, vengan sueltas o en grupos.
 *
 * El componente dibuja una lista y navega con flechas; los grupos son
 * encabezados adentro de esa lista, no listas paralelas. Aplanarlas aquí es lo
 * que hace que la flecha de abajo pase de la última opción de un grupo a la
 * primera del siguiente sin que el componente tenga que saber de grupos.
 *
 * **El orden no se toca**: quien armó los grupos ya decidió cuál va primero.
 * Cada opción se lleva el nombre de su grupo en `grupo`, que es lo que después
 * dibuja el encabezado — y así el encabezado sale de la lista y no de una
 * segunda estructura que se pueda desincronizar.
 *
 * Si vienen las dos cosas, las sueltas van primero: es el orden en que se
 * escriben en el JSX y el único que no sorprende.
 */
export function aplanarOpciones(options, groups) {
  const planas = [];
  for (const o of options ?? []) planas.push(o);
  for (const g of groups ?? []) {
    for (const o of g.options ?? []) planas.push({ ...o, grupo: g.label });
  }
  return planas;
}

/**
 * La lista partida en tramos, uno por grupo, para poder dibujarla.
 *
 * Cada tramo lleva su nombre —o ninguno, para las opciones sueltas— y sus
 * opciones **con el índice que tienen en la lista completa**: ese índice es el
 * que usa el teclado para saber cuál está activa, así que partir la lista no
 * puede renumerar nada.
 *
 * Se calcula sobre la lista YA filtrada: si la búsqueda dejó afuera a todo un
 * grupo, ese tramo no existe y su encabezado no se dibuja. Un encabezado sin
 * nada debajo es una sección vacía pintada.
 *
 * Existe porque un grupo tiene que ser un `role="group"` de verdad, con todas
 * sus opciones adentro: para un lector de pantalla, un encabezado suelto en el
 * medio de un listbox no existe.
 */
export function segmentarPorGrupo(opciones) {
  const tramos = [];
  (opciones ?? []).forEach((o, i) => {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.grupo === o.grupo) ultimo.opciones.push({ opcion: o, indice: i });
    else tramos.push({ grupo: o.grupo, opciones: [{ opcion: o, indice: i }] });
  });
  return tramos;
}
