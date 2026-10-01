import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { claveDeEstado, fechaCorta, fechaLarga, tonoDeEstado } from '@codice/core';
import { api } from '../comun/api';
import { AreaDeTexto } from '../comun/Piezas';

/** Lo que devuelve `GET /api/equipo/clientes/:id` (#27 D.3). */
interface Ficha {
  inscripciones: { inscripcion_id: string; referencia: string; curso: string | null; inicio: string | null; zona: string | null; estado: string }[];
  notas: { id: string; texto: string; created_at: string; autor: string | null }[];
}

const ZONA_DEL_EQUIPO = 'America/Merida';

/**
 * La ficha de un cliente, abierta debajo de su fila — orden #27 D.3.
 *
 * Sus inscripciones con estado, y las **notas del equipo**: lista (fecha,
 * quién, texto) y un campo para agregar una. Solo se agrega (la 011 no deja
 * editar ni borrar): una nota equivocada se corrige con otra, y la ayuda lo
 * dice. Los datos del perfil ya están en la fila; acá no se repiten.
 */
export function FichaDeCliente({ personaId, nombre, alAgregar }: { personaId: string; nombre: string; alAgregar: () => void }) {
  const { t } = useTranslation();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState(false);
  const [texto, setTexto] = useState('');
  const [errorDeNota, setErrorDeNota] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setFicha(await api<Ficha>(`equipo/clientes/${personaId}`));
    } catch {
      setError(true);
    }
  }, [personaId]);
  useEffect(() => { void cargar(); }, [cargar]);

  async function agregar(evento: React.FormEvent) {
    evento.preventDefault();
    const limpio = texto.trim();
    if (limpio === '' || limpio.length > 2000) {
      setErrorDeNota(t('equipo.clientes.detalle.errores.nota'));
      return;
    }
    setErrorDeNota(null);
    setAgregando(true);
    try {
      await api(`equipo/clientes/${personaId}/notas`, { metodo: 'POST', cuerpo: { texto: limpio } });
      setTexto('');
      await cargar();
      alAgregar();
    } catch {
      setErrorDeNota(t('equipo.clientes.detalle.errores.generico'));
    } finally {
      setAgregando(false);
    }
  }

  if (error) return <p className="error" role="alert">{t('equipo.clientes.detalle.error')}</p>;
  if (!ficha) return <p className="nota" role="status">{t('equipo.clientes.detalle.cargando')}</p>;

  return (
    <div className="ficha" aria-label={nombre}>
      <div>
        <h3 className="ficha__titulo">{t('equipo.clientes.detalle.inscripciones')}</h3>
        {ficha.inscripciones.length === 0 ? <p className="nota">{t('equipo.clientes.detalle.sinInscripciones')}</p> : (
          <ul className="ficha__lista">
            {ficha.inscripciones.map((i) => (
              <li key={i.inscripcion_id}>
                {i.curso ?? '—'}
                {i.inicio && i.zona ? <span className="tabla__sub">{fechaLarga(i.inicio, i.zona)}</span> : null}
                <span className="tabla__sub">
                  <span className="tabla__ref">{i.referencia}</span>{' '}
                  <span className={`estado estado--${tonoDeEstado(i.estado)}`}>{t(`equipo.estadosInscripcion.${i.estado}`, { defaultValue: t(claveDeEstado(i.estado)) })}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="ficha__titulo">{t('equipo.clientes.detalle.notas')}</h3>
        {ficha.notas.length === 0 ? <p className="nota">{t('equipo.clientes.detalle.sinNotas')}</p> : (
          <ul className="ficha__lista">
            {ficha.notas.map((n) => (
              <li key={n.id}>
                <span className="ficha__nota">{n.texto}</span>
                <span className="tabla__sub">{t('equipo.clientes.detalle.notaPor', { fecha: fechaCorta(n.created_at, ZONA_DEL_EQUIPO), quien: n.autor ?? '—' })}</span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={agregar} noValidate className="confirmar">
          <AreaDeTexto id={`nota-${personaId}`} rotulo={t('equipo.clientes.detalle.nota')} ayuda={t('equipo.clientes.detalle.notaAyuda')}
            maxLength={2000} rows={3} value={texto} error={errorDeNota} onChange={(e) => setTexto(e.target.value)} />
          <div className="confirmar__botones">
            <button type="submit" className="btn btn--chico" disabled={agregando}>
              {agregando ? t('equipo.clientes.detalle.agregando') : t('equipo.clientes.detalle.agregar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
