import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fechaLarga, formatearPrecio, horaCorta, ocupacion } from '@codice/core';
import { FormularioDeCurso } from './FormularioDeCurso';
import { FormularioDeEdicion } from './FormularioDeEdicion';
import type { CursoDelPanel, EdicionDelPanel } from './tipos';

/**
 * Cursos — la lista, con sus ediciones debajo (orden #24 A.1).
 *
 * Un formulario abierto a la vez, en el lugar de lo que edita. Es lo que deja
 * **un solo naranja** en la pantalla (D26): el «Guardar» del formulario abierto.
 * «Nuevo curso», «Editar» y «Nueva edición» van en contorno.
 *
 * Las fechas se escriben **en la zona de la edición** (D15), con la zona al
 * lado: «jueves, 5 de noviembre de 2026, 8:30 a 13:00 · hora de Merida».
 */
type Abierto =
  | { que: 'curso'; curso: CursoDelPanel | null }
  | { que: 'edicion'; curso: CursoDelPanel; edicion: EdicionDelPanel | null }
  | null;

export function Cursos({ cursos, alCambiar }: { cursos: CursoDelPanel[]; alCambiar: () => Promise<void> }) {
  const { t } = useTranslation();
  const [abierto, setAbierto] = useState<Abierto>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const alGuardar = async () => {
    setAbierto(null);
    setAviso(t('panel.guardado'));
    await alCambiar();
  };
  const abrir = (a: Abierto) => { setAviso(null); setAbierto(a); };

  return (
    <div>
      <div className="barra">
        <button type="button" className="btn" onClick={() => abrir({ que: 'curso', curso: null })}>
          {t('panel.cursos.nuevo')}
        </button>
        <p className="nota">{t('panel.nadaSeBorra')}</p>
      </div>
      {aviso ? <p className="exito" role="status">{aviso}</p> : null}

      {abierto?.que === 'curso' && abierto.curso === null ? (
        <FormularioDeCurso curso={null} alGuardar={alGuardar} alCancelar={() => setAbierto(null)} />
      ) : null}

      {cursos.length === 0 ? <p className="nota u-mt-6">{t('panel.cursos.vacio')}</p> : null}

      <ul className="cursos">
        {cursos.map((curso) => (
          <li key={curso.id} className="curso">
            {abierto?.que === 'curso' && abierto.curso?.id === curso.id ? (
              <FormularioDeCurso curso={curso} alGuardar={alGuardar} alCancelar={() => setAbierto(null)} />
            ) : (
              <div className="curso__cabeza">
                <div>
                  <h2 className="curso__titulo">{curso.titulo}</h2>
                  <p className="nota">
                    <span className={`chip chip--${curso.estado}`}>{t(`panel.estadosCurso.${curso.estado}`)}</span>
                    {' · '}{t(`panel.modalidades.${curso.modalidad}`)}{' · '}/{curso.slug}
                  </p>
                </div>
                <div className="curso__acciones">
                  <button type="button" className="btn btn--chico" onClick={() => abrir({ que: 'curso', curso })}>
                    {t('panel.cursos.editar')}
                  </button>
                  <button type="button" className="btn btn--chico" onClick={() => abrir({ que: 'edicion', curso, edicion: null })}>
                    {t('panel.cursos.nuevaEdicion')}
                  </button>
                </div>
              </div>
            )}

            {abierto?.que === 'edicion' && abierto.curso.id === curso.id && abierto.edicion === null ? (
              <FormularioDeEdicion curso={curso} edicion={null} alGuardar={alGuardar} alCancelar={() => setAbierto(null)} />
            ) : null}

            {curso.ediciones.length === 0 ? (
              <p className="nota u-mt-4">{t('panel.cursos.sinEdiciones')}</p>
            ) : (
              <div className="tabla-marco">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th scope="col">{t('panel.cursos.edicionEncabezados.fecha')}</th>
                      <th scope="col">{t('panel.cursos.edicionEncabezados.lugar')}</th>
                      <th scope="col">{t('panel.cursos.edicionEncabezados.inscriptos')}</th>
                      <th scope="col">{t('panel.cursos.edicionEncabezados.precio')}</th>
                      <th scope="col">{t('panel.cursos.edicionEncabezados.estado')}</th>
                      <th scope="col"><span className="solo-lectura">{t('panel.cursos.editar')}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {curso.ediciones.map((e) => (
                      abierto?.que === 'edicion' && abierto.edicion?.id === e.id ? (
                        <tr key={e.id}>
                          <td colSpan={6}>
                            <FormularioDeEdicion curso={curso} edicion={e} alGuardar={alGuardar} alCancelar={() => setAbierto(null)} />
                          </td>
                        </tr>
                      ) : (
                        <tr key={e.id}>
                          <td>
                            {t('panel.cursos.horario', { fecha: fechaLarga(e.inicio, e.zona), fin: horaCorta(e.fin, e.zona) })}
                            <span className="tabla__sub">{t('panel.cursos.enZona', { zona: e.ciudad ?? e.zona })}</span>
                          </td>
                          <td>{[e.sede, e.ciudad, e.pais].filter(Boolean).join(' · ') || '—'}</td>
                          <td className="tabla__numero">{ocupacion(e.inscriptos, e.cupo)}</td>
                          <td className="tabla__numero">{formatearPrecio(e.precio_monto, e.precio_moneda)}</td>
                          <td><span className={`chip chip--${e.estado}`}>{t(`panel.estadosEdicion.${e.estado}`)}</span></td>
                          <td>
                            <button type="button" className="enlace" onClick={() => abrir({ que: 'edicion', curso, edicion: e })}>
                              {t('panel.cursos.editar')}
                            </button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
