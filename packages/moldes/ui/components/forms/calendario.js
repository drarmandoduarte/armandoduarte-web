/* La cuenta del calendario propio. Sin pantalla y con test.

   ── Qué viene a reemplazar ─────────────────────────────────────────────────
   `CampoFecha` ya reemplazó el CAMPO: se escribe dd/mm/aaaa en los cuatro
   idiomas y se emite ISO. Lo que quedaba del navegador era el CALENDARIO: el
   botón llamaba a `showPicker()` sobre un `<input type="date">` escondido, y lo
   que se abría era el «August 2026 · Clear · Today» en azul de sistema, en el
   idioma del navegador y no en el del producto. Una línea de código, dieciséis
   pantallas.

   Y la cabecera de `CampoFecha` ARGUMENTABA que ahí el nativo estaba bien —«una
   grilla de días no tiene formato ambiguo»—. Es una decisión escrita, dirección
   la revisó y la cambió: un panel del sistema operativo en el medio de una
   pantalla quiet luxury es el mismo agujero que el kit ya tapó en el `<select>`.
   Se reescribe con el caso al lado: un argumento que se descarta se anota con su caso.

   ── Por qué está aquí y no adentro del componente ──────────────────────────
   Porque es la parte que puede estar mal EN SILENCIO: el mes que abre cuando no
   hay nada elegido, el día que queda fuera de `min` y aun así se deja apretar,
   la flecha que sigue viva en el borde del rango. Nada de eso se ve en una
   captura. Es la misma razón por la que `fecha.js` y `mes.js` viven sueltos y
   con test propio, y no dentro de `CampoFecha` ni de `MiniCalendario`.

   ── EL BORDE HABLA ISO ─────────────────────────────────────────────────────
   Decisión de dirección (duda 4 de la Parte 0). Hacia afuera todo es
   `YYYY-MM-DD`, que es el contrato que `CampoFecha` ya tenía y lo que guarda
   Postgres. Adentro, la rejilla la calcula `mes.js` con `Date` —**se comparte el
   saber, no el dibujo**: es el mismo archivo que usa el mini-calendario de la
   Agenda, tiene test y no se toca— y **la conversión ocurre en un solo lugar**,
   que es `isoDeDia`.

   Lo que D8 prohíbe es `new Date('2026-08-01')`, que se interpreta como
   medianoche UTC y en Montevideo es el 31 de julio. Aquí eso no ocurre nunca:
   `diaDeIso` parte el string y usa el constructor de componentes, e `isoDeDia`
   arma el string con `getFullYear`/`getMonth`/`getDate` y **jamás con
   `toISOString()`**, que devuelve el día en UTC y se equivoca en el mismo
   sentido. Las dos son tres líneas y las dos tienen su caso en el test. */

import { diasDeMes, primeroDelMes } from './mes.js';

const dos = (n) => String(n).padStart(2, '0');

/**
 * El ISO de un día, por componentes LOCALES.
 *
 * Nunca `toISOString()`: eso pasa a UTC, y a las 21:00 de Montevideo el día
 * de UTC ya es el siguiente. Un calendario que devuelve el día de mañana al
 * apretar el de hoy es exactamente el bug con el que el gate de esta casa corre
 * con `TZ=America/Montevideo`.
 */
export function isoDeDia(fecha) {
  return `${String(fecha.getFullYear()).padStart(4, '0')}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/**
 * El día de un ISO, con el constructor de componentes.
 *
 * `null` si no es una fecha completa — el campo puede tener media fecha escrita
 * mientras alguien teclea, y eso no es un día.
 */
export function diaDeIso(iso) {
  const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return p ? new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3])) : null;
}

/**
 * ¿Ese día se puede elegir? `min` y `max` son ISO e **inclusivos los dos**, que
 * es lo que significan en el `<input type="date">` que esto reemplaza.
 *
 * La comparación es de strings y no de fechas a propósito: en `YYYY-MM-DD` el
 * orden alfabético ES el orden cronológico, y comparar dos `Date` obliga a
 * construirlos, que es donde aparece el huso.
 */
export function esElegible(iso, min, max) {
  if (!iso) return false;
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}

/**
 * Correr el ancla de un mes, con el día 1 siempre puesto.
 *
 * Va por el constructor de componentes —`new Date(anio, mes + pasos, 1)`, que
 * normaliza diciembre + 1 a enero del año siguiente— y no por aritmética de
 * strings, para no tener dos maneras de correr un mes en el mismo repo.
 */
export function correrMes(anclaIso, pasos) {
  const dia = diaDeIso(anclaIso);
  if (!dia) return anclaIso;
  return isoDeDia(new Date(dia.getFullYear(), dia.getMonth() + pasos, 1));
}

/** El día 1 del mes al que pertenece ese ISO. El ancla con la que se navega. */
export function anclaDelMes(iso) {
  const dia = diaDeIso(iso);
  return dia ? isoDeDia(primeroDelMes(dia)) : '';
}

/**
 * Qué mes se abre. Es la decisión de «qué pasa si falta este dato», y son
 * cuatro casos:
 *
 *   · hay fecha elegida → su mes, aunque quede fuera de `min`/`max`. Lo que ya
 *     está guardado se muestra: esconderlo haría creer que el campo está vacío;
 *   · no hay, y hoy entra en el rango → el mes de hoy, que es lo que casi
 *     siempre se quiere elegir;
 *   · no hay, y hoy quedó ANTES del mínimo → el mes del mínimo;
 *   · no hay, y hoy quedó DESPUÉS del máximo → el mes del máximo.
 *
 * Los dos últimos son el caso que se rompe solo: abrir en el mes de hoy cuando
 * hoy no se puede elegir deja una rejilla con los treinta y un días apagados, y
 * quien la ve piensa que el campo está roto en vez de buscar la flecha.
 */
export function mesQueAbre(valor, hoy, min, max) {
  if (diaDeIso(valor)) return anclaDelMes(valor);
  if (min && hoy < min) return anclaDelMes(min);
  if (max && hoy > max) return anclaDelMes(max);
  return anclaDelMes(hoy);
}

/**
 * ¿Queda algo hacia atrás? La flecha se apaga cuando el mes anterior entero
 * está fuera de rango — o sea cuando `min` cae dentro del mes que se está
 * mirando o después.
 *
 * Se mira contra el día 1 del mes visible y no contra `min` a secas: con
 * `min = 2026-08-14`, agosto todavía tiene días elegibles pero julio no tiene
 * ninguno, y la flecha hacia atrás no debe llevar a un mes muerto.
 */
export function hayMesAnterior(anclaIso, min) {
  return !min || min < anclaIso;
}

/** Lo mismo hacia adelante: se mira contra el último día del mes visible. */
export function hayMesSiguiente(anclaIso, max) {
  if (!max) return true;
  return max >= correrMes(anclaIso, 1);
}

/**
 * Las 42 casillas del mes, listas para dibujar y sin una cuenta adentro del
 * `.jsx`. Siempre 42 —seis filas— porque el alto del panel no puede cambiar al
 * pasar de mes: eso empuja lo que tenga debajo cada vez que alguien toca una
 * flecha. Es lo que `mes.js` ya garantiza.
 *
 * `primerDia` es 1 = lunes (ISO 8601, la convención de toda agenda del molde
 * y la de `extract(isodow)` en Postgres).
 */
export function casillasDeMes(anclaIso, { hoy = '', valor = '', min, max, primerDia = 1 } = {}) {
  const ancla = diaDeIso(anclaDelMes(anclaIso));
  if (!ancla) return [];
  return diasDeMes(ancla, primerDia).map((fecha) => {
    const iso = isoDeDia(fecha);
    return {
      iso,
      dia: fecha.getDate(),
      /* Los de relleno son días de verdad y se pueden elegir —apretar el 31 de
         julio desde la rejilla de agosto elige el 31 de julio—; van apagados,
         no muertos. Lo que `delMes` decide es el color, no el permiso. */
      delMes: fecha.getMonth() === ancla.getMonth() && fecha.getFullYear() === ancla.getFullYear(),
      esHoy: iso === hoy,
      elegido: iso === valor,
      elegible: esElegible(iso, min, max),
    };
  });
}
