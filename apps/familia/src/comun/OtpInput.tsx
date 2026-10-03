import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';

/**
 * La casilla de 6 huecos del Kit de Seguridad 512 — orden #35 (guion v1, §3).
 *
 * **Copiada del kit** (`referencia-cenit/pantallas/OtpInput.tsx`, v1.1.0) y
 * vestida con el `design.json` de Mi espacio: las clases de abajo usan solo las
 * variables `--acceso-*` que genera `packages/ui/scripts/design-json.mjs`.
 * Lo que es del kit no cambió:
 *
 *   · **un input real + 6 casillas dibujadas**: el `<input>` está encima,
 *     transparente, y recibe el teclado, el pegado entero y el
 *     `autocomplete="one-time-code"` de iPhone y Android. Seis inputs separados
 *     rompen las dos cosas;
 *   · `onComplete` se llama **una sola vez** al llegar a 6 (verifica solo);
 *   · pegar «código: 123 456» deja `123456`.
 *
 * Lo que el guion agrega y el componente del kit no traía, todo de la cara:
 *
 *   · **el error** (§3): cuando `errores` sube, las seis tiemblan una vez, se
 *     vacían y el foco vuelve a la primera. El temblor no corre con
 *     `prefers-reduced-motion` (lo apaga el CSS);
 *   · las flechas: el input real es uno, así que «moverse entre casillas» es
 *     mover el cursor; la casilla activa sigue al cursor;
 *   · `id` y `aria-describedby`, para que la etiqueta y el mensaje de error se
 *     lean junto con el campo.
 */
interface Props {
  id: string;
  /** Código actual (0-6 dígitos). El padre es la fuente de verdad. */
  value: string;
  /** Cada cambio, ya limpio (solo dígitos, hasta 6). */
  onChange: (next: string) => void;
  /** Una sola vez al pasar a 6 dígitos. No se vuelve a llamar mientras siga en 6. */
  onComplete?: (code: string) => void;
  /** Cuántas veces falló. Cada vez que sube: temblor, vaciado y foco a la primera. */
  errores?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-describedby'?: string;
}

const SLOTS = 6;
const POSICIONES = [0, 1, 2, 3, 4, 5] as const;

export function OtpInput({
  id, value, onChange, onComplete, errores = 0, disabled, autoFocus, 'aria-describedby': describedBy,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const completedAtRef = useRef(false);
  const [cursor, setCursor] = useState(value.length);
  const [tiembla, setTiembla] = useState(false);
  const erroresVistos = useRef(errores);

  useEffect(() => {
    if (value.length === SLOTS && !completedAtRef.current) {
      completedAtRef.current = true;
      onComplete?.(value);
    } else if (value.length < SLOTS) {
      completedAtRef.current = false;
    }
  }, [value, onComplete]);

  /* §3 · el error: temblor una vez, vaciado, foco a la primera. */
  useEffect(() => {
    if (errores <= erroresVistos.current) return;
    erroresVistos.current = errores;
    setTiembla(true);
    onChange('');
    setCursor(0);
    const el = inputRef.current;
    if (el && !disabled) {
      el.focus();
      el.setSelectionRange(0, 0);
    }
    const fin = window.setTimeout(() => setTiembla(false), 400);
    return () => window.clearTimeout(fin);
  }, [errores, onChange, disabled]);

  const sanitize = (raw: string) => raw.replace(/\D/g, '').slice(0, SLOTS);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const limpio = sanitize(e.target.value);
    onChange(limpio);
    setCursor(Math.min(e.target.selectionStart ?? limpio.length, limpio.length));
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    const cleaned = sanitize(pasted);
    if (cleaned && cleaned !== pasted) {
      e.preventDefault();
      onChange(cleaned);
      setCursor(cleaned.length);
    }
  }

  /* Las flechas mueven el cursor del input real; la casilla activa lo sigue. */
  function handleKeyUp(e: KeyboardEvent<HTMLInputElement>) {
    setCursor(e.currentTarget.selectionStart ?? value.length);
  }

  function focusInput() {
    const el = inputRef.current;
    if (!el || disabled) return;
    el.focus();
  }

  const activa = Math.min(cursor, value.length, SLOTS - 1);

  return (
    <div className={`otp${tiembla ? ' otp--tiembla' : ''}`} onClick={focusInput} role="presentation">
      <input
        ref={inputRef}
        id={id}
        className="otp__entrada"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={SLOTS}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyUp={handleKeyUp}
        onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? value.length)}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={errores > 0 && value.length === 0 ? true : undefined}
        aria-describedby={describedBy}
      />
      {POSICIONES.map((i) => {
        const digito = value[i] ?? '';
        const esActiva = !disabled && i === activa && value.length < SLOTS;
        return (
          <div key={i} aria-hidden="true" data-casilla={i} className={`otp__casilla${esActiva ? ' otp__casilla--activa' : ''}`}>
            {digito ? <span>{digito}</span> : null}
            {esActiva && !digito ? <span className="otp__cursor" /> : null}
          </div>
        );
      })}
    </div>
  );
}
