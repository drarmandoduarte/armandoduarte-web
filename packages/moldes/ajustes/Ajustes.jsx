import React from 'react';
import { Antetitulo, Titulo, SettingsRail, Enlace, useEsCelular } from '@moldes/ui';
import { seccionesVisibles, resolverSeccion } from './secciones.js';
import { PANELES } from './paneles.jsx';

/**
 * Ajustes — la cáscara (guion de Ajustes v1.2, anatomía del §2 del v1).
 *
 * ── Qué dibuja ─────────────────────────────────────────────────────────────
 *   § · CONFIGURACIÓN
 *   Tus *preferencias*.
 *   [riel]                 [la sección activa]
 *    TÚ                     Título con la última palabra acentuada.
 *    Perfil …               Una línea que dice qué se maneja acá.
 *    {APP}                  Bloques de filas.
 *    Datos …
 *    ───
 *    Plan y facturación
 *    Acerca de
 *
 * En CELULAR la lista de secciones es la primera pantalla; al tocar una, entra,
 * con «← Ajustes» arriba (guion v1.2 §4).
 *
 * ── Qué NO hace ────────────────────────────────────────────────────────────
 * No lee la URL ni la base: la sección activa la maneja la app (`seccion` /
 * `onSeccion`, típicamente `?s=` en la URL) y los valores y acciones llegan
 * armados. Vive DENTRO del shell de la app, sin «volver» propio en escritorio:
 * la barra lateral es el volver.
 *
 * ── El grupo «{APP}» ───────────────────────────────────────────────────────
 * Se rotula con el nombre de la app (`appNombre`, de `design.json`): es lo que
 * le cambia la app a todo el equipo. «Tú» es lo que te la cambia solo a ti. Plan
 * y Acerca de cuelgan sueltos después del filete: no se configuran, se miran.
 */
export function Ajustes({
  t, appNombre, ctx = {}, config = {}, valores = {}, acciones = {},
  seccion, onSeccion, style,
}) {
  const celular = useEsCelular();
  const visibles = seccionesVisibles(ctx, config);
  // En escritorio siempre hay una abierta (la primera, si lo pedido no existe);
  // en celular, nada pedido = la lista.
  const activa = resolverSeccion(seccion, visibles, celular ? null : visibles[0]?.id ?? null, config.alias);
  const grupo = (g) => (g === 'tu' ? t('settings.group.you') : g === 'app' ? appNombre : undefined);

  const riel = (
    <SettingsRail
      label={t('comun.secciones')}
      activeId={celular ? undefined : activa}
      onSelect={(id) => onSeccion && onSeccion(id)}
      items={visibles.map((s) => ({ id: s.id, label: s.propia ? s.etiqueta : t(s.clave), grupo: grupo(s.grupo) }))}
    />
  );

  const propia = (config.propias || []).find((p) => p.id === activa);
  const Panel = propia ? propia.Panel : PANELES[activa];
  const panel = Panel ? <Panel t={t} ctx={ctx} config={config} valores={valores} acciones={acciones} /> : null;

  const cabecera = (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginBottom: 'var(--space-24)' }}>
      <Antetitulo texto={t('settings.eyebrow')} />
      <Titulo texto={t('settings.heading')} />
    </header>
  );

  if (celular) {
    return (
      <div style={{ padding: 'var(--space-12)', ...style }} data-vista={activa ? 'seccion' : 'lista'}>
        {activa ? (
          <>
            <Enlace tono="apagado" onClick={() => onSeccion && onSeccion(null)} style={{ textDecoration: 'none', marginBottom: 'var(--space-12)', display: 'inline-block' }}>
              {t('settings.back')}
            </Enlace>
            <section aria-label={t(visibles.find((s) => s.id === activa)?.clave || '')}>{panel}</section>
          </>
        ) : (
          <>{cabecera}{riel}</>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-20) var(--app-canaleta)', ...style }} data-vista="escritorio">
      {cabecera}
      <div style={{ display: 'flex', gap: 'var(--space-32)', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 15rem', position: 'sticky', top: 'var(--space-12)' }}>{riel}</div>
        {/* La columna de la sección: 760 px como máximo (guion §2). */}
        <section style={{ flex: 1, minWidth: 0, maxWidth: 760 }}>{panel}</section>
      </div>
    </div>
  );
}
