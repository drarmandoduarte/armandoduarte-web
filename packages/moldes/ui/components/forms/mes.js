/* La cuadrícula de un mes, sin pantalla y con test propio.

   Son quince líneas y aun así es donde se esconden los errores caros de todo
   calendario: el mes que empieza domingo, el que tiene 28 días justos, el que
   cambia la hora en el medio. Todo se calcula en **hora local** y con
   constructores de fecha —`new Date(anio, mes, dia)`, `setDate`—, nunca sumando
   milisegundos: sumar 24 × 60 × 60 × 1000 no cruza el fin de mes ni sobrevive al
   cambio de hora, y las dos cosas pasan en una agenda.

   SIEMPRE SEIS FILAS. Un mes entra en cinco semanas o en seis según en qué día
   caiga el 1, y un mini-calendario que cambia de alto al pasar de mes empuja lo
   que tiene debajo cada vez que alguien toca una flecha. Cuarenta y dos casillas
   siempre: el alto es el mismo en enero que en febrero. */

/** Medianoche local de esa fecha, sin hora. Es la unidad con la que se compara. */
export function soloDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** El día 1 del mes de esa fecha. */
export function primeroDelMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

/** ¿Son el mismo día del mismo mes del mismo año? */
export function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** ¿Cae esa fecha dentro de ese mes? Lo que decide si el número va apagado. */
export function mismoMes(fecha, mes) {
  return fecha.getFullYear() === mes.getFullYear() && fecha.getMonth() === mes.getMonth();
}

/**
 * Las 42 casillas del mes: las del mes, más las de relleno de los meses vecinos
 * que completan la primera y la última semana.
 *
 * `primerDia` es qué día abre la semana — 1 = lunes (ISO 8601, la convención de
 * toda agenda del molde y la de `extract(isodow)` en Postgres), 0 = domingo.
 */
export function diasDeMes(mes, primerDia = 1) {
  const uno = primeroDelMes(mes);
  // Cuántos días hay que retroceder para llegar al arranque de esa semana.
  const desplazamiento = (uno.getDay() - primerDia + 7) % 7;
  const arranque = new Date(uno.getFullYear(), uno.getMonth(), 1 - desplazamiento);
  return Array.from({ length: 42 }, (_, i) => (
    new Date(arranque.getFullYear(), arranque.getMonth(), arranque.getDate() + i)
  ));
}

/**
 * Las iniciales de los siete días, en el idioma que sea y arrancando por el que
 * abre la semana. Salen de `Intl` y no de i18n a propósito: el nombre de un día
 * no es texto de producto —no lo escribe nadie, no se puede decir de otra
 * manera— y tenerlo en cuatro archivos de traducción sería mantener a mano lo
 * que el navegador ya sabe en todos los idiomas.
 */
export function inicialesDeSemana(idioma, primerDia = 1) {
  const formato = new Intl.DateTimeFormat(idioma, { weekday: 'narrow' });
  // El 4 de enero de 1970 fue domingo: sirve de ancla para recorrer los siete.
  return Array.from({ length: 7 }, (_, i) => (
    formato.format(new Date(1970, 0, 4 + ((primerDia + i) % 7)))
  ));
}
