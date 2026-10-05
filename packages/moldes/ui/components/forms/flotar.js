/* Dónde se dibuja una capa que flota colgada de un campo.

   ── El defecto que esto viene a arreglar ───────────────────────────────────
   El panel del `Selector` era `position: absolute` dentro del campo. Eso anda
   en una pantalla y **no anda dentro de un diálogo**: `Dialog` es una caja con
   `overflow: hidden` y un cuerpo con `overflowY: auto`, así que un desplegable
   abierto cerca del pie queda ATRAPADO adentro de la caja que scrollea — no
   flotando sobre ella. La Parte 0 de esta orden lo midió: **41 de las 78 piezas
   de chrome ajeno viven en archivos `Dialogo*`**, o sea que la mudanza entera de
   la orden pasa por aquí, y el caso peor ya existe hoy: un `SelectorConAlta` al
   pie de «Anotar una salida».

   La cura es sacar la capa del cuerpo que scrollea —un portal a `document.body`,
   con `position: fixed`— y ahí aparece la cuenta que este archivo resuelve:
   **al salir del flujo, la capa deja de saber dónde está.** Hay que decírselo, y
   decirlo mal se ve mal en un solo caso —el campo cerca del pie de la ventana—
   que es justo el que nadie prueba.

   ── Por qué es un archivo con test y no cuatro líneas en el `.jsx` ─────────
   Porque es una cuenta que se equivoca en silencio. Un panel de 15 rem abierto
   sobre un campo que tiene 120 px hasta el borde de la ventana no da error: se
   dibuja fuera de la pantalla y **la mitad de las opciones no existen** para
   quien lo está usando. Es del mismo linaje que `fecha.js` y `mes.js`: la parte
   que puede estar mal sin que nada falle vive suelta y probada. */

/** Lo que mide el panel cuando tiene lugar de sobra. 15 rem, como la lista del `Selector`. */
export const ALTO_MAXIMO = 240;

/** El aire que se le deja al borde de la ventana. Un panel pegado al canto se lee como cortado. */
export const MARGEN = 8;

/**
 * Hacia dónde abre la capa y cuánto puede medir.
 *
 * Las tres reglas, en este orden:
 *
 *   1. **si abajo entra entero, abre abajo.** Es lo que alguien espera de un
 *      desplegable, y cambiar de lado sin necesidad desorienta más que ayudar;
 *   2. **si no entra abajo, gana el lado con más espacio.** No «arriba siempre»:
 *      un campo en el medio de la ventana suele tener parecido de los dos lados,
 *      y voltearlo por diez píxeles es peor que dejarlo donde estaba;
 *   3. **el alto se recorta al espacio que hay**, nunca al revés. La lista ya
 *      scrollea sola; lo que no puede pasar es que se dibuje fuera de la
 *      ventana, porque ahí no scrollea nada y las opciones de abajo no existen.
 *
 * Todo en píxeles de ventana (`getBoundingClientRect` + `innerHeight`), que es
 * lo que `position: fixed` entiende.
 */
export function ubicarPanel({
  arribaDelCampo, abajoDelCampo, altoDeVentana,
  alto = ALTO_MAXIMO, margen = MARGEN,
}) {
  const espacioAbajo = altoDeVentana - abajoDelCampo - margen;
  const espacioArriba = arribaDelCampo - margen;
  const hacia = espacioAbajo >= alto || espacioAbajo >= espacioArriba ? 'abajo' : 'arriba';
  const disponible = hacia === 'abajo' ? espacioAbajo : espacioArriba;
  return { hacia, alto: Math.max(0, Math.min(alto, disponible)) };
}
