import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { BotonPrincipal, Campo, Pantalla, Titulo } from '../comun/Piezas';

/**
 * PANTALLA 5 · `/mi-espacio` — lo mínimo de la #15.
 *
 * Saludo, los datos que falten, cerrar sesión. Y si es equipo, además
 * Seguridad: cuántos códigos de respaldo quedan, regenerarlos y cerrar las
 * otras sesiones.
 *
 * ── Lo que NO está, y es a propósito ────────────────────────────────────
 * Ni catálogo, ni inscripción, ni pagos, ni comprobantes. La orden #15 es «la
 * puerta»: que una persona pueda entrar, salir y proteger su cuenta. Todo lo
 * demás llega con las órdenes que lo pidan, y agregarlo ahora sería adivinar
 * qué forma va a tener.
 */
export function MiEspacio({
  yo,
  alSalir,
  alRegenerar,
  recargar,
}: {
  yo: Yo;
  alSalir: () => void;
  /** Sube los códigos nuevos a `App`, que es quien muestra la pantalla 4. */
  alRegenerar: (codigos: string[]) => void;
  recargar: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const esEquipo = yo.tipo === 'equipo';

  return (
    <Pantalla>
      <Titulo
        texto={yo.persona?.nombre
          ? t('miEspacio.saludo', { nombre: yo.persona.nombre })
          : t('miEspacio.saludoSinNombre')}
      />
      <p className="bajada">{t('miEspacio.bajada')}</p>

      <SeccionDeDatos yo={yo} recargar={recargar} />
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
function SeccionDeDatos({ yo }: { yo: Yo; recargar: () => Promise<void> }) {
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
        <BotonPrincipal type="button" disabled>
          {t('miEspacio.guardar')}
        </BotonPrincipal>
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
