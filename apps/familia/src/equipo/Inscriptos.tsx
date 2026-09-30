import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { aCsv, coincide, enlaceDeSaludo, fechaCorta, fechaLarga, nombreDeArchivo } from '@codice/core';
import { api } from '../comun/api';
import { Campo, Selector } from '../comun/Piezas';
import { descargar } from './descargar';
import { nombreCompleto, type CursoDelPanel, type Inscripto } from './tipos';

/**
 * Inscriptos — una tabla por edición (orden #24 A.2).
 *
 * Las filas son las que la base deja ver a quien entró: Gabi recibe las de
 * México, Diana las del resto, Armando todas. **Acá no se filtra por
 * territorio**: se busca dentro de lo que llegó, y se exporta lo que se ve.
 *
 * El WhatsApp abre `wa.me` con un saludo corto ya escrito, con el nombre y el
 * curso. Si el número no tiene forma de teléfono, se muestra como texto.
 */
export function Inscriptos({ cursos }: { cursos: CursoDelPanel[] }) {
  const { t } = useTranslation();
  const ediciones = useMemo(
    () => cursos.flatMap((c) => c.ediciones.map((e) => ({ curso: c, edicion: e }))),
    [cursos],
  );
  const [elegida, setElegida] = useState<string>(ediciones[0]?.edicion.id ?? '');
  const [filas, setFilas] = useState<Inscripto[] | null>(null);
  const [error, setError] = useState(false);
  const [consulta, setConsulta] = useState('');

  useEffect(() => {
    if (!elegida) return;
    let vivo = true;
    setFilas(null);
    setError(false);
    void (async () => {
      try {
        const r = await api<{ inscriptos: Inscripto[] }>(`equipo/inscriptos/${elegida}`);
        if (vivo) setFilas(r.inscriptos);
      } catch {
        if (vivo) setError(true);
      }
    })();
    return () => { vivo = false; };
  }, [elegida]);

  if (ediciones.length === 0) return <p className="nota">{t('equipo.inscriptos.sinEdiciones')}</p>;

  const actual = ediciones.find((x) => x.edicion.id === elegida);
  const visibles = (filas ?? []).filter((f) => coincide([f.nombre, f.apellido, f.email, f.referencia], consulta));
  /* La fecha de inscripción, en la zona de la edición: la misma hora que ve el equipo en la ficha. */
  const fecha = (instante: string) => fechaCorta(instante, actual?.edicion.zona ?? 'America/Merida');

  const exportar = () => {
    const encabezados = ['referencia', 'nombre', 'correo', 'whatsapp', 'pais', 'fecha', 'estado']
      .map((k) => t(`equipo.inscriptos.encabezados.${k}`));
    const csv = aCsv(encabezados, visibles.map((f) => [
      f.referencia, nombreCompleto(f, ''), f.email, f.whatsapp, f.pais, f.inscripto_el,
      t(`equipo.estadosInscripcion.${f.estado}`),
    ]));
    descargar(nombreDeArchivo(`inscriptos-${actual?.curso.slug ?? 'edicion'}`, new Date()), csv);
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

      {error ? <p className="error" role="alert">{t('equipo.errorAlCargar')}</p> : null}
      {filas === null && !error ? <p className="nota" role="status">{t('equipo.cargando')}</p> : null}
      {filas && filas.length === 0 ? <p className="nota">{t('equipo.inscriptos.vacio')}</p> : null}
      {filas && filas.length > 0 && visibles.length === 0 ? <p className="nota">{t('equipo.inscriptos.sinResultados')}</p> : null}

      {filas && visibles.length > 0 ? (
        <>
          <p className="nota" role="status">{t('equipo.inscriptos.cuantos', { cuantos: visibles.length, total: filas.length })}</p>
          <div className="tabla-marco">
            <table className="tabla">
              <thead>
                <tr>
                  {['referencia', 'nombre', 'correo', 'whatsapp', 'pais', 'fecha', 'estado'].map((k) => (
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
                  return (
                    <tr key={f.inscripcion_id}>
                      <td className="tabla__ref">{f.referencia}</td>
                      <td>{nombre}</td>
                      <td><a className="enlace" href={`mailto:${f.email}`}>{f.email}</a></td>
                      <td>
                        {enlace ? (
                          <a className="enlace" href={enlace} target="_blank" rel="noopener"
                            aria-label={t('equipo.inscriptos.escribirle', { nombre })}>{f.whatsapp}</a>
                        ) : (f.whatsapp ?? '—')}
                      </td>
                      <td>{f.pais ?? '—'}</td>
                      <td className="tabla__numero">{fecha(f.inscripto_el)}</td>
                      <td><span className={`chip chip--${f.estado}`}>{t(`equipo.estadosInscripcion.${f.estado}`)}</span></td>
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
