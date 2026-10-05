import React from 'react';

/* Los tres widgets que trae el molde (orden de la fase 1, §5): «Hoy» (lo
   agendado del día), «Alertas» (las mismas de la campana) y «Pendientes». Los
   demás son de cada app.

   Un widget recibe `{ t, datos, tamano }` y nada más: los datos llegan de la
   lectura única de Inicio, ya armados por la app. Cuántos renglones muestra
   depende de su tamaño: un widget chico es un vistazo, no una lista entera. */

export const RENGLONES = { chico: 3, mediano: 6, grande: 8 };

const renglon = {
  display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 'var(--space-3) var(--space-6)', alignItems: 'baseline',
  padding: 'var(--space-5) 0', borderTop: 'var(--border-w) solid var(--border)',
};
const titulo = { fontSize: 'var(--text-md)', color: 'var(--text)', minWidth: 0 };
const detalle = { display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-3)' };

function Vacio({ children }) {
  return <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-3)', padding: 'var(--space-6) 0' }}>{children}</p>;
}

/** Lo agendado de hoy: hora, qué, y un detalle. */
export function WidgetHoy({ t, datos = {}, tamano = 'mediano' }) {
  const items = (datos.hoy || []).slice(0, RENGLONES[tamano]);
  if (items.length === 0) return <Vacio>{t('inicio.widget.hoy.vacio')}</Vacio>;
  return (
    <ul style={{ listStyle: 'none' }}>
      {items.map((x, i) => (
        <li key={x.id} style={{ ...renglon, borderTop: i === 0 ? 'none' : renglon.borderTop }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)', fontSize: 'var(--text-md)' }}>{x.hora}</span>
          <span style={titulo}>{x.titulo}{x.detalle ? <span style={detalle}>{x.detalle}</span> : null}</span>
          <span />
        </li>
      ))}
    </ul>
  );
}

/* El punto de cada columna del Centro de alertas: el mismo color que allá. */
const PUNTO = {
  critico: 'var(--alerta-critico)', hoy: 'var(--alerta-hoy)',
  proximamente: 'var(--alerta-proximamente)', oportunidades: 'var(--alerta-oportunidades)',
};

/** Las alertas de la campana, de la más urgente a la menos. */
export function WidgetAlertas({ t, datos = {}, tamano = 'mediano' }) {
  const orden = ['critico', 'hoy', 'proximamente', 'oportunidades'];
  const items = [...(datos.alertas || [])]
    .sort((a, b) => orden.indexOf(a.tono) - orden.indexOf(b.tono))
    .slice(0, RENGLONES[tamano]);
  if (items.length === 0) return <Vacio>{t('inicio.widget.alertas.vacio')}</Vacio>;
  return (
    <ul style={{ listStyle: 'none' }}>
      {items.map((x, i) => (
        <li key={x.id} style={{ ...renglon, borderTop: i === 0 ? 'none' : renglon.borderTop }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 'var(--radius-pill)', background: PUNTO[x.tono] || 'var(--text-3)', alignSelf: 'center' }} />
          <span style={titulo}>{x.titulo}{x.detalle ? <span style={detalle}>{x.detalle}</span> : null}</span>
          {x.accion ? (
            <button type="button" onClick={x.accion.onClick} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--primary-text)' }}>
              {x.accion.texto}
            </button>
          ) : <span />}
        </li>
      ))}
    </ul>
  );
}

/** Lo que quedó por hacer. */
export function WidgetPendientes({ t, datos = {}, tamano = 'mediano' }) {
  const items = (datos.pendientes || []).slice(0, RENGLONES[tamano]);
  if (items.length === 0) return <Vacio>{t('inicio.widget.pendientes.vacio')}</Vacio>;
  return (
    <ul style={{ listStyle: 'none' }}>
      {items.map((x, i) => (
        <li key={x.id} style={{ ...renglon, borderTop: i === 0 ? 'none' : renglon.borderTop }}>
          <span aria-hidden="true" style={{ width: 12, height: 12, border: 'var(--border-w) solid var(--border-strong)', borderRadius: 'var(--radius-xs)', alignSelf: 'center' }} />
          <span style={titulo}>{x.titulo}{x.detalle ? <span style={detalle}>{x.detalle}</span> : null}</span>
          {x.cuando ? <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{x.cuando}</span> : <span />}
        </li>
      ))}
    </ul>
  );
}

/** Los tres del molde, listos para sumar al catálogo de la app. */
export const WIDGETS_DEL_MOLDE = [
  { id: 'hoy', clave: 'inicio.widget.hoy', admite: ['chico', 'mediano'], nace: 'mediano', Widget: WidgetHoy },
  { id: 'alertas', clave: 'inicio.widget.alertas', admite: ['chico', 'mediano', 'grande'], nace: 'mediano', Widget: WidgetAlertas },
  { id: 'pendientes', clave: 'inicio.widget.pendientes', admite: ['chico', 'mediano'], nace: 'chico', Widget: WidgetPendientes },
];
