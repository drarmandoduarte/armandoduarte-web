import React from 'react';
import { Field } from './Field.jsx';
import { Icon } from '../core/Icon.jsx';
import { filtrarOpciones, opcionDe } from './buscar.js';

/* Un campo que se escribe y filtra su lista mientras se escribe.

   EL CASO QUE LO MANDA: elegir la persona en un turno. Una cuenta con 700
   fichas en un `<select>` es una lista de 700 renglones que hay que recorrer con
   la rueda del mouse mientras el responsable espera al teléfono. Aquí se escriben tres
   letras y quedan tres.

   EL SEGUNDO CASO, con la misma pieza: el motivo del turno. Ahí la lista es
   corta y curada, pero lo que no está en ella tiene que poder escribirse igual —
   `libre` lo permite, y lo escrito se guarda tal cual. Un componente y no dos:
   son la misma pregunta ("elige de esto, o escribe lo tuyo") con la lista de
   distinto largo, y dos copias se separarían en el primer arreglo.

   Va a ser también el campo del responsable y el del producto. Por eso las opciones
   llevan `detalle`: la segunda línea de cada renglón —el responsable de
   una persona, el rubro de un producto— **y esa línea también se busca**. En el
   mostrador, quien llama dice su propio apellido antes que el nombre del titular.

   CERRADO, LO ESCRITO NO MANDA. Sin `libre`, salir del campo con algo tecleado
   que no es ninguna opción no guarda ese texto: se restituye lo que estaba. Un
   turno tiene que apuntar a una ficha real; media búsqueda no es una ficha.

   No es un `<datalist>`, y es el mismo argumento de siempre: el nativo se ve
   distinto en cada navegador, no se puede vestir con tokens y en el móvil no
   abre nada. */

/** Cuántos renglones se dibujan. Ver `filtrarOpciones`: corta el DOM, no la búsqueda. */
const TOPE_VISIBLE = 50;

export function ComboBuscador({
  label, hint, error, required, options = [], value = '', onChange,
  placeholder, libre = false, libreEtiqueta, vacioTexto, ayudaTope,
  id, disabled = false, style, containerStyle, ...rest
}) {
  const autoId = React.useId();
  const campoId = id || autoId;
  const listaId = `${campoId}-lista`;

  const elegida = opcionDe(options, value);
  /** Lo que el campo muestra cuando nadie lo está escribiendo. */
  const textoDeReposo = elegida ? elegida.label : (libre ? value : '');

  const [abierto, setAbierto] = React.useState(false);
  const [texto, setTexto] = React.useState(textoDeReposo);
  const [activo, setActivo] = React.useState(0);
  const [foco, setFoco] = React.useState(false);
  const caja = React.useRef(null);

  /* El valor puede cambiar desde afuera —al abrir el diálogo sobre otro turno,
     al restaurar un borrador—. Mientras el campo está abierto no se toca: lo
     reformatearía debajo del cursor de quien está escribiendo. */
  React.useEffect(() => {
    if (!abierto) setTexto(textoDeReposo);
    // `texto` fuera de las dependencias a propósito: esto reacciona a lo que
    // llega de afuera, no a cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoDeReposo, abierto]);

  const visibles = abierto ? filtrarOpciones(options, texto, TOPE_VISIBLE) : [];
  const hayMas = abierto && filtrarOpciones(options, texto).length > visibles.length;

  const abrir = () => { if (!disabled) { setAbierto(true); setActivo(0); } };

  const elegir = (opcion) => {
    setAbierto(false);
    setTexto(opcion.label);
    if (onChange) onChange(opcion.value);
  };

  /* Cerrar sin elegir. Con `libre`, lo tecleado ES el valor —así se guarda un
     motivo que la lista no tiene—. Sin `libre`, se restituye lo que estaba:
     media búsqueda no es una ficha. */
  const cerrar = () => {
    setAbierto(false);
    if (!libre) { setTexto(textoDeReposo); return; }
    const limpio = texto.trim();
    if (limpio !== value && onChange) onChange(limpio);
  };

  const escribir = (crudo) => {
    setTexto(crudo);
    setAbierto(true);
    setActivo(0);
  };

  const teclado = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) { abrir(); return; }
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      const cuantas = visibles.length;
      if (cuantas === 0) return;
      setActivo((i) => (i + paso + cuantas) % cuantas);
      return;
    }
    if (e.key === 'Enter') {
      // Solo se traga el Enter si hay algo que elegir: si no, el formulario
      // sigue enviándose como en cualquier campo de texto.
      if (abierto && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]); }
      return;
    }
    if (e.key === 'Escape' && abierto) {
      e.preventDefault();
      setAbierto(false);
      setTexto(textoDeReposo);
    }
  };

  /* El foco se va del campo Y de la lista: hay que mirar a dónde fue antes de
     cerrar, porque un clic en un renglón pasa por el `blur` del input. */
  const salir = (e) => {
    setFoco(false);
    const destino = e.relatedTarget;
    if (destino && caja.current && caja.current.contains(destino)) return;
    cerrar();
  };

  const borde = error ? 'var(--danger)' : (foco || abierto) ? 'var(--primary)' : 'var(--border-strong)';

  return React.createElement(Field, { label, hint, error, required, htmlFor: campoId, style: containerStyle },
    React.createElement('div', {
      ref: caja,
      style: { position: 'relative', minWidth: 0 },
      onBlur: salir,
    },
      React.createElement('div', { style: { position: 'relative', display: 'flex', alignItems: 'center' } },
        React.createElement('input', {
          id: campoId, type: 'text', autoComplete: 'off', disabled,
          role: 'combobox', 'aria-expanded': abierto ? 'true' : 'false',
          'aria-controls': listaId, 'aria-autocomplete': 'list',
          'aria-activedescendant': abierto && visibles[activo] ? `${listaId}-${activo}` : undefined,
          value: texto, placeholder,
          onChange: (e) => escribir(e.target.value),
          onFocus: () => { setFoco(true); abrir(); },
          onKeyDown: teclado,
          style: {
            width: '100%', minHeight: 'var(--control-h)',
            padding: '0 30px 0 var(--space-5)',
            background: disabled ? 'var(--surface-2)' : 'var(--surface)',
            color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
            border: 'var(--border-w) solid ' + borde,
            borderRadius: 'var(--radius-campo)', outline: 'none',
            transition: 'border-color var(--dur-fast) var(--ease-standard)',
            cursor: disabled ? 'not-allowed' : undefined,
            ...style,
          },
          ...rest,
        }),
        React.createElement('span', {
          style: {
            position: 'absolute', right: 'var(--space-5)', color: 'var(--text-3)',
            pointerEvents: 'none', display: 'flex',
          },
        }, React.createElement(Icon, { name: abierto ? 'chevron-up' : 'chevron-down', size: 14 })),
      ),

      /* La lista flota: es lo único de este campo que se superpone a lo de
         abajo, y por eso lleva la sombra de flotante (que en dark los tokens
         apagan y resuelven con superficie + borde). */
      abierto && React.createElement('div', {
        id: listaId, role: 'listbox',
        style: {
          position: 'absolute', top: 'calc(100% + var(--space-2))', left: 0, right: 0,
          zIndex: 40, maxHeight: '15rem', overflowY: 'auto',
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
          }, libre && texto.trim() ? libreEtiqueta : vacioTexto)
          : visibles.map((o, i) => React.createElement('button', {
            key: o.value,
            id: `${listaId}-${i}`,
            type: 'button',
            role: 'option',
            'aria-selected': o.value === value ? 'true' : 'false',
            tabIndex: -1,
            onMouseDown: (e) => e.preventDefault(),
            onMouseEnter: () => setActivo(i),
            onClick: () => elegir(o),
            style: {
              display: 'block', width: '100%', textAlign: 'left',
              padding: 'var(--space-3) var(--space-4)', border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: i === activo ? 'var(--surface-2)' : 'transparent',
              color: 'var(--text)', fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)', cursor: 'pointer',
            },
          },
            React.createElement('span', {
              key: 'n',
              style: {
                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', fontWeight: 'var(--weight-semibold)',
              },
            }, o.label),
            o.detalle && React.createElement('span', {
              key: 'd',
              style: {
                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: 'var(--text-xs)',
              },
            }, o.detalle),
          )),

        /* Se dice que hay más y no se dibujan: un tope silencioso se lee como
           «no está», y quien busca a alguien que sí existe dejaría de
           buscarla. */
        hayMas && React.createElement('p', {
          key: 'tope',
          style: {
            padding: 'var(--space-3) var(--space-4)', margin: 0,
            fontSize: 'var(--text-xs)', color: 'var(--text-3)',
            fontFamily: 'var(--font-ui)',
          },
        }, ayudaTope),
      ),
    ),
  );
}
