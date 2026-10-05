import React from 'react';
import { Boton, Enlace, FilaAjuste, Bloque, AvatarPersona, Badge, Selector } from '@moldes/ui';
import { filasDeEquipo } from '@moldes/ajustes';
import { Pantalla } from './Shell.jsx';

/* Las pantallas del menú que trae el molde: Centro de alertas, Papelera y
   Equipo. Como todo el molde, no leen ni guardan: reciben lo que hay y llaman
   acciones que devuelven promesas. */

// ── Centro de alertas ────────────────────────────────────────────────────

/** Las cuatro columnas, en su orden: lo urgente primero, lo que viene después. */
export const COLUMNAS_DE_ALERTAS = ['critico', 'hoy', 'proximamente', 'oportunidades'];
const COLOR_DE_COLUMNA = {
  critico: 'var(--alerta-critico)', hoy: 'var(--alerta-hoy)',
  proximamente: 'var(--alerta-proximamente)', oportunidades: 'var(--alerta-oportunidades)',
};

/** Reparte las alertas en sus columnas; una alerta con un tono que no existe va a «Hoy». */
export function repartirAlertas(alertas = []) {
  const columnas = Object.fromEntries(COLUMNAS_DE_ALERTAS.map((c) => [c, []]));
  for (const a of alertas) (columnas[a.tono] || columnas.hoy).push(a);
  return columnas;
}

export function CentroDeAlertas({ t, alertas = [] }) {
  const columnas = repartirAlertas(alertas);
  return (
    <Pantalla antetitulo={t('alertas.eyebrow')} titulo={t('alertas.titulo')} hint={t('alertas.hint')}>
      {alertas.length === 0 ? (
        <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-lg)' }}>{t('inicio.widget.alertas.vacio')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))', gap: 'var(--space-8)' }}>
          {COLUMNAS_DE_ALERTAS.map((c) => (
            <section key={c} data-columna={c} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-rotulo)', textTransform: 'uppercase', color: COLOR_DE_COLUMNA[c], fontWeight: 'var(--weight-semibold)' }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 'var(--radius-pill)', background: COLOR_DE_COLUMNA[c] }} />
                {t(`alertas.${c}`)}
                <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{columnas[c].length}</span>
              </h2>
              {columnas[c].length === 0 ? <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-md)' }}>{t('alertas.vacio')}</p> : null}
              {columnas[c].map((a) => (
                <article key={a.id} style={{ background: 'var(--surface)', border: 'var(--border-w) solid var(--card-border)', borderRadius: 'var(--radius-tarjeta)', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ fontWeight: 'var(--weight-medium)' }}>{a.titulo}</span>
                  {a.detalle ? <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{a.detalle}</span> : null}
                  {a.accion ? <Enlace onClick={a.accion.onClick} style={{ alignSelf: 'flex-start', fontSize: 'var(--text-sm)' }}>{a.accion.texto}</Enlace> : null}
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
    </Pantalla>
  );
}

// ── Papelera ─────────────────────────────────────────────────────────────

/** Nada se borra en seco: lo que se borra queda acá 30 días. */
export const DIAS_EN_PAPELERA = 30;

/** Cuántos días le quedan a algo borrado (nunca menos de 0). */
export function diasQueQuedan(borradoEl, hoy = new Date(), dias = DIAS_EN_PAPELERA) {
  const msDia = 24 * 60 * 60 * 1000;
  const pasaron = Math.floor((new Date(hoy).setHours(0, 0, 0, 0) - new Date(borradoEl).setHours(0, 0, 0, 0)) / msDia);
  return Math.max(0, dias - pasaron);
}

export function Papelera({ t, items = [], onRestaurar, hoy }) {
  return (
    <Pantalla antetitulo={t('papelera.eyebrow')} titulo={t('papelera.titulo')} hint={t('papelera.hint', { dias: DIAS_EN_PAPELERA })}>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-lg)' }}>{t('papelera.vacia')}</p>
      ) : (
        <Bloque>
          {items.map((x) => {
            const quedan = diasQueQuedan(x.borradoEl, hoy);
            return (
              <FilaAjuste
                key={x.id}
                nombre={<span>{x.nombre}{x.tipo ? <span style={{ color: 'var(--text-3)', fontWeight: 'var(--weight-regular)' }}> · {x.tipo}</span> : null}</span>}
                explicacion={<>
                  {t('papelera.borradoPor', { fecha: x.fechaTexto, persona: x.persona })}
                  {' · '}
                  <span style={{ color: quedan <= 3 ? 'var(--warning-text)' : undefined }}>{t('papelera.quedan', { n: quedan })}</span>
                </>}
              >
                {onRestaurar ? <Boton tamano="chico" variante="secundario" onClick={() => onRestaurar(x.id)}>{t('papelera.restaurar')}</Boton> : null}
              </FilaAjuste>
            );
          })}
        </Bloque>
      )}
    </Pantalla>
  );
}

// ── Equipo ───────────────────────────────────────────────────────────────

const TONO_DE_ESTADO = { activa: 'primary', invitada: 'warning', suspendida: 'neutral' };

/**
 * Equipo vive en el menú, no en Ajustes (reglas-pr-3 §2): las personas se
 * administran todos los días. Lo administra quien manda; los demás ven la lista.
 * Resetear el autenticador de alguien no existe cuando el kit tiene
 * `rescate: 'solo'` (reglas-pr-3 §5): ahí lo pide la persona y espera 48 h.
 */
export function Equipo({ t, ctx = {}, kit = {}, personas = [], roles = [], acciones = {} }) {
  const puede = new Set(filasDeEquipo(ctx, kit));
  return (
    <Pantalla
      antetitulo={t('equipo.eyebrow')} titulo={t('equipo.titulo')} hint={t('equipo.hint')}
      acciones={puede.has('invite') && acciones.invitar ? <Boton tamano="chico" onClick={acciones.invitar}>{t('settings.team.invite')}</Boton> : null}
    >
      <Bloque antetitulo={t('settings.team.list')}>
        <p style={{ color: 'var(--text-3)', padding: 'var(--space-4) 0' }}>{t('settings.team.list.d', { n: personas.length })}</p>
        {personas.map((p) => (
          <div key={p.id} data-persona={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6) var(--space-10)', padding: 'var(--space-8) 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flex: '1 1 16rem', minWidth: 0 }}>
              <AvatarPersona nombre={p.nombre} fotoUrl={p.fotoUrl} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'var(--weight-medium)' }}>{p.nombre}</span>
                  {p.yo ? <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>· {t('equipo.tu')}</span> : null}
                  <Badge tone={TONO_DE_ESTADO[p.estado] || 'neutral'}>{t(`equipo.estado.${p.estado || 'activa'}`)}</Badge>
                </div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
                  {p.correo}{p.ultima ? ` · ${t('equipo.ultima', { cuando: p.ultima })}` : ''}
                </span>
              </div>
            </div>
            {/* Nadie se cambia el rol, se suspende ni se resetea a sí mismo. */}
            {!p.yo ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
                {puede.has('role') && roles.length && acciones.cambiarRol ? (
                  <Selector
                    label={t('equipo.rol')} value={p.rol}
                    options={roles.map((r) => ({ value: r.id, label: r.etiqueta }))}
                    onChange={(v) => acciones.cambiarRol(p.id, v)}
                    style={{ minWidth: '10rem' }}
                  />
                ) : null}
                {puede.has('suspend') && acciones.suspender ? (
                  <Boton tamano="chico" variante={p.estado === 'suspendida' ? 'secundario' : 'peligro'} onClick={() => acciones.suspender(p.id, p.estado !== 'suspendida')}>
                    {p.estado === 'suspendida' ? t('equipo.reactivar') : t('settings.team.suspend')}
                  </Boton>
                ) : null}
                {puede.has('reset2fa') && acciones.resetearAutenticador ? (
                  <Boton tamano="chico" variante="secundario" onClick={() => acciones.resetearAutenticador(p.id)}>{t('settings.team.reset2fa')}</Boton>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </Bloque>
      {ctx.manda && acciones.abrirActividad ? (
        <Bloque style={{ marginTop: 'var(--space-12)' }}>
          <FilaAjuste nombre={t('settings.team.activity')} explicacion={t('settings.team.activity.d')}>
            <Boton tamano="chico" variante="secundario" onClick={acciones.abrirActividad}>{t('settings.team.activity.open')}</Boton>
          </FilaAjuste>
        </Bloque>
      ) : null}
    </Pantalla>
  );
}
