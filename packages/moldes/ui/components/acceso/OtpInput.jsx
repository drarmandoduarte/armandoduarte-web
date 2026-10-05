import React from 'react';

/* La casilla de 6 huecos (guion de pantallas §3) — la que Dirección aprobó, la
   de la captura de referencia. Viene de la app de origen del molde y se
   generalizó a tokens: ni un color, ni una fuente, ni un radio propios.

   ── Por qué es UN input y no seis ──────────────────────────────────────────
   Un `<input>` real, invisible, encima de seis casillas que solo dibujan. Seis
   inputs separados rompen dos cosas que el guion pide: pegar seis dígitos de una
   vez y el autocompletado del teléfono (`autocomplete="one-time-code"`: iPhone y
   Android ofrecen el código solos desde el mail o el SMS). Con uno solo, las dos
   andan sin código propio.

   ── Lo que hace, contra el guion ───────────────────────────────────────────
   · Una cifra por casilla, solo números (`inputMode="numeric"`); lo que no es
     dígito se descarta, también al pegar «123 456» o «123-456».
   · Escribir avanza; borrar vuelve; pegar seis los reparte en las seis.
   · Las flechas mueven la casilla activa: el cursor del input real se mueve y
     la casilla que se dibuja activa es la del cursor.
   · La activa tiene el borde del acento y el fondo apenas distinto.
   · Al completar la sexta llama `onCompleto` UNA vez (verificar solo). Si se
     borra y se vuelve a completar, llama otra vez.
   · Con `error`, las seis casillas tiemblan una vez y se pintan del error. Vaciar
     y devolver el foco a la primera es `reset()` por ref: lo decide la pantalla,
     que es la que sabe cuándo el servidor dijo que no.

   ── Una trampa que ya se pagó ──────────────────────────────────────────────
   El input tiene `maxLength=6`. Con el código completo, el navegador descarta
   cada tecla nueva: el campo parece vivo pero no hace nada. Dos defensas: al
   enfocar con seis dígitos se SELECCIONA todo (escribir reemplaza), y la
   pantalla puede llamar `reset()` tras un intento fallido.

   El tamaño de cada casilla (80 × 72 en escritorio, 48 × 56 en celular) vive en
   `tokens/piezas.css`, porque un estilo en línea no sabe de `@media`. */

const LARGO = 6;

export const OtpInput = React.forwardRef(function OtpInput({
  value, onChange, onCompleto, error = false, disabled = false,
  'aria-label': etiqueta, id, style, ...rest
}, ref) {
  const inputRef = React.useRef(null);
  const completoRef = React.useRef(false);
  const relojRef = React.useRef(null);
  const [cursor, setCursor] = React.useState(value.length);
  const [enfocado, setEnfocado] = React.useState(false);
  const [tiembla, setTiembla] = React.useState(false);

  React.useEffect(() => {
    if (value.length === LARGO && !completoRef.current) {
      completoRef.current = true;
      if (onCompleto) onCompleto(value);
    } else if (value.length < LARGO) {
      completoRef.current = false;
    }
  }, [value, onCompleto]);

  // Tiembla cada vez que `error` pasa a verdadero, no mientras sigue siéndolo.
  // La clase se apaga al terminar la animación (y no con un `key`, que
  // remontaría el input y le sacaría el foco).
  React.useEffect(() => { if (error) setTiembla(true); }, [error]);

  const limpiar = (crudo) => crudo.replace(/\D/g, '').slice(0, LARGO);

  const leerCursor = (el) => setCursor(Math.min(el.selectionStart ?? el.value.length, LARGO - 1));

  function ubicar(el) {
    if (el.value.length >= LARGO) el.setSelectionRange(0, el.value.length);
    else el.setSelectionRange(el.value.length, el.value.length);
    leerCursor(el);
  }

  function enfocar() {
    const el = inputRef.current;
    // Se lee `el.disabled` del DOM y no la prop: `reset()` enfoca un tick
    // después, cuando la prop del cierre puede seguir en `true`.
    if (!el || el.disabled) return;
    el.focus();
    ubicar(el);
  }

  React.useImperativeHandle(ref, () => ({
    focus: enfocar,
    reset: () => {
      onChange('');
      if (relojRef.current) clearTimeout(relojRef.current);
      relojRef.current = setTimeout(() => { relojRef.current = null; enfocar(); }, 0);
    },
  }), [onChange]);

  React.useEffect(() => () => { if (relojRef.current) clearTimeout(relojRef.current); }, []);

  const activa = enfocado && !disabled ? (value.length < LARGO ? Math.min(cursor, value.length) : -1) : -1;

  return React.createElement('div', {
    className: 'molde-otp' + (tiembla ? ' molde-tiembla' : ''),
    'data-tiembla': tiembla || undefined,
    onAnimationEnd: () => setTiembla(false),
    role: 'presentation',
    onClick: enfocar,
    style: { position: 'relative', userSelect: 'none', ...style },
  },
  React.createElement('input', {
    ref: inputRef, id,
    type: 'text', inputMode: 'numeric', autoComplete: 'one-time-code', pattern: '[0-9]*',
    maxLength: LARGO, value, disabled,
    'aria-label': etiqueta, 'aria-invalid': error || undefined,
    onChange: (e) => { onChange(limpiar(e.target.value)); leerCursor(e.target); },
    onPaste: (e) => {
      const pegado = e.clipboardData.getData('text');
      const limpio = limpiar(pegado);
      if (limpio && limpio !== pegado) { e.preventDefault(); onChange(limpio); }
    },
    onFocus: (e) => { setEnfocado(true); ubicar(e.currentTarget); },
    onBlur: () => setEnfocado(false),
    onSelect: (e) => leerCursor(e.currentTarget),
    onKeyUp: (e) => leerCursor(e.currentTarget),
    style: {
      position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0,
      cursor: disabled ? 'not-allowed' : 'text', border: 0, padding: 0,
    },
    ...rest,
  }),
  Array.from({ length: LARGO }, (_, i) => {
    const cifra = value[i] ?? '';
    const esActiva = i === activa;
    return React.createElement('div', {
      key: i, 'aria-hidden': true, 'data-casilla': i, 'data-activa': esActiva || undefined,
      className: 'molde-otp-casilla',
      style: {
        position: 'relative', display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-3xl)', fontVariantNumeric: 'tabular-nums', color: 'var(--text)',
        background: esActiva && !error ? 'var(--primary-soft)' : 'transparent',
        border: 'var(--border-w) solid ' + (error ? 'var(--danger)' : esActiva ? 'var(--primary)' : 'var(--border-strong)'),
        borderRadius: 'var(--radius-campo)',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)',
      },
    },
    cifra ? React.createElement('span', null, cifra) : null,
    esActiva && !cifra ? React.createElement('span', {
      className: 'molde-cursor',
      style: { position: 'absolute', width: 1, height: '40%', background: 'var(--text)' },
    }) : null);
  }));
});
