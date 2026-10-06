/**
 * Mi espacio con el molde — orden #37, PR 3 (fase-2 §6 y §9).
 *
 * Las preguntas que el shell, Ajustes, Inicio, el Centro de alertas y la
 * Bienvenida del molde le hacen a la app, y que no le tocan a un `.tsx` (la app
 * nativa va a hacer las mismas):
 *
 *   · ¿Quién es esta persona para el molde? — `contextoDeAjustes` y
 *     `contextoDeInicio`, desde su rol.
 *   · ¿Qué módulos ve en la barra? — `modulosDe`.
 *   · ¿Qué cuadros ve en Inicio si nunca lo acomodó? — `INICIO_POR_ROL`.
 *   · ¿Qué alertas tiene, y de qué tono? — `alertasDeMiEspacio`.
 *   · ¿Qué pasos tiene su Bienvenida? — `pasosDeBienvenida`.
 *
 * Los textos no están acá: cada cosa devuelve **claves** de idioma y sus
 * variables, y la pantalla las traduce.
 */
import type { Rol } from '../panel/equipo';

/* ── Quién es, para el molde ─────────────────────────────────────────────── */

/**
 * El contexto de Ajustes del molde (`@moldes/ajustes`, `Contexto`).
 *   · `manda`: el dueño. Es quien ve «Actividad» en Cuenta y la pantalla de
 *     Equipo. Gabi y Diana son equipo pero no mandan: no suman ni quitan gente.
 *   · `equipo`: el autenticador es obligatorio (el kit lo exige a `dueno` y
 *     `equipo`); para el cliente es opcional.
 *   · `asistente: false`: Mi espacio no tiene asistente (fase 3).
 */
export function contextoDeAjustes(rol: Rol): { manda: boolean; equipo: boolean; dueno: boolean; asistente: false } {
  return { manda: rol === 'dueno', equipo: rol !== 'cliente', dueno: rol === 'dueno', asistente: false };
}

/**
 * El contexto de Inicio del molde (`@moldes/inicio`). Acá `manda` quiere decir
 * «es del equipo»: el molde esconde los cuadros `soloManda` a quien no manda, y
 * en Mi espacio lo que un cliente no puede ver es lo del panel (comprobantes en
 * revisión de otras personas), que Gabi y Diana sí ven.
 */
export function contextoDeInicio(rol: Rol): { rol: Rol; manda: boolean } {
  return { rol, manda: rol !== 'cliente' };
}

/* ── La barra ────────────────────────────────────────────────────────────── */

/** Los módulos del negocio, en el orden de la barra (Inicio, Alertas y Papelera los pone el molde). */
export const MODULOS = ['talleres', 'misTalleres', 'panel'] as const;
export type Modulo = (typeof MODULOS)[number];

/**
 * Qué ve cada rol en la barra (orden #37 §9): el cliente, Talleres y Mis
 * talleres; el equipo y el dueño, además el Panel. Lo transversal —después de
 * la Papelera— es Equipo, solo para el dueño. El módulo de la pestaña del
 * celular es Talleres para todos.
 */
export function modulosDe(rol: Rol): { modulos: Modulo[]; transversales: Array<'equipo'>; principal: Modulo } {
  return {
    modulos: rol === 'cliente' ? ['talleres', 'misTalleres'] : ['talleres', 'misTalleres', 'panel'],
    transversales: rol === 'dueno' ? ['equipo'] : [],
    principal: 'talleres',
  };
}

/* ── Inicio ──────────────────────────────────────────────────────────────── */

/** Los cuadros propios de Mi espacio; `hoy`, `alertas` y `pendientes` son del molde. */
export const CUADROS_DE_MI_ESPACIO = ['proximo', 'datos', 'ayuda', 'panel'] as const;

/**
 * Lo que cada rol ve en Inicio si nunca lo acomodó (orden #37 §9). «Mientras
 * no estabas» es el hueco del asistente (fase 3): no es un cuadro y Mi espacio
 * todavía no lo tiene.
 */
export const INICIO_POR_ROL: Record<Rol, string[]> = {
  cliente: ['proximo', 'datos', 'ayuda'],
  equipo: ['panel', 'proximo'],
  dueno: ['panel', 'proximo'],
};

/* ── El Centro de alertas ────────────────────────────────────────────────── */

export type TonoDeAlerta = 'critico' | 'hoy' | 'proximamente' | 'oportunidades';
/** Adónde lleva la acción de una alerta. La ruta la arma la pantalla. */
export type DestinoDeAlerta = 'misTalleres' | 'talleres' | 'panel' | 'cuenta';

export interface AlertaDeMiEspacio {
  id: string;
  tono: TonoDeAlerta;
  /** Clave de idioma del título, con sus variables. */
  titulo: { clave: string; variables?: Record<string, string | number> };
  /** El detalle, ya listo (un horario, un motivo) o una clave. */
  detalle?: { clave: string; variables?: Record<string, string | number> } | { texto: string };
  /** Clave del texto de la acción y adónde lleva. */
  accion?: { clave: string; a: DestinoDeAlerta; slug?: string };
}

interface InscripcionParaAlertas {
  referencia: string;
  curso_titulo: string;
  curso_slug?: string;
  inicio: string;
  fin: string;
  zona: string;
  estado: string;
  motivo_rechazo?: string | null;
}

interface AbiertoParaAlertas {
  edicion_id: string;
  curso_titulo: string;
  curso_slug: string;
  inicio: string;
  zona: string;
  lugares: number | null;
  mi_referencia: string | null;
}

interface EdicionDelEquipoParaAlertas {
  id: string;
  titulo: string;
  inicio: string;
  fin: string;
  zona: string;
  estado: string;
}

/** El día (AAAA-MM-DD) de un instante, en una zona. `en-CA` escribe justo así. */
function diaEn(instante: Date, zona: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instante);
}

/** Cuántos días de calendario faltan para un taller, contados en la zona del taller. */
export function diasHasta(inicio: string, zona: string, ahora: Date = new Date()): number {
  const a = Date.parse(`${diaEn(ahora, zona)}T00:00:00Z`);
  const b = Date.parse(`${diaEn(new Date(inicio), zona)}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Lo que se avisa con tiempo: una semana. */
export const DIAS_DE_PROXIMAMENTE = 7;

/**
 * Las alertas de Mi espacio en los cuatro tonos del molde (orden #37 §9):
 *   · **crítico**: un comprobante rechazado (la persona tiene que volver a
 *     mandarlo) y un reseteo del autenticador pedido por esta persona (si no fue
 *     ella, lo frena desde el correo);
 *   · **hoy**: un taller que es hoy (el suyo y, para el equipo, los del panel);
 *   · **próximamente**: un taller en los próximos 7 días y, para el equipo, los
 *     comprobantes por revisar;
 *   · **oportunidades**: un taller abierto al que el cliente no se anotó.
 * Nunca hay una alerta de otra persona por su nombre: el equipo ve cuántos
 * comprobantes hay, no de quién (eso está en el panel, con segundo paso).
 */
export function alertasDeMiEspacio(d: {
  rol: Rol;
  mios: readonly InscripcionParaAlertas[];
  abiertos: readonly AbiertoParaAlertas[];
  reseteoPendiente?: { vence: string } | null;
  /** Solo equipo y dueño: cuántos comprobantes esperan revisión (`null` si no se pudo leer). */
  enRevision?: number | null;
  /** Solo equipo y dueño: las ediciones vigentes del panel. */
  ediciones?: readonly EdicionDelEquipoParaAlertas[];
  ahora?: Date;
}): AlertaDeMiEspacio[] {
  const ahora = d.ahora ?? new Date();
  const esEquipo = d.rol !== 'cliente';
  const alertas: AlertaDeMiEspacio[] = [];

  for (const m of d.mios) {
    if (m.estado === 'pendiente_de_pago' && m.motivo_rechazo) {
      alertas.push({
        id: `rechazado-${m.referencia}`, tono: 'critico',
        titulo: { clave: 'mi.alertas.rechazado', variables: { taller: m.curso_titulo } },
        detalle: { texto: m.motivo_rechazo },
        accion: { clave: 'mi.alertas.rechazado.accion', a: 'misTalleres' },
      });
    }
  }
  if (d.reseteoPendiente) {
    alertas.push({
      id: 'reseteo', tono: 'critico',
      titulo: { clave: 'mi.alertas.reseteo' },
      detalle: { clave: 'mi.alertas.reseteo.detalle' },
      accion: { clave: 'mi.alertas.reseteo.accion', a: 'cuenta' },
    });
  }

  const cuando = (inicio: string, zona: string, fin: string) => {
    if (Date.parse(fin) < ahora.getTime()) return null;
    const n = diasHasta(inicio, zona, ahora);
    if (n <= 0) return 'hoy' as const;
    if (n <= DIAS_DE_PROXIMAMENTE) return n;
    return null;
  };

  for (const m of d.mios) {
    if (m.estado === 'anulada') continue;
    const c = cuando(m.inicio, m.zona, m.fin);
    if (c === 'hoy') {
      alertas.push({ id: `hoy-${m.referencia}`, tono: 'hoy', titulo: { clave: 'mi.alertas.tuTallerHoy', variables: { taller: m.curso_titulo } }, accion: { clave: 'mi.alertas.ver', a: 'misTalleres' } });
    } else if (typeof c === 'number') {
      alertas.push({ id: `pronto-${m.referencia}`, tono: 'proximamente', titulo: { clave: 'mi.alertas.tuTallerEn', variables: { taller: m.curso_titulo, n: c } }, accion: { clave: 'mi.alertas.ver', a: 'misTalleres' } });
    }
  }

  if (esEquipo) {
    for (const e of d.ediciones ?? []) {
      if (e.estado === 'cerrada') continue;
      const c = cuando(e.inicio, e.zona, e.fin);
      if (c === 'hoy') {
        alertas.push({ id: `equipo-hoy-${e.id}`, tono: 'hoy', titulo: { clave: 'mi.alertas.tallerHoy', variables: { taller: e.titulo } }, accion: { clave: 'mi.alertas.irAlPanel', a: 'panel' } });
      } else if (typeof c === 'number') {
        alertas.push({ id: `equipo-pronto-${e.id}`, tono: 'proximamente', titulo: { clave: 'mi.alertas.tallerEn', variables: { taller: e.titulo, n: c } }, accion: { clave: 'mi.alertas.irAlPanel', a: 'panel' } });
      }
    }
    if (d.enRevision && d.enRevision > 0) {
      alertas.push({ id: 'en-revision', tono: 'proximamente', titulo: { clave: 'mi.alertas.enRevision', variables: { n: d.enRevision } }, accion: { clave: 'mi.alertas.irAlPanel', a: 'panel' } });
    }
  } else {
    for (const a of d.abiertos) {
      if (a.mi_referencia) continue;
      if (a.lugares !== null && a.lugares <= 0) continue;
      alertas.push({
        id: `abierto-${a.edicion_id}`, tono: 'oportunidades',
        titulo: { clave: 'mi.alertas.abierto', variables: { taller: a.curso_titulo } },
        accion: { clave: 'mi.alertas.abierto.accion', a: 'talleres', slug: a.curso_slug },
      });
    }
  }
  return alertas;
}

/* ── La Bienvenida ───────────────────────────────────────────────────────── */

export type PasoDeBienvenida = 'datos' | 'lugar' | 'autenticador';

/**
 * Los pasos de la primera entrada (orden #37 §9): (1) **Tus datos** —nombre,
 * apellido y WhatsApp—, obligatorio; (2) **País y ciudad**; (3) solo el equipo,
 * **Activa tu autenticador** (P4 del kit). El tercero aparece solo si el
 * autenticador todavía no está: el núcleo del kit (`decidirReto()`) le pide P4
 * al equipo antes que cualquier pantalla, así que en los hechos un miembro del
 * equipo llega a la Bienvenida con él ya puesto y ve dos pasos.
 */
export function pasosDeBienvenida(rol: Rol, autenticadorActivo: boolean): PasoDeBienvenida[] {
  return rol !== 'cliente' && !autenticadorActivo ? ['datos', 'lugar', 'autenticador'] : ['datos', 'lugar'];
}
