/* Cómo se busca dentro de una lista larga, sin pantalla y con test propio.

   El caso que la manda es el de una cuenta con 700 fichas: escribir «mar»
   tiene que traer a Marcos Leiva y a María sin que importe el acento, la mayúscula ni
   por dónde empieza la palabra. Nadie recuerda si la ficha decía «Nº 12 Bis» o
   «12 bis», y una búsqueda que solo mira el principio del nombre obliga a
   recordarlo.

   Es una cuenta y no un detalle del componente por la razón de siempre: si
   mañana la búsqueda de personas y la de productos difieren en cómo tratan un
   acento, una de las dos va a estar mal y nadie va a saber cuál. */

/** Sin acentos, sin mayúsculas y sin aire en las puntas. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    // El rango de los diacríticos combinantes. Se escribe así y no con
    // `\p{Diacritic}` porque la clase de propiedad Unicode necesita la bandera
    // `u`, y este archivo tiene que andar igual en cualquier navegador que
    // corra el producto.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Las opciones que coinciden con lo escrito, en el orden en que venían.
 *
 * **El orden de la lista no se toca.** Quien la arma ya decidió cuál va primero
 * —las personas por nombre, los motivos por frecuencia de uso— y reordenar por
 * relevancia haría que la misma tecla mueva las opciones de sitio mientras
 * alguien apunta con el dedo.
 *
 * Se busca en el nombre Y en el detalle: en la lista de personas el detalle es
 * el responsable, y «Pérez» es exactamente como el mostrador encuentra al
 * titular cuando el que llama dice su propio apellido.
 *
 * `tope` corta el largo de lo que se dibuja, no el de lo que se busca: 700
 * opciones en el DOM son 700 nodos por cada tecla. Quien no encontró lo suyo en
 * los primeros escribe una letra más, que es más rápido que recorrer.
 */
export function filtrarOpciones(opciones, texto, tope) {
  const termino = normalizar(texto);
  const lista = opciones ?? [];
  const encontradas = termino
    ? lista.filter((o) => normalizar(`${o.label} ${o.detalle ?? ''}`).includes(termino))
    : lista;
  return tope && tope > 0 ? encontradas.slice(0, tope) : encontradas;
}

/** La opción que tiene ese valor, si es que la lista lo tiene. */
export function opcionDe(opciones, valor) {
  if (!valor) return null;
  return (opciones ?? []).find((o) => o.value === valor) ?? null;
}
