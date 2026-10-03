import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FILTROS_DE_INSCRIPTOS, MOTIVO_MAXIMO, aCsv, accionesDePago, coincide, enlaceDeSaludo, fechaCorta, fechaLarga,
  filtrarPorEstado, filtroInicial, formatearPrecio, montoDesdeTexto, nombreDeArchivo, tonoDeEstado, validarResolucion,
  type FiltroDeInscriptos,
  formatearWhatsapp,
} from '@codice/core';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { abrirEnOtraPestana } from '../comun/abrir';
import { Campo, Selector } from '../comun/Piezas';
import { descargar } from './descargar';
import { nombreCompleto, type CursoDelPanel, type Inscripto } from './tipos';

/**
 * Inscriptos — una tabla por edición (orden #24 A.2), y desde la #27 C el
 * lugar donde el equipo **revisa los pagos**.
 *
 * Las filas son las que la base deja ver a quien entró: Gabi recibe las de
 * México, Diana las del resto, Armando todas. **Acá no se filtra por
 * territorio**: se busca y se filtra por estado dentro de lo que llegó, y se
 * exporta lo que se ve.
 *
 * ── Lo que sumó la #27 C ────────────────────────────────────────────────
 *   · El estado con un punto de color y, abajo, el **historial corto**: el
 *     último renglón del libro con fecha, quién y nota («Rechazado el 3 nov por
 *     Diana · El monto no coincide»), y lo que el cliente declaró.
 *   · Un filtro **Todos · En revisión · Confirmadas · Pendientes**; arranca en
 *     «En revisión» si hay alguna.
 *   · Por fila: **Ver** (el comprobante, URL firmada de 60 s), **Confirmar**
 *     (teal relleno) y **Rechazar** (contorno, con motivo obligatorio) cuando
 *     está en revisión, y **Anular** solo para el dueño. Las tres piden
 *     confirmación en el mismo lugar, nunca un `confirm()` del navegador.
 *
 * Qué acciones lleva cada fila lo decide `accionesDePago()` de `@codice/core`;
 * que se puedan hacer, la base y la API.
 */
type Resolviendo = { id: string; tipo: 'confirmado' | 'rechazado' | 'anulado'; monto: string; nota: string } | null;

export function Inscriptos({ cursos, yo }: { cursos: CursoDelPanel[]; yo: Yo }) {
  const { t } = useTranslation();
  const ediciones = useMemo(
    () => cursos.flatMap((c) => c.ediciones.map((e) => ({ curso: c, edicion: e }))),
    [cursos],
  );
  const [elegida, setElegida] = useState<string>(ediciones[0]?.edicion.id ?? '');
  const [filas, setFilas] = useState<Inscripto[] | null>(null);
  const [error, setError] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<FiltroDeInscriptos>('todos');
  const [resolviendo, setResolviendo] = useState<Resolviendo>(null);
  const [errorDeResolucion, setErrorDeResolucion] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<{ id: string; texto: string; error?: boolean } | null>(null);

  const cargar = useCallback(async (edicion: string, conFiltroInicial: boolean) => {
    try {
      const r = await api<{ inscriptos: Inscripto[] }>(`equipo/inscriptos/${edicion}`);
      setFilas(r.inscriptos);
      if (conFiltroInicial) setFiltro(filtroInicial(r.inscriptos));
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!elegida) return;
    setFilas(null);
    setError(false);
    setResolviendo(null);
    setAviso(null);
    void cargar(elegida, true);
  }, [elegida, cargar]);

  if (ediciones.length === 0) return <p className="nota">{t('equipo.inscriptos.sinEdiciones')}</p>;

  const actual = ediciones.find((x) => x.edicion.id === elegida);
  const zona = actual?.edicion.zona ?? 'America/Merida';
  const visibles = filtrarPorEstado(filas ?? [], filtro)
    .filter((f) => coincide([f.nombre, f.apellido, f.email, f.referencia], consulta));
  /* La fecha, en la zona de la edición: la misma hora que ve el equipo en la ficha. */
  const fecha = (instante: string) => fechaCorta(instante, zona);
  const dinero = (monto: number | string | null, moneda: string | null) =>
    (monto === null ? '—' : formatearPrecio(Number(monto), moneda));

  const historial = (f: Inscripto) => {
    if (!f.ultimo_tipo || !f.ultimo_el) return null;
    const tipo = t(`equipo.inscriptos.tiposDelLibro.${f.ultimo_tipo}`);
    const linea = f.ultimo_por
      ? t('equipo.inscriptos.historial', { tipo, fecha: fecha(f.ultimo_el), quien: f.ultimo_por })
      : t('equipo.inscriptos.historialSinQuien', { tipo, fecha: fecha(f.ultimo_el) });
    return f.ultima_nota ? `${linea} · ${f.ultima_nota}` : linea;
  };

  const exportar = () => {
    const claves = ['referencia', 'nombre', 'correo', 'whatsapp', 'pais', 'fecha', 'estado', 'ultimoMovimiento', 'montoDeclarado', 'montoConfirmado'];
    const csv = aCsv(claves.map((k) => t(`equipo.inscriptos.encabezados.${k}`)), visibles.map((f) => [
      f.referencia, nombreCompleto(f, ''), f.email, f.whatsapp, f.pais, f.inscripto_el,
      t(`equipo.estadosInscripcion.${f.estado}`), f.ultimo_el, f.monto_declarado, f.monto_confirmado,
    ]));
    descargar(nombreDeArchivo(`inscriptos-${actual?.curso.slug ?? 'edicion'}`, new Date()), csv);
  };

  async function ver(f: Inscripto) {
    setAviso(null);
    const ok = await abrirEnOtraPestana(async () =>
      (await api<{ url: string }>(`pagos/comprobante/${f.inscripcion_id}`)).url);
    if (!ok) setAviso({ id: f.inscripcion_id, texto: t('equipo.inscriptos.pago.errores.ver'), error: true });
  }

  async function resolver() {
    if (!resolviendo) return;
    const problema = validarResolucion(resolviendo.tipo, resolviendo.nota);
    setErrorDeResolucion(problema ? t(problema) : null);
    if (problema) return;
    setTrabajando(true);
    try {
      const monto = resolviendo.tipo === 'confirmado' ? montoDesdeTexto(resolviendo.monto) : null;
      const r = await api<{ ok: boolean; correo: string }>('pagos/resolver', {
        metodo: 'POST',
        cuerpo: { inscripcion_id: resolviendo.id, tipo: resolviendo.tipo, monto, nota: resolviendo.nota.trim() || null },
      });
      const id = resolviendo.id;
      setResolviendo(null);
      /* #34 B.3: `apagado` es la persona que pidió no recibir correos; igual hay que avisarle. */
      const clave = r.correo === 'no_enviado' ? 'correoNoSalio' : r.correo === 'apagado' ? 'correoApagado' : 'hecho';
      setAviso({ id, texto: t(`equipo.inscriptos.pago.${clave}`) });
      await cargar(elegida, false);
    } catch (e) {
      const codigo = e instanceof ErrorDeApi ? e.codigoDelServidor : undefined;
      setErrorDeResolucion(t(
        codigo === 'NO_ESTA_EN_REVISION' ? 'equipo.inscriptos.pago.errores.noEnRevision'
          : codigo === 'SOLO_DUENO' || codigo === 'SIN_PERMISO' ? 'equipo.inscriptos.pago.errores.sinPermiso'
            : codigo === 'FALTA_MOTIVO' ? 'equipo.inscriptos.pago.errores.motivo'
              : 'equipo.inscriptos.pago.errores.generico',
      ));
    } finally {
      setTrabajando(false);
    }
  }

  const abrir = (f: Inscripto, tipo: 'confirmado' | 'rechazado' | 'anulado') => {
    setAviso(null);
    setErrorDeResolucion(null);
    setResolviendo({
      id: f.inscripcion_id, tipo, nota: '',
      monto: tipo === 'confirmado' && f.monto_declarado !== null ? String(Number(f.monto_declarado)) : '',
    });
  };

  return (
    <div>
      <div className="barra barra--filtros">
        <Selector
          id="inscriptos-edicion"
          rotulo={t('equipo.inscriptos.edicion')}
          value={elegida}
          onChange={(x) => { setElegida(x.target.value); setConsulta(''); }}
          opciones={ediciones.map(({ curso, edicion }) => ({
            valor: edicion.id,
            texto: `${curso.titulo} — ${fechaLarga(edicion.inicio, edicion.zona)}`,
          }))}
        />
        <Campo id="inscriptos-buscar" type="search" rotulo={t('equipo.inscriptos.buscar')} ayuda={t('equipo.inscriptos.buscarAyuda')}
          value={consulta} onChange={(x) => setConsulta(x.target.value)} />
        <div className="barra__accion">
          <button type="button" className="btn" onClick={exportar} disabled={!filas || visibles.length === 0}>
            {t('equipo.inscriptos.exportar')}
          </button>
        </div>
      </div>

      <div className="filtros" role="group" aria-label={t('equipo.inscriptos.filtro')}>
        {FILTROS_DE_INSCRIPTOS.map((x) => (
          <button key={x} type="button" className={`filtro${filtro === x ? ' filtro--activo' : ''}`} aria-pressed={filtro === x}
            onClick={() => setFiltro(x)}>
            {t(`equipo.inscriptos.filtros.${x}`)}
            {filas ? <span className="filtro__cuenta">{filtrarPorEstado(filas, x).length}</span> : null}
          </button>
        ))}
      </div>

      {error ? <p className="error" role="alert">{t('equipo.errorAlCargar')}</p> : null}
      {filas === null && !error ? <p className="nota" role="status">{t('equipo.cargando')}</p> : null}
      {filas && filas.length === 0 ? <p className="nota">{t('equipo.inscriptos.vacio')}</p> : null}
      {filas && filas.length > 0 && visibles.length === 0 ? <p className="nota">{t('equipo.inscriptos.sinResultados')}</p> : null}

      {filas && visibles.length > 0 ? (
        <>
          <p className="nota" role="status">{t('equipo.inscriptos.cuantos', { cuantos: visibles.length, total: filas.length })}</p>
          <div className="tabla-marco">
            <table className="tabla tabla--inscriptos">
              <thead>
                <tr>
                  {['referencia', 'nombre', 'correo', 'whatsapp', 'pais', 'fecha', 'estado', 'acciones'].map((k) => (
                    <th key={k} scope="col">{t(`equipo.inscriptos.encabezados.${k}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => {
                  const nombre = nombreCompleto(f, f.email);
                  const enlace = enlaceDeSaludo(f.whatsapp, t('equipo.inscriptos.saludo', {
                    nombre: f.nombre ?? '', curso: actual?.curso.titulo ?? '',
                  }).trim());
                  const acciones = accionesDePago(yo.rol, f);
                  const aca = resolviendo?.id === f.inscripcion_id ? resolviendo : null;
                  const linea = historial(f);
                  return (
                    <tr key={f.inscripcion_id}>
                      <td className="tabla__ref">{f.referencia}</td>
                      <td>{nombre}</td>
                      <td><a className="enlace" href={`mailto:${f.email}`}>{f.email}</a></td>
                      <td>
                        {enlace ? (
                          <a className="enlace" href={enlace} target="_blank" rel="noopener"
                            aria-label={t('equipo.inscriptos.escribirle', { nombre })}>{formatearWhatsapp(f.whatsapp)}</a>
                        ) : (f.whatsapp ? formatearWhatsapp(f.whatsapp) : '—')}
                      </td>
                      <td>{f.pais ?? '—'}</td>
                      <td className="tabla__numero">{fecha(f.inscripto_el)}</td>
                      <td className="tabla__estado">
                        <span className={`estado estado--${tonoDeEstado(f.estado)}`}>{t(`equipo.estadosInscripcion.${f.estado}`)}</span>
                        {linea ? <span className="tabla__sub">{linea}</span> : null}
                        {f.monto_declarado !== null && f.estado === 'en_revision' ? (
                          <span className="tabla__sub">{t('equipo.inscriptos.declaro', {
                            monto: dinero(f.monto_declarado, f.moneda_declarada),
                            banco: f.banco ?? '—',
                            fecha: f.fecha_transferencia ?? '—',
                          })}{f.ultimos4_o_folio ? ` · ${f.ultimos4_o_folio}` : ''}</span>
                        ) : null}
                      </td>
                      <td className="tabla__acciones">
                        {!aca ? (
                          <div className="acciones">
                            {acciones.ver ? <button type="button" className="enlace" onClick={() => void ver(f)}>{t('equipo.inscriptos.pago.ver')}</button> : null}
                            {acciones.confirmar ? <button type="button" className="btn btn--chico btn--teal" onClick={() => abrir(f, 'confirmado')}>{t('equipo.inscriptos.pago.confirmar')}</button> : null}
                            {acciones.rechazar ? <button type="button" className="btn btn--chico" onClick={() => abrir(f, 'rechazado')}>{t('equipo.inscriptos.pago.rechazar')}</button> : null}
                            {acciones.anular ? <button type="button" className="enlace" onClick={() => abrir(f, 'anulado')}>{t('equipo.inscriptos.pago.anular')}</button> : null}
                          </div>
                        ) : (
                          <div className="confirmar">
                            {aca.tipo === 'confirmado' ? (
                              <>
                                <Campo id={`monto-${f.inscripcion_id}`} rotulo={t('equipo.inscriptos.pago.monto')} inputMode="decimal"
                                  value={aca.monto} onChange={(x) => setResolviendo({ ...aca, monto: x.target.value })} />
                                <Campo id={`nota-${f.inscripcion_id}`} rotulo={t('equipo.inscriptos.pago.nota')} maxLength={MOTIVO_MAXIMO}
                                  value={aca.nota} onChange={(x) => setResolviendo({ ...aca, nota: x.target.value })} />
                                <p className="nota">{t('equipo.inscriptos.pago.confirmarAviso', { nombre })}</p>
                              </>
                            ) : (
                              <>
                                <Campo id={`motivo-${f.inscripcion_id}`} rotulo={t('equipo.inscriptos.pago.motivo')} maxLength={MOTIVO_MAXIMO}
                                  ayuda={t('equipo.inscriptos.pago.motivoAyuda', { nombre })} autoFocus
                                  value={aca.nota} onChange={(x) => setResolviendo({ ...aca, nota: x.target.value })} />
                                {aca.tipo === 'anulado' ? <p className="nota">{t('equipo.inscriptos.pago.anularAviso')}</p> : null}
                              </>
                            )}
                            {errorDeResolucion ? <p className="error" role="alert">{errorDeResolucion}</p> : null}
                            <div className="confirmar__botones">
                              <button type="button" disabled={trabajando} onClick={() => void resolver()}
                                className={`btn btn--chico${aca.tipo === 'confirmado' ? ' btn--teal' : ''}`}>
                                {t(aca.tipo === 'confirmado' ? 'equipo.inscriptos.pago.siConfirmar'
                                  : aca.tipo === 'rechazado' ? 'equipo.inscriptos.pago.siRechazar' : 'equipo.inscriptos.pago.siAnular')}
                              </button>
                              <button type="button" className="enlace" onClick={() => setResolviendo(null)} disabled={trabajando}>
                                {t('equipo.cancelar')}
                              </button>
                            </div>
                          </div>
                        )}
                        {aviso?.id === f.inscripcion_id ? (
                          <p className={aviso.error ? 'error' : 'exito'} role={aviso.error ? 'alert' : 'status'}>{aviso.texto}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
