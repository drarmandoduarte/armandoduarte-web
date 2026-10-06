import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pantalla } from '@moldes/app-shell';
import { puedeDeclarar } from '@codice/core';
import { api, type Yo } from '../comun/api';
import { EnlaceInterno, useNavegar } from '../comun/navegacion';
import { RUTAS } from '../rutas';
import {
  ConfirmacionDeLugar, MisTalleres, TalleresAbiertos, type Confirmacion, type TallerAbierto, type TallerMio,
} from './Talleres';
import type { Cobro } from './Comprobante';
import { useT } from '../acceso/textos';

/**
 * Las pantallas de Mi espacio por dentro — orden #29, B.
 *
 * ── Desde la #37 (PR 3), dentro del shell del molde ─────────────────────
 * Talleres y Mis talleres son **módulos** del `<Shell>`: lo de adentro (los
 * talleres, «Me anoto», el comprobante) no cambió; la cabecera es `Pantalla`
 * del molde (`§ · MÓDULO`, el título con su palabra acentuada y una línea),
 * con los textos del molde en los tres idiomas. El cuerpo sigue en español
 * (lo declara el informe). «Tus datos» y Seguridad se fueron a Ajustes del
 * molde (`molde/ajustes.tsx`).
 *
 * Hasta la #28 todo esto era **una** pantalla (`/mi-espacio`): saludo, talleres
 * abiertos, mis talleres, tus datos, seguridad y cerrar sesión, apilados. La
 * #29 lo reparte en los lugares de la barra lateral, **cada uno tal cual era**:
 *
 *   · `/talleres` — «Talleres abiertos» de la #24 B, con «Me anoto»;
 *   · `/mis-talleres` — «Mis talleres» de la #24 B + #27 C (estado, comprobante);
 *   · `/mis-datos` — «Tus datos» de la #18 + #27 D y, para el equipo, Seguridad
 *     (desde la #34, Ajustes → Perfil y Ajustes → Seguridad, en `Ajustes.tsx`);
 *   · Inicio (`/mi-espacio`) es nuevo y vive en `Inicio.tsx`.
 *
 * «Cerrar sesión» pasó a la barra («Salir»). El marco lo pone `App.tsx`.
 *
 * ── Un naranja por pantalla (D26), ahora que son varias ─────────────────
 * Cada pantalla tiene su acción principal y nada más: en Talleres, «Me anoto»;
 * en Mis talleres, pagar lo que se debe; en Mis datos, «Guardar». Lo que antes
 * decidía `principalDeMiEspacio()` entre las tres ya no hace falta decidirlo:
 * no están en la misma pantalla.
 */
/** Lo que trae `GET /api/talleres`, con su estado de carga. Nunca «cargando» para siempre (#22): un fallo es `error`. */
type Talleres =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; abiertos: TallerAbierto[]; mios: TallerMio[]; cobro: Cobro | null };

export function useTalleres() {
  const [talleres, setTalleres] = useState<Talleres>({ estado: 'cargando' });
  const leer = useCallback(async () => {
    try {
      const r = await api<{ abiertos: TallerAbierto[]; mios: TallerMio[]; cobro?: Cobro | null }>('talleres');
      setTalleres({ estado: 'listo', abiertos: r.abiertos, mios: r.mios, cobro: r.cobro ?? null });
    } catch {
      setTalleres({ estado: 'error' });
    }
  }, []);
  useEffect(() => { void leer(); }, [leer]);
  return { talleres, leer };
}

/** Cargando o error, igual en las dos pantallas de talleres. */
function EstadoDeLaLista({ talleres, leer }: { talleres: Talleres; leer: () => Promise<void> }) {
  const { t } = useTranslation();
  if (talleres.estado === 'cargando') {
    return <section className="seccion"><p className="nota" role="status">{t('miEspacio.talleresCargando')}</p></section>;
  }
  return (
    <section className="seccion">
      <p className="error" role="alert">{t('miEspacio.talleresError')}</p>
      <div className="fila">
        <button type="button" className="btn btn--ancho" onClick={() => void leer()}>{t('comun.reintentar')}</button>
      </div>
    </section>
  );
}

/** `/talleres` y `/me-anoto/<slug>`: los talleres abiertos, y al anotarse, la confirmación. */
export function PaginaDeTalleres({ yo, slugElegido = null, recargar }: {
  yo: Yo;
  /** El taller de `/me-anoto/<slug>`, si se llegó por ahí (#24 B). */
  slugElegido?: string | null;
  recargar: () => Promise<void>;
}) {
  const { t: tm } = useT();
  const navegar = useNavegar();
  const { talleres, leer } = useTalleres();
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  return (
    <Pantalla antetitulo={tm('mi.modulos.talleres')} titulo={tm('mi.paginas.talleres')} hint={tm('mi.paginas.talleres.hint')}>
      {confirmacion ? (
        <ConfirmacionDeLugar c={confirmacion} yo={yo} alCerrar={() => navegar(RUTAS.misTalleres)} />
      ) : talleres.estado !== 'listo' ? (
        <EstadoDeLaLista talleres={talleres} leer={leer} />
      ) : (
        <TalleresAbiertos
          talleres={talleres.abiertos}
          slugElegido={slugElegido}
          yo={yo}
          sinTitulo
          alConfirmar={(c) => {
            setConfirmacion(c);
            window.scrollTo({ top: 0 });
            /* La ficha pudo cambiar (nombre, apellido, WhatsApp) y la lista
               también (su referencia, un lugar menos). */
            void recargar();
            void leer();
          }}
          alCambiar={() => void leer()}
        />
      )}
    </Pantalla>
  );
}

/** `/mis-talleres`: mis inscripciones, su estado y el comprobante (#24 B + #27 C). */
export function PaginaDeMisTalleres({ yo }: { yo: Yo }) {
  const { t } = useTranslation();
  const { t: tm } = useT();
  const { talleres, leer } = useTalleres();
  return (
    <Pantalla antetitulo={tm('mi.modulos.misTalleres')} titulo={tm('mi.paginas.misTalleres')} hint={tm('mi.paginas.misTalleres.hint')}>
      {talleres.estado !== 'listo' ? (
        <EstadoDeLaLista talleres={talleres} leer={leer} />
      ) : talleres.mios.length === 0 ? (
        <section className="seccion">
          <p className="nota">{t('paginas.misTalleresVacio')}</p>
          <p className="u-mt-4"><EnlaceInterno a={RUTAS.talleres} className="enlace">{t('paginas.verTalleres')} →</EnlaceInterno></p>
        </section>
      ) : (
        <MisTalleres
          mios={talleres.mios}
          yo={yo}
          cobro={talleres.cobro}
          sinTitulo
          naranja={talleres.mios.some((m) => puedeDeclarar(m.estado) && Boolean(m.inscripcion_id))}
          alDeclarar={() => void leer()}
        />
      )}
    </Pantalla>
  );
}
