import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Antetitulo, Idioma, Titulo } from '@moldes/ui';
import { IDIOMAS, WEB_PUBLICA, type Idioma as IdiomaDeLaCasa } from '@codice/core';
import { guardarIdioma } from '../comun/idioma';
import { useT } from './textos';

/**
 * La anatomía de toda pantalla de acceso — orden #37, PR 2 (Kit de Acceso 1.3.0).
 *
 * Es el marco de la galería del molde (`storybook/principal.jsx`: `Marco` y
 * `Barrita`) hecho pantalla: la columna del molde (`.molde-columna`, 560 de
 * ancho y 24 de margen), `← ARMANDO DUARTE` arriba a la izquierda hacia la web,
 * el selector de idioma del molde (`Idioma`) a la derecha, y debajo el
 * antetítulo, el título con su palabra acentuada y la bajada. Las piezas son
 * todas de `@moldes/ui`; lo de Armando (colores, letra, radio, nombre) lo pone
 * el `design.json`. Sin fotos ni paneles.
 *
 * Lo que la #35 tenía escrito a mano —el título partido, el selector, el botón,
 * la casilla de seis— se fue: lo trae el molde.
 */
export function MarcoDeAcceso({
  antetitulo, titulo, subtitulo, centrada = false, portada = false, children,
}: {
  /** La palabra del `§ · PALABRA`. P1 no lleva. */
  antetitulo?: string;
  /** Con la palabra acentuada entre asteriscos. */
  titulo: string;
  subtitulo?: ReactNode;
  /** Las pantallas de código van centradas. */
  centrada?: boolean;
  /** P1: el título grande de la entrada. */
  portada?: boolean;
  children?: ReactNode;
}) {
  const { t, idioma } = useT();
  const { i18n } = useTranslation();
  return (
    <div className="acceso" lang={idioma}>
      <div className="molde-columna">
        <header className="acceso__cabeza">
          <a className="acceso__volver" href={WEB_PUBLICA}>{t('auth.back')}</a>
          <Idioma
            valor={idioma}
            idiomas={[...IDIOMAS]}
            etiqueta={t('comun.idioma')}
            onCambiar={(l) => { guardarIdioma(l as IdiomaDeLaCasa); void i18n.changeLanguage(l); }}
          />
        </header>
        <main className={`acceso__cuerpo${centrada ? ' acceso__cuerpo--centrada' : ''}`} id="contenido">
          {antetitulo ? <Antetitulo texto={antetitulo} /> : null}
          <Titulo texto={titulo} tamano={portada ? 'portada' : 'pantalla'} alineado={centrada ? 'centro' : 'inicio'} />
          {subtitulo ? <p className={`acceso__bajada${portada ? ' acceso__bajada--portada' : ''}`}>{subtitulo}</p> : null}
          {children}
        </main>
      </div>
    </div>
  );
}

/** El rótulo en mayúsculas encima de la casilla de seis, como en la galería del molde (P3). */
export function Rotulo({ children }: { children: ReactNode }) {
  return <p className="acceso__rotulo" aria-hidden="true">{children}</p>;
}

/** Un error de la pantalla, en el color del error del `design.json`, anunciado. */
export function ErrorDeAcceso({ id, children }: { id?: string; children: ReactNode }) {
  return <p className="acceso__error" id={id} role="alert">{children}</p>;
}
