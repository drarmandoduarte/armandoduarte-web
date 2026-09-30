import { useState, type ReactNode } from 'react';
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
}: {
  children: ReactNode;
  conArmando?: boolean;
}) {
  /* Panel o retrato, nunca los dos: se monta el que corresponde al ancho y la
     otra imagen no se descarga (ver `usar-ancho.ts`, con la medición). */
  const dosMitades = usarAncho(ANCHO_DE_DOS_MITADES);
  return (
    <div className={`marco${conArmando ? ' marco--con-armando' : ''}`}>
      <Cabecera />
      {conArmando && dosMitades ? <PanelDeArmando /> : null}
      <main className="marco__principal">
        <div className="columna">
          {conArmando && !dosMitades ? <RetratoChico /> : null}
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
 * A · el mundo de Armando, a ≥ 1100 px: el panel cálido a sangre, la firma
 * arriba y el busto apoyado en el borde de abajo, como en «Sobre el
 * facilitador» de `/merida`.
 *
 * El busto es la imagen más pesada de la pantalla y, en escritorio, el LCP. Por
 * eso: **un solo WebP**, `loading` normal y `fetchpriority="high"`.
 *
 * Es el recorte de **900** (67 KB) y no el de 560 (42 KB), por decisión de
 * dirección (auditoría del PR #32, 30/9): la foto termina en seco en los dos
 * brazos, y con el de 560 a ~470 px el corte del brazo izquierdo quedaba a la
 * vista a 1440. Con el de 900 el busto ocupa **el ancho entero del panel** y
 * los dos cortes coinciden con sus bordes. Premium primero: 25 KB más, en una
 * pantalla que se visita una vez por sesión y que en el teléfono no la baja
 * (`usar-ancho.ts`). Con `alt` vacío porque
 * es ambiente: el nombre de Armando ya lo dice el wordmark de al lado, y un
 * lector de pantalla no gana nada con oír «Armando Duarte» dos veces seguidas.
 *
 * La firma **no** va en naranja, aunque en el pie de la web sí: en esta
 * pantalla el naranja es del botón y de nadie más (B.2, D26). Va en `--tinta`.
 */
function PanelDeArmando() {
  const { t } = useTranslation();
  return (
    <aside className="panel" aria-hidden="true">
      <p className="panel__firma">{t('web:comun.marca.tagline')}</p>
      <div className="panel__foto">
        <img
          className="panel__busto"
          src="/img/armando/medio-cuerpo-900.webp"
          width={900}
          height={1087}
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </div>
    </aside>
  );
}

/**
 * A · a < 1100 px el panel no está y queda Armando en chico, arriba del título.
 *
 * `loading="lazy"` aunque se vea sin desplazar, y está medido: en el teléfono
 * el LCP es el texto de la bajada, no esta foto, y bajándola de entrada se
 * sumaba al camino del LCP en la red simulada de Lighthouse (73 con, 75 sin).
 * Con `lazy` baja apenas se pinta la pantalla, que para 5 KB es lo mismo.
 */
function RetratoChico() {
  const { t } = useTranslation();
  return (
    <img
      className="retrato-chico"
      src="/img/armando/retrato-128.webp"
      width={64}
      height={64}
      alt={t('entrar.retratoAlt')}
      loading="lazy"
    />
  );
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
 * B.9 · el aviso legal, con los dos enlaces a las páginas de la web.
 * Va en `/entrar`, que es donde se acepta.
 */
export function AvisoLegal() {
  const { t } = useTranslation();
  return (
    <p className="aviso-legal">
      {t('comun.avisoLegalAntes')}
      <a href={`${WEB}/privacidad`}>{t('web:comun.pie.privacidad')}</a>
      {t('comun.avisoLegalMedio')}
      <a href={`${WEB}/terminos`}>{t('web:comun.pie.terminos')}</a>
      {t('comun.avisoLegalDespues')}
    </p>
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
 * El campo de los seis dígitos — seis casillas (orden Códice #18, B.8 y F).
 *
 * ── Se ven seis, y es **una** entrada ───────────────────────────────────
 * La #15 dejó escrita la razón para no hacer seis cajitas: seis `<input>`
 * rompen el pegado desde el portapapeles, rompen el autocompletado del código
 * del correo y obligan a manejar el foco a mano, que es donde esos componentes
 * fallan con teclado y con lector de pantalla. La razón sigue siendo cierta, y
 * dirección pidió las seis casillas (B.8). Las dos cosas caben juntas:
 *
 *   · hay **un solo `<input>`**, transparente, encima de la fila. Recibe el
 *     teclado, el pegado entero y el `autoComplete="one-time-code"` de iOS, y
 *     el lector de pantalla lo anuncia como un campo, con su rótulo;
 *   · las seis casillas son **dibujo** (`aria-hidden`): muestran el dígito de
 *     cada posición y resaltan la que sigue, que es el «foco que avanza solo».
 *
 * Pegar «123 456» o «123-456» deja seis dígitos: se limpia todo lo que no es
 * número y se corta en seis. Lo prueba `casillas.test.tsx`.
 */
/* Las seis posiciones, escritas. No `Array.from`: `sin-base-desde-el-navegador`
   busca `.from(` —la lectura directa de Supabase— y tiene razón en no saber
   distinguirlo. Mejor no darle nada que distinguir. */
const POSICIONES = [0, 1, 2, 3, 4, 5] as const;

export function CampoDeCodigo(props: {
  id: string;
  rotulo: string;
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string | null;
  autoFocus?: boolean;
}) {
  const [enfocado, setEnfocado] = useState(false);
  const idError = props.error ? `${props.id}-error` : undefined;
  const siguiente = Math.min(props.valor.length, 5);
  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={props.id}>{props.rotulo}</label>
      <div className="casillas">
        <input
          id={props.id}
          className="casillas__entrada"
          value={props.valor}
          onChange={(e) => props.alCambiar(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus={props.autoFocus}
          aria-invalid={props.error ? 'true' : undefined}
          aria-describedby={idError}
        />
        <div className="casillas__fila" aria-hidden="true">
          {POSICIONES.map((i) => (
            <span
              key={i}
              data-casilla={i}
              className={`casilla${props.valor[i] ? ' casilla--llena' : ''}${enfocado && i === siguiente ? ' casilla--sigue' : ''}`}
            >
              {props.valor[i] ?? ''}
            </span>
          ))}
        </div>
      </div>
      {props.error ? <span className="error" id={idError} role="alert">{props.error}</span> : null}
    </div>
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
