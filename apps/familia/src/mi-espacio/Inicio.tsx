import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import {
  PREFIJO_ME_ANOTO, TELEFONO_GABY, claveDeEstado, edicionesVigentes, enlaceWhatsApp, estadoDelTaller,
  faltanEnLaFicha, proximoTaller, tonoDeEstado,
} from '@codice/core';
import { api, type Yo } from '../comun/api';
import { CabeceraDeContenido } from '../comun/Marco';
import { EnlaceInterno } from '../comun/navegacion';
import { Titulo } from '../comun/Piezas';
import { RUTAS } from '../rutas';
import type { CursoDelPanel, Inscripto } from '../equipo/tipos';
import { Fecha, zonaDeLaPersona } from './Talleres';
import { useTalleres } from './MiEspacio';

/**
 * Inicio (`/mi-espacio`) — orden #29, B.
 *
 * «Hola, {nombre}» y tres tarjetas en fila (apiladas en el teléfono): **Tu
 * próximo taller**, **Tus datos** y **¿Necesitas ayuda?**. Para el equipo, una
 * cuarta: **Panel del equipo** con cuántos comprobantes esperan revisión.
 *
 * Qué taller es «el próximo» y qué le falta a la ficha lo decide `core`
 * (`proximoTaller`, `faltanEnLaFicha`); acá solo se pinta.
 *
 * El único naranja posible (D26) es «Me anoto», cuando la persona no tiene
 * ningún taller y hay uno abierto: es lo único que Inicio le propone hacer.
 * Todo lo demás son enlaces a su lugar en la barra.
 */
export function Inicio({ yo }: { yo: Yo }) {
  const { t } = useTranslation();
  const nombre = yo.persona?.nombre;
  return (
    <>
      <CabeceraDeContenido
        titulo={<Titulo texto={nombre ? t('miEspacio.saludo', { nombre }) : t('miEspacio.saludoSinNombre')} />}
        bajada={t('miEspacio.bajada')}
      />
      <div className={`tarjetas${yo.tipo === 'equipo' ? ' tarjetas--cuatro' : ''}`}>
        <TarjetaProximoTaller yo={yo} />
        <TarjetaDatos yo={yo} />
        <TarjetaAyuda />
        {yo.tipo === 'equipo' ? <TarjetaPanel /> : null}
      </div>
    </>
  );
}

function TarjetaProximoTaller({ yo }: { yo: Yo }) {
  const { t } = useTranslation();
  const { talleres } = useTalleres();
  const zona = zonaDeLaPersona(yo);

  let cuerpo;
  if (talleres.estado === 'cargando') {
    cuerpo = <p className="nota" role="status">{t('miEspacio.talleresCargando')}</p>;
  } else if (talleres.estado === 'error') {
    cuerpo = <p className="error" role="alert">{t('miEspacio.talleresError')}</p>;
  } else {
    const mio = proximoTaller(talleres.mios);
    const abierto = talleres.abiertos.find((a) => estadoDelTaller(a).tipo === 'disponible') ?? null;
    if (mio) {
      cuerpo = (
        <>
          <p className="taller__titulo">{mio.curso_titulo}</p>
          <Fecha t={mio} zona={zona} />
          <p className="u-mt-4"><span className={`estado estado--${tonoDeEstado(mio.estado)}`}>{t(claveDeEstado(mio.estado))}</span></p>
          <p className="tarjeta__accion"><EnlaceInterno a={RUTAS.misTalleres} className="enlace">{t('inicio.proximoVer')} →</EnlaceInterno></p>
        </>
      );
    } else if (abierto) {
      cuerpo = (
        <>
          <p className="nota">{t('inicio.proximoAbierto')}</p>
          <p className="taller__titulo u-mt-4">{abierto.curso_titulo}</p>
          <Fecha t={abierto} zona={zona} />
          <p className="tarjeta__accion">
            <EnlaceInterno a={`${PREFIJO_ME_ANOTO}${abierto.curso_slug}`} className="btn btn--naranja btn--ancho">
              {t('miEspacio.meAnoto')}
            </EnlaceInterno>
          </p>
        </>
      );
    } else {
      cuerpo = <p className="nota">{t('inicio.proximoNinguno')}</p>;
    }
  }

  return (
    <section className="tarjeta" aria-labelledby="tarjeta-proximo">
      <h2 className="tarjeta__titulo" id="tarjeta-proximo">{t('inicio.proximoTitulo')}</h2>
      {cuerpo}
    </section>
  );
}

function TarjetaDatos({ yo }: { yo: Yo }) {
  const { t } = useTranslation();
  const faltan = faltanEnLaFicha(yo.persona);
  return (
    <section className="tarjeta" aria-labelledby="tarjeta-datos">
      <h2 className="tarjeta__titulo" id="tarjeta-datos">{t('inicio.datosTitulo')}</h2>
      {faltan.length === 0 ? (
        <p className="tarjeta__completo"><Check size={18} strokeWidth={1.5} aria-hidden /> {t('inicio.datosCompletos')}</p>
      ) : (
        <p className="nota">{t('inicio.datosFaltan', { lista: faltan.map((c) => t(`inicio.campos.${c}`)).join(', ') })}</p>
      )}
      <p className="tarjeta__accion">
        <EnlaceInterno a={RUTAS.ajustesPerfil} className="enlace">
          {faltan.length === 0 ? t('inicio.datosVer') : t('inicio.datosCompletar')} →
        </EnlaceInterno>
      </p>
    </section>
  );
}

function TarjetaAyuda() {
  const { t } = useTranslation();
  return (
    <section className="tarjeta" aria-labelledby="tarjeta-ayuda">
      <h2 className="tarjeta__titulo" id="tarjeta-ayuda">{t('inicio.ayudaTitulo')}</h2>
      <p className="nota">{t('inicio.ayudaTexto')}</p>
      <p className="tarjeta__accion">
        {/* Enlace y no botón: en una tarjeta de 229 px el botón en versalitas
            partía «Escribir a Gaby» en dos renglones, y las otras dos
            tarjetas cierran con un enlace (captura de la #29). */}
        <a className="enlace" href={enlaceWhatsApp(TELEFONO_GABY, t('inicio.ayudaMensaje'))} target="_blank" rel="noopener noreferrer">
          {t('inicio.ayudaBoton')} →
        </a>
      </p>
    </section>
  );
}

/**
 * Cuántos comprobantes esperan revisión, entre las ediciones que no terminaron.
 *
 * Sin endpoint nuevo: los mismos dos que usa el panel (`equipo/cursos` y
 * `equipo/inscriptos/:edicion`), así que lo que se cuenta es exactamente lo
 * que el panel le muestra a esta persona (RLS por territorio, D11). Son pocas
 * ediciones vivas a la vez; el día que sean muchas, esto pide un conteo en la
 * base.
 */
function useEnRevision(): number | 'cargando' | 'error' {
  const [n, setN] = useState<number | 'cargando' | 'error'>('cargando');
  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const { cursos } = await api<{ cursos: CursoDelPanel[] }>('equipo/cursos');
        const ediciones = edicionesVigentes(cursos.flatMap((c) => c.ediciones));
        const listas = await Promise.all(ediciones.map((e) => api<{ inscriptos: Inscripto[] }>(`equipo/inscriptos/${e.id}`)));
        if (vivo) setN(listas.reduce((s, l) => s + l.inscriptos.filter((i) => i.estado === 'en_revision').length, 0));
      } catch {
        if (vivo) setN('error');
      }
    })();
    return () => { vivo = false; };
  }, []);
  return n;
}

function TarjetaPanel() {
  const { t } = useTranslation();
  const n = useEnRevision();
  return (
    <section className="tarjeta" aria-labelledby="tarjeta-panel">
      <h2 className="tarjeta__titulo" id="tarjeta-panel">{t('inicio.panelTitulo')}</h2>
      {n === 'cargando' ? <p className="nota" role="status">{t('comun.cargando')}</p>
        : n === 'error' ? <p className="nota">{t('inicio.enRevisionError')}</p>
          : <p className="tarjeta__numero">{n === 0 ? t('inicio.sinRevision') : t('inicio.enRevision', { count: n })}</p>}
      <p className="tarjeta__accion"><EnlaceInterno a={`${RUTAS.equipo}#inscriptos`} className="enlace">{t('inicio.panelIr')} →</EnlaceInterno></p>
    </section>
  );
}
