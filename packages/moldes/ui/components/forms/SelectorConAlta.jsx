import React from 'react';
import { Selector } from './Selector.jsx';
import { Button } from '../core/Button.jsx';

/* El selector que además sabe dar de alta lo que le falta.

   El caso que resuelve: anotar una salida de caja a un laboratorio que todavía
   no está cargado. Antes eso se hacía escribiendo el nombre a
   mano, y entonces el mismo laboratorio quedaba escrito de tres formas, ninguna
   con ficha, ninguna con teléfono, y la pregunta «¿cuánto le pagué a estos?» no
   se podía contestar. Mandar a la persona a otra pantalla a crearlo tampoco
   sirve: pierde lo que estaba anotando.

   Así que el alta vive DENTRO del selector. Es la misma anatomía que
   el `ComboSugerido` que el kit enterró, y a propósito: una opción al final de la lista abre un
   bloque DEBAJO del campo, no en su lugar. Quien la eligió por error vuelve sin
   perder nada. La diferencia con aquel es lo que pasa al confirmar — allá el
   texto se guarda como texto, aquí **nace una ficha en el padrón que
   corresponde** y lo que se guarda es su id.

   ── LO QUE ESTE COMPONENTE NO DECIDE ──────────────────────────────────────
   Ni qué campos tiene el alta ni qué se hace con ellos: eso llega por
   `formulario` y `onAgregar`, porque cambia entre un proveedor —al que le
   alcanza el nombre para nacer— y un externo, que necesita además su
   especialidad. Lo que sí es de aquí, y por eso es una pieza y no un patrón
   copiado: abrir y cerrar, el ocupado, el error, y que lo recién creado quede
   elegido sin esperar a que el padre recargue su lista.

   ── Y NO SE DIBUJA SI NO SE PUEDE ─────────────────────────────────────────
   `puedeAgregar` en `false` deja el selector tal cual, sin la opción de alta.
   No es una cortesía: en una app del molde crear una ficha de proveedor o de profesional es
   del dueño y solo del dueño (`es_dueno_de()`, migraciones 0008 y 0011), así
   que para un administrador esa opción sería un botón que se estrella contra un
   42501. Lo que no se puede hacer, no se dibuja. */

const ALTA = '__alta__';

export function SelectorConAlta({
  puedeAgregar = false, agregar = {}, formulario, onAgregar, onAbrirAlta,
  options = [], value = '', onChange, disabled = false, error, hint,
  ...rest
}) {
  const [abierta, setAbierta] = React.useState(false);
  const [ocupado, setOcupado] = React.useState(false);
  const [fallo, setFallo] = React.useState(null);
  /* Lo recién creado, hasta que el padre lo tenga en `options`. Sin esto, entre
     el `onAgregar` y la recarga del padre el campo se ve VACÍO, y quien acaba de
     escribir un nombre cree que no se guardó y lo escribe otra vez. */
  const [recien, setRecien] = React.useState(null);

  const lista = React.useMemo(() => {
    const base = recien && !options.some((o) => o.value === recien.value)
      ? [...options, recien]
      : options;
    return puedeAgregar
      ? [...base, { value: ALTA, label: agregar.opcion }]
      : base;
  }, [options, recien, puedeAgregar, agregar.opcion]);

  function elegir(v) {
    if (v === ALTA) {
      setFallo(null);
      setAbierta(true);
      if (onAbrirAlta) onAbrirAlta();
      return;
    }
    setAbierta(false);
    if (onChange) onChange(v);
  }

  function cancelar() {
    setAbierta(false);
    setFallo(null);
  }

  async function confirmar() {
    if (!onAgregar) return;
    setFallo(null);
    setOcupado(true);
    try {
      const nacida = await onAgregar();
      /* `onAgregar` puede devolver nada cuando decidió no crear —falta el
         nombre, por ejemplo—. En ese caso el bloque se queda abierto con lo
         escrito: cerrarlo sería tirar lo que la persona puso. */
      if (nacida && nacida.value) {
        setRecien(nacida);
        setAbierta(false);
        if (onChange) onChange(nacida.value);
      }
    } catch (e) {
      setFallo(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  return React.createElement('div',
    { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 0 } },
    React.createElement(Selector, {
      key: 'sel',
      ...rest,
      hint,
      error,
      options: lista,
      /* Mientras el alta está abierta el campo muestra la opción de alta, no un
         hueco: es lo que hace que el bloque de abajo se lea como su continuación
         y no como un formulario que apareció solo. */
      value: abierta ? ALTA : value,
      onChange: elegir,
      disabled: disabled || ocupado,
    }),

    abierta && React.createElement('div', {
      key: 'alta',
      style: {
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        border: 'var(--border-w) solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-2)',
      },
    },
      agregar.titulo && React.createElement('p', {
        key: 't',
        style: {
          margin: 0, fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-rotulo)',
          textTransform: 'uppercase', color: 'var(--text-3)',
        },
      }, agregar.titulo),

      React.createElement('div', { key: 'f' }, formulario),

      fallo && React.createElement('p', {
        key: 'e',
        style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--danger-text)' },
      }, fallo),

      React.createElement('div', {
        key: 'b',
        style: { display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' },
      },
        React.createElement(Button, {
          key: 'c', variant: 'ghost', size: 'sm', type: 'button',
          onClick: cancelar, disabled: ocupado,
        }, agregar.cancelar),
        /* `type="button"` en los dos, y no es un detalle: este bloque vive
           dentro del formulario del diálogo, y un botón sin tipo dentro de un
           `<form>` es un submit — agregar un proveedor guardaría la salida. */
        React.createElement(Button, {
          key: 'a', variant: 'secondary', size: 'sm', type: 'button',
          onClick: () => { void confirmar(); }, disabled: ocupado,
        }, ocupado ? (agregar.guardando ?? '…') : agregar.accion),
      ),
    ),
  );
}
