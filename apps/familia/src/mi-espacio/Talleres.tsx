import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  claveDeEstado, datosParaEnviar, datosQueFaltan, edicionElegida, edicionPrincipal,
  enlaceParaPedirLosDatosDeCobro, estadoDelTaller, fechaCorta, fechasDelTaller, formatearPrecio,
  validarDatosParaAnotarse, type DatoParaAnotarse, type DatosParaAnotarse,
} from '@codice/core';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { BotonPrincipal, Campo } from '../comun/Piezas';

/**
 * «Talleres abiertos», «Me anoto» y «Mis talleres» — orden #24 B.
 *
 * La pantalla solo pinta: qué falta, cuántos lugares se dicen, cuál «Me anoto»
 * va en naranja y cómo se escribe la fecha en dos zonas lo decide `@codice/core`
 * (`mi-espacio/me-anoto.ts`); si hay lugar, si está abierta y si ya estaba
 * anotada lo decide la base (migración 009).
 *
 * ── Un naranja por pantalla (D26) ───────────────────────────────────────
 * Con varios talleres abiertos, solo **uno** «Me anoto» va en naranja: el del
 * taller elegido por `/me-anoto/<slug>`, o el primero con lugar. Los demás van
 * en contorno. Con el paso abierto, el naranja pasa a «Confirmar mi lugar».
 */

/** Una fila de `talleres_abiertos()` (009). */
export interface TallerAbierto {
  edicion_id: string;
  curso_slug: string;
  curso_titulo: string;
  curso_bajada: string | null;
  modalidad: string;
  inicio: string;
  fin: string;
  zona: string;
  sede: string | null;
  ciudad: string | null;
  pais: string | null;
  precio_monto: number | string | null;
  precio_moneda: string | null;
  lugares: number | null;
  mi_referencia: string | null;
}

/** Una fila de `mis_talleres()` (009). */
export interface TallerMio {
  referencia: string;
  inscripto_el: string;
  curso_titulo: string;
  curso_slug: string;
  inicio: string;
  fin: string;
  zona: string;
  sede: string | null;
  ciudad: string | null;
  estado: string;
}

/** Lo que devuelve `POST /api/talleres/inscribirme`. */
interface Respuesta {
  referencia: string;
  ya_estaba: boolean;
  cobro: { banco: string; titular: string; clabe: string; concepto_sugerido: string | null } | null;
}

export interface Confirmacion extends Respuesta {
  taller: TallerAbierto;
}

/** La zona de la persona: la de su ficha, o la del navegador si no la cargó. */
export function zonaDeLaPersona(yo: Yo): string | null {
  if (yo.persona?.zona_horaria) return yo.persona.zona_horaria;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

const precio = (t: TallerAbierto) =>
  formatearPrecio(t.precio_monto === null ? null : Number(t.precio_monto), t.precio_moneda);

/** El día, el horario en la zona de la edición y, si hace falta, en la de la persona. */
function Fecha({ t, zona }: { t: { inicio: string; fin: string; zona: string; ciudad: string | null }; zona: string | null }) {
  const { t: tr } = useTranslation();
  const f = fechasDelTaller(t, zona);
  return (
    <>
      <p className="taller__dato taller__dia">{f.dia}</p>
      <p className="taller__dato">{tr('miEspacio.horaDe', { horario: f.horario, ciudad: f.ciudad })}</p>
      {f.enTuZona ? <p className="taller__dato taller__dato--suave">{tr('miEspacio.enTuHora', f.enTuZona)}</p> : null}
    </>
  );
}

export function TalleresAbiertos({
  talleres,
  slugElegido,
  yo,
  alConfirmar,
  alCambiar,
}: {
  talleres: TallerAbierto[];
  slugElegido: string | null;
  yo: Yo;
  alConfirmar: (c: Confirmacion) => void;
  /** Algo cambió del lado de la base (sin lugares, cerrada): hay que volver a leer. */
  alCambiar: () => void;
}) {
  const { t } = useTranslation();
  const zona = zonaDeLaPersona(yo);
  const elegida = edicionElegida(talleres, slugElegido);
  /* El paso de «Me anoto» se abre solo para el taller de `/me-anoto/<slug>`,
     si se puede anotar; si no, se ve la tarjeta y su motivo. */
  const [abierta, setAbierta] = useState<string | null>(() =>
    elegida && estadoDelTaller(elegida).tipo === 'disponible' ? elegida.edicion_id : null);
  const principal = edicionPrincipal(talleres, abierta ?? elegida?.edicion_id ?? null);

  return (
    <section className="seccion" aria-labelledby="talleres-titulo">
      <h2 className="subtitulo" id="talleres-titulo">{t('miEspacio.talleresTitulo')}</h2>
      {slugElegido && !elegida ? <p className="nota u-mt-4">{t('miEspacio.tallerNoEncontrado')}</p> : null}
      {talleres.length === 0 ? <p className="nota u-mt-4">{t('miEspacio.talleresVacio')}</p> : (
        <ul className="talleres">
          {talleres.map((taller) => {
            const estado = estadoDelTaller(taller);
            return (
              <li key={taller.edicion_id} className={`taller${taller.edicion_id === elegida?.edicion_id ? ' taller--elegido' : ''}`}>
                <h3 className="taller__titulo">{taller.curso_titulo}</h3>
                <Fecha t={taller} zona={zona} />
                <p className="taller__dato">{[taller.sede, taller.ciudad].filter(Boolean).join(' · ')}</p>
                <p className="taller__dato taller__precio">{precio(taller)}</p>
                {estado.tipo === 'anotado' ? (
                  <p className="u-mt-4"><span className="chip chip--confirmada">{t('miEspacio.yaTienesTuLugar', { referencia: estado.referencia })}</span></p>
                ) : estado.tipo === 'sin-lugares' ? (
                  <p className="u-mt-4"><span className="chip">{t('miEspacio.sinLugares')}</span></p>
                ) : (
                  <>
                    {estado.quedan !== null ? (
                      <p className="taller__lugares">{t('miEspacio.quedanLugares', { count: estado.quedan })}</p>
                    ) : null}
                    {abierta === taller.edicion_id ? (
                      <PasoDeMeAnoto
                        taller={taller}
                        yo={yo}
                        alCancelar={() => setAbierta(null)}
                        alConfirmar={alConfirmar}
                        alCambiar={alCambiar}
                      />
                    ) : (
                      <div className="fila">
                        <button
                          type="button"
                          className={`btn btn--ancho${abierta === null && principal === taller.edicion_id ? ' btn--naranja' : ''}`}
                          onClick={() => setAbierta(taller.edicion_id)}
                        >
                          {t('miEspacio.meAnoto')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * El paso de «Me anoto», en el mismo lugar (no manda a otra pantalla): pide
 * los datos que falten y confirma.
 */
function PasoDeMeAnoto({
  taller,
  yo,
  alCancelar,
  alConfirmar,
  alCambiar,
}: {
  taller: TallerAbierto;
  yo: Yo;
  alCancelar: () => void;
  alConfirmar: (c: Confirmacion) => void;
  alCambiar: () => void;
}) {
  const { t } = useTranslation();
  /* Qué falta se calcula una vez, al abrir: si se recalculara en cada tecla, el
     campo desaparecería apenas el dato empieza a tener forma. */
  const [faltan] = useState<DatoParaAnotarse[]>(() => datosQueFaltan(yo.persona));
  const [datos, setDatos] = useState<Partial<DatosParaAnotarse>>({});
  const [errores, setErrores] = useState<Partial<Record<DatoParaAnotarse, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar(evento: React.FormEvent) {
    evento.preventDefault();
    const encontrados = validarDatosParaAnotarse(datos, faltan);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setError(null);
    setEnviando(true);
    try {
      const r = await api<Respuesta>('talleres/inscribirme', {
        metodo: 'POST',
        cuerpo: { edicion_id: taller.edicion_id, ...datosParaEnviar(datos, faltan) },
      });
      alConfirmar({ ...r, taller });
    } catch (fallo) {
      const codigo = fallo instanceof ErrorDeApi ? fallo.codigoDelServidor : undefined;
      if (codigo === 'SIN_LUGARES' || codigo === 'EDICION_CERRADA') {
        setError(t(codigo === 'SIN_LUGARES' ? 'miEspacio.errores.sinLugares' : 'miEspacio.errores.edicionCerrada'));
        alCambiar();
      } else {
        setError(t('comun.errorGenerico'));
      }
    } finally {
      setEnviando(false);
    }
  }

  const campo = (id: DatoParaAnotarse, props: React.InputHTMLAttributes<HTMLInputElement> & { ayuda?: string }) => (
    <Campo
      id={`anotarse-${id}`}
      rotulo={t(`miEspacio.${id}`)}
      value={datos[id] ?? ''}
      error={errores[id] ? t(errores[id]!) : null}
      onChange={(e) => setDatos((d) => ({ ...d, [id]: e.target.value }))}
      {...props}
    />
  );

  return (
    <form className="paso" onSubmit={confirmar} noValidate>
      {faltan.length > 0 ? (
        <>
          <p className="nota">{t('miEspacio.faltanParaAnotarte')}</p>
          {faltan.includes('nombre') ? campo('nombre', { autoComplete: 'given-name', autoFocus: true }) : null}
          {faltan.includes('apellido') ? campo('apellido', { autoComplete: 'family-name' }) : null}
          {faltan.includes('whatsapp')
            ? campo('whatsapp', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', ayuda: t('miEspacio.whatsappAyuda') })
            : null}
        </>
      ) : null}
      <div className="fila">
        <BotonPrincipal cargando={enviando} textoCargando={t('miEspacio.anotando')}>
          {t('miEspacio.confirmarLugar')}
        </BotonPrincipal>
        <button type="button" className="enlace" onClick={alCancelar} disabled={enviando}>
          {t('comun.cancelar')}
        </button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
    </form>
  );
}

/** Copia un texto y dice «Copiado» un momento. Si el navegador no deja, no pasa nada. */
function BotonCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const { t } = useTranslation();
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Sin portapapeles (permiso negado, http): el dato sigue a la vista para copiarlo a mano. */
    }
  }
  return (
    <button type="button" className="btn btn--chico" onClick={copiar} aria-label={rotulo}>
      <span aria-live="polite">{copiado ? t('miEspacio.copiado') : t('miEspacio.copiar')}</span>
    </button>
  );
}

/**
 * La confirmación: la referencia y cómo transferir. **Sin datos de cobro
 * cargados no se inventa una cuenta**: se dice que van por WhatsApp y se ofrece
 * escribirle a Gaby con la referencia ya puesta.
 */
export function ConfirmacionDeLugar({ c, yo, alCerrar }: { c: Confirmacion; yo: Yo; alCerrar: () => void }) {
  const { t } = useTranslation();
  const concepto = c.referencia;
  return (
    <section className="seccion confirmacion" aria-labelledby="confirmacion-titulo" role="status">
      <h2 className="subtitulo" id="confirmacion-titulo">{c.ya_estaba ? t('miEspacio.yaTenias') : t('miEspacio.listo')}</h2>
      <p className="taller__titulo u-mt-4">{c.taller.curso_titulo}</p>
      <Fecha t={c.taller} zona={zonaDeLaPersona(yo)} />

      <div className="referencia">
        <span className="referencia__rotulo">{t('miEspacio.tuReferencia')}</span>
        <span className="referencia__valor">{c.referencia}</span>
        <BotonCopiar texto={c.referencia} rotulo={t('miEspacio.copiarReferencia')} />
      </div>
      <p className="nota">{t('miEspacio.referenciaAyuda')}</p>

      {c.cobro ? (
        <div className="cobro">
          <h3 className="subtitulo">{t('miEspacio.paraTransferir')}</h3>
          <dl className="cobro__datos">
            <dt>{t('miEspacio.banco')}</dt><dd>{c.cobro.banco}</dd>
            <dt>{t('miEspacio.titular')}</dt><dd>{c.cobro.titular}</dd>
            <dt>{t('miEspacio.clabe')}</dt>
            <dd className="cobro__clabe">
              <span>{c.cobro.clabe}</span>
              <BotonCopiar texto={c.cobro.clabe} rotulo={t('miEspacio.copiarClabe')} />
            </dd>
            <dt>{t('miEspacio.concepto')}</dt><dd>{concepto}</dd>
            <dt>{t('miEspacio.monto')}</dt><dd>{precio(c.taller)}</dd>
          </dl>
        </div>
      ) : (
        <div className="cobro">
          <p className="nota">{t('miEspacio.cobroPorWhatsapp')}</p>
          <div className="fila">
            <a
              className="btn btn--ancho"
              href={enlaceParaPedirLosDatosDeCobro(t('miEspacio.mensajeCobro', { curso: c.taller.curso_titulo, referencia: c.referencia }))}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('miEspacio.escribirAGaby')}
            </a>
          </div>
        </div>
      )}
      <div className="fila fila--suelta">
        <button type="button" className="enlace" onClick={alCerrar}>{t('miEspacio.verMisTalleres')}</button>
      </div>
    </section>
  );
}

export function MisTalleres({ mios, yo }: { mios: TallerMio[]; yo: Yo }) {
  const { t } = useTranslation();
  const zona = zonaDeLaPersona(yo);
  return (
    <section className="seccion" aria-labelledby="mis-talleres-titulo" id="mis-talleres">
      <h2 className="subtitulo" id="mis-talleres-titulo">{t('miEspacio.misTalleresTitulo')}</h2>
      <ul className="talleres">
        {mios.map((m) => (
          <li key={m.referencia} className="taller">
            <h3 className="taller__titulo">{m.curso_titulo}</h3>
            <Fecha t={m} zona={zona} />
            <p className="taller__dato taller__dato--suave">
              {t('miEspacio.inscriptoEl', { fecha: fechaCorta(m.inscripto_el, zona ?? m.zona) })}
            </p>
            <p className="taller__estado">
              <span className="tabla__ref">{m.referencia}</span>
              <span className={`chip${m.estado === 'confirmada' ? ' chip--confirmada' : ''}`}>{t(claveDeEstado(m.estado))}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
