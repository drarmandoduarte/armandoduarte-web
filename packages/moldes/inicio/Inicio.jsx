import React from 'react';
import { Titulo, Antetitulo, Boton, Switch, SegmentedControl, IconButton, Icon, useEsCelular } from '@moldes/ui';
import { widgetsDeInicio, tamanoDe, alternar, mover, conTamano, deFabrica, panelDeAjuste, llenarFilas, COLUMNAS, COLUMNAS_DE_TAMANO } from './catalogo.js';

/**
 * Inicio (orden de la fase 1, §5) — extraído del Inicio de la app de origen.
 *
 *   [Mientras no estabas]                ← hueco del asistente (fase 3), arriba de todo
 *   Hola, *Ana*.          [acción] [acción] [acción] [Ajustar]
 *   sábado 4 de octubre
 *   [Para empezar: n de m]               ← desaparece solo cuando están todos
 *   [widget] [widget] [widget] …         ← del catálogo, en el orden de la persona
 *
 * ── La lectura única ───────────────────────────────────────────────────────
 * Inicio no lee nada: la app hace UNA lectura para todos los widgets y la pasa
 * en `datos`. Si una parte falló, la nombra en `noCargo` y la pantalla lo dice:
 * un cero en un cuadro que no se pudo leer no quiere decir que no pasó nada.
 *
 * ── Ajustar ────────────────────────────────────────────────────────────────
 * Mostrar u ocultar, tamaño y orden. **Nada se guarda hasta «Listo»**:
 * «Deshacer cambios» vuelve a como estaba al abrir, y «Como al principio»
 * vuelve a los defaults del rol (y a los que vengan).
 */
export function Inicio({
  t, ctx = {}, catalogo, config = null, onGuardarConfig,
  nombre, fechaTexto, acciones = [], datos = {}, noCargo = [],
  primerosPasos, mientras, onIr,
}) {
  const celular = useEsCelular();
  const [ajustando, setAjustando] = React.useState(false);
  const [borrador, setBorrador] = React.useState(config);
  React.useEffect(() => { if (!ajustando) setBorrador(config); }, [config, ajustando]);
  const vigente = ajustando ? borrador : config;
  const widgets = widgetsDeInicio(catalogo, ctx, vigente);
  const anchos = llenarFilas(widgets.map((w) => COLUMNAS_DE_TAMANO[tamanoDe(w, vigente)]));

  const empezar = () => { setBorrador(config); setAjustando(true); };
  const listo = async () => { if (onGuardarConfig) await onGuardarConfig(borrador); setAjustando(false); };

  const saludo = nombre ? t('inicio.saludo', { nombre: `*${nombre}*` }) : t('inicio.saludoSinNombre');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {mientras ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Antetitulo texto={t('asistente.mientras')} />
          {mientras}
        </section>
      ) : null}

      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Titulo texto={saludo} />
          {fechaTexto ? <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-md)' }}>{fechaTexto}</p> : null}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {/* Hasta tres acciones fijas, las que declara la app. */}
          {acciones.slice(0, 3).map((a, i) => (
            <Boton key={i} tamano="chico" variante={i === 0 ? 'primario' : 'secundario'} onClick={a.onClick} flecha={false}>{a.texto}</Boton>
          ))}
          {!ajustando ? <Boton tamano="chico" variante="secundario" onClick={empezar}>{t('inicio.ajustar.accion')}</Boton> : null}
        </div>
      </header>

      {noCargo.length ? (
        <p role="alert" style={{ color: 'var(--warning-text)', fontSize: 'var(--text-md)' }}>{t('inicio.noCargo', { partes: noCargo.join(', ') })}</p>
      ) : null}

      {primerosPasos && primerosPasos.some((p) => !p.hecho) ? <PrimerosPasos t={t} pasos={primerosPasos} /> : null}

      {ajustando ? (
        <PanelAjustar
          t={t} catalogo={catalogo} ctx={ctx} borrador={borrador} setBorrador={setBorrador}
          onListo={listo} onDeshacer={() => setBorrador(config)} onDeFabrica={() => setBorrador(deFabrica())}
        />
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${celular ? 1 : COLUMNAS}, minmax(0, 1fr))`, gap: 'var(--space-8)', alignItems: 'start' }}>
        {widgets.map((w, i) => {
          const tamano = tamanoDe(w, vigente);
          const W = w.Widget;
          return (
            <section
              key={w.id}
              data-widget={w.id}
              data-tamano={tamano}
              style={{
                gridColumn: `span ${celular ? 1 : anchos[i]}`,
                background: 'var(--surface)', border: 'var(--border-w) solid var(--card-border)', borderRadius: 'var(--radius-tarjeta)',
                padding: 'var(--space-10) var(--space-12)', minWidth: 0,
              }}
            >
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-normal)', marginBottom: 'var(--space-6)' }}>
                {w.ruta && onIr ? (
                  <button type="button" onClick={() => onIr(w.ruta)} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'inherit', font: 'inherit' }}>
                    {t(w.clave)} <Icon name="chevron-right" size={14} aria-hidden />
                  </button>
                ) : t(w.clave)}
              </h2>
              {W ? <W t={t} datos={datos} tamano={tamano} ctx={ctx} onIr={onIr} /> : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** «Para empezar»: cosas que se hacen una vez. Cada una se tacha sola cuando el dato existe. */
function PrimerosPasos({ t, pasos }) {
  const hechos = pasos.filter((p) => p.hecho).length;
  return (
    <section style={{ border: 'var(--border-w) solid var(--primary-linea)', borderRadius: 'var(--radius-tarjeta)', padding: 'var(--space-10) var(--space-12)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>{t('inicio.pasos.titulo')}</h2>
        <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{t('inicio.pasos.avance', { hechos, total: pasos.length })}</span>
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-md)', maxWidth: '60ch' }}>{t('inicio.pasos.ayuda')}</p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {pasos.map((p) => (
          <li key={p.id} data-hecho={p.hecho || undefined} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', color: p.hecho ? 'var(--text-3)' : 'var(--text)', textDecoration: p.hecho ? 'line-through' : 'none' }}>
            <Icon name={p.hecho ? 'check' : 'circle'} size={14} aria-hidden />
            {p.onIr && !p.hecho ? (
              <button type="button" onClick={p.onIr} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary-text)', font: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{p.texto}</button>
            ) : p.texto}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** El panel de ajustar: mostrar, tamaño y orden de cada widget. Nada se guarda hasta «Listo». */
function PanelAjustar({ t, catalogo, ctx, borrador, setBorrador, onListo, onDeshacer, onDeFabrica }) {
  const filas = panelDeAjuste(catalogo, ctx, borrador);
  const visibles = filas.filter((f) => f.visible);
  return (
    <section aria-label={t('inicio.ajustar.titulo')} style={{ border: 'var(--border-w) solid var(--border-strong)', borderRadius: 'var(--radius-tarjeta)', padding: 'var(--space-12)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>{t('inicio.ajustar.titulo')}</h2>
        <p style={{ color: 'var(--text-3)', marginTop: 'var(--space-2)' }}>{t('inicio.ajustar.enCurso')}</p>
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
        {filas.map(({ widget: w, visible }) => {
          const nombre = t(w.clave);
          const i = visibles.findIndex((f) => f.widget.id === w.id);
          return (
            <li key={w.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)', padding: 'var(--space-5) 0', borderTop: 'var(--border-w) solid var(--border)' }}>
              <Switch
                checked={visible} label={nombre} aria-label={t('inicio.ajustar.mostrar', { widget: nombre })}
                onChange={() => setBorrador(alternar(catalogo, ctx, borrador, w.id))}
              />
              <span style={{ flex: 1 }} />
              {visible && w.admite.length > 1 ? (
                <SegmentedControl
                  label={t('inicio.ajustar.tamano')}
                  value={tamanoDe(w, borrador)}
                  onChange={(v) => setBorrador(conTamano(catalogo, ctx, borrador, w.id, v))}
                  options={w.admite.map((x) => ({ value: x, label: t(`inicio.ajustar.tamano.${x}`) }))}
                />
              ) : null}
              {visible ? (
                <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                  <IconButton icon="chevron-up" size="sm" variant="outline" label={t('inicio.ajustar.subir', { widget: nombre })} disabled={i <= 0} onClick={() => setBorrador(mover(catalogo, ctx, borrador, w.id, -1))} />
                  <IconButton icon="chevron-down" size="sm" variant="outline" label={t('inicio.ajustar.bajar', { widget: nombre })} disabled={i >= visibles.length - 1} onClick={() => setBorrador(mover(catalogo, ctx, borrador, w.id, +1))} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
        <Boton tamano="chico" onClick={onListo}>{t('inicio.ajustar.listo')}</Boton>
        <Boton tamano="chico" variante="secundario" onClick={onDeshacer}>{t('inicio.ajustar.deshacer')}</Boton>
        <Boton tamano="chico" variante="secundario" onClick={onDeFabrica}>{t('inicio.ajustar.deFabrica')}</Boton>
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', maxWidth: '60ch' }}>{t('inicio.ajustar.deFabrica.ayuda')}</p>
    </section>
  );
}
