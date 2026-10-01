import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ESTADOS_DE_EDICION, ZONA_POR_DEFECTO, edicionParaGuardar, horaDeParedDe, validarEdicion,
  type EdicionEntrada, type Errores,
} from '@codice/core';
import { api, ErrorDeApi } from '../comun/api';
import { BotonPrincipal, Campo, Selector } from '../comun/Piezas';
import type { CursoDelPanel, EdicionDelPanel } from './tipos';

/**
 * Crear o editar una edición (orden #24 A.1).
 *
 * Las horas se escriben **como hora de pared de la zona de la edición** (D15):
 * «5 de noviembre, 8:30» en `America/Merida`. `edicionParaGuardar()` de
 * `@codice/core` las pasa a instante; la base guarda instante y zona, nunca un
 * offset. Por eso al editar, las horas que se muestran salen de
 * `horaDeParedDe(inicio, zona)` y no de la hora de la computadora de quien edita.
 *
 * El precio es en MXN (la orden) y el país va en código de dos letras.
 */
export function FormularioDeEdicion({
  curso,
  edicion,
  alGuardar,
  alCancelar,
}: {
  curso: CursoDelPanel;
  edicion: EdicionDelPanel | null;
  alGuardar: () => Promise<void>;
  alCancelar: () => void;
}) {
  const { t } = useTranslation();
  const zona = edicion?.zona ?? ZONA_POR_DEFECTO;
  const local = (instante: string | null | undefined) => (instante ? horaDeParedDe(instante, zona) ?? '' : '');
  const [e, setE] = useState<EdicionEntrada>({
    inicio: local(edicion?.inicio),
    fin: local(edicion?.fin),
    zona,
    sede: edicion?.sede ?? '',
    ciudad: edicion?.ciudad ?? '',
    pais: edicion?.pais ?? 'MX',
    cupo: edicion?.cupo ? String(edicion.cupo) : '',
    precio: edicion?.precio_monto !== null && edicion?.precio_monto !== undefined ? String(edicion.precio_monto) : '',
    inscripcionesHasta: local(edicion?.inscripciones_hasta),
    estado: edicion?.estado ?? 'abierta',
  });
  const [errores, setErrores] = useState<Errores<keyof EdicionEntrada>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const poner = (campo: keyof EdicionEntrada, valor: string) => setE((previo) => ({ ...previo, [campo]: valor }));

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setGeneral(null);
    const encontrados = validarEdicion(e);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setGuardando(true);
    try {
      const fila = edicionParaGuardar(e);
      await api(edicion ? `equipo/ediciones/${edicion.id}` : 'equipo/ediciones', {
        metodo: 'POST',
        cuerpo: edicion ? fila : { ...fila, curso_id: curso.id },
      });
      await alGuardar();
    } catch (fallo) {
      const codigo = fallo instanceof ErrorDeApi ? fallo.codigoDelServidor : undefined;
      setGeneral(t(codigo === 'SIN_PERMISO' ? 'equipo.errores.sinPermiso' : 'equipo.errores.generico'));
    } finally {
      setGuardando(false);
    }
  }

  const error = (campo: keyof EdicionEntrada) => (errores[campo] ? t(errores[campo] as string) : null);
  const ayudaDeHora = t('equipo.edicion.horaAyuda');

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h3 className="subtitulo">
        {t(edicion ? 'equipo.edicion.tituloEditar' : 'equipo.edicion.tituloNuevo', { curso: curso.titulo })}
      </h3>
      <div className="formulario__rejilla">
        <Campo id="edicion-inicio" type="datetime-local" rotulo={t('equipo.edicion.inicio')} ayuda={ayudaDeHora}
          value={e.inicio} error={error('inicio')} onChange={(x) => poner('inicio', x.target.value)} autoFocus />
        <Campo id="edicion-fin" type="datetime-local" rotulo={t('equipo.edicion.fin')} ayuda={ayudaDeHora}
          value={e.fin} error={error('fin')} onChange={(x) => poner('fin', x.target.value)} />
        <Campo id="edicion-zona" rotulo={t('equipo.edicion.zona')} ayuda={t('equipo.edicion.zonaAyuda')}
          value={e.zona} error={error('zona')} onChange={(x) => poner('zona', x.target.value.trim())} />
        <Campo id="edicion-sede" rotulo={t('equipo.edicion.sede')} value={e.sede} error={error('sede')}
          onChange={(x) => poner('sede', x.target.value)} />
        <Campo id="edicion-ciudad" rotulo={t('equipo.edicion.ciudad')} value={e.ciudad} error={error('ciudad')}
          onChange={(x) => poner('ciudad', x.target.value)} />
        <Campo id="edicion-pais" rotulo={t('equipo.edicion.pais')} value={e.pais} maxLength={2} error={error('pais')}
          onChange={(x) => poner('pais', x.target.value.toUpperCase())} />
        <Campo id="edicion-cupo" rotulo={t('equipo.edicion.cupo')} ayuda={t('equipo.edicion.cupoAyuda')} inputMode="numeric"
          value={e.cupo} error={error('cupo')} onChange={(x) => poner('cupo', x.target.value.trim())} />
        <Campo id="edicion-precio" rotulo={t('equipo.edicion.precio')} inputMode="decimal"
          value={e.precio} error={error('precio')} onChange={(x) => poner('precio', x.target.value.trim())} />
        <Campo id="edicion-hasta" type="datetime-local" rotulo={t('equipo.edicion.hasta')} ayuda={t('equipo.edicion.hastaAyuda')}
          value={e.inscripcionesHasta} error={error('inscripcionesHasta')} onChange={(x) => poner('inscripcionesHasta', x.target.value)} />
        <Selector id="edicion-estado" rotulo={t('equipo.edicion.estado')} value={e.estado} error={error('estado')}
          onChange={(x) => poner('estado', x.target.value)}
          opciones={ESTADOS_DE_EDICION.map((m) => ({ valor: m, texto: t(`equipo.estadosEdicion.${m}`) }))} />
      </div>
      {general ? <p className="error" role="alert">{general}</p> : null}
      <div className="formulario__botones">
        <BotonPrincipal cargando={guardando} textoCargando={t('equipo.guardando')}>{t('equipo.guardar')}</BotonPrincipal>
        <button type="button" className="btn" onClick={alCancelar}>{t('equipo.cancelar')}</button>
      </div>
    </form>
  );
}
