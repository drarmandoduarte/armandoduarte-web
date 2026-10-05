import { useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { IDIOMAS, WEB_PUBLICA, partirTituloDeAcceso, rellenar, type Idioma } from '@codice/core';
import { guardarIdioma } from '../comun/idioma';
import design from '../../design.json';

/**
 * La anatomía de toda pantalla de acceso — guion v1 del Kit 512, §2 (orden #35).
 *
 * Fondo liso, columna centrada de 560 (24 de margen a 390), `← ARMANDO DUARTE`
 * arriba a la izquierda hacia la web, el selector de idioma arriba a la derecha,
 * y debajo antetítulo, título con la palabra acentuada, subtítulo y lo que la
 * pantalla traiga. **Sin fotos ni paneles**: el guion lo prohíbe y es regla de
 * dirección para todas las apps; la foto de Armando de la #31 se fue con esto.
 *
 * Lo que es de Armando sale del `design.json` (generado del canon): el nombre
 * (y desde la #37, en el esquema del molde, `design.app.nombre`; la web pasó a
 * `WEB_PUBLICA` de `@codice/core`) y, en las variables `--acceso-*` de `acceso/design.css`, los colores,
 * la tipografía y el radio. Nada de eso se escribe acá.
 */

/** Los textos `auth.*`, con `{app}` y las demás variables de una llave rellenadas. */
export function useTextos() {
  const { t, i18n } = useTranslation();
  const ta = useCallback(
    (clave: string, variables: Record<string, string | number> = {}) =>
      rellenar(t(`auth.${clave}`), { app: design.app.nombre, ...variables }),
    [t],
  );
  return { ta, idioma: (i18n.resolvedLanguage ?? 'es') as Idioma, i18n };
}

/** «Verifica tu *identidad*.» con la palabra en la sans, cursiva y en el acento (§1.2). */
export function TituloDeAcceso({ texto }: { texto: string }) {
  const { antes, palabra, despues } = partirTituloDeAcceso(texto);
  return (
    <h1 className="acceso__titulo">
      {antes}
      {palabra ? <em className="acceso__palabra">{palabra}</em> : null}
      {despues}
    </h1>
  );
}

function SelectorDeIdioma() {
  const { ta, idioma, i18n } = useTextos();
  return (
    <div className="acceso__idiomas" role="group" aria-label={ta('lang.label')}>
      <Globe size={16} strokeWidth={1.5} aria-hidden />
      {IDIOMAS.map((l, i) => (
        <span key={l} className="acceso__idioma-item">
          {i > 0 ? <span className="acceso__punto" aria-hidden="true">·</span> : null}
          <button
            type="button"
            lang={l}
            className={`acceso__idioma${l === idioma ? ' acceso__idioma--activo' : ''}`}
            aria-pressed={l === idioma}
            onClick={() => { guardarIdioma(l); void i18n.changeLanguage(l); }}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

export function MarcoDeAcceso({
  antetitulo, titulo, subtitulo, centrada = false, pie, children,
}: {
  /** La palabra del `§ · PALABRA`. P1 no lleva. */
  antetitulo?: string;
  titulo: string;
  subtitulo?: ReactNode;
  /** Las pantallas de código van centradas (§2). */
  centrada?: boolean;
  /** El pie legal: solo P1. */
  pie?: ReactNode;
  children?: ReactNode;
}) {
  const { ta, idioma } = useTextos();
  return (
    <div className="acceso" lang={idioma}>
      <div className="acceso__columna">
        <header className="acceso__cabeza">
          <a className="acceso__volver" href={WEB_PUBLICA}>{ta('back')}</a>
          <SelectorDeIdioma />
        </header>
        <main className={`acceso__cuerpo${centrada ? ' acceso__cuerpo--centrada' : ''}`} id="contenido">
          {antetitulo ? <p className="acceso__antetitulo">§ · {antetitulo}</p> : null}
          <TituloDeAcceso texto={titulo} />
          {subtitulo ? <p className="acceso__subtitulo">{subtitulo}</p> : null}
          {children}
          {pie}
        </main>
      </div>
    </div>
  );
}

/** El botón principal: contorno del acento, mayúsculas, `→` si lleva a otra pantalla (§2). */
export function BotonDeAcceso({
  children, flecha = false, ancho = false, cargando = false, ...resto
}: {
  children: ReactNode;
  flecha?: boolean;
  /** Del ancho de la columna (pantallas de código); si no, del ancho del texto. */
  ancho?: boolean;
  cargando?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={`acceso__boton${ancho ? ' acceso__boton--ancho' : ''}`}
      disabled={cargando || resto.disabled}
      aria-busy={cargando || undefined}
      {...resto}
    >
      <span>{children}</span>
      {flecha ? <span aria-hidden="true">→</span> : null}
    </button>
  );
}

/** Los enlaces secundarios, centrados, uno debajo del otro: el primero en acento, el segundo apagado (§2). */
export function EnlacesDeAcceso({ children }: { children: ReactNode }) {
  return <div className="acceso__enlaces">{children}</div>;
}

/** La etiqueta en mayúsculas y en acento, encima del campo (§2). */
export function Etiqueta({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return <label className="acceso__etiqueta" htmlFor={htmlFor}>{children}</label>;
}
