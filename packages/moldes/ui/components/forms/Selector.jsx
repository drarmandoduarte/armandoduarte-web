import React from 'react';
import { createPortal } from 'react-dom';
import { Field } from './Field.jsx';
import { Icon } from '../core/Icon.jsx';
import { filtrarOpciones, opcionDe } from './buscar.js';
import { aplanarOpciones, modoDeSeleccion, segmentarPorGrupo } from './opciones.js';
import { ubicarPanel } from './flotar.js';

/* EL SELECTOR DE LA CASA.

   LO QUE VINO A REEMPLAZAR: `Select` era un `<select>` del navegador con la caja
   vestida. La caja cerrada se veía como el kit y **la lista que se abría la dibujaba
   el sistema operativo**: gris, con su tipografía, sin poder describir una
   opción en dos líneas y sin poder escribir para buscar. En una pantalla quiet
   luxury eso es un agujero por el que se ve el escritorio.

   Está en pasado porque se enterró junto con `ComboSugerido`: se mudaron sus
   50 usos, en dos tandas, y ninguna de las dos
   piezas existe ya. `censo.test.tsx` es lo que no las deja volver.

   DOS MODOS Y UNA SOLA PIEZA. El modo lo decide el tamaño de la lista
   (`modoDeSeleccion`, con test): hasta siete opciones, desplegable; de ahí en
   adelante, se escribe y filtra. **Es una sola pieza a propósito**: dos
   componentes que hacen lo mismo con distinta ropa se separan en el primer
   arreglo, y quien migra una pantalla no tiene que decidir cuál usar.

   ABSORBE A `ComboBuscador`, y esa fue la decisión aprobada: el modo de búsqueda
   ES su comportamiento —lo tecleado vive en el componente, el efecto que
   sincroniza el valor de afuera está condicionado a `!abierto` para que nadie
   pierda letras, el foco se vigila con `relatedTarget` porque un clic en un
   renglón pasa por el `blur` del campo— más los grupos, que allá no existían.

   ACCESIBLE DE VERDAD, que es el punto 4 de la orden y no un adorno:
   - se abre y se recorre solo con teclado (flechas, Inicio, Fin, Enter, Escape);
   - el foco se ve siempre: el disparador toma el borde el acento, y la opción
     activa se marca con superficie —nunca con color solo—;
   - el lector de pantalla anuncia la opción activa con `aria-activedescendant`,
     que es lo único que funciona cuando el foco se queda en el disparador y lo
     que se mueve es la selección;
   - los grupos son `role="group"` con su nombre, no encabezados sueltos.

   LA LISTA SALE DE LA CAJA QUE SCROLLEA.
   Hasta entonces el panel era `position: absolute` dentro del campo, y eso anda
   en una pantalla y **no anda dentro de un diálogo**: `Dialog` es una caja con
   `overflow: hidden` y un cuerpo con `overflowY: auto`, así que una lista
   abierta cerca del pie quedaba ATRAPADA adentro de la caja que scrollea. No es
   un caso raro: la Parte 0 midió que **41 de las 78 piezas que esta orden viene
   a reemplazar viven en archivos `Dialogo*`**, y el caso peor ya existía —un
   `SelectorConAlta` al pie de «Anotar una salida»—.
   Así que la lista se dibuja con un portal a `document.body` y `position:
   fixed`. Lo que eso cuesta es que la capa deja de saber dónde está: se lo dice
   `flotar.js`, que decide de qué lado abre y cuánto puede medir, y se vuelve a
   medir mientras está abierta —al scrollear el cuerpo del diálogo, al cambiar
   el tamaño de la ventana— porque el campo se mueve y la capa ya no lo sigue
   sola. `SelectorConAlta` no se enteró: su bloque de alta sigue debajo del
   campo y adentro del diálogo, que es donde tiene que estar.

   CON `libre`, ACEPTA LO QUE LA LISTA NO TIENE. Es el `libre` de
   `ComboBuscador`, absorbido con lo demás: al salir del campo, lo escrito se
   guarda tal cual. El caso que lo manda es la especialidad de un externo —
   «fisiatría deportiva» vale aunque no esté en ninguna lista curada—. Sin
   `libre`, salir con media búsqueda restituye lo que estaba: un turno tiene que
   apuntar a una ficha real. */

/** Cuántos renglones se dibujan en el modo de búsqueda. Corta el DOM, no la búsqueda. */
const TOPE_VISIBLE = 50;

/* La escalera de capas de la casa, que no tiene tokens y por eso se escribe:
   40 es lo que flota anclado a su campo, 50 el tooltip, 60 el velo del diálogo.
   La lista tiene que quedar POR ENCIMA del velo, porque desde que se dibuja con
   un portal ya no es hija del diálogo: si valiera 40, un desplegable abierto
   dentro de un diálogo se dibujaría debajo del velo. */
const CAPA = 70;

/* En el servidor no hay medidas que tomar, y `useLayoutEffect` avisa por consola
   si se lo llama ahí. El guardián de este componente lo dibuja con
   `react-dom/server`, así que la advertencia sería de todos los días. */
const efectoDeMedida = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export function Selector({
  label, hint, error, required, options = [], groups, value = '', onChange,
  placeholder, buscable, libre = false, libreEtiqueta,
  buscarPlaceholder, vacioTexto, sinOpcionesTexto, ayudaTope,
  id, disabled = false, style, containerStyle, 'aria-label': ariaLabel, ...rest
}) {
  const autoId = React.useId();
  const campoId = id || autoId;
  const listaId = `${campoId}-lista`;

  const todas = React.useMemo(() => aplanarOpciones(options, groups), [options, groups]);
  const modo = modoDeSeleccion(todas.length, buscable, libre);
  const conBusqueda = modo === 'busqueda';

  const elegida = opcionDe(todas, value);
  /* Lo que el campo muestra cuando nadie lo está escribiendo. Con `libre`, el
     valor puede no estar en la lista y es igual de válido: se muestra tal cual. */
  const textoDeReposo = elegida ? elegida.label : (libre ? value : '');

  const [abierto, setAbierto] = React.useState(false);
  const [texto, setTexto] = React.useState('');
  const [activo, setActivo] = React.useState(0);
  const [foco, setFoco] = React.useState(false);
  /* Dónde va la capa, en píxeles de ventana. `null` mientras no se midió: la
     lista no se dibuja sin medida, porque dibujarla en 0,0 y corregirla después
     es un salto que se ve. */
  const [ubicacion, setUbicacion] = React.useState(null);
  const caja = React.useRef(null);
  const lista = React.useRef(null);

  /* La medida es del CAMPO, no de la lista: `caja` envuelve solo el campo desde
     que la lista se fue al portal. */
  const medir = React.useCallback(() => {
    const nodo = caja.current;
    if (!nodo || typeof window === 'undefined') return;
    const r = nodo.getBoundingClientRect();
    const { hacia, alto } = ubicarPanel({
      arribaDelCampo: r.top, abajoDelCampo: r.bottom, altoDeVentana: window.innerHeight,
    });
    setUbicacion({
      hacia, alto, izquierda: r.left, ancho: r.width,
      arriba: r.top, abajo: r.bottom, altoDeVentana: window.innerHeight,
    });
  }, []);

  /* Mientras está abierta hay que volver a medir, y el `scroll` va en CAPTURA a
     propósito: lo que mueve el campo dentro de un diálogo es el scroll del
     cuerpo del diálogo, que es un `div` y no la ventana — un `scroll` sin
     captura en `window` no se entera de ese. */
  efectoDeMedida(() => {
    if (!abierto) { setUbicacion(null); return undefined; }
    medir();
    window.addEventListener('scroll', medir, true);
    window.addEventListener('resize', medir);
    return () => {
      window.removeEventListener('scroll', medir, true);
      window.removeEventListener('resize', medir);
    };
  }, [abierto, medir]);

  /* El valor puede cambiar desde afuera —al abrir el diálogo sobre otra fila, al
     restaurar un borrador—. Mientras está abierto no se toca: reformatearía el
     campo debajo del cursor de quien está escribiendo. */
  React.useEffect(() => {
    if (!abierto) setTexto('');
  }, [value, abierto]);

  const visibles = React.useMemo(() => {
    if (!abierto) return [];
    if (!conBusqueda) return todas;
    return filtrarOpciones(todas, texto, TOPE_VISIBLE);
  }, [abierto, conBusqueda, todas, texto]);

  const hayMas = abierto && conBusqueda
    && filtrarOpciones(todas, texto).length > visibles.length;

  const tramos = React.useMemo(() => segmentarPorGrupo(visibles), [visibles]);

  /* La opción activa se mantiene a la vista: sin esto, bajar con la flecha en una
     lista de doscientas mueve la selección fuera de la caja y el foco parece
     haberse perdido. */
  React.useEffect(() => {
    if (!abierto || !lista.current) return;
    const nodo = lista.current.querySelector(`[data-indice="${activo}"]`);
    if (nodo && nodo.scrollIntoView) nodo.scrollIntoView({ block: 'nearest' });
  }, [abierto, activo]);

  const abrir = () => {
    if (disabled) return;
    setAbierto(true);
    /* Con `libre` se abre con lo escrito puesto —se está editando un texto, y
       borrárselo al abrir sería tirar lo que hay—; sin `libre` se abre en
       blanco, que muestra la lista entera y deja escribir sin borrar antes. */
    setTexto(libre ? textoDeReposo : '');
    // Se abre parado en lo que ya está elegido, no en el primero: quien abre
    // para cambiar de opción tiene que ver dónde está antes de moverse.
    //
    // Y acotado a lo que se va a dibujar: en una lista de doscientas, la
    // elegida puede estar más allá del tope de renglones, y dejar la marca
    // apuntando a una opción que no existe en pantalla deja el Enter sin efecto
    // y al lector de pantalla sin nada que anunciar.
    const i = todas.findIndex((o) => o.value === value);
    const tope = conBusqueda ? TOPE_VISIBLE : todas.length;
    setActivo(i >= 0 && i < tope ? i : 0);
  };

  /**
   * Cerrar. `comprometer` decide qué pasa con lo tecleado que no es ninguna
   * opción: al salir del campo (`true`) **con `libre` eso ES el valor** —así se
   * guarda una especialidad que la lista no tiene—; con Escape (`false`) se descarta,
   * porque Escape significa «no quise nada de esto».
   */
  const cerrar = (comprometer) => {
    setAbierto(false);
    const limpio = texto.trim();
    setTexto('');
    if (comprometer && libre && limpio !== value && onChange) onChange(limpio);
  };

  const elegir = (opcion) => {
    /* Una opción deshabilitada se ve y no se elige. Es para lo que existe pero
       todavía no se puede usar —un canal que llega en la próxima etapa— y por eso
       se muestra en vez de esconderse: esconderla no dice nada, y mostrarla
       apagada dice «esto va a estar». El freno vive aquí y no solo en el estilo,
       porque al teclado se llega igual. */
    if (opcion.disabled) return;
    cerrar(false);
    if (onChange) onChange(opcion.value);
  };

  const teclado = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) { abrir(); return; }
      const cuantas = visibles.length;
      if (cuantas === 0) return;
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      setActivo((i) => (i + paso + cuantas) % cuantas);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      if (!abierto) return;
      e.preventDefault();
      setActivo(e.key === 'Home' ? 0 : Math.max(visibles.length - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      // Solo se traga el Enter si hay algo que elegir: si no, el formulario
      // sigue enviándose como con cualquier campo.
      if (abierto && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]); }
      return;
    }
    if (e.key === ' ' && !conBusqueda) {
      // La barra abre y elige en un desplegable; en el modo de búsqueda es un
      // espacio y se escribe.
      e.preventDefault();
      if (!abierto) abrir();
      else if (visibles[activo]) elegir(visibles[activo]);
      return;
    }
    if (e.key === 'Escape' && abierto) {
      e.preventDefault();
      cerrar(false);
    }
  };

  /* El foco se va del disparador Y de la lista: hay que mirar a dónde fue antes
     de cerrar, porque un clic en un renglón pasa por el `blur` del disparador. */
  const salir = (e) => {
    setFoco(false);
    const destino = e.relatedTarget;
    if (destino && caja.current && caja.current.contains(destino)) return;
    cerrar(true);
  };

  const borde = error
    ? 'var(--danger)'
    : (foco || abierto) ? 'var(--primary)' : 'var(--border-strong)';

  const estiloCampo = {
    width: '100%', minHeight: 'var(--control-h)',
    padding: '0 30px 0 var(--space-5)',
    background: disabled ? 'var(--surface-2)' : 'var(--surface)',
    color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
    border: 'var(--border-w) solid ' + borde,
    borderRadius: 'var(--radius-campo)', outline: 'none',
    transition: 'border-color var(--dur-fast) var(--ease-standard)',
    cursor: disabled ? 'not-allowed' : conBusqueda ? undefined : 'pointer',
    ...style,
  };

  const comunes = {
    id: campoId,
    disabled,
    role: 'combobox',
    'aria-expanded': abierto ? 'true' : 'false',
    'aria-controls': listaId,
    'aria-haspopup': 'listbox',
    'aria-activedescendant': abierto && visibles[activo] ? `${listaId}-${activo}` : undefined,
    'aria-label': ariaLabel,
    onKeyDown: teclado,
    onFocus: () => setFoco(true),
  };

  const disparador = conBusqueda
    ? React.createElement('input', {
      ...comunes,
      type: 'text',
      autoComplete: 'off',
      'aria-autocomplete': 'list',
      // Cerrado muestra lo elegido; abierto, lo que se está escribiendo. El
      // placeholder cambia con eso: cerrado invita a elegir, abierto invita a
      // escribir.
      value: abierto ? texto : textoDeReposo,
      placeholder: abierto ? (buscarPlaceholder || placeholder) : placeholder,
      onChange: (e) => { setTexto(e.target.value); setAbierto(true); setActivo(0); },
      onClick: abrir,
      style: { ...estiloCampo, textAlign: 'left' },
      ...rest,
    })
    : React.createElement('button', {
      ...comunes,
      type: 'button',
      onClick: () => (abierto ? cerrar(false) : abrir()),
      style: { ...estiloCampo, textAlign: 'left' },
      ...rest,
    },
      React.createElement('span', {
        style: {
          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: elegida ? 'var(--text)' : 'var(--text-3)',
        },
      }, elegida ? elegida.label : (placeholder || '')));

  return React.createElement(Field, { label, hint, error, required, htmlFor: campoId, style: containerStyle },
    React.createElement('div', {
      ref: caja,
      style: { position: 'relative', minWidth: 0 },
      onBlur: salir,
    },
      React.createElement('div', {
        style: { position: 'relative', display: 'flex', alignItems: 'center' },
      },
        disparador,
        React.createElement('span', {
          style: {
            position: 'absolute', right: 'var(--space-5)', color: 'var(--text-3)',
            pointerEvents: 'none', display: 'flex',
          },
        }, React.createElement(Icon, { name: abierto ? 'chevron-up' : 'chevron-down', size: 14 })),
      ),

      /* La lista flota: es lo único de este campo que se superpone a lo de
         abajo, y por eso lleva la sombra de flotante —que en dark los tokens
         apagan y resuelven con superficie y borde—.

         Y se dibuja en `document.body`, fuera del cuerpo que scrollea. Sigue
         siendo hija de este componente en el árbol de React —los eventos suben
         por aquí, que es lo que hace que un clic adentro de la lista no se lea
         como un clic en el velo del diálogo—, pero en el DOM cuelga del `body`,
         que es lo único que la salva del `overflow: hidden` del diálogo.

         El aire contra el campo sigue siendo `--space-2`: se pega dentro de un
         `calc`, porque el token no se reemplaza por un número solo por haber
         pasado a píxeles de ventana. */
      abierto && ubicacion && typeof document !== 'undefined' && createPortal(React.createElement('div', {
        ref: lista,
        id: listaId,
        role: 'listbox',
        'aria-label': typeof label === 'string' ? label : ariaLabel,
        style: {
          position: 'fixed',
          left: `${ubicacion.izquierda}px`, width: `${ubicacion.ancho}px`,
          top: ubicacion.hacia === 'abajo'
            ? `calc(${ubicacion.abajo}px + var(--space-2))` : undefined,
          bottom: ubicacion.hacia === 'arriba'
            ? `calc(${ubicacion.altoDeVentana - ubicacion.arriba}px + var(--space-2))` : undefined,
          zIndex: CAPA, maxHeight: `${ubicacion.alto}px`, overflowY: 'auto',
          background: 'var(--floating-surface)',
          border: 'var(--border-w) solid var(--floating-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-pop)',
          padding: 'var(--space-2)',
        },
      },
        visibles.length === 0
          ? React.createElement('p', {
            style: {
              padding: 'var(--space-3) var(--space-4)', margin: 0,
              fontSize: 'var(--text-sm)', color: 'var(--text-3)',
              fontFamily: 'var(--font-ui)',
            },
            // Dos vacíos distintos, y decirlos igual sería mentir en uno de
            // los dos: **«nada coincide» no es «no hay nada»**. Quien busca en
            // una lista vacía tiene que saber que el problema no es su búsqueda
            // —no hay lotes cargados, no hay profesionales— porque lo que tiene
            // que hacer después es distinto.
            // Con `libre` y algo tecleado, la lista vacía no es un callejón:
            // dice que eso que se escribió es lo que se va a guardar.
          }, libre && texto.trim()
            ? (libreEtiqueta || vacioTexto)
            : (todas.length === 0 ? (sinOpcionesTexto || vacioTexto) : vacioTexto))
          : tramos.map((tramo) => {
            const renglones = tramo.opciones.map(({ opcion, indice }) => React.createElement('button', {
              key: opcion.value,
              id: `${listaId}-${indice}`,
              'data-indice': indice,
              type: 'button',
              role: 'option',
              'aria-selected': opcion.value === value ? 'true' : 'false',
              'aria-disabled': opcion.disabled ? 'true' : undefined,
              tabIndex: -1,
              // El `mousedown` no llega a robar el foco: si lo robara, el `blur`
              // del disparador cerraría la lista antes del clic.
              onMouseDown: (e) => e.preventDefault(),
              onMouseEnter: () => setActivo(indice),
              onClick: () => elegir(opcion),
              style: {
                display: 'block', width: '100%', textAlign: 'left',
                padding: 'var(--space-3) var(--space-4)', border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: indice === activo && !opcion.disabled ? 'var(--surface-2)' : 'transparent',
                color: opcion.disabled ? 'var(--text-3)' : 'var(--text)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                cursor: opcion.disabled ? 'not-allowed' : 'pointer',
              },
            },
              React.createElement('span', {
                key: 'n',
                style: {
                  display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: opcion.value === value
                    ? 'var(--weight-semibold)'
                    : 'var(--weight-medium)',
                },
              }, opcion.label),
              opcion.detalle && React.createElement('span', {
                key: 'd',
                style: {
                  display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: 'var(--text-xs)',
                },
              }, opcion.detalle),
            ));

            if (!tramo.grupo) {
              return React.createElement(React.Fragment, {
                key: `sueltas-${tramo.opciones[0].indice}`,
              }, renglones);
            }

            /* El grupo es un `role="group"` con su nombre y con TODAS sus
               opciones adentro: para un lector de pantalla, un encabezado suelto
               en el medio de un listbox no existe. */
            return React.createElement('div', {
              key: `g-${tramo.grupo}-${tramo.opciones[0].indice}`,
              role: 'group',
              'aria-label': tramo.grupo,
            },
              React.createElement('p', {
                key: 'h',
                'aria-hidden': true,
                style: {
                  padding: 'var(--space-3) var(--space-4) var(--space-2)', margin: 0,
                  fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-rotulo)',
                  textTransform: 'uppercase', color: 'var(--text-3)',
                  fontFamily: 'var(--font-ui)',
                },
              }, tramo.grupo),
              renglones,
            );
          }),

        /* Se dice que hay más y no se dibujan: un tope silencioso se lee como
           «no está», y quien busca algo que sí existe dejaría de buscarlo. */
        hayMas && React.createElement('p', {
          key: 'tope',
          style: {
            padding: 'var(--space-3) var(--space-4)', margin: 0,
            fontSize: 'var(--text-xs)', color: 'var(--text-3)',
            fontFamily: 'var(--font-ui)',
          },
        }, ayudaTope),
      ), document.body),
    ),
  );
}
