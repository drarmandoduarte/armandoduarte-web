import { Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TERRITORIOS, aCsv, accionDeEquipo, coincide, edadDesdeAnio, enlaceDeSaludo, fechaCorta, nombreDeArchivo, type Rol,
  formatearWhatsapp,
} from '@codice/core';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { Campo, Selector } from '../comun/Piezas';
import { descargar } from './descargar';
import { FichaDeCliente } from './FichaDeCliente';
import { nombreCompleto, type Cliente } from './tipos';

/**
 * Clientes — todas las personas registradas que quien entró puede ver (orden
 * #24 A.3), con cuántos cursos tiene y el último.
 *
 * **Solo el dueño** ve, en cada fila, «Sumar al equipo» o «Quitar del equipo».
 * Qué botón va lo decide `accionDeEquipo()` de `@codice/core`; que se pueda
 * hacer lo decide la base (policies `miembros_dueno_*` de la 001). Sumar pide
 * el territorio y una confirmación; quitar, solo la confirmación. Quitar es
 * desactivar: la fila se queda y la auditoría lo anota.
 *
 * Las fechas se escriben en la zona de Mérida: es donde trabaja el equipo.
 */
const ZONA_DEL_EQUIPO = 'America/Merida';

type Confirmando = { persona: string; accion: 'sumar' | 'quitar'; territorio: string } | null;

export function Clientes({ yo }: { yo: Yo }) {
  const { t } = useTranslation();
  const [filas, setFilas] = useState<Cliente[] | null>(null);
  const [error, setError] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [confirmando, setConfirmando] = useState<Confirmando>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  /* #27 D.3: la ficha abierta (una por vez), debajo de su fila. */
  const [abierta, setAbierta] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(false);
    try {
      const r = await api<{ clientes: Cliente[] }>('equipo/clientes');
      setFilas(r.clientes);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const rol: Rol = yo.rol;
  const miId = yo.persona?.id ?? '';
  const visibles = (filas ?? []).filter((f) => coincide([f.nombre, f.apellido, f.email, f.whatsapp, f.ciudad], consulta));
  const conColumnaDeEquipo = rol === 'dueno';

  async function confirmar() {
    if (!confirmando) return;
    setTrabajando(true);
    setFallo(null);
    try {
      if (confirmando.accion === 'sumar') {
        await api('equipo/miembros', { metodo: 'POST', cuerpo: { persona_id: confirmando.persona, territorio: confirmando.territorio } });
      } else {
        await api(`equipo/miembros/${confirmando.persona}/quitar`, { metodo: 'POST' });
      }
      setConfirmando(null);
      await cargar();
    } catch (e) {
      const codigo = e instanceof ErrorDeApi ? e.codigoDelServidor : undefined;
      setFallo(t(codigo === 'SOLO_DUENO' || codigo === 'SIN_PERMISO' ? 'panel.errores.sinPermiso' : 'panel.errores.generico'));
    } finally {
      setTrabajando(false);
    }
  }

  const exportar = () => {
    /* #27 D.3: ciudad, edad (calculada; nunca el año) y nivel. */
    const encabezados = ['nombre', 'correo', 'whatsapp', 'pais', 'ciudad', 'edad', 'nivel', 'alta', 'cursos']
      .map((k) => t(`panel.clientes.encabezados.${k}`));
    const csv = aCsv(encabezados, visibles.map((f) => [
      nombreCompleto(f, ''), f.email, f.whatsapp, f.pais, f.ciudad, edadDesdeAnio(f.anio_nacimiento),
      f.nivel_educativo ? t(`miEspacio.niveles.${f.nivel_educativo}`) : null, f.alta, f.cursos,
    ]));
    descargar(nombreDeArchivo('clientes', new Date()), csv);
  };

  return (
    <div>
      <div className="barra barra--filtros">
        <Campo id="clientes-buscar" type="search" rotulo={t('panel.clientes.buscar')} ayuda={t('panel.clientes.buscarAyuda')}
          value={consulta} onChange={(x) => setConsulta(x.target.value)} />
        <div className="barra__accion">
          <button type="button" className="btn" onClick={exportar} disabled={!filas || visibles.length === 0}>
            {t('panel.clientes.exportar')}
          </button>
        </div>
      </div>

      {error ? <p className="error" role="alert">{t('panel.errorAlCargar')}</p> : null}
      {filas === null && !error ? <p className="nota" role="status">{t('panel.cargando')}</p> : null}
      {filas && filas.length === 0 ? <p className="nota">{t('panel.clientes.vacio')}</p> : null}
      {filas && filas.length > 0 && visibles.length === 0 ? <p className="nota">{t('panel.clientes.sinResultados')}</p> : null}
      {fallo ? <p className="error" role="alert">{fallo}</p> : null}

      {filas && visibles.length > 0 ? (
        <>
          <p className="nota" role="status">{t('panel.clientes.cuantos', { cuantos: visibles.length, total: filas.length })}</p>
          <div className="tabla-marco">
            <table className="tabla">
              <thead>
                <tr>
                  {['nombre', 'correo', 'whatsapp', 'pais', 'ciudad', 'edad', 'nivel', 'alta', 'cursos', 'notas'].map((k) => (
                    <th key={k} scope="col">{t(`panel.clientes.encabezados.${k}`)}</th>
                  ))}
                  {conColumnaDeEquipo ? <th scope="col">{t('panel.clientes.encabezados.equipo')}</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => {
                  const nombre = nombreCompleto(f, t('panel.clientes.sinNombre'));
                  const accion = accionDeEquipo(rol, miId, f);
                  const enlace = enlaceDeSaludo(f.whatsapp, t('panel.clientes.saludo', { nombre: f.nombre ?? '' }).replace(' ,', ','));
                  const esta = confirmando?.persona === f.persona_id ? confirmando : null;
                  return (
                    <Fragment key={f.persona_id}>
                    <tr>
                      <td>{nombre}</td>
                      <td><a className="enlace" href={`mailto:${f.email}`}>{f.email}</a></td>
                      <td>{enlace ? <a className="enlace" href={enlace} target="_blank" rel="noopener">{formatearWhatsapp(f.whatsapp)}</a> : (f.whatsapp ? formatearWhatsapp(f.whatsapp) : '—')}</td>
                      <td>{f.pais ?? '—'}</td>
                      <td>{f.ciudad ?? '—'}</td>
                      <td className="tabla__numero">{edadDesdeAnio(f.anio_nacimiento) ?? '—'}</td>
                      <td>{f.nivel_educativo ? t(`miEspacio.niveles.${f.nivel_educativo}`) : '—'}</td>
                      <td className="tabla__numero">{fechaCorta(f.alta, ZONA_DEL_EQUIPO)}</td>
                      <td>
                        {f.cursos}
                        {f.ultimo_curso ? <span className="tabla__sub">{t('panel.clientes.ultimo', { curso: f.ultimo_curso })}</span> : null}
                      </td>
                      <td>
                        <button type="button" className="enlace" aria-expanded={abierta === f.persona_id}
                          aria-label={t(abierta === f.persona_id ? 'panel.clientes.cerrar' : 'panel.clientes.abrirAria', { nombre })}
                          onClick={() => setAbierta(abierta === f.persona_id ? null : f.persona_id)}>
                          {abierta === f.persona_id ? t('panel.clientes.cerrar') : `${t('panel.clientes.abrir')} (${f.cuantas_notas ?? 0})`}
                        </button>
                      </td>
                      {conColumnaDeEquipo ? (
                        <td className="tabla__equipo">
                          {f.rol === 'dueno' ? <span className="chip">{t('panel.clientes.esDueno')}</span> : null}
                          {f.rol === 'equipo' && f.activo && f.territorio ? (
                            <span className="chip">{t('panel.clientes.esEquipo', { territorio: t(`panel.territorios.${f.territorio}`) })}</span>
                          ) : null}
                          {accion && !esta ? (
                            <button type="button" className="enlace"
                              onClick={() => { setFallo(null); setConfirmando({ persona: f.persona_id, accion, territorio: 'mexico' }); }}>
                              {t(accion === 'sumar' ? 'panel.clientes.sumar' : 'panel.clientes.quitar')}
                            </button>
                          ) : null}
                          {esta ? (
                            <div className="confirmar">
                              {esta.accion === 'sumar' ? (
                                <Selector id={`territorio-${f.persona_id}`} rotulo={t('panel.clientes.territorio')} value={esta.territorio}
                                  onChange={(x) => setConfirmando({ ...esta, territorio: x.target.value })}
                                  opciones={TERRITORIOS.map((x) => ({ valor: x, texto: t(`panel.territorios.${x}`) }))} />
                              ) : (
                                <p className="nota">{t('panel.clientes.quitarAviso')}</p>
                              )}
                              <div className="confirmar__botones">
                                <button type="button" className="btn btn--chico" onClick={() => void confirmar()} disabled={trabajando}>
                                  {t(esta.accion === 'sumar' ? 'panel.clientes.confirmarSumar' : 'panel.clientes.confirmarQuitar', { nombre })}
                                </button>
                                <button type="button" className="enlace" onClick={() => setConfirmando(null)}>{t('panel.cancelar')}</button>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                    {abierta === f.persona_id ? (
                      <tr className="tabla__ficha">
                        <td colSpan={conColumnaDeEquipo ? 11 : 10}>
                          <FichaDeCliente personaId={f.persona_id} nombre={nombre} alAgregar={() => void cargar()} />
                        </td>
                      </tr>
                    ) : null}
                    </Fragment>
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
