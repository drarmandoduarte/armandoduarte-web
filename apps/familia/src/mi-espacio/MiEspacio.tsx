import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  NIVELES_EDUCATIVOS, edadDesdeAnio, paisesParaElegir, perfilParaEnviar, puedeDeclarar, validarPerfil,
  type CampoDelPerfil, type PerfilEntrada,
} from '@codice/core';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { BotonPrincipal, Campo, Selector, Titulo } from '../comun/Piezas';
import { CampoWhatsApp } from '../comun/CampoWhatsApp';
import { CabeceraDeContenido } from '../comun/Marco';
import { EnlaceInterno, useNavegar } from '../comun/navegacion';
import { RUTAS, WEB } from '../rutas';
import {
  ConfirmacionDeLugar, MisTalleres, TalleresAbiertos, type Confirmacion, type TallerAbierto, type TallerMio,
} from './Talleres';
import type { Cobro } from './Comprobante';

/**
 * Las pantallas de Mi espacio por dentro — orden #29, B.
 *
 * Hasta la #28 todo esto era **una** pantalla (`/mi-espacio`): saludo, talleres
 * abiertos, mis talleres, tus datos, seguridad y cerrar sesión, apilados. La
 * #29 lo reparte en los lugares de la barra lateral, **cada uno tal cual era**:
 *
 *   · `/talleres` — «Talleres abiertos» de la #24 B, con «Me anoto»;
 *   · `/mis-talleres` — «Mis talleres» de la #24 B + #27 C (estado, comprobante);
 *   · `/mis-datos` — «Tus datos» de la #18 + #27 D y, para el equipo, Seguridad
 *     (desde la #34, Ajustes → Perfil y Ajustes → Seguridad, en `Ajustes.tsx`);
 *   · Inicio (`/mi-espacio`) es nuevo y vive en `Inicio.tsx`.
 *
 * «Cerrar sesión» pasó a la barra («Salir»). El marco lo pone `App.tsx`.
 *
 * ── Un naranja por pantalla (D26), ahora que son varias ─────────────────
 * Cada pantalla tiene su acción principal y nada más: en Talleres, «Me anoto»;
 * en Mis talleres, pagar lo que se debe; en Mis datos, «Guardar». Lo que antes
 * decidía `principalDeMiEspacio()` entre las tres ya no hace falta decidirlo:
 * no están en la misma pantalla.
 */
/** Lo que trae `GET /api/talleres`, con su estado de carga. Nunca «cargando» para siempre (#22): un fallo es `error`. */
type Talleres =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; abiertos: TallerAbierto[]; mios: TallerMio[]; cobro: Cobro | null };

export function useTalleres() {
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

/** Cargando o error, igual en las dos pantallas de talleres. */
function EstadoDeLaLista({ talleres, leer }: { talleres: Talleres; leer: () => Promise<void> }) {
  const { t } = useTranslation();
  if (talleres.estado === 'cargando') {
    return <section className="seccion"><p className="nota" role="status">{t('miEspacio.talleresCargando')}</p></section>;
  }
  return (
    <section className="seccion">
      <p className="error" role="alert">{t('miEspacio.talleresError')}</p>
      <div className="fila">
        <button type="button" className="btn btn--ancho" onClick={() => void leer()}>{t('comun.reintentar')}</button>
      </div>
    </section>
  );
}

/** `/talleres` y `/me-anoto/<slug>`: los talleres abiertos, y al anotarse, la confirmación. */
export function PaginaDeTalleres({ yo, slugElegido = null, recargar }: {
  yo: Yo;
  /** El taller de `/me-anoto/<slug>`, si se llegó por ahí (#24 B). */
  slugElegido?: string | null;
  recargar: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const navegar = useNavegar();
  const { talleres, leer } = useTalleres();
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  return (
    <>
      <CabeceraDeContenido titulo={<Titulo texto={t('paginas.talleres')} />} bajada={t('paginas.talleresBajada')} />
      {confirmacion ? (
        <ConfirmacionDeLugar c={confirmacion} yo={yo} alCerrar={() => navegar(RUTAS.misTalleres)} />
      ) : talleres.estado !== 'listo' ? (
        <EstadoDeLaLista talleres={talleres} leer={leer} />
      ) : (
        <TalleresAbiertos
          talleres={talleres.abiertos}
          slugElegido={slugElegido}
          yo={yo}
          sinTitulo
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
    </>
  );
}

/** `/mis-talleres`: mis inscripciones, su estado y el comprobante (#24 B + #27 C). */
export function PaginaDeMisTalleres({ yo }: { yo: Yo }) {
  const { t } = useTranslation();
  const { talleres, leer } = useTalleres();
  return (
    <>
      <CabeceraDeContenido titulo={<Titulo texto={t('paginas.misTalleres')} />} bajada={t('paginas.misTalleresBajada')} />
      {talleres.estado !== 'listo' ? (
        <EstadoDeLaLista talleres={talleres} leer={leer} />
      ) : talleres.mios.length === 0 ? (
        <section className="seccion">
          <p className="nota">{t('paginas.misTalleresVacio')}</p>
          <p className="u-mt-4"><EnlaceInterno a={RUTAS.talleres} className="enlace">{t('paginas.verTalleres')} →</EnlaceInterno></p>
        </section>
      ) : (
        <MisTalleres
          mios={talleres.mios}
          yo={yo}
          cobro={talleres.cobro}
          sinTitulo
          naranja={talleres.mios.some((m) => puedeDeclarar(m.estado) && Boolean(m.inscripcion_id))}
          alDeclarar={() => void leer()}
        />
      )}
    </>
  );
}

/**
 * Ajustes → Perfil (#34 B.1; hasta la #33, `/mis-datos`).
 *
 * «Tus datos» — y, desde la #27 D, el perfil: país, ciudad, año de nacimiento
 * y nivel educativo. **Todo opcional**; «Guardar» es uno y guarda todo junto
 * (`POST /api/yo`). La edad se calcula al lado del año y nunca se pide la
 * fecha. Debajo, en gris, para qué se piden y el enlace al aviso de privacidad
 * (`armandoduarte.com/privacidad#perfil`).
 *
 * Qué es válido lo dice `@codice/core` (`validarPerfil`); la base lo vuelve a
 * mirar con los `check` de la 001 y la 011.
 */
export function SeccionDeDatos({ yo, recargar, principal }: { yo: Yo; recargar: () => Promise<void>; principal: boolean }) {
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
      <h2 className="solo-lectura" id="tus-datos-titulo">{t('miEspacio.datosTitulo')}</h2>
      {faltan ? <p className="nota">{t('miEspacio.datosFaltan')}</p> : null}
      <form onSubmit={guardar} noValidate>
        <Campo id="nombre" rotulo={t('miEspacio.nombre')} value={datos.nombre} autoComplete="given-name"
          error={error('nombre')} onChange={cambiar('nombre')} />
        <Campo id="apellido" rotulo={t('miEspacio.apellido')} value={datos.apellido} autoComplete="family-name"
          error={error('apellido')} onChange={cambiar('apellido')} />
        <CampoWhatsApp id="whatsapp" rotulo={t('miEspacio.whatsapp')} ayuda={t('miEspacio.whatsappAyuda')}
          valor={datos.whatsapp} paisSugerido={datos.pais || null} error={errores.whatsapp}
          alCambiar={(v) => cambiar('whatsapp')({ target: { value: v } })} />
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

/**
 * Ajustes → Seguridad (#34 B.4): solo para el equipo. Los códigos de respaldo,
 * tal cual estaban al final de Mis datos. «Cerrar las otras sesiones» se mudó a
 * Ajustes → Sesiones, que ven todos.
 */
export function SeccionDeSeguridad({ alRegenerar }: { alRegenerar: (codigos: string[]) => void }) {
  const { t } = useTranslation();
  const [quedan, setQuedan] = useState<number | null>(null);
  const [regenerando, setRegenerando] = useState(false);
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

  const pocos = quedan !== null && quedan <= 3;

  return (
    <div>
      <h3 className="subtitulo">{t('respaldo.regenerarTitulo')}</h3>
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

      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
