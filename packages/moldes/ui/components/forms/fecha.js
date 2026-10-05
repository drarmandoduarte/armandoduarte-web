/* La cuenta de la fecha, sola y sin pantalla.

   El molde escribe y lee fechas en ISO (`2026-08-10`) porque es lo que guarda
   Postgres y lo que ordena bien como texto. Pero nadie escribe una fecha así:
   se escribe 10/08/2026, y en los cuatro idiomas del producto se escribe
   igual —día, mes, año—, que es la razón por la que el molde la presenta siempre
   así en vez de dejársela al navegador.

   El `<input type=date>` nativo, que es lo que había, muestra el formato del
   IDIOMA DEL NAVEGADOR y no del producto: el Chrome en inglés de quien lo encontró
   decía «mm/dd/yyyy» en un formulario en español. No es un tema de gusto —es
   la diferencia entre el 8 de octubre y el 10 de agosto, y en una fecha de
   nacimiento eso no lo corrige nadie después.

   Estas cuatro funciones son puras a propósito: son la parte que puede estar
   mal en silencio, y por eso están aquí y no adentro del componente. */

/** ISO a lo que se lee: `2026-08-10` → `10/08/2026`. Vacío devuelve vacío. */
export function isoATexto(iso) {
  const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return p ? `${p[3]}/${p[2]}/${p[1]}` : '';
}

/** ¿Existe ese día en el calendario? `31/02/2026` no existe y no se acepta. */
export function esFechaReal(dia, mes, anio) {
  if (mes < 1 || mes > 12 || dia < 1) return false;
  // Día 0 del mes siguiente = último día de este mes. Sirve para los bisiestos
  // sin escribir la regla de los bisiestos, que es donde siempre se falla.
  const ultimo = new Date(anio, mes, 0).getDate();
  return dia <= ultimo;
}

/**
 * Lo que se lee a ISO: `10/08/2026` → `2026-08-10`. Devuelve `null` si todavía
 * no es una fecha —incompleta, o un día que no existe—, y `''` si está vacío.
 *
 * `null` y `''` son distintos a propósito: vacío es «no hay fecha», que es un
 * estado legítimo; `null` es «lo que hay escrito no sirve todavía», y el
 * componente lo usa para no borrar el valor mientras alguien escribe.
 */
export function textoAIso(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return '';
  const p = /^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{4})$/.exec(limpio);
  if (!p) return null;
  const dia = Number(p[1]);
  const mes = Number(p[2]);
  const anio = Number(p[3]);
  if (!esFechaReal(dia, mes, anio)) return null;
  const dosDigitos = (n) => String(n).padStart(2, '0');
  return `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`;
}

/**
 * Las barras se ponen solas mientras se teclea: `10082026` → `10/08/2026`.
 *
 * Solo agrega; nunca quita ni corrige. Quien está borrando con la tecla de
 * retroceso tiene que poder pasar por encima de una barra sin que el campo se
 * la vuelva a poner delante del cursor — por eso se corta en los dígitos que
 * haya y no se completa nada.
 */
export function conBarras(texto) {
  const digitos = String(texto || '').replace(/\D/g, '').slice(0, 8);
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)];
  return partes.filter((x) => x.length > 0).join('/');
}
