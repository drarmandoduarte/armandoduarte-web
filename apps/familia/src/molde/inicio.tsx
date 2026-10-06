import { useMemo } from 'react';
import { Enlace, Boton } from '@moldes/ui';
import {
  Inicio, registrarCatalogo, sanear, WIDGETS_DEL_MOLDE, type ConfigDeInicio, type PropsDeWidget,
} from '@moldes/inicio';
import type { Alerta } from '@moldes/app-shell';
import type { T, Idioma } from '@moldes/idiomas';
import {
  INICIO_POR_ROL, PREFIJO_ME_ANOTO, TELEFONO_GABY, claveDeEstado, contextoDeInicio, enlaceWhatsApp, estadoDelTaller,
  faltanEnLaFicha, fechasDelTaller, horaCorta, proximoTaller,
} from '@codice/core';
import type { Yo } from '../comun/api';
import { zonaDeLaPersona } from '../mi-espacio/Talleres';
import { RUTA_DE_LUGAR, rutaDeAjustes } from '../rutas';
import type { Lectura } from './lectura';

/**
 * Inicio de Mi espacio: `<Inicio>` del molde (orden #37, PR 3 · §9) con el
 * catálogo de la app.
 *
 *   · Los tres cuadros del molde: **Hoy** (los talleres de hoy), **Centro de
 *     alertas** (las mismas de la campana) y **Pendientes** (mandar un
 *     comprobante; para el equipo, revisarlos).
 *   · Los cuatro de Mi espacio, los de la #29 hechos cuadros: **Tu próximo
 *     taller**, **Tus datos**, **¿Necesitas ayuda?** y **Panel del equipo**
 *     (solo equipo y dueño: `soloManda`, ver `contextoDeInicio()`).
 *   · Qué ve cada rol si nunca lo acomodó: `INICIO_POR_ROL` de `core`.
 *
 * Inicio no lee nada: todo sale de la lectura única (`lectura.ts`) en `datos`.
 * Lo que la persona acomoda se guarda en su ficha (`personas.inicio`, 014) al
 * tocar «Listo», y lo guardado pasa por `sanear()` antes de usarse.
 */

/* ── Los cuadros de Mi espacio ───────────────────────────────────────────── */

const texto = { fontSize: 'var(--text-md)', color: 'var(--text-3)' } as const;
const titulo = { fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' } as const;
const columna = { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start' } as const;

function cuando(t: T, idioma: Idioma, x: { inicio: string; fin: string; zona: string; ciudad?: string | null }, zona: string | null) {
  const f = fechasDelTaller(x, zona, idioma === 'es' ? 'es-MX' : idioma === 'pt' ? 'pt-BR' : 'en-US');
  return { dia: f.dia, horario: t('mi.inicio.horario', { desde: horaCorta(x.inicio, x.zona), hasta: horaCorta(x.fin, x.zona), ciudad: f.ciudad }) };
}

function WidgetProximo({ t, datos, onIr }: PropsDeWidget) {
  const l = datos.lectura as Lectura;
  const yo = datos.yo as Yo;
  const idioma = t.idioma as Idioma;
  if (l.noCargo.includes('talleres')) return <p style={texto}>{t('mi.inicio.noLeido')}</p>;
  const mio = proximoTaller(l.mios);
  const zona = zonaDeLaPersona(yo);
  if (mio) {
    const c = cuando(t, idioma, mio, zona);
    return (
      <div style={columna}>
        <span style={titulo}>{mio.curso_titulo}</span>
        <span style={texto}>{c.dia}</span>
        <span style={texto}>{c.horario}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--primary-text)' }}>{t(claveDeEstado(mio.estado))}</span>
        <Enlace onClick={() => onIr?.(RUTA_DE_LUGAR.misTalleres)}>{t('mi.inicio.proximo.ver')}</Enlace>
      </div>
    );
  }
  const abierto = l.abiertos.find((a) => estadoDelTaller(a).tipo === 'disponible') ?? null;
  if (abierto) {
    const c = cuando(t, idioma, { ...abierto, ciudad: abierto.ciudad }, zona);
    return (
      <div style={columna}>
        <span style={texto}>{t('mi.inicio.proximo.abierto')}</span>
        <span style={titulo}>{abierto.curso_titulo}</span>
        <span style={texto}>{c.dia}</span>
        <Boton tamano="chico" onClick={() => onIr?.(`${PREFIJO_ME_ANOTO}${abierto.curso_slug}`)}>{t('mi.inicio.proximo.meAnoto')}</Boton>
      </div>
    );
  }
  return <p style={texto}>{t('mi.inicio.proximo.ninguno')}</p>;
}

function WidgetDatos({ t, datos, onIr }: PropsDeWidget) {
  const faltan = faltanEnLaFicha((datos.yo as Yo).persona);
  return (
    <div style={columna}>
      <p style={texto}>
        {faltan.length === 0 ? t('mi.inicio.datos.completos') : t('mi.inicio.datos.faltan', { lista: faltan.map((c) => t(`mi.inicio.campos.${c}`)).join(', ') })}
      </p>
      <Enlace onClick={() => onIr?.(rutaDeAjustes('taller'))}>
        {faltan.length === 0 ? t('mi.inicio.datos.ver') : t('mi.inicio.datos.completar')}
      </Enlace>
    </div>
  );
}

function WidgetAyuda({ t }: PropsDeWidget) {
  return (
    <div style={columna}>
      <p style={texto}>{t('mi.inicio.ayuda.texto')}</p>
      <Enlace href={enlaceWhatsApp(TELEFONO_GABY, t('mi.inicio.ayuda.mensaje'))}>{t('mi.inicio.ayuda.boton')}</Enlace>
    </div>
  );
}

function WidgetPanel({ t, datos, onIr }: PropsDeWidget) {
  const l = datos.lectura as Lectura;
  const n = l.enRevision;
  return (
    <div style={columna}>
      <p style={{ ...titulo, fontVariantNumeric: 'tabular-nums' }}>
        {l.noCargo.includes('panel') || n === null ? t('mi.inicio.panel.error')
          : n === 0 ? t('mi.inicio.panel.ninguno') : t('mi.inicio.panel.enRevision', { n })}
      </p>
      <Enlace onClick={() => onIr?.(`${RUTA_DE_LUGAR.panel}#inscriptos`)}>{t('mi.inicio.panel.ir')}</Enlace>
    </div>
  );
}

/* ── El catálogo ─────────────────────────────────────────────────────────── */

export const CATALOGO = registrarCatalogo(
  [
    ...WIDGETS_DEL_MOLDE.map((w) => (w.id === 'alertas' ? { ...w, ruta: RUTA_DE_LUGAR.alertas } : w)),
    { id: 'proximo', clave: 'mi.inicio.proximo', admite: ['mediano', 'grande'], nace: 'mediano', Widget: WidgetProximo },
    { id: 'datos', clave: 'mi.inicio.datos', admite: ['chico', 'mediano'], nace: 'chico', Widget: WidgetDatos },
    { id: 'ayuda', clave: 'mi.inicio.ayuda', admite: ['chico', 'mediano'], nace: 'chico', Widget: WidgetAyuda },
    { id: 'panel', clave: 'mi.inicio.panel', admite: ['chico', 'mediano'], nace: 'mediano', soloManda: true, ruta: `${RUTA_DE_LUGAR.panel}#inscriptos`, Widget: WidgetPanel },
  ],
  INICIO_POR_ROL,
);

/* ── Lo que los cuadros del molde leen de la lectura única ──────────────── */

/** «Hoy»: los talleres de hoy (los míos y, para el equipo, los del panel). */
function deHoy(t: T, yo: Yo, l: Lectura, alertas: Alerta[]) {
  const hoy = new Set(alertas.filter((a) => a.tono === 'hoy').map((a) => a.id));
  const mios = l.mios.filter((m) => hoy.has(`hoy-${m.referencia}`))
    .map((m) => ({ id: m.referencia, hora: horaCorta(m.inicio, m.zona), titulo: m.curso_titulo, detalle: m.ciudad ?? undefined }));
  const delEquipo = yo.tipo === 'equipo'
    ? l.ediciones.filter((e) => hoy.has(`equipo-hoy-${e.id}`)).map((e) => ({ id: e.id, hora: horaCorta(e.inicio, e.zona), titulo: e.titulo, detalle: t('mi.inicio.hoy.delPanel') }))
    : [];
  return [...mios, ...delEquipo];
}

/** «Pendientes»: mandar el comprobante de lo que falta pagar; para el equipo, revisar. */
function pendientes(t: T, yo: Yo, l: Lectura) {
  const mios = l.mios.filter((m) => m.estado === 'pendiente_de_pago')
    .map((m) => ({ id: m.referencia, titulo: t('mi.inicio.pendiente.pagar', { taller: m.curso_titulo }) }));
  const revisar = yo.tipo === 'equipo' && l.enRevision ? [{ id: 'revisar', titulo: t('mi.inicio.pendiente.revisar', { n: l.enRevision }) }] : [];
  return [...revisar, ...mios];
}

export function PaginaDeInicio({ t, yo, lectura, alertas, onIr, alGuardar }: {
  t: T;
  yo: Yo;
  lectura: Lectura;
  alertas: Alerta[];
  onIr: (ruta: string) => void;
  /** Guarda lo acomodado en la ficha (`POST /api/yo { inicio }`); `null` = como al principio. */
  alGuardar: (config: ConfigDeInicio) => Promise<unknown>;
}) {
  const ctx = contextoDeInicio(yo.rol);
  const config = useMemo(() => sanear(CATALOGO, yo.persona?.inicio ?? null), [yo.persona?.inicio]);
  const fecha = new Intl.DateTimeFormat(t.idioma === 'es' ? 'es-MX' : t.idioma === 'pt' ? 'pt-BR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date());
  const acciones = yo.tipo === 'equipo'
    ? [{ texto: t('mi.inicio.irAlPanel'), onClick: () => onIr(RUTA_DE_LUGAR.panel) }]
    : [{ texto: t('mi.inicio.verTalleres'), onClick: () => onIr(RUTA_DE_LUGAR.talleres) }];
  return (
    <Inicio
      t={t}
      ctx={ctx}
      catalogo={CATALOGO}
      config={config}
      onGuardarConfig={alGuardar}
      nombre={yo.persona?.nombre ?? undefined}
      fechaTexto={fecha.charAt(0).toUpperCase() + fecha.slice(1)}
      acciones={acciones}
      datos={{ lectura, yo, alertas, hoy: deHoy(t, yo, lectura, alertas), pendientes: pendientes(t, yo, lectura) }}
      noCargo={lectura.noCargo.map((x) => t(`mi.inicio.noCargo.${x}`))}
      onIr={onIr}
    />
  );
}
