import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Las piezas que comparten las cinco pantallas.
 *
 * Viven en `apps/familia/src/comun/` y no en `packages/ui/components` por la
 * regla escrita en el `LEEME.md` de esa carpeta: **un componente sube al design
 * system cuando lo comparten dos PRODUCTOS**, no dos pantallas del mismo. Hoy
 * Mi espacio es el único que los usa. El día que el consultorio necesite el
 * mismo campo, sube — con su test y con el nombre que los dos usen.
 */

/** El marco de toda pantalla: la marca arriba, el contenido centrado. */
export function Pantalla({
  children,
  ancha = false,
  arriba = false,
}: {
  children: ReactNode;
  ancha?: boolean;
  arriba?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <main className={`lienzo${arriba ? ' lienzo--ancho' : ''}`}>
      <div className={`tarjeta${ancha ? ' tarjeta--ancha' : ''}`}>
        <span className="marca">{t('comun.marca')}</span>
        {children}
      </div>
    </main>
  );
}

/**
 * Un campo de texto con su rótulo, su ayuda y su error.
 *
 * El error se anuncia con `role="alert"` y el campo se marca con
 * `aria-invalid`: sin eso, alguien con lector de pantalla escribe mal el correo,
 * toca «Enviar» y no se entera de nada — la pantalla cambia en un lugar donde
 * no tiene el foco.
 */
export function Campo({
  id,
  rotulo,
  ayuda,
  error,
  clase,
  ...resto
}: {
  id: string;
  rotulo: string;
  ayuda?: string;
  error?: string | null;
  clase?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  return (
    <label className="campo" htmlFor={id}>
      <span className="campo__rotulo">{rotulo}</span>
      <input
        id={id}
        className={`campo__entrada${clase ? ` ${clase}` : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        {...resto}
      />
      {ayuda ? <span className="campo__ayuda" id={idAyuda}>{ayuda}</span> : null}
      {error ? <span className="error" id={idError} role="alert">{error}</span> : null}
    </label>
  );
}

/**
 * El campo de los seis dígitos.
 *
 * Es **una** entrada y no seis cajitas, y la diferencia no es estética: seis
 * cajitas rompen el pegado desde el portapapeles, rompen el autocompletado del
 * código del correo y obligan a manejar el foco a mano —que es donde esos
 * componentes fallan con teclado y con lector de pantalla—. `inputMode` y
 * `autoComplete="one-time-code"` son lo que hace que el teclado del celular
 * salga numérico y que iOS ofrezca el código apenas llega.
 */
export function CampoDeCodigo(props: {
  id: string;
  rotulo: string;
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string | null;
  autoFocus?: boolean;
}) {
  return (
    <Campo
      id={props.id}
      rotulo={props.rotulo}
      error={props.error}
      clase="codigo"
      value={props.valor}
      onChange={(e) => props.alCambiar(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={6}
      autoFocus={props.autoFocus}
    />
  );
}

/** El botón que hace avanzar: uno por pantalla, y es el único naranja. */
export function BotonPrincipal({
  children,
  cargando,
  textoCargando,
  ...resto
}: {
  children: ReactNode;
  cargando?: boolean;
  textoCargando?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="submit" className="btn btn--naranja btn--ancho" disabled={cargando} {...resto}>
      {cargando && textoCargando ? textoCargando : children}
    </button>
  );
}

/** Un aviso al entrar: «te cerramos la sesión», «tu sesión ya no estaba». */
export function Aviso({ children }: { children: ReactNode }) {
  return <p className="aviso" role="status">{children}</p>;
}
