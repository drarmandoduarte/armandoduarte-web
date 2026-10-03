import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TELEFONO_GABY, enlaceWhatsApp, formasDeEntrar, seccionesDeAjustes, type SeccionDeAjustes,
} from '@codice/core';
import { api, type Yo } from '../comun/api';
import { EnlaceInterno } from '../comun/navegacion';
import { RUTA_DE_SECCION, WEB } from '../rutas';
import { SeccionDeDatos, SeccionDeSeguridad } from './MiEspacio';

/**
 * «Tus preferencias.» (`/ajustes/*`) — orden #34, B.
 *
 * ── El molde ────────────────────────────────────────────────────────────
 * Bitácora, `apps/frontend/src/pages/app/Configuracion.tsx`: el rótulo
 * «§ · CONFIGURACIÓN», el título, y dos columnas —un sub-nav a la izquierda con
 * la línea del activo, la sección a la derecha—. Allá las pestañas son estado
 * (`?tab=`); acá cada sección es una **ruta** (`/ajustes/perfil`…), como pide la
 * orden: se puede enlazar, el «atrás» vuelve y el engranaje la recuerda.
 *
 * Colores de Armando (D26): rótulo y línea del activo en `--teal`; el único
 * naranja de cada sección es su acción principal, y solo Perfil la tiene
 * («Guardar»). Notificaciones guarda al tocar, como Bitácora (sin botón).
 *
 * Qué secciones ve quién lo dice `core` (`seccionesDeAjustes`): Seguridad, solo
 * el equipo. A un cliente que escribe `/ajustes/seguridad` lo devuelve a Inicio
 * `rutaQueCorresponde()`; acá no se pinta nunca para él.
 *
 * Fuera, a propósito: Apariencia, Idioma, Integraciones, Lugares, Plan y
 * Pacientes, que Bitácora tiene y a Armando hoy no le aplican. No se dejan
 * secciones vacías.
 */
export function Ajustes({ yo, correo, proveedores, seccion, recargar, alRegenerar, alPedirPasoReciente, alSalirDeTodo }: {
  yo: Yo;
  correo: string | null;
  /** `app_metadata.providers` de la sesión: con qué entra (B.2). */
  proveedores: readonly string[] | null;
  seccion: SeccionDeAjustes;
  recargar: () => Promise<void>;
  alRegenerar: (codigos: string[]) => void;
  /** #35 · P8, ver `SeccionDeSeguridad`. */
  alPedirPasoReciente: (accion: { reintentar: () => void; cancelar: () => void }) => void;
  alSalirDeTodo: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const secciones = seccionesDeAjustes(yo.tipo === 'equipo');
  /* Un cliente no llega acá con `seguridad` (lo corrige la ruta); si llegara,
     ve Perfil y no una sección que no le toca. */
  const actual = secciones.includes(seccion) ? seccion : 'perfil';

  let cuerpo: ReactNode;
  if (actual === 'perfil') cuerpo = <SeccionDePerfil yo={yo} recargar={recargar} />;
  else if (actual === 'cuenta') cuerpo = <SeccionDeCuenta correo={correo} proveedores={proveedores} alSalirDeTodo={alSalirDeTodo} />;
  else if (actual === 'notificaciones') cuerpo = <SeccionDeNotificaciones yo={yo} recargar={recargar} />;
  else if (actual === 'seguridad') cuerpo = <Seccion clave="seguridad"><SeccionDeSeguridad alRegenerar={alRegenerar} alPedirPasoReciente={alPedirPasoReciente} /></Seccion>;
  else if (actual === 'sesiones') cuerpo = <SeccionDeSesiones />;
  else cuerpo = <SeccionDePrivacidad />;

  return (
    <div className="ajustes">
      <p className="ajustes__rotulo">{t('ajustes.rotulo')}</p>
      <h1 className="titulo ajustes__titulo">{t('ajustes.titulo')}</h1>
      <div className="ajustes__cuerpo">
        <nav className="ajustes__nav" aria-label={t('ajustes.secciones')}>
          <ul>
            {secciones.map((s) => (
              <li key={s}>
                <EnlaceInterno
                  a={RUTA_DE_SECCION[s]}
                  className={`ajustes__item${s === actual ? ' ajustes__item--activo' : ''}`}
                  aria-current={s === actual ? 'page' : undefined}
                >
                  {t(`ajustes.nav.${s}`)}
                </EnlaceInterno>
              </li>
            ))}
          </ul>
        </nav>
        <section className="ajustes__seccion" aria-labelledby={`ajustes-${actual}`}>
          {cuerpo}
        </section>
      </div>
    </div>
  );
}

/** La cabecera de cada sección: título y bajada, como `SectionHeader` de Bitácora. */
function Seccion({ clave, children }: { clave: SeccionDeAjustes; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <header className="ajustes__cabeza">
        <h2 className="ajustes__h2" id={`ajustes-${clave}`}>{t(`ajustes.${clave}.titulo`)}</h2>
        <p className="nota">{t(`ajustes.${clave}.bajada`)}</p>
      </header>
      {children}
    </>
  );
}

/** B.1 · Perfil: «Mis datos» entero, con el WhatsApp de la #32. */
function SeccionDePerfil({ yo, recargar }: { yo: Yo; recargar: () => Promise<void> }) {
  return (
    <Seccion clave="perfil">
      <SeccionDeDatos yo={yo} recargar={recargar} principal />
    </Seccion>
  );
}

/** B.2 · Cuenta: el correo (solo lectura), con qué entra, y salir de todos lados. */
function SeccionDeCuenta({ correo, proveedores, alSalirDeTodo }: {
  correo: string | null;
  proveedores: readonly string[] | null;
  alSalirDeTodo: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [cerrando, setCerrando] = useState(false);
  const formas = formasDeEntrar(proveedores).map((f) => t(`ajustes.cuenta.${f}`)).join(t('ajustes.cuenta.y'));
  return (
    <Seccion clave="cuenta">
      <dl className="ajustes__datos">
        <div className="ajustes__dato">
          <dt className="campo__rotulo">{t('ajustes.cuenta.correo')}</dt>
          <dd className="ajustes__valor" data-correo>{correo ?? '—'}</dd>
          <dd className="campo__ayuda">{t('ajustes.cuenta.correoAyuda')}</dd>
        </div>
        <div className="ajustes__dato">
          <dt className="campo__rotulo">{t('ajustes.cuenta.entrasCon')}</dt>
          <dd className="ajustes__valor" data-entra-con>{formas}</dd>
        </div>
      </dl>
      <div className="seccion">
        <p className="nota">{t('ajustes.cuenta.cerrarTodoAyuda')}</p>
        <div className="fila">
          <button
            type="button"
            className="btn"
            disabled={cerrando}
            onClick={async () => { setCerrando(true); await alSalirDeTodo(); }}
          >
            {cerrando ? t('ajustes.cuenta.cerrandoTodo') : t('ajustes.cuenta.cerrarTodo')}
          </button>
        </div>
      </div>
    </Seccion>
  );
}

/**
 * B.3 · Notificaciones: un interruptor, encendido por defecto. Guarda al tocar
 * (`POST /api/yo`), y si falla vuelve a como estaba y lo dice — el
 * `patchAndRevert` de Bitácora, sin botón «Guardar».
 */
function SeccionDeNotificaciones({ yo, recargar }: { yo: Yo; recargar: () => Promise<void> }) {
  const { t } = useTranslation();
  const [encendido, setEncendido] = useState(yo.persona?.avisos_por_correo !== false);
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'guardado' | 'error'>('quieto');

  async function cambiar() {
    const anterior = encendido;
    setEncendido(!anterior);
    setEstado('guardando');
    try {
      await api('yo', { metodo: 'POST', cuerpo: { avisos_por_correo: !anterior } });
      setEstado('guardado');
      await recargar();
    } catch {
      setEncendido(anterior);
      setEstado('error');
    }
  }

  return (
    <Seccion clave="notificaciones">
      <div className="interruptor">
        <span className="interruptor__texto" id="aviso-correo">{t('ajustes.notificaciones.avisos')}</span>
        <button
          type="button"
          role="switch"
          aria-checked={encendido}
          aria-labelledby="aviso-correo"
          className={`interruptor__boton${encendido ? ' interruptor__boton--encendido' : ''}`}
          onClick={() => void cambiar()}
          disabled={estado === 'guardando'}
          data-interruptor
        >
          <span className="interruptor__perilla" aria-hidden="true" />
        </button>
      </div>
      {estado === 'guardado' ? <p className="exito" role="status">{t('ajustes.notificaciones.guardado')}</p> : null}
      {estado === 'error' ? <p className="error" role="alert">{t('ajustes.notificaciones.error')}</p> : null}
    </Seccion>
  );
}

/**
 * B.5 · Sesiones. **Lo que se puede decir hoy, y nada inventado.**
 *
 * La orden pide la lista de `security_devices` (navegador, última vez, «este
 * dispositivo», «Cerrar» por fila). En Códice esa tabla **no la escribe nadie
 * todavía** —el aviso de «aparato nuevo» que la llena es el PR 5 del kit— y, por
 * diseño de la 005, no guarda el navegador ni se puede ligar a una sesión para
 * cerrarla sola. Una función `mis_dispositivos()` sobre ella devolvería siempre
 * una lista vacía, y la orden misma pide no dejar secciones vacías. Queda como
 * decisión para dirección (informe #34).
 *
 * Lo que sí hay: esta sesión, activa ahora, y «Cerrar las otras sesiones»
 * (`POST /api/sesiones/cerrar-las-otras`, que hasta la #33 estaba en
 * Seguridad, solo para el equipo, y ahora vale para todos).
 */
function SeccionDeSesiones() {
  const { t } = useTranslation();
  const [cerrando, setCerrando] = useState(false);
  const [cerradas, setCerradas] = useState(false);
  const [error, setError] = useState(false);

  async function cerrarOtras() {
    setError(false);
    setCerrando(true);
    try {
      await api('sesiones/cerrar-las-otras', { metodo: 'POST' });
      setCerradas(true);
    } catch {
      setError(true);
    } finally {
      setCerrando(false);
    }
  }

  return (
    <Seccion clave="sesiones">
      <ul className="ajustes__lista">
        <li className="ajustes__fila" data-este-dispositivo>
          <span className="ajustes__valor">{t('ajustes.sesiones.esteDispositivo')}</span>
          <span className="estado estado--confirmada">{t('ajustes.sesiones.ahora')}</span>
        </li>
      </ul>
      <div className="seccion">
        <h3 className="subtitulo">{t('ajustes.sesiones.otras')}</h3>
        <p className="nota u-mt-3">{t('ajustes.sesiones.otrasAyuda')}</p>
        <div className="fila">
          <button type="button" className="btn" onClick={() => void cerrarOtras()} disabled={cerrando}>
            {cerrando ? t('miEspacio.cerrandoOtrasSesiones') : t('miEspacio.cerrarOtrasSesiones')}
          </button>
        </div>
        {cerradas ? <p className="exito" role="status">{t('miEspacio.otrasSesionesCerradas')}</p> : null}
        {error ? <p className="error" role="alert">{t('comun.errorGenerico')}</p> : null}
      </div>
    </Seccion>
  );
}

/** B.6 · Privacidad: texto corto, los dos enlaces de la web y los derechos ARCO por WhatsApp con Gaby. */
function SeccionDePrivacidad() {
  const { t } = useTranslation();
  return (
    <Seccion clave="privacidad">
      <p className="nota">{t('ajustes.privacidad.texto')}</p>
      <ul className="ajustes__enlaces">
        <li><a className="enlace" href={`${WEB}/privacidad`}>{t('ajustes.privacidad.aviso')} →</a></li>
        <li><a className="enlace" href={`${WEB}/terminos`}>{t('ajustes.privacidad.terminos')} →</a></li>
        <li>
          <a className="enlace" href={enlaceWhatsApp(TELEFONO_GABY, t('ajustes.privacidad.arcoMensaje'))} target="_blank" rel="noopener noreferrer" data-arco>
            {t('ajustes.privacidad.arco')} →
          </a>
        </li>
      </ul>
    </Seccion>
  );
}
