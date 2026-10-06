import { useCallback, useEffect, useState } from 'react';
import { Equipo, type Persona } from '@moldes/app-shell';
import type { T } from '@moldes/idiomas';
import { api, type Yo } from '../comun/api';
import { ACCESO } from '../acceso/acceso.config';
import { RUTA_DE_LUGAR } from '../rutas';

/** Una fila de `GET /api/equipo/miembros`. */
interface Miembro { id: string; nombre: string | null; apellido: string | null; email: string | null; rol: string; territorio: string; activo: boolean }

/**
 * La pantalla Equipo de Mi espacio: `<Equipo>` del molde (orden #37, PR 3 ·
 * §9), solo para el dueño (es quien la ve en la barra, y la API se lo pide:
 * `SOLO_DUENO`).
 *
 *   · `kit.rescate` = `'solo'` (`acceso.config.ts`): **no existe «Resetear
 *     autenticador»** — nadie resetea a otra persona (fase-2 §8).
 *   · Suspender es quitar del equipo (`POST /api/equipo/miembros/:id/quitar`)
 *     y reactivar es volver a sumarla con su territorio de antes: la fila se
 *     queda, con su historia (001). A un dueño no se lo suspende (la API no lo
 *     deja): el cartel lo dice.
 *   · Invitar lleva al panel → Clientes, que es donde se suma a alguien al
 *     equipo desde la #24 (eligiendo su territorio).
 *   · Sin «Cambiar rol» (no hay ruta para pasar de equipo a dueño) y sin
 *     Actividad (es el molde de Auditoría, que todavía no existe: fase-2 §13).
 */
export function PaginaDeEquipo({ t, yo, onIr, alAvisar }: {
  t: T; yo: Yo; onIr: (ruta: string) => void; alAvisar: (texto: string, tono?: 'success' | 'danger') => void;
}) {
  const [miembros, setMiembros] = useState<Miembro[]>([]);

  const leer = useCallback(async () => {
    try {
      setMiembros((await api<{ miembros: Miembro[] }>('equipo/miembros')).miembros);
    } catch {
      alAvisar(t('mi.equipo.error'), 'danger');
    }
  }, [t, alAvisar]);
  useEffect(() => { void leer(); }, [leer]);

  const suspender = async (id: string, suspender: boolean) => {
    const m = miembros.find((x) => x.id === id);
    try {
      if (suspender) await api(`equipo/miembros/${id}/quitar`, { metodo: 'POST' });
      else await api('equipo/miembros', { metodo: 'POST', cuerpo: { persona_id: id, territorio: m?.territorio } });
    } catch {
      alAvisar(t(m?.rol === 'dueno' ? 'mi.equipo.noSuspende' : 'mi.equipo.error'), 'danger');
    }
    await leer();
  };

  const personas: Persona[] = miembros.map((m) => ({
    id: m.id,
    nombre: [m.nombre, m.apellido].filter(Boolean).join(' ') || m.email || '—',
    correo: m.email ?? undefined,
    rol: m.rol,
    estado: m.activo ? 'activa' : 'suspendida',
    yo: m.id === yo.persona?.id,
  }));

  return (
    <Equipo
      t={t}
      ctx={{ manda: yo.rol === 'dueno' }}
      kit={{ rescate: ACCESO.rescate }}
      personas={personas}
      roles={[{ id: 'dueno', etiqueta: t('mi.rol.dueno') }, { id: 'equipo', etiqueta: t('mi.rol.equipo') }]}
      acciones={{
        invitar: () => onIr(`${RUTA_DE_LUGAR.panel}#clientes`),
        suspender: (id, s) => void suspender(id, s),
      }}
    />
  );
}
