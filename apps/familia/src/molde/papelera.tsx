import { useCallback, useEffect, useState } from 'react';
import { Papelera, type Borrado } from '@moldes/app-shell';
import type { T } from '@moldes/idiomas';
import { api, type Yo } from '../comun/api';

/** Una fila de `GET /api/papelera` (`en_la_papelera()`, 014). */
interface FilaDePapelera { tipo: 'curso' | 'edicion'; id: string; nombre: string; borrado_el: string; persona: string }

/**
 * La Papelera de Mi espacio: `<Papelera>` del molde (orden #37, PR 3 · §9).
 *
 * Es del equipo: un curso archivado o una edición cerrada **sin
 * inscripciones** (la regla, con su porqué, está en la 014). Lo que tiene
 * inscripciones no entra: es un registro contable y no se borra nunca. A los 30
 * días se borra para siempre; lo hace la base cuando alguien abre la papelera
 * (`GET /api/papelera`). Un cliente no borra nada en Mi espacio: la ve vacía y
 * no se le pregunta nada a la API.
 */
export function PaginaDePapelera({ t, yo, alAvisar }: { t: T; yo: Yo; alAvisar: (texto: string, tono?: 'success' | 'danger') => void }) {
  const [items, setItems] = useState<Borrado[]>([]);
  const esEquipo = yo.tipo === 'equipo';
  const idioma = t.idioma === 'es' ? 'es-MX' : t.idioma === 'pt' ? 'pt-BR' : 'en-US';

  const leer = useCallback(async () => {
    if (!esEquipo) return;
    try {
      const r = await api<{ items: FilaDePapelera[] }>('papelera');
      setItems(r.items.map((x) => ({
        id: `${x.tipo}:${x.id}`,
        nombre: x.nombre,
        tipo: t(`mi.papelera.tipo.${x.tipo}`),
        borradoEl: x.borrado_el,
        fechaTexto: new Intl.DateTimeFormat(idioma, { day: 'numeric', month: 'numeric' }).format(new Date(x.borrado_el)),
        persona: x.persona,
      })));
    } catch {
      alAvisar(t('mi.papelera.error'), 'danger');
    }
  }, [esEquipo, idioma, t, alAvisar]);

  useEffect(() => { void leer(); }, [leer]);

  const restaurar = async (clave: string) => {
    const [tipo, id] = clave.split(':');
    try {
      await api('papelera/restaurar', { metodo: 'POST', cuerpo: { tipo, id } });
      alAvisar(t('mi.papelera.restaurado'), 'success');
    } catch {
      alAvisar(t('mi.papelera.error'), 'danger');
    }
    await leer();
  };

  return <Papelera t={t} items={items} onRestaurar={esEquipo ? (id) => void restaurar(id) : undefined} />;
}
