import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Yo } from '../comun/api';
import { Pantalla, Titulo } from '../comun/Piezas';
import { RUTAS } from '../rutas';
import { Cursos } from './Cursos';
import { Inscriptos } from './Inscriptos';
import { Clientes } from './Clientes';
import type { CursoDelPanel } from './tipos';

/**
 * `/equipo` — el panel del equipo, orden #24 A.
 *
 * Tres pestañas, en el orden de la orden: **Cursos · Inscriptos · Clientes**.
 * La pestaña va en el `#` de la URL para que un recargar vuelva a la misma.
 *
 * **La pantalla no filtra por territorio.** Lo que llega de la API ya es lo que
 * la base le deja ver a quien entró (RLS, D11); acá solo se busca dentro de eso.
 *
 * Los cursos se cargan una vez acá arriba porque las dos primeras pestañas los
 * usan: Cursos los muestra y Inscriptos elige la edición de entre ellos.
 */
const PESTANAS = ['cursos', 'inscriptos', 'clientes'] as const;
type Pestana = (typeof PESTANAS)[number];

function pestanaDelHash(): Pestana {
  const hash = window.location.hash.replace('#', '');
  return (PESTANAS as readonly string[]).includes(hash) ? (hash as Pestana) : 'cursos';
}

export function Panel({ yo }: { yo: Yo }) {
  const { t } = useTranslation();
  const [pestana, setPestana] = useState<Pestana>(pestanaDelHash);
  const [cursos, setCursos] = useState<CursoDelPanel[] | null>(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setError(false);
    try {
      const r = await api<{ cursos: CursoDelPanel[] }>('equipo/cursos');
      setCursos(r.cursos);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const elegir = (p: Pestana) => {
    setPestana(p);
    window.history.replaceState(null, '', `${RUTAS.equipo}#${p}`);
  };

  return (
    <Pantalla ancha>
      <div className="panel-cabeza">
        <div>
          <Titulo texto={t('equipo.titulo')} />
          <p className="bajada">{t('equipo.bajada')}</p>
        </div>
        <a href={RUTAS.miEspacio} className="enlace">← {t('equipo.volver')}</a>
      </div>

      <div className="pestanas" role="tablist" aria-label={t('equipo.titulo').replace(/[[\]]/g, '')}>
        {PESTANAS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            id={`pestana-${p}`}
            aria-selected={pestana === p}
            aria-controls={`panel-${p}`}
            className={`pestana${pestana === p ? ' pestana--activa' : ''}`}
            onClick={() => elegir(p)}
          >
            {t(`equipo.pestanas.${p}`)}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`pestana-${pestana}`} className="pestana-contenido">
        {error ? (
          <div className="aviso" role="alert">
            {t('equipo.errorAlCargar')}{' '}
            <button type="button" className="enlace" onClick={() => void cargar()}>{t('equipo.reintentar')}</button>
          </div>
        ) : cursos === null ? (
          <p className="nota" role="status">{t('equipo.cargando')}</p>
        ) : pestana === 'cursos' ? (
          <Cursos cursos={cursos} alCambiar={cargar} />
        ) : pestana === 'inscriptos' ? (
          <Inscriptos cursos={cursos} yo={yo} />
        ) : (
          <Clientes yo={yo} />
        )}
      </section>
    </Pantalla>
  );
}
