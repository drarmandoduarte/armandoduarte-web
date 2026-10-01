import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  NIVELES_EDUCATIVOS, edadDesdeAnio, edicionElegida, edicionPrincipal, paisesParaElegir, perfilParaEnviar,
  principalDeMiEspacio, puedeDeclarar, validarPerfil, type CampoDelPerfil, type PerfilEntrada,
} from '@codice/core';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { BotonPrincipal, Campo, Pantalla, Selector, Titulo } from '../comun/Piezas';
import { RUTAS, WEB } from '../rutas';
import {
  ConfirmacionDeLugar, MisTalleres, TalleresAbiertos, type Confirmacion, type TallerAbierto, type TallerMio,
} from './Talleres';
import type { Cobro } from './Comprobante';

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
 * ── Lo que sumó la #27 C ────────────────────────────────────────────────
 * En «Mis talleres», el pago de cada uno: el estado con palabras de persona,
 * «Ya transferí, subo mi comprobante» y «Ver mi comprobante».
 */
/** Lo que trae `GET /api/talleres`, con su estado de carga. Nunca «cargando» para siempre (#22): un fallo es `error`. */
type Talleres =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; abiertos: TallerAbierto[]; mios: TallerMio[]; cobro: Cobro | null };

function useTalleres() {
  const [talleres, setTalleres] = useState<Talleres>({ estado: 'cargando' });
  const leer = useCallback(async () => {
    try {
      const r = await api<{ abiertos: TallerAbierto[]; mios: TallerMio[]; cobro?: Cobro | null }>('talleres');
      setTalleres({ estado: 'listo', abiertos: r.abiertos, mios: r.mios, cobro: r.cobro ?? null });
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

  /* D26: un naranja por pantalla. Lo decide `principalDeMiEspacio()` (#27 C):
     si vino por `/me-anoto/<slug>`, «Me anoto»; si no, pagar lo que debe va
     antes que anotarse a otro, y anotarse antes que «Guardar». Y si la persona
     abre un paso (anotarse o subir el comprobante), ése pasa a ser el foco. */
  const [foco, setFoco] = useState<'me-anoto' | 'pago' | null>(null);
  const hayMeAnotoPrincipal = talleres.estado === 'listo'
    && edicionPrincipal(talleres.abiertos, edicionElegida(talleres.abiertos, slugElegido)?.edicion_id ?? null) !== null;
  const hayPagoPendiente = talleres.estado === 'listo'
    && talleres.mios.some((m) => puedeDeclarar(m.estado) && Boolean(m.inscripcion_id));
  const principal = confirmacion
    ? null
    : foco ?? principalDeMiEspacio({ vinoAAnotarse: Boolean(slugElegido), hayMeAnoto: hayMeAnotoPrincipal, hayPagoPendiente });

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
          naranja={principal === 'me-anoto'}
          alAbrir={() => setFoco('me-anoto')}
          alConfirmar={(c) => {
            setFoco(null);
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
      {talleres.estado === 'listo' && talleres.mios.length > 0 ? (
        <MisTalleres
          mios={talleres.mios}
          yo={yo}
          cobro={talleres.cobro}
          naranja={principal === 'pago'}
          alAbrir={() => setFoco('pago')}
          alDeclarar={() => { setFoco(null); void leer(); }}
        />
      ) : null}

      <SeccionDeDatos yo={yo} recargar={recargar} principal={principal === 'guardar'} />
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
 * «Tus datos» — y, desde la #27 D, el perfil: país, ciudad, año de nacimiento
 * y nivel educativo. **Todo opcional**; «Guardar» es uno y guarda todo junto
 * (`POST /api/yo`). La edad se calcula al lado del año y nunca se pide la
 * fecha. Debajo, en gris, para qué se piden y el enlace al aviso de privacidad
 * (`armandoduarte.com/privacidad#perfil`).
 *
 * Qué es válido lo dice `@codice/core` (`validarPerfil`); la base lo vuelve a
 * mirar con los `check` de la 001 y la 011.
 */
function SeccionDeDatos({ yo, recargar, principal }: { yo: Yo; recargar: () => Promise<void>; principal: boolean }) {
  const { t, i18n } = useTranslation();
  const p = yo.persona;
  const faltan = !p?.nombre || !p?.apellido || !p?.whatsapp || !p?.pais;
  const [datos, setDatos] = useState<PerfilEntrada>(() => ({
    nombre: p?.nombre ?? '',
    apellido: p?.apellido ?? '',
    whatsapp: p?.whatsapp ?? '',
    pais: p?.pais ?? '',
    ciudad: p?.ciudad ?? '',
    anio_nacimiento: p?.anio_nacimiento ? String(p.anio_nacimiento) : '',
    nivel_educativo: p?.nivel_educativo ?? '',
  }));
  const [errores, setErrores] = useState<Partial<Record<CampoDelPerfil, string>>>({});
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'guardado' | 'error'>('quieto');
  const paises = useMemo(() => paisesParaElegir(i18n.language || 'es'), [i18n.language]);

  const cambiar = (campo: CampoDelPerfil) => (e: { target: { value: string } }) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }));
    setEstado('quieto');
  };
  const anio = /^\d{4}$/.test(datos.anio_nacimiento.trim()) ? Number(datos.anio_nacimiento.trim()) : null;
  const edad = edadDesdeAnio(anio);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const encontrados = validarPerfil(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEstado('guardando');
    try {
      await api('yo', { metodo: 'POST', cuerpo: perfilParaEnviar(datos) });
      setEstado('guardado');
      await recargar();
    } catch {
      setEstado('error');
    }
  }

  const error = (campo: CampoDelPerfil) => (errores[campo] ? t(errores[campo]!) : null);

  return (
    <section className="seccion" id="tus-datos" aria-labelledby="tus-datos-titulo">
      <h2 className="subtitulo" id="tus-datos-titulo">{t('miEspacio.datosTitulo')}</h2>
      {faltan ? <p className="nota">{t('miEspacio.datosFaltan')}</p> : null}
      <form onSubmit={guardar} noValidate>
        <Campo id="nombre" rotulo={t('miEspacio.nombre')} value={datos.nombre} autoComplete="given-name"
          error={error('nombre')} onChange={cambiar('nombre')} />
        <Campo id="apellido" rotulo={t('miEspacio.apellido')} value={datos.apellido} autoComplete="family-name"
          error={error('apellido')} onChange={cambiar('apellido')} />
        <Campo id="whatsapp" rotulo={t('miEspacio.whatsapp')} ayuda={t('miEspacio.whatsappAyuda')}
          value={datos.whatsapp} type="tel" inputMode="tel" autoComplete="tel" error={error('whatsapp')} onChange={cambiar('whatsapp')} />
        <Selector id="pais" rotulo={t('miEspacio.pais')} value={datos.pais} autoComplete="country"
          error={error('pais')} onChange={cambiar('pais')}
          opciones={[{ valor: '', texto: t('miEspacio.sinElegir') }, ...paises.map((x) => ({ valor: x.codigo, texto: x.nombre }))]} />
        <Campo id="ciudad" rotulo={t('miEspacio.ciudad')} value={datos.ciudad} autoComplete="address-level2"
          maxLength={120} error={error('ciudad')} onChange={cambiar('ciudad')} />
        <Campo id="anio_nacimiento" rotulo={t('miEspacio.anioNacimiento')} value={datos.anio_nacimiento}
          inputMode="numeric" maxLength={4} autoComplete="bday-year"
          ayuda={edad !== null ? t('miEspacio.edad', { edad }) : t('miEspacio.anioAyuda')}
          error={error('anio_nacimiento')} onChange={cambiar('anio_nacimiento')} />
        <Selector id="nivel_educativo" rotulo={t('miEspacio.nivelEducativo')} value={datos.nivel_educativo}
          error={error('nivel_educativo')} onChange={cambiar('nivel_educativo')}
          opciones={[{ valor: '', texto: t('miEspacio.sinElegir') }, ...NIVELES_EDUCATIVOS.map((n) => ({ valor: n, texto: t(`miEspacio.niveles.${n}`) }))]} />
        <p className="nota nota--para-que">
          <b>{t('miEspacio.perfil.paraQue')}</b> {t('miEspacio.perfil.paraQueTexto')}{' '}
          <a className="enlace" href={`${WEB}/privacidad#perfil`}>{t('miEspacio.perfil.aviso')}</a>
        </p>
        <div className="fila">
          {principal ? (
            <BotonPrincipal cargando={estado === 'guardando'} textoCargando={t('miEspacio.guardando')}>
              {t('miEspacio.guardar')}
            </BotonPrincipal>
          ) : (
            <button type="submit" className="btn btn--ancho" disabled={estado === 'guardando'}>
              {estado === 'guardando' ? t('miEspacio.guardando') : t('miEspacio.guardar')}
            </button>
          )}
        </div>
        {estado === 'guardado' ? <p className="exito" role="status">{t('miEspacio.guardado')}</p> : null}
        {estado === 'error' ? <p className="error" role="alert">{t('miEspacio.errorAlGuardar')}</p> : null}
      </form>
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
