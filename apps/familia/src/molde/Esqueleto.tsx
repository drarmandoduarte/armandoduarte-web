import type { ReactNode } from 'react';
import { Shell } from '@moldes/app-shell';
import type { T } from '@moldes/idiomas';
import { claveDelRol, modulosDe, nombreDelBloque, type Modulo } from '@codice/core';
import type { Yo } from '../comun/api';
import { RUTA_DE_LUGAR, type Lugar } from '../rutas';
import { design } from './arranque';

/** El ícono de cada módulo, de los que trae el Kit UI (`core/iconos.js`). */
const ICONO: Record<Modulo | 'equipo', string> = {
  talleres: 'calendar-days',
  misTalleres: 'receipt',
  panel: 'layout-grid',
  equipo: 'users',
};

/**
 * El esqueleto de Mi espacio: `<Shell>` del molde (orden #37, PR 3 · §9), que
 * reemplaza la barra de la #29/#34.
 *
 * Qué módulos ve cada rol lo dice `modulosDe()` de `core`: el cliente, Talleres
 * y Mis talleres; el equipo y el dueño, además el Panel; Equipo (transversal,
 * después de la Papelera), solo el dueño. Talleres va en la pestaña del celular.
 * Sin `onPreguntar`: Mi espacio no tiene asistente, y la fila «Pregúntale» no
 * aparece (§9).
 *
 * El shell no navega: avisa con `onIr(id)` y la ruta sale de `RUTA_DE_LUGAR`.
 * Debajo del nombre, el rol («Equipo · México»), donde las apps con plan
 * ponen el plan.
 */
export function Esqueleto({ t, yo, correo, activo, alertas, onIr, onSalir, children }: {
  t: T;
  yo: Yo;
  correo: string | null;
  activo: Lugar;
  alertas: number;
  onIr: (ruta: string) => void;
  onSalir: () => void;
  children: ReactNode;
}) {
  const { modulos, transversales, principal } = modulosDe(yo.rol);
  const fila = (id: Modulo | 'equipo') => ({ id, etiqueta: t(id === 'equipo' ? 'shell.equipo' : `mi.modulos.${id}`), icono: ICONO[id] });
  return (
    <Shell
      t={t}
      app={design.app}
      modulos={modulos.map(fila)}
      transversales={transversales.map(fila)}
      principal={principal}
      activo={activo}
      onIr={(id) => onIr(RUTA_DE_LUGAR[id as Lugar] ?? RUTA_DE_LUGAR.inicio)}
      alertas={alertas}
      usuario={{ nombre: nombreDelBloque(yo.persona, correo), plan: t(claveDelRol(yo.rol, yo.territorio)) }}
      onSalir={onSalir}
    >
      {children}
    </Shell>
  );
}
