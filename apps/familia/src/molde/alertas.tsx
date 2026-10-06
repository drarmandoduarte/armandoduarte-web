import { CentroDeAlertas, type Alerta } from '@moldes/app-shell';
import type { T } from '@moldes/idiomas';
import { alertasDeMiEspacio, PREFIJO_ME_ANOTO, type AlertaDeMiEspacio, type DestinoDeAlerta } from '@codice/core';
import type { Yo } from '../comun/api';
import { fechaDeVencimiento } from '../acceso/textos';
import type { Idioma } from '@moldes/idiomas';
import type { Lectura } from './lectura';
import { RUTA_DE_LUGAR } from '../rutas';

/**
 * El Centro de alertas de Mi espacio (orden #37, PR 3 · §9). Qué alerta va en
 * qué tono lo decide `@codice/core` (`alertasDeMiEspacio`, con su test); acá se
 * traduce y se le pone a cada acción adónde lleva.
 */
export function alertasTraducidas(
  t: T, idioma: Idioma, yo: Yo, lectura: Lectura, onIr: (ruta: string) => void,
): Alerta[] {
  const crudas = alertasDeMiEspacio({
    rol: yo.rol,
    mios: lectura.mios,
    abiertos: lectura.abiertos,
    reseteoPendiente: yo.reseteoPendiente ?? null,
    enRevision: lectura.enRevision,
    ediciones: lectura.ediciones,
  });
  const vence = yo.reseteoPendiente ? fechaDeVencimiento(new Date(yo.reseteoPendiente.vence), idioma) : '';
  return crudas.map((a) => traducir(t, a, vence, onIr));
}

const RUTA_DEL_DESTINO: Record<DestinoDeAlerta, string> = {
  misTalleres: RUTA_DE_LUGAR.misTalleres,
  talleres: RUTA_DE_LUGAR.talleres,
  panel: `${RUTA_DE_LUGAR.panel}#inscriptos`,
  cuenta: `${RUTA_DE_LUGAR.ajustes}?s=cuenta`,
};

function traducir(t: T, a: AlertaDeMiEspacio, vence: string, onIr: (ruta: string) => void): Alerta {
  const detalle = !a.detalle ? undefined
    : 'texto' in a.detalle ? a.detalle.texto
      : t(a.detalle.clave, { ...a.detalle.variables, fecha: vence });
  const accion = a.accion;
  return {
    id: a.id,
    tono: a.tono,
    titulo: t(a.titulo.clave, a.titulo.variables),
    detalle,
    accion: accion ? {
      texto: t(accion.clave),
      onClick: () => onIr(accion.slug ? `${PREFIJO_ME_ANOTO}${accion.slug}` : RUTA_DEL_DESTINO[accion.a]),
    } : undefined,
  };
}

export function PaginaDeAlertas({ t, alertas }: { t: T; alertas: Alerta[] }) {
  return <CentroDeAlertas t={t} alertas={alertas} />;
}
