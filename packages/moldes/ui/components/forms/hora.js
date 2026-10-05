/* La cuenta de la hora, sola y sin pantalla.

   El molde escribe y lee horas en 24 h (`09:30`, `14:00`) porque es lo que guarda
   Postgres en una columna `time`, lo que ordena bien como texto y lo que dibuja
   la grilla de la Agenda. Y es lo que se escribe en los cuatro idiomas del
   producto: el negocio que abre a las dos de la tarde lo tiene anotado como
   14:00 en la puerta.

   El `<input type=time>` nativo, que es lo que había, dibuja el reloj del
   IDIOMA DEL NAVEGADOR y no del producto: en un Chrome en inglés el mismo campo
   se parte en tres casillas —hora, minutos y un AM/PM— sobre un formulario en
   castellano donde el resto del día está en 24 h. Es el mismo agujero que la
   kit tapó en el `<select>` y en el calendario, y aquí tiene además una
   trampa propia: **«02:30» sin el AM/PM es dos horas distintas**, y en la franja
   de disponibilidad de un profesional eso es la diferencia entre abrir de
   madrugada y abrir después de comer.

   Estas cuatro funciones son puras a propósito: son la parte que puede estar
   mal en silencio, y por eso están aquí y no adentro del componente. Son las
   hermanas de `fecha.js`, y se escriben igual porque hacen lo mismo. */

/**
 * Lo guardado a lo que se lee: `09:30` → `09:30`. Vacío devuelve vacío.
 *
 * Y `09:30:00` → `09:30`, que es la forma en que una columna `time` de Postgres
 * vuelve del servidor. Hoy `equipo/datos.ts` ya la corta antes de llegar aquí,
 * pero el campo no puede depender de que **todas** las puertas de datos se
 * acuerden: la que se olvide mostraría un campo vacío sobre un dato que existe,
 * que es la peor manera de perder una hora cargada.
 */
export function horaATexto(valor) {
  const p = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(String(valor || ''));
  return p ? `${p[1]}:${p[2]}` : '';
}

/** ¿Existe esa hora en el reloj? `24:00` no existe, y `09:60` tampoco. */
export function esHoraReal(hora, minuto) {
  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
}

/**
 * Lo que se lee a `HH:MM`. Devuelve `null` si todavía no es una hora
 * —incompleta, o una que el reloj no tiene—, y `''` si está vacío.
 *
 * `null` y `''` son distintos a propósito, igual que en `fecha.js`: vacío es «no
 * hay hora», que es un estado legítimo; `null` es «lo que hay escrito no sirve
 * todavía», y el componente lo usa para no borrar el valor mientras alguien
 * escribe. Quien va por «1» no quiso decir la una de la mañana.
 */
export function textoAHora(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return '';
  const p = /^(\d{1,2}):(\d{2})$/.exec(limpio);
  if (!p) return null;
  const hora = Number(p[1]);
  const minuto = Number(p[2]);
  if (!esHoraReal(hora, minuto)) return null;
  return `${String(hora).padStart(2, '0')}:${p[2]}`;
}

/**
 * Los dos puntos se ponen solos mientras se teclea: `0930` → `09:30`.
 *
 * Solo agrega; nunca quita ni corrige. Quien está borrando con la tecla de
 * retroceso tiene que poder pasar por encima de los dos puntos sin que el campo
 * se los vuelva a poner delante del cursor — por eso se corta en los dígitos
 * que haya y no se completa nada.
 */
export function conDosPuntos(texto) {
  const digitos = String(texto || '').replace(/\D/g, '').slice(0, 4);
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4)];
  return partes.filter((x) => x.length > 0).join(':');
}
