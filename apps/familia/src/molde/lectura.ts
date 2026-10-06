import { useCallback, useEffect, useState } from 'react';
import { edicionesVigentes } from '@codice/core';
import { api, type Yo } from '../comun/api';
import type { TallerAbierto, TallerMio } from '../mi-espacio/Talleres';
import type { CursoDelPanel, Inscripto } from '../equipo/tipos';

/**
 * La lectura única (fase-2 §9: «Inicio no lee nada; la app hace una lectura
 * para todos los widgets»). La comparten tres lugares que muestran lo mismo:
 * el número de la campana del shell, Inicio y el Centro de alertas. Se lee una
 * vez al entrar y otra cuando algo cambió (`releer`).
 *
 *   · todos: `GET /api/talleres` — los abiertos y los míos;
 *   · el equipo, además: `GET /api/equipo/cursos` y, de cada edición vigente,
 *     sus inscriptos, para contar los comprobantes en revisión. Es lo mismo que
 *     hacía la tarjeta «Panel del equipo» de la #29.
 *
 * **Si una parte falla, se dice cuál** (`noCargo`): un cero en un cuadro que no
 * se pudo leer no quiere decir que no pasó nada. Nunca «cargando» para siempre
 * (#22): un fallo es un estado.
 */
export interface Lectura {
  cargando: boolean;
  abiertos: TallerAbierto[];
  mios: TallerMio[];
  /** Solo equipo y dueño; `null` si no se pudo leer. */
  enRevision: number | null;
  /** Solo equipo y dueño: las ediciones vigentes, con el título de su curso. */
  ediciones: Array<{ id: string; titulo: string; inicio: string; fin: string; zona: string; estado: string }>;
  /** Qué no se pudo leer: `talleres` y/o `panel`. */
  noCargo: Array<'talleres' | 'panel'>;
}

const VACIA: Lectura = { cargando: true, abiertos: [], mios: [], enRevision: null, ediciones: [], noCargo: [] };

export function useLectura(yo: Yo | null): Lectura & { releer: () => Promise<void> } {
  const [lectura, setLectura] = useState<Lectura>(VACIA);
  const esEquipo = yo?.tipo === 'equipo';
  const hay = yo !== null;

  const releer = useCallback(async () => {
    if (!hay) return;
    const noCargo: Lectura['noCargo'] = [];
    let abiertos: TallerAbierto[] = [];
    let mios: TallerMio[] = [];
    let enRevision: number | null = null;
    let ediciones: Lectura['ediciones'] = [];
    try {
      const r = await api<{ abiertos?: TallerAbierto[]; mios?: TallerMio[] }>('talleres');
      /* Una respuesta sin las listas no tira abajo Inicio: es «no hay». */
      abiertos = Array.isArray(r.abiertos) ? r.abiertos : [];
      mios = Array.isArray(r.mios) ? r.mios : [];
    } catch {
      noCargo.push('talleres');
    }
    if (esEquipo) {
      try {
        const cursos = (await api<{ cursos?: CursoDelPanel[] }>('equipo/cursos')).cursos ?? [];
        const vigentes = edicionesVigentes(cursos.flatMap((c) => c.ediciones.map((e) => ({ ...e, titulo: c.titulo }))));
        ediciones = vigentes.map((e) => ({ id: e.id, titulo: e.titulo, inicio: e.inicio, fin: e.fin, zona: e.zona, estado: e.estado }));
        const listas = await Promise.all(vigentes.map((e) => api<{ inscriptos: Inscripto[] }>(`equipo/inscriptos/${e.id}`)));
        enRevision = listas.reduce((s, l) => s + (l.inscriptos ?? []).filter((i) => i.estado === 'en_revision').length, 0);
      } catch {
        noCargo.push('panel');
      }
    }
    setLectura({ cargando: false, abiertos, mios, enRevision, ediciones, noCargo });
  }, [hay, esEquipo]);

  useEffect(() => { void releer(); }, [releer]);
  return { ...lectura, releer };
}
