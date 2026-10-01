import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { edicionElegida, edicionPrincipal } from '@codice/core';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { BotonPrincipal, Campo, Pantalla, Titulo } from '../comun/Piezas';
import { RUTAS } from '../rutas';
import {
  ConfirmacionDeLugar, MisTalleres, TalleresAbiertos, type Confirmacion, type TallerAbierto, type TallerMio,
} from './Talleres';

/**
 * PANTALLA 5 · `/mi-espacio` — lo mínimo de la #15.
 *
 * Saludo, los datos que falten, cerrar sesión. Y si es equipo, además
 * Seguridad: cuántos códigos de respaldo quedan, regenerarlos y cerrar las
 * otras sesiones.
 *
 * ── Lo que sumó la #24 B ────────────────────────────────────────────────
 * Arriba de «Tus datos»: **«Talleres abiertos»** (con «Me anoto») y **«Mis
 * talleres»** (solo si hay alguno: a quien recién entra no se le muestra una
 * lista vacía debajo de la otra). Al anotarse, la confirmación con la
 * referencia y los datos para transferir ocupa el lugar de la lista.
 *
 * ── Lo que NO está, y es a propósito ────────────────────────────────────
 * Ni pagos ni comprobantes: el comprobante es la orden siguiente.
 */
/** Lo que trae `GET /api/talleres`, con su estado de carga. Nunca «cargando» para siempre (#22): un fallo es `error`. */
type Talleres =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; abiertos: TallerAbierto[]; mios: TallerMio[] };

function useTalleres() {
  const [talleres, setTalleres] = useState<Talleres>({ estado: 'cargando' });
  const leer = useCallback(async () => {
    try {
      const r = await api<{ abiertos: TallerAbierto[]; mios: TallerMio[] }>('talleres');
      setTalleres({ estado: 'listo', abiertos: r.abiertos, mios: r.mios });
    } catch {
      setTalleres({ estado: 'error' });
    }
  }, []);
  useEffect(() => { void leer(); }, [leer]);
  return { talleres, leer };
}

export function MiEspacio({
  yo,
  slugElegido = null,
  alSalir,
  alRegenerar,
  recargar,
}: {
  yo: Yo;
  /** El taller de `/me-anoto/<slug>`, si se llegó por ahí (#24 B). */
  slugElegido?: string | null;
  alSalir: () => void;
  /** Sube los códigos nuevos a `App`, que es quien muestra la pantalla 4. */
  alRegenerar: (codigos: string[]) => void;
  recargar: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const esEquipo = yo.tipo === 'equipo';
  const { talleres, leer } = useTalleres();
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  /* D26: un naranja por pantalla. Si hay un «Me anoto» que lo lleva, «Guardar»
     de «Tus datos» —que además está apagado hasta que exista guardar— pasa a
     contorno. */
  const hayMeAnotoPrincipal = talleres.estado === 'listo'
    && edicionPrincipal(talleres.abiertos, edicionElegida(talleres.abiertos, slugElegido)?.edicion_id ?? null) !== null;

  return (
    <Pantalla>
      <Titulo
        texto={yo.persona?.nombre
          ? t('miEspacio.saludo', { nombre: yo.persona.nombre })
          : t('miEspacio.saludoSinNombre')}
      />
      <p className="bajada">{t('miEspacio.bajada')}</p>
      {/* #24 A: a quien es del equipo le aparece arriba la entrada al panel. */}
      {esEquipo ? (
        <p className="u-mt-4">
          <a href={RUTAS.equipo} className="btn btn--ancho">{t('miEspacio.panelDelEquipo')} <span aria-hidden="true">→</span></a>
        </p>
      ) : null}

      {confirmacion ? (
        <ConfirmacionDeLugar c={confirmacion} yo={yo} alCerrar={() => setConfirmacion(null)} />
      ) : talleres.estado === 'cargando' ? (
        <section className="seccion"><p className="nota" role="status">{t('miEspacio.talleresCargando')}</p></section>
      ) : talleres.estado === 'error' ? (
        <section className="seccion">
          <h2 className="subtitulo">{t('miEspacio.talleresTitulo')}</h2>
          <p className="error" role="alert">{t('miEspacio.talleresError')}</p>
          <div className="fila">
            <button type="button" className="btn btn--ancho" onClick={() => void leer()}>{t('comun.reintentar')}</button>
          </div>
        </section>
      ) : (
        <TalleresAbiertos
          talleres={talleres.abiertos}
          slugElegido={slugElegido}
          yo={yo}
          alConfirmar={(c) => {
            setConfirmacion(c);
            window.scrollTo({ top: 0 });
            /* La ficha pudo cambiar (nombre, apellido, WhatsApp) y la lista
               también (su referencia, un lugar menos). */
            void recargar();
            void leer();
          }}
          alCambiar={() => void leer()}
        />
      )}
      {talleres.estado === 'listo' && talleres.mios.length > 0 ? <MisTalleres mios={talleres.mios} yo={yo} /> : null}

      <SeccionDeDatos yo={yo} recargar={recargar} principal={!hayMeAnotoPrincipal && !confirmacion} />
      {esEquipo ? <SeccionDeSeguridad alRegenerar={alRegenerar} /> : null}

      <div className="seccion">
        <button type="button" className="btn btn--ancho" onClick={alSalir}>
          {t('comun.cerrarSesion')}
        </button>
      </div>
    </Pantalla>
  );
}

/**
 * Los datos de la persona.
 *
 * Se piden **solo si faltan**, y el aviso lo dice con su porqué: sin WhatsApp
 * no hay forma de avisarle de su taller, que es para lo que dejó el dato. Un
 * formulario que aparece completo y sin explicación se lee como un trámite.
 *
 * ── Nota de alcance, que va escrita ────────────────────────────────────
 * **Guardar todavía no está implementado**: la #15 no trae el `PATCH /api/yo`
 * —su sección B enumera cuatro rutas y ésa no está—. El formulario se dibuja
 * porque la orden pide que la pantalla lo tenga; el botón queda apagado y lo
 * dice. La ruta llega con la orden que la pida, y entonces esta nota se borra.
 */
function SeccionDeDatos({ yo, principal }: { yo: Yo; recargar: () => Promise<void>; principal: boolean }) {
  const { t } = useTranslation();
  const p = yo.persona;
  const faltan = !p?.nombre || !p?.apellido || !p?.whatsapp || !p?.pais;

  const [nombre, setNombre] = useState(p?.nombre ?? '');
  const [apellido, setApellido] = useState(p?.apellido ?? '');
  const [whatsapp, setWhatsapp] = useState(p?.whatsapp ?? '');
  const [pais, setPais] = useState(p?.pais ?? '');

  return (
    <section className="seccion">
      <h2 className="subtitulo">{t('miEspacio.datosTitulo')}</h2>
      {faltan ? <p className="nota">{t('miEspacio.datosFaltan')}</p> : null}
      <Campo id="nombre" rotulo={t('miEspacio.nombre')} value={nombre} autoComplete="given-name"
        onChange={(e) => setNombre(e.target.value)} />
      <Campo id="apellido" rotulo={t('miEspacio.apellido')} value={apellido} autoComplete="family-name"
        onChange={(e) => setApellido(e.target.value)} />
      <Campo id="whatsapp" rotulo={t('miEspacio.whatsapp')} ayuda={t('miEspacio.whatsappAyuda')}
        value={whatsapp} type="tel" inputMode="tel" autoComplete="tel"
        onChange={(e) => setWhatsapp(e.target.value)} />
      <Campo id="pais" rotulo={t('miEspacio.pais')} value={pais} autoComplete="country-name"
        onChange={(e) => setPais(e.target.value)} />
      <div className="fila">
        {/* Apagado hasta que exista `PATCH /api/yo`. Ver la nota de arriba. */}
        {principal ? (
          <BotonPrincipal type="button" disabled>
            {t('miEspacio.guardar')}
          </BotonPrincipal>
        ) : (
          <button type="button" className="btn btn--ancho" disabled>{t('miEspacio.guardar')}</button>
        )}
      </div>
    </section>
  );
}

/** Seguridad: solo para el equipo. */
function SeccionDeSeguridad({ alRegenerar }: { alRegenerar: (codigos: string[]) => void }) {
  const { t } = useTranslation();
  const [quedan, setQuedan] = useState<number | null>(null);
  const [regenerando, setRegenerando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [cerradas, setCerradas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const r = await api<{ quedan: number }>('respaldo/cuantos');
        if (vivo) setQuedan(r.quedan);
      } catch {
        /* No se pinta nada: cuántos códigos quedan es información útil, no
           crítica, y un error acá no tiene por qué ensuciar la pantalla. */
      }
    })();
    return () => { vivo = false; };
  }, []);

  async function regenerar() {
    setError(null);
    setRegenerando(true);
    try {
      const r = await api<{ codigos: string[] }>('respaldo/generar', { metodo: 'POST' });
      alRegenerar(r.codigos);
    } catch (fallo) {
      /* `PASO_RECIENTE_REQUERIDO` es el 403 que manda el kit cuando la
         verificación del autenticador ya no es reciente. Se traduce a NUESTRO
         texto —el del kit está en voseo y no se puede tocar— y se muestra el
         `PasoRecienteGate`, que llega con la orden que lo necesite; hoy el
         mensaje alcanza para que la persona sepa qué hacer. */
      setError(
        fallo instanceof ErrorDeApi && fallo.codigo === 'PASO_RECIENTE_REQUERIDO'
          ? t('pasoReciente.bajada')
          : t('comun.errorGenerico'),
      );
    } finally {
      setRegenerando(false);
    }
  }

  async function cerrarOtras() {
    setError(null);
    setCerrando(true);
    try {
      await api('sesiones/cerrar-las-otras', { metodo: 'POST' });
      setCerradas(true);
    } catch {
      setError(t('comun.errorGenerico'));
    } finally {
      setCerrando(false);
    }
  }

  const pocos = quedan !== null && quedan <= 3;

  return (
    <section className="seccion">
      <h2 className="subtitulo">{t('miEspacio.seguridadTitulo')}</h2>

      <h3 className="nota u-mt-4">{t('respaldo.regenerarTitulo')}</h3>
      {quedan === null ? null : (
        <p className="nota">
          {pocos ? t('respaldo.quedanPocos', { cuantos: quedan }) : t('respaldo.quedan', { cuantos: quedan })}
        </p>
      )}
      <p className="nota">{t('respaldo.regenerarAviso')}</p>
      <div className="fila">
        <button type="button" className="btn btn--ancho" onClick={regenerar} disabled={regenerando}>
          {regenerando ? t('respaldo.regenerando') : t('respaldo.regenerar')}
        </button>
      </div>

      <h3 className="nota u-mt-6">{t('miEspacio.cerrarOtrasSesiones')}</h3>
      <p className="nota">{t('miEspacio.cerrarOtrasAyuda')}</p>
      <div className="fila">
        <button type="button" className="btn btn--ancho" onClick={cerrarOtras} disabled={cerrando}>
          {cerrando ? t('miEspacio.cerrandoOtrasSesiones') : t('miEspacio.cerrarOtrasSesiones')}
        </button>
      </div>
      {cerradas ? <p className="exito" role="status">{t('miEspacio.otrasSesionesCerradas')}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </section>
  );
}
