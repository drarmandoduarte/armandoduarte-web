import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays, ChevronLeft, ChevronRight, House, LayoutDashboard, LogOut, Menu, Ticket, UserRound, X,
} from 'lucide-react';
import { slugDeMeAnoto } from '@codice/core';
import { RUTAS, WEB } from '../rutas';
import { EnlaceInterno } from './navegacion';
import { usarAncho } from './usar-ancho';

/**
 * El marco de Mi espacio por dentro — orden #29, A.
 *
 * ── El molde, y lo que se copió de él ───────────────────────────────────
 * Bitácora (`apps/frontend/src/components/Sidebar.tsx`, `AppShell.tsx` y
 * `layouts/DashboardLayout.tsx`): una barra de 256 px a la izquierda con el
 * nombre arriba y un chevron que la pliega a 64 (solo íconos), el `nav` con
 * ícono Lucide de trazo 1,5 y texto, el ítem activo marcado, y abajo la cuenta
 * y «Salir». El estado plegado se guarda en el navegador. Debajo de un ancho,
 * la barra no se monta y es un cajón que se abre desde la cabecera.
 *
 * Se copió la **estructura y el comportamiento**, no los colores: acá la barra
 * es `--calido` con su borde `--hair`, el activo es `--tinta` sobre `--crema`
 * con la línea `--teal` de 2 px, y no hay naranja (D26: es del botón principal
 * de cada pantalla, y la barra no es una pantalla).
 *
 * ── Por qué la frontera se decide en JS y no con `display:none` ─────────
 * Lo mismo que Bitácora y que el panel de `/entrar` (`usar-ancho.ts`): se
 * monta el árbol que corresponde y nada más. Con CSS habría dos `nav` con los
 * mismos enlaces en el documento, y un lector de pantalla los leería dos veces.
 */

/** Debajo de esto, la barra es un cajón (A.4). */
export const ANCHO_CON_BARRA = '(min-width: 900px)';

/** Dónde se guarda si la barra está plegada. Por navegador, como en Bitácora. */
const CLAVE_PLEGADA = 'codice.barra-plegada';

type Icono = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>;
export interface ItemDeLaBarra { ruta: string; clave: string; Icono: Icono }

/**
 * Los ítems de la barra, en el orden de la orden (A.1). El panel del equipo,
 * solo para el equipo y después de un separador: para un cliente son cuatro.
 */
export function itemsDeLaBarra(esEquipo: boolean): { principales: ItemDeLaBarra[]; equipo: ItemDeLaBarra[] } {
  return {
    principales: [
      { ruta: RUTAS.miEspacio, clave: 'marco.inicio', Icono: House },
      { ruta: RUTAS.talleres, clave: 'marco.talleres', Icono: CalendarDays },
      { ruta: RUTAS.misTalleres, clave: 'marco.misTalleres', Icono: Ticket },
      { ruta: RUTAS.misDatos, clave: 'marco.misDatos', Icono: UserRound },
    ],
    equipo: esEquipo ? [{ ruta: RUTAS.equipo, clave: 'marco.panel', Icono: LayoutDashboard }] : [],
  };
}

/** Qué ítem está activo: `/me-anoto/<slug>` es Talleres con ese taller elegido (A.5). */
export function rutaDelItemActivo(ruta: string): string {
  return slugDeMeAnoto(ruta) !== null ? RUTAS.talleres : ruta;
}

function leerPlegada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_PLEGADA) === '1';
  } catch {
    return false;
  }
}

function guardarPlegada(plegada: boolean): void {
  try {
    window.localStorage.setItem(CLAVE_PLEGADA, plegada ? '1' : '0');
  } catch {
    /* Sin almacenamiento: se pliega igual, y la próxima vez arranca abierta. */
  }
}

export function Marco({
  ruta,
  esEquipo,
  correo,
  alSalir,
  ancha = false,
  children,
}: {
  ruta: string;
  esEquipo: boolean;
  /** El correo de la sesión, para el pie de la barra. */
  correo: string | null;
  alSalir: () => void;
  /** El panel del equipo: sus tablas necesitan más que 720 px. */
  ancha?: boolean;
  children: ReactNode;
}) {
  const conBarra = usarAncho(ANCHO_CON_BARRA);
  const [plegada, setPlegada] = useState(leerPlegada);
  const plegar = () => setPlegada((p) => { guardarPlegada(!p); return !p; });

  const contenido = (
    <main className="app__contenido" id="contenido">
      <div className={`app__columna${ancha ? ' app__columna--ancha' : ''}`}>{children}</div>
    </main>
  );

  if (conBarra) {
    return (
      <div className={`app${plegada ? ' app--plegada' : ''}`}>
        <Barra ruta={ruta} esEquipo={esEquipo} correo={correo} alSalir={alSalir} plegada={plegada} alPlegar={plegar} />
        {contenido}
      </div>
    );
  }
  return (
    <div className="app app--movil">
      <CabeceraMovil ruta={ruta} esEquipo={esEquipo} correo={correo} alSalir={alSalir} />
      {contenido}
    </div>
  );
}

function Barra({
  ruta, esEquipo, correo, alSalir, plegada, alPlegar, alCerrar, alNavegar,
}: {
  ruta: string;
  esEquipo: boolean;
  correo: string | null;
  alSalir: () => void;
  plegada: boolean;
  /** En escritorio: el chevron. */
  alPlegar?: () => void;
  /** En el cajón: la X. */
  alCerrar?: () => void;
  /** En el cajón: navegar lo cierra. */
  alNavegar?: () => void;
}) {
  const { t } = useTranslation();
  const { principales, equipo } = itemsDeLaBarra(esEquipo);
  const activa = rutaDelItemActivo(ruta);

  const item = ({ ruta: destino, clave, Icono: I }: ItemDeLaBarra) => (
    <li key={destino}>
      <EnlaceInterno
        a={destino}
        className={`lateral__item${activa === destino ? ' lateral__item--activo' : ''}`}
        aria-current={activa === destino ? 'page' : undefined}
        title={plegada ? t(clave) : undefined}
        aria-label={plegada ? t(clave) : undefined}
        onClick={alNavegar}
      >
        <I size={20} strokeWidth={1.5} aria-hidden />
        {plegada ? null : <span>{t(clave)}</span>}
      </EnlaceInterno>
    </li>
  );

  return (
    <aside className={`lateral${plegada ? ' lateral--plegada' : ''}`}>
      <div className="lateral__cabeza">
        {plegada ? null : (
          <EnlaceInterno a={RUTAS.miEspacio} className="lateral__marca" aria-label={t('marco.irAInicio')} onClick={alNavegar}>
            <b>{t('web:comun.marca.nombre')}</b>
          </EnlaceInterno>
        )}
        {alCerrar ? (
          <button type="button" className="lateral__accion" onClick={alCerrar} aria-label={t('marco.cerrarMenu')}>
            <X size={18} strokeWidth={1.5} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="lateral__accion"
            onClick={alPlegar}
            aria-label={plegada ? t('marco.desplegar') : t('marco.plegar')}
            aria-expanded={!plegada}
            data-plegar
          >
            {plegada ? <ChevronRight size={18} strokeWidth={1.5} aria-hidden /> : <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />}
          </button>
        )}
      </div>

      <nav className="lateral__nav" aria-label={t('marco.navegacion')}>
        <ul>{principales.map(item)}</ul>
        {equipo.length > 0 ? (
          <>
            <hr className="lateral__separador" />
            <ul>{equipo.map(item)}</ul>
          </>
        ) : null}
      </nav>

      <div className="lateral__pie">
        {plegada || !correo ? null : <p className="lateral__correo" title={correo}>{correo}</p>}
        <button
          type="button"
          className="lateral__item lateral__salir"
          onClick={alSalir}
          title={plegada ? t('marco.salir') : undefined}
          aria-label={plegada ? t('marco.salir') : undefined}
        >
          <LogOut size={20} strokeWidth={1.5} aria-hidden />
          {plegada ? null : <span>{t('marco.salir')}</span>}
        </button>
        {plegada ? null : <a className="lateral__web" href={WEB}>← {t('marco.volverALaWeb')}</a>}
      </div>
    </aside>
  );
}

/**
 * A.4 · debajo de 900 px: la cabecera con el nombre y «Menú», y la barra como
 * cajón desde la izquierda, sobre el telón grafito del menú de la web. Foco
 * atrapado adentro mientras está abierto, Esc lo cierra, y al cerrarse el foco
 * vuelve a «Menú». Navegar también lo cierra.
 */
function CabeceraMovil({ ruta, esEquipo, correo, alSalir }: { ruta: string; esEquipo: boolean; correo: string | null; alSalir: () => void }) {
  const { t } = useTranslation();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const cajon = useRef<HTMLDivElement>(null);
  const estabaAbierto = useRef(false);

  useEffect(() => {
    if (!abierto) {
      if (estabaAbierto.current) boton.current?.focus();
      estabaAbierto.current = false;
      return;
    }
    estabaAbierto.current = true;
    const caja = cajon.current;
    const enfocables = () => [...(caja?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])];
    enfocables()[0]?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setAbierto(false); return; }
      if (e.key !== 'Tab') return;
      const lista = enfocables();
      if (lista.length === 0) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', alTeclear);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = '';
    };
  }, [abierto]);

  return (
    <>
      <header className="app__cabeza">
        <EnlaceInterno a={RUTAS.miEspacio} className="lateral__marca" aria-label={t('marco.irAInicio')}>
          <b>{t('web:comun.marca.nombre')}</b>
        </EnlaceInterno>
        <button
          ref={boton}
          type="button"
          className="app__menu"
          onClick={() => setAbierto(true)}
          aria-expanded={abierto}
          aria-controls="cajon"
        >
          <Menu size={20} strokeWidth={1.5} aria-hidden /> {t('marco.menu')}
        </button>
      </header>
      {abierto ? (
        <div className="cajon" id="cajon" role="dialog" aria-modal="true" aria-label={t('marco.navegacion')} ref={cajon}>
          <div className="cajon__telon" onClick={() => setAbierto(false)} aria-hidden="true" />
          <Barra
            ruta={ruta}
            esEquipo={esEquipo}
            correo={correo}
            alSalir={alSalir}
            plegada={false}
            alCerrar={() => setAbierto(false)}
            alNavegar={() => setAbierto(false)}
          />
        </div>
      ) : null}
    </>
  );
}

/**
 * La cabecera del contenido (A.2): el título de la pantalla y, si corresponde,
 * una línea gris. El título lleva su palabra en `--teal` (`Titulo`).
 */
export function CabeceraDeContenido({ titulo, bajada }: { titulo: ReactNode; bajada?: string }) {
  return (
    <div className="app__titulo">
      {titulo}
      {bajada ? <p className="bajada">{bajada}</p> : null}
    </div>
  );
}
