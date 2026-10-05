import React from 'react';
import { Input } from './Input.jsx';
import { conDosPuntos, horaATexto, textoAHora } from './hora.js';

/* La hora, escrita como se escribe: hh:mm en 24 h, en los cuatro idiomas.

   REEMPLAZA AL `<input type=time>` NATIVO EN TODA LA APP
   chrome ajeno que quedaba junto al `datetime-local` de Consulta. El nativo
   dibuja el reloj del idioma del NAVEGADOR, no del producto: en un Chrome en
   inglés el campo se parte en tres casillas —hora, minutos y un AM/PM— sobre un
   formulario en castellano donde el resto del día está en 24 h. Y trae una
   trampa que la fecha no tenía: **«02:30» sin ese AM/PM son dos horas
   distintas**, y en la franja de disponibilidad de un profesional eso es la
   diferencia entre abrir de madrugada y abrir después de comer.

   Hacia afuera es el mismo contrato que tenía el nativo: `value` y `onChange`
   hablan `HH:MM`. Por eso reemplazarlo fue cambiar una línea en cada pantalla y
   ninguna consulta a la base.

   ── POR QUÉ NO TIENE PANEL, Y ES DELIBERADO ────────────────────────────────
   El calendario de campo existe porque una fecha trae una pregunta que el
   teclado no contesta: «¿qué martes?». Una hora no tiene esa pregunta —quien
   pone una franja de 09:00 a 13:00 ya sabe los cuatro dígitos— y un desplegable
   de horas obliga a elegir el paso: cada 15 minutos deja fuera el turno de las
   09:20, y cada 5 son 288 renglones para escribir cuatro teclas.

   Así que el reloj propio es una máscara y nada más, y por eso son setenta
   líneas y no trescientas. Dirección avisó al aprobar los relojes: «si el reloj
   propio crece más de lo que parece, freno propio». No creció.

   ── Y POR QUÉ SE APOYA EN `Input` ──────────────────────────────────────────
   No repite el bloque de estilo del campo: lo usa. En un formulario todos los
   campos visten igual —regla de la casa—, y un segundo bloque de borde, foco y
   fondo copiado aquí sería el que se olvide de cambiar el día que el primero
   cambie. Lo único propio es la máscara, que es lo único propio que hay.

   No emite nada hasta que lo escrito ES una hora. Mientras alguien va por «1»,
   el valor de arriba no se toca: un formulario que borra lo que había apenas se
   toca el campo es peor que uno que espera. */

export function CampoHora({ value = '', onChange, disabled = false, style, ...rest }) {
  const [texto, setTexto] = React.useState(() => horaATexto(value));

  /* El valor puede cambiar desde afuera —al abrir el diálogo con otro turno, o
     porque mover el inicio arrastró el fin—. Se relee solo cuando ese `HH:MM`
     no es el que ya está escrito: si no, reformatearía el texto debajo del
     cursor. Es el mismo efecto que `CampoFecha`, y por la misma razón. */
  React.useEffect(() => {
    if (textoAHora(texto) !== (value || '')) setTexto(horaATexto(value));
    // `texto` a propósito fuera de las dependencias: esto reacciona a lo que
    // llega de afuera, no a cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const escribir = (crudo) => {
    const conFormato = conDosPuntos(crudo);
    setTexto(conFormato);
    const hora = textoAHora(conFormato);
    if (hora !== null && onChange) onChange(hora);
  };

  return React.createElement(Input, {
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'off',
    placeholder: 'hh:mm',
    disabled,
    value: texto,
    onChange: (e) => escribir(e.target.value),
    /* `tnum` porque son cifras que se comparan: la columna de «desde» de tres
       franjas apiladas tiene que alinear los dos puntos. */
    style: { fontVariantNumeric: 'tabular-nums', ...style },
    ...rest,
  });
}
