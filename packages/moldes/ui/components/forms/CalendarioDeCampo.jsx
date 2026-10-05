import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { inicialesDeSemana } from './mes.js';
import {
  anclaDelMes, casillasDeMes, correrMes, diaDeIso, esElegible,
  hayMesAnterior, hayMesSiguiente, mesQueAbre,
} from './calendario.js';

/* El calendario de la casa, el que cuelga de un campo.

   ── Qué reemplaza ──────────────────────────────────────────────────────────
   `CampoFecha` ya había reemplazado el CAMPO antes: se escribe
   dd/mm/aaaa en los cuatro idiomas y se emite ISO. Lo que quedaba del navegador
   era el calendario: el botón llamaba a `showPicker()` sobre un `<input
   type="date">` escondido, y lo que se abría era el **«August 2026 · Clear ·
   Today» en azul de sistema**, en el idioma del navegador y no en el del
   producto. Una línea de código, dieciséis pantallas.

   Y la cabecera de `CampoFecha` ARGUMENTABA que ahí el nativo estaba bien —«una
   grilla de días no tiene formato ambiguo… ahí el nativo no molesta»—. Es una
   decisión escrita; dirección la revisó y la cambió, y por eso se reescribe con
   el caso al lado (un argumento que se descarta se anota con su caso): era cierto sobre
   la AMBIGÜEDAD y falso sobre lo demás. Un panel del sistema operativo en el
   medio de una pantalla quiet luxury es el mismo agujero que el kit ya tapó en el
   `<select>` — gris, con su tipografía, con sus dos botones en inglés.

   ── EL NOMBRE DICE CUÁL DE LOS DOS ES ─────────────────────────────────────
   `CalendarioDeCampo` y no `Calendario` a secas, y no es un capricho: la casa
   tiene dos y el nombre genérico obliga a abrir el archivo para saber cuál.
   Este cuelga de un campo; el de la Agenda (`MiniCalendario`) vive al costado.
   Además `calendario.js` —la cuenta— ya ocupa ese nombre, y en un disco que no
   distingue mayúsculas `Calendario.d.ts` y `calendario.d.ts` son EL MISMO
   ARCHIVO: escribir uno borra el otro sin decir nada, y en Linux, donde son
   dos, la mitad de los tipos aparece bajo el nombre equivocado.

   ── NO SE REFUNDE CON `MiniCalendario`, y no es por estética ───────────────
   Son dos oficios. El mini de la Agenda **navega sin elegir** —se pasa a
   octubre para mirar y la agenda no se mueve, tiene el puntito de «este día
   tiene turnos», vive siempre visible al costado—; este **elige y se va**,
   colgado de un campo. Refundirlos daría un componente con dos modos que se
   separan en el primer arreglo.
   Lo que sí comparten es `mes.js`, que es donde vive lo que se puede equivocar:
   se comparte el saber, no el dibujo.

   ── Y COMPARTEN EL VOCABULARIO DE ESTADO, que es otra cosa ─────────────────
   Hoy va en el aviso suave y lo elegido en anillo el acento, igual que en el mini. No
   es copiar el dibujo: es que **el mismo estado no puede decirse de dos maneras
   en la misma app**. El relleno sólido el acento está descartado por la misma
   razón que allá — el botón primario del formulario que abre este calendario ya
   es sólido, y dos rellenos sólidos compitiendo rompen la regla de color.

   ── Todo hacia afuera es ISO ───────────────────────────────────────────────
   `valor`, `hoy`, `min`, `max` y lo que emite `onElegir` son `YYYY-MM-DD`. La
   cuenta —qué mes abre, qué día se puede apretar, qué flecha se apaga— vive en
   `calendario.js` con su test; aquí solo se dibuja y se escuchan teclas. */

/** Lado de la casilla. Más chico que el mínimo cómodo de un dedo no baja. */
const LADO = 32;
/** Siete columnas, el aire de los costados y el borde. Lo que la capa mide de ancho. */
export const ANCHO_DEL_CALENDARIO = LADO * 7 + 24;

export function CalendarioDeCampo({
  valor = '', hoy = '', min, max, idioma = 'es',
  onElegir, onQuitar, onCerrar,
  label, hoyEtiqueta, quitarEtiqueta, mesAnteriorEtiqueta, mesSiguienteEtiqueta,
  style, ...rest
}) {
  const abre = React.useMemo(() => mesQueAbre(valor, hoy, min, max), [valor, hoy, min, max]);
  const [mes, setMes] = React.useState(abre);

  /* El día que tiene el foco dentro de la rejilla. Arranca en lo elegido; si no
     hay nada elegido, en hoy cuando hoy cae en el mes que se abrió; si tampoco,
     en el 1. Quien entra con el teclado tiene que caer parado en algo que
     signifique algo, y en un mes que no es el de hoy «hoy» no significa nada. */
  const [activo, setActivo] = React.useState(() => {
    if (diaDeIso(valor)) return valor;
    if (diaDeIso(hoy) && anclaDelMes(hoy) === abre) return hoy;
    return abre;
  });

  const rejilla = React.useRef(null);
  const casillas = React.useMemo(
    () => casillasDeMes(mes, { hoy, valor, min, max }),
    [mes, hoy, valor, min, max],
  );

  const nombreDeDia = React.useMemo(
    () => new Intl.DateTimeFormat(idioma, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [idioma],
  );

  /* Seis filas de siete. La rejilla es `role="grid"` de verdad —con sus filas—
     y no cuarenta y dos botones sueltos: un lector de pantalla anuncia «fila 3,
     columna 5» y eso es la mitad de lo que hace usable un calendario sin ver. */
  const filas = React.useMemo(() => {
    const conNombre = casillas.map((c) => {
      const d = diaDeIso(c.iso);
      return { ...c, etiqueta: d ? nombreDeDia.format(d) : c.iso };
    });
    return Array.from({ length: 6 }, (_, f) => conNombre.slice(f * 7, f * 7 + 7));
  }, [casillas, nombreDeDia]);

  /* El foco sigue al día activo. Va en un efecto y no en el `onKeyDown` porque
     el botón al que hay que ir puede no existir todavía cuando la tecla cambió
     de mes: primero se dibuja el mes nuevo, después se enfoca. */
  React.useEffect(() => {
    const nodo = rejilla.current && rejilla.current.querySelector(`[data-iso="${activo}"]`);
    if (nodo && nodo.focus) nodo.focus({ preventScroll: true });
  }, [activo, mes]);

  const irA = (iso) => {
    setActivo(iso);
    if (anclaDelMes(iso) !== mes) setMes(anclaDelMes(iso));
  };

  const correr = (pasos) => {
    const nuevo = correrMes(mes, pasos);
    setMes(nuevo);
    /* El día activo se muda al mes nuevo conservando el número, y se pega al
       último cuando ese día no existe —del 31 de enero a febrero—. Sin esto, la
       flecha deja el foco en un botón que ya no está y el teclado se muere. */
    const dia = diaDeIso(activo);
    const cuantos = casillasDeMes(nuevo).filter((c) => c.delMes).length;
    const numero = dia ? Math.min(dia.getDate(), cuantos) : 1;
    setActivo(`${nuevo.slice(0, 8)}${String(numero).padStart(2, '0')}`);
  };

  const teclado = (e) => {
    const paso = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (paso !== undefined) {
      e.preventDefault();
      const dia = diaDeIso(activo);
      if (!dia) return;
      const movido = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + paso);
      irA(`${movido.getFullYear()}-${String(movido.getMonth() + 1).padStart(2, '0')}-${String(movido.getDate()).padStart(2, '0')}`);
      return;
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      correr(e.key === 'PageUp' ? -1 : 1);
      return;
    }
    if (e.key === 'Escape' && onCerrar) {
      e.preventDefault();
      onCerrar();
    }
  };

  const titulo = React.useMemo(() => {
    const crudo = new Intl.DateTimeFormat(idioma, { month: 'long', year: 'numeric' })
      .format(diaDeIso(mes) || new Date());
    /* Mayúscula inicial a mano y NO con `text-transform: capitalize`, que fue el
       defecto que ya se pagó una vez: en castellano el formato largo es «agosto de
       2026» y `capitalize` lo deja en «Agosto De 2026». */
    return crudo.charAt(0).toUpperCase() + crudo.slice(1);
  }, [idioma, mes]);

  const iniciales = React.useMemo(() => inicialesDeSemana(idioma), [idioma]);
  const atras = hayMesAnterior(mes, min);
  const adelante = hayMesSiguiente(mes, max);

  const flecha = (icono, etiqueta, pasos, viva) => React.createElement('button', {
    type: 'button', onClick: () => correr(pasos), disabled: !viva,
    'aria-label': etiqueta, title: etiqueta,
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '24px', height: '24px', padding: 0, border: 'none',
      borderRadius: 'var(--radius-pill)', background: 'transparent',
      color: viva ? 'var(--text-3)' : 'var(--border-strong)',
      cursor: viva ? 'pointer' : 'not-allowed',
      transition: 'background var(--dur-fast) var(--ease-standard)',
    },
  }, React.createElement(Icon, { name: icono, size: 14 }));

  const alPie = (etiqueta, alTocar, apagado) => React.createElement('button', {
    type: 'button', onClick: alTocar, disabled: apagado,
    style: {
      border: 'none', background: 'transparent', padding: 'var(--space-2) var(--space-3)',
      borderRadius: 'var(--radius-sm)',
      color: apagado ? 'var(--text-3)' : 'var(--primary-text)',
      fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      cursor: apagado ? 'not-allowed' : 'pointer',
    },
  }, etiqueta);

  return React.createElement('div', {
    role: 'dialog', 'aria-label': label, 'aria-modal': 'false',
    onKeyDown: teclado,
    style: { padding: 'var(--space-4)', userSelect: 'none', ...style },
    ...rest,
  },
    React.createElement('div', {
      key: 'cabecera',
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 'var(--space-2)', marginBottom: 'var(--space-3)',
      },
    },
      React.createElement('span', {
        'aria-live': 'polite',
        style: {
          fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-semibold)', color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        },
      }, titulo),
      React.createElement('div', { style: { display: 'flex', flex: '0 0 auto' } },
        flecha('chevron-left', mesAnteriorEtiqueta, -1, atras),
        flecha('chevron-right', mesSiguienteEtiqueta, 1, adelante)),
    ),

    React.createElement('div', {
      key: 'iniciales', 'aria-hidden': true,
      style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' },
    }, iniciales.map((inicial, i) => React.createElement('span', {
      key: i,
      style: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: '20px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xs)',
        textTransform: 'uppercase', color: 'var(--text-3)',
      },
    }, inicial))),

    React.createElement('div', {
      key: 'dias', ref: rejilla, role: 'grid', 'aria-label': label,
      style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' },
    }, filas.map((fila, f) => React.createElement('div', {
      key: `f${f}`, role: 'row',
      /* `display: contents` deja que las siete casillas caigan en la rejilla del
         padre: la fila existe para el lector de pantalla y no dibuja nada. */
      style: { display: 'contents' },
    }, fila.map((casilla) => React.createElement('button', {
      key: casilla.iso,
      'data-iso': casilla.iso,
      type: 'button',
      role: 'gridcell',
      disabled: !casilla.elegible,
      /* Roving tabindex: un solo botón de los cuarenta y dos entra en el orden
         de tabulación. Con los cuarenta y dos dentro, salir del calendario con
         Tab serían cuarenta y dos tabulaciones. */
      tabIndex: casilla.iso === activo ? 0 : -1,
      onClick: () => onElegir && onElegir(casilla.iso),
      'aria-label': casilla.etiqueta,
      'aria-current': casilla.esHoy ? 'date' : undefined,
      'aria-selected': casilla.elegido ? 'true' : undefined,
      style: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: `${LADO}px`, height: `${LADO}px`, margin: '0 auto', padding: 0,
        borderRadius: 'var(--radius-pill)',
        border: 'var(--border-w) solid ' + (casilla.elegido ? 'var(--primary)' : 'transparent'),
        background: casilla.esHoy ? 'var(--warning-soft)' : 'transparent',
        /* Un día fuera de `min`/`max` se ve y no se aprieta: esconderlo dejaría
           un hueco en la rejilla y el mes dejaría de leerse como un mes. */
        color: !casilla.elegible ? 'var(--text-3)'
          : casilla.esHoy ? 'var(--warning-text)'
            : casilla.delMes ? 'var(--text)' : 'var(--text-3)',
        opacity: casilla.elegible ? 1 : 0.45,
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
        fontWeight: casilla.esHoy || casilla.elegido
          ? 'var(--weight-semibold)' : 'var(--weight-regular)',
        fontVariantNumeric: 'tabular-nums',
        cursor: casilla.elegible ? 'pointer' : 'not-allowed',
        transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      },
    }, casilla.dia))))),

    /* El pie. «Hoy» siempre —es el atajo que se usa todos los días— y se apaga
       si hoy no entra en el rango, en vez de desaparecer: un botón que a veces
       está y a veces no obliga a buscarlo cada vez.
       «Quitar» SOLO donde la fecha es opcional, y es decisión de dirección: un
       campo opcional sin manera de vaciarse es una promesa al revés. Donde la
       fecha es obligatoria no se dibuja, porque no habría con qué cumplirlo. */
    React.createElement('div', {
      key: 'pie',
      style: {
        display: 'flex', alignItems: 'center',
        justifyContent: onQuitar ? 'space-between' : 'flex-end',
        gap: 'var(--space-2)', marginTop: 'var(--space-3)',
        paddingTop: 'var(--space-3)',
        borderTop: 'var(--border-w) solid var(--border)',
      },
    },
      onQuitar && alPie(quitarEtiqueta, () => onQuitar(), false),
      alPie(hoyEtiqueta, () => onElegir && onElegir(hoy), !esElegible(hoy, min, max)),
    ),
  );
}
