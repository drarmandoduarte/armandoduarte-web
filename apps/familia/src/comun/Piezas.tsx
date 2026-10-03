import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TELEFONO_GABY, enlaceWhatsApp } from '@codice/core';
import { WEB } from '../rutas';
import { partirAcento } from './acento';
import { ANCHO_DE_DOS_MITADES, usarAncho } from './usar-ancho';

/**
 * Las piezas que comparten las cinco pantallas.
 *
 * Viven en `apps/familia/src/comun/` y no en `packages/ui/components` por la
 * regla escrita en el `LEEME.md` de esa carpeta: **un componente sube al design
 * system cuando lo comparten dos PRODUCTOS**, no dos pantallas del mismo. Hoy
 * Mi espacio es el único que los usa. El día que el consultorio necesite el
 * mismo campo, sube — con su test y con el nombre que los dos usen.
 */

/**
 * El marco de toda pantalla — orden Códice #18, B.1, B.10 y C.
 *
 * Cabecera, columna de 420 y pie, **iguales en las cinco pantallas**: la
 * persona que pasa de `/entrar` al reto o a Mi espacio no cambia de casa. El
 * panel de Armando (`conArmando`) va **solo** en `/entrar`, que es la puerta;
 * adentro, la columna sola.
 *
 * ── Por qué antes no había cabecera ni pie ──────────────────────────────
 * La #15 lo decidió así («una pantalla a la vez, sin nada de lo que la web
 * necesita»), y la #18 lo corrige con el caso a la vista: puesta al lado de la
 * entrada de Bitácora Clínica, la de Armando era un formulario suelto en una
 * hoja crema, **sin marca y sin salida**. Lo que se trae de la web es el cromo
 * —el wordmark, el pie legal— y no el menú ni el overlay, que siguen sin tener
 * nada que hacer acá.
 */
export function Pantalla({
  children,
  conArmando = false,
  ancha = false,
}: {
  children: ReactNode;
  conArmando?: boolean;
  /** El panel del equipo (#24 A): columna de escritorio, arriba y no centrada. */
  ancha?: boolean;
}) {
  /* La foto solo a dos columnas: debajo no se monta y no se descarga (ver
     `usar-ancho.ts`, con la medición). La firma va en todos los anchos. */
  const dosMitades = usarAncho(ANCHO_DE_DOS_MITADES);
  return (
    <div className={`marco${conArmando ? ' marco--con-armando' : ''}`}>
      <Cabecera />
      {conArmando && dosMitades ? <ArmandoDePie /> : null}
      <main className={`marco__principal${ancha ? ' marco__principal--arriba' : ''}`}>
        <div className={`columna${ancha ? ' columna--ancha' : ''}`}>
          {conArmando ? <Firma /> : null}
          {children}
        </div>
      </main>
      <Pie />
    </div>
  );
}

/** B.1 · el wordmark lleva a la web y la salida, también. Mismo cromo (D25). */
function Cabecera() {
  const { t } = useTranslation();
  return (
    <header className="cab">
      <div className="cab__dentro">
        <a href={WEB} className="cab__marca" aria-label={t('comun.inicioDeLaWeb')}>
          <b>{t('web:comun.marca.nombre')}</b>
        </a>
        <a href={WEB} className="cab__volver">
          <span aria-hidden="true">←</span> {t('comun.volverALaWeb')}
        </a>
      </div>
    </header>
  );
}

/**
 * A · Armando de pie a la izquierda, como en «Quién soy» (orden #31).
 *
 * La #30 lo había puesto en un panel cálido con esquinas; dirección: «ese
 * cuadro como parche no es lindo». Ahora es la composición de `#quien` en la
 * portada: la silueta `de-pie` con alfa **sin ningún fondo** detrás, el pelo a
 * la altura de las letras de la firma y el corte del archivo apoyado en la
 * línea del pie. Las medidas, en `estilos.css` («/entrar como Quién soy»).
 *
 * Es la imagen más pesada de la pantalla y, en escritorio, el LCP: **un solo
 * WebP**, `loading` normal y `fetchpriority="high"`. En el teléfono no se monta
 * (`usar-ancho.ts`). Con `alt` vacío porque es ambiente: el nombre de Armando ya
 * lo dice el wordmark, y un lector de pantalla no gana nada con oírlo dos veces.
 */
function ArmandoDePie() {
  return (
    <figure className="de-pie" aria-hidden="true">
      <img
        className="de-pie__img"
        src="/img/armando/de-pie-1400.webp"
        width={1400}
        height={2791}
        alt=""
        fetchPriority="high"
        decoding="async"
      />
    </figure>
  );
}

/**
 * La firma «Construyendo familias fuertes», arriba del formulario y en todos
 * los anchos: **en el lugar del rótulo** de `#quien` (orden #31). En `--tinta`
 * y no en naranja: en esta pantalla el naranja es del botón (D26).
 *
 * Debajo de 1100 px, sin foto (orden #30, 3): a 390×844 la silueta al 40 %
 * más la firma mandaban «Enviarme el código» a ≈ 890, debajo del pliegue.
 */
function Firma() {
  const { t } = useTranslation();
  return <p className="firma" aria-hidden="true">{t('web:comun.marca.tagline')}</p>;
}

/**
 * B.10 · el pie: copyright, las dos páginas legales de la web y la ayuda.
 *
 * El WhatsApp es **el de Gaby**, que es quien atiende la web principal
 * (`CONTACTO_DE_PAGINA` en `@codice/core`), y se arma con el mismo
 * `enlaceWhatsApp` que usa la web: un número, un helper.
 */
function Pie() {
  const { t } = useTranslation();
  return (
    <footer className="pie">
      <div className="pie__dentro">
        <span>{t('web:comun.pie.copyright')}</span>
        <nav className="pie__grupo" aria-label={t('web:comun.pie.legal')}>
          <a href={`${WEB}/privacidad`}>{t('web:comun.pie.privacidad')}</a>
          <a href={`${WEB}/terminos`}>{t('web:comun.pie.terminos')}</a>
          <a href={enlaceWhatsApp(TELEFONO_GABY, t('comun.ayudaMensaje'))} target="_blank" rel="noopener">
            {t('comun.ayuda')} {t('comun.ayudaWhatsapp')}
          </a>
        </nav>
      </div>
    </footer>
  );
}

/**
 * El título de cada pantalla, con su palabra en `--teal` (B.2, C).
 *
 * El naranja **no** va nunca acá: es del botón que hace avanzar, uno por
 * pantalla (D26). La palabra sale de los corchetes del texto —ver `acento.ts`—.
 */
export function Titulo({ texto }: { texto: string }) {
  const { antes, palabra, despues } = partirAcento(texto);
  return (
    <h1 className="titulo">
      {antes}
      {palabra ? <span className="titulo__palabra">{palabra}</span> : null}
      {despues}
    </h1>
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

/** Un `<select>` con su rótulo y su error, con la misma anatomía que `Campo`. */
export function Selector({
  id,
  rotulo,
  error,
  opciones,
  ...resto
}: {
  id: string;
  rotulo: string;
  error?: string | null;
  opciones: { valor: string; texto: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const idError = error ? `${id}-error` : undefined;
  return (
    <label className="campo" htmlFor={id}>
      <span className="campo__rotulo">{rotulo}</span>
      <select id={id} className="campo__entrada" aria-invalid={error ? 'true' : undefined} aria-describedby={idError} {...resto}>
        {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
      {error ? <span className="error" id={idError} role="alert">{error}</span> : null}
    </label>
  );
}

/** Un `<textarea>` con su rótulo, su ayuda y su error. */
export function AreaDeTexto({
  id,
  rotulo,
  ayuda,
  error,
  ...resto
}: {
  id: string;
  rotulo: string;
  ayuda?: string;
  error?: string | null;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  return (
    <label className="campo" htmlFor={id}>
      <span className="campo__rotulo">{rotulo}</span>
      <textarea
        id={id}
        className="campo__entrada campo__entrada--area"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        {...resto}
      />
      {ayuda ? <span className="campo__ayuda" id={idAyuda}>{ayuda}</span> : null}
      {error ? <span className="error" id={idError} role="alert">{error}</span> : null}
    </label>
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
