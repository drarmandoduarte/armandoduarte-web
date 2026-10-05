import React from 'react';
import { Field } from './Field.jsx';
import { Icon } from '../core/Icon.jsx';
import { conBarras, isoATexto, textoAIso } from './fecha.js';
import { CalendarioDeCampo, ANCHO_DEL_CALENDARIO } from './CalendarioDeCampo.jsx';
import { CapaFlotante } from './CapaFlotante.jsx';
import { isoDeDia } from './calendario.js';

/* La fecha, escrita como se escribe: dd/mm/aaaa, en los cuatro idiomas.

   REEMPLAZA AL `<input type=date>` NATIVO EN TODA LA APP. El nativo muestra el
   formato del idioma del NAVEGADOR, no del producto: el Chrome en inglés de
   El navegador decía «mm/dd/yyyy» en un formulario en español, sobre una fecha de
   nacimiento. No es un tema de gusto — es la diferencia entre el 8 de octubre
   y el 10 de agosto, y en una ficha eso no lo corrige nadie después.

   Hacia afuera es el mismo contrato que tenía el nativo: `value` y `onChange`
   hablan ISO (`2026-08-10`). Por eso reemplazarlo fue cambiar una línea en
   cada pantalla y ninguna consulta a la base.

   EL CALENDARIO TAMBIÉN ES DE LA CASA. Hasta entonces el botón
   abría el nativo con `showPicker()` sobre un input escondido, y **esta cabecera
   defendía esa decisión**: «una grilla de días no tiene formato ambiguo —el 8 de
   octubre está en la casilla del 8 de octubre en cualquier idioma—, así que ahí
   el nativo no molesta». Dirección revisó esa decisión y la cambió, y la línea se
   reescribe con el caso al lado: un argumento que se descarta se anota con su caso.

   El argumento era cierto sobre la AMBIGÜEDAD y falso sobre todo lo demás: lo
   que se abría era el «August 2026 · Clear · Today» en azul de sistema, con la
   tipografía del sistema operativo y sus dos botones en inglés, en el medio de
   un formulario en castellano. El mismo agujero que el kit ya tapó en el
   `<select>`. Y de paso se ganan tres cosas que el nativo no daba: el rango
   `min`/`max` dibujado (no solo validado), «Hoy» de un toque, y **«Quitar» donde
   la fecha es opcional** —el «Clear» del nativo aparecía también en las
   obligatorias, que es una promesa que el formulario no puede cumplir—.

   El panel flota con un portal (`CapaFlotante`): ocho de las dieciséis pantallas
   que usan este campo son diálogos, y un `Dialog` de la casa recorta lo que se
   le sale.

   Se emite ISO solo cuando lo escrito ES una fecha. Mientras alguien va por
   «10/0», el valor de arriba no se toca: un formulario que borra lo que había
   apenas se toca el campo es peor que uno que espera. */

/* Lo que el panel querría medir: cabecera, las iniciales, seis filas de 32, el
   pie y el aire. Si no entra, `flotar.js` lo recorta y la capa scrollea. */
const ALTO = 360;

export function CampoFecha({
  label, hint, error, required, disabled = false,
  value = '', onChange, min, max, id, calendarioLabel, idioma = 'es',
  /* Los cuatro textos del panel llegan juntos y no de a uno: son dieciséis
     pantallas, y cuatro props sueltas por pantalla son sesenta y cuatro líneas
     que dicen lo mismo. `packages/ui` no sabe de idiomas — quien dibuja los
     trae ya traducidos, como en `Selector` y en `MiniCalendario`. */
  textos = {},
  style, containerStyle, ...rest
}) {
  const [foco, setFoco] = React.useState(false);
  const [abierto, setAbierto] = React.useState(false);
  const [texto, setTexto] = React.useState(() => isoATexto(value));
  const caja = React.useRef(null);
  const panel = React.useRef(null);
  const autoId = React.useId();
  const campoId = id || autoId;

  /* El valor puede cambiar desde afuera —al abrir el diálogo con otra ficha, o
     al elegir en el calendario—. Se relee solo cuando ese ISO no es el que ya
     está escrito: si no, reformatearía el texto debajo del cursor. */
  React.useEffect(() => {
    if (textoAIso(texto) !== (value || '')) setTexto(isoATexto(value));
    // `texto` a propósito fuera de las dependencias: esto reacciona a lo que
    // llega de afuera, no a cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  /* Cerrar al tocar afuera. Va por `mousedown` en el documento y no por `blur`
     del campo, y la razón es el portal: el panel NO es descendiente del campo en
     el DOM, así que un `blur` que mirara `contains` cerraría el calendario en el
     primer clic sobre un día. Se pregunta por los dos nodos, que es lo que
     «afuera» significa aquí. */
  React.useEffect(() => {
    if (!abierto) return undefined;
    const alTocar = (e) => {
      const dentroDelCampo = caja.current && caja.current.contains(e.target);
      const dentroDelPanel = panel.current && panel.current.contains(e.target);
      if (!dentroDelCampo && !dentroDelPanel) setAbierto(false);
    };
    document.addEventListener('mousedown', alTocar);
    return () => document.removeEventListener('mousedown', alTocar);
  }, [abierto]);

  const escribir = (crudo) => {
    const conFormato = conBarras(crudo);
    setTexto(conFormato);
    const iso = textoAIso(conFormato);
    if (iso !== null && onChange) onChange(iso);
  };

  const elegir = (iso) => {
    setTexto(isoATexto(iso));
    if (onChange) onChange(iso);
    setAbierto(false);
  };

  const quitar = () => {
    setTexto('');
    if (onChange) onChange('');
    setAbierto(false);
  };

  /* Hoy se calcula aquí y no adentro del calendario: la cuenta no lee el reloj,
     y así el guardián puede dibujar el panel en cualquier día sin viajar en el
     tiempo. */
  const hoy = isoDeDia(new Date());

  return React.createElement(Field, { label, hint, error, required, htmlFor: campoId, style: containerStyle },
    React.createElement('div', {
      ref: caja,
      style: { position: 'relative', display: 'flex', alignItems: 'center' },
    },
      React.createElement('input', {
        id: campoId, type: 'text', inputMode: 'numeric', autoComplete: 'off',
        placeholder: 'dd/mm/aaaa', disabled, value: texto,
        onChange: (e) => escribir(e.target.value),
        onFocus: () => setFoco(true), onBlur: () => setFoco(false),
        style: {
          width: '100%', minHeight: 'var(--control-h)',
          padding: '0 34px 0 var(--space-5)',
          background: disabled ? 'var(--surface-2)' : 'var(--surface)',
          color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
          fontVariantNumeric: 'tabular-nums',
          border: 'var(--border-w) solid ' + (error ? 'var(--danger)' : (foco || abierto) ? 'var(--primary)' : 'var(--border-strong)'),
          borderRadius: 'var(--radius-campo)', outline: 'none',
          transition: 'border-color var(--dur-fast) var(--ease-standard)',
          cursor: disabled ? 'not-allowed' : undefined,
          ...style,
        },
        ...rest,
      }),

      React.createElement('button', {
        type: 'button', disabled, onClick: () => setAbierto((a) => !a),
        'aria-label': calendarioLabel, title: calendarioLabel,
        'aria-expanded': abierto ? 'true' : 'false',
        style: {
          position: 'absolute', right: 'var(--space-4)', display: 'flex',
          alignItems: 'center', background: 'none', border: 'none', padding: 0,
          color: abierto ? 'var(--primary-text)' : 'var(--text-3)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        },
      }, React.createElement(Icon, { name: 'calendar', size: 14 })),

      React.createElement(CapaFlotante, {
        /* El `ref` va a la capa entera y no a un `div` de adentro: el borde y la
           barra de la capa también son «adentro» para el clic que cierra. */
        ref: panel,
        abierta: abierto && !disabled, ancla: caja, ancho: ANCHO_DEL_CALENDARIO, alto: ALTO,
      },
        React.createElement(CalendarioDeCampo, {
          valor: value || '', hoy, min, max, idioma,
          onElegir: elegir,
          /* «Quitar» SOLO donde la fecha es opcional — decisión de dirección. Un
             campo opcional sin manera de vaciarse es una promesa al revés; uno
             obligatorio con un «Quitar» es la promesa contraria. */
          onQuitar: required ? undefined : quitar,
          onCerrar: () => setAbierto(false),
          label: calendarioLabel,
          hoyEtiqueta: textos.hoy,
          quitarEtiqueta: textos.quitar,
          mesAnteriorEtiqueta: textos.mesAnterior,
          mesSiguienteEtiqueta: textos.mesSiguiente,
        })),
    ),
  );
}
