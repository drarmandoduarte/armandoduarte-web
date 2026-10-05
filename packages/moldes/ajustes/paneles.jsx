import React from 'react';
import {
  Bloque, FilaAjuste, Boton, Campo, Switch, Barra, BloqueUsoIA, ZonaPeligrosa, Idioma, AvatarPersona, Enlace, CampoHora,
} from '@moldes/ui';
import { CabeceraSeccion, FilaDeOpciones, useGuardar } from './piezas.jsx';
import { claveDelAutenticador, filasDeCuenta, filasDelAsistente, HORA_DEL_RESUMEN, muestraHoraDelResumen } from './filas.js';
import { leerNovedades } from './novedades.js';

/* Las secciones comunes de Ajustes, con sus filas (anexo de filas del guion v1,
   con lo que cambió en el v1.2 y en `docs/reglas-pr-3.md`).

   Todas reciben lo mismo: `{ t, ctx, config, valores, acciones }`.
     · `t`        — de `@moldes/idiomas`, ya en el idioma y el español de la app.
     · `ctx`      — quién mira: `{ manda, equipo, dueno }` en ESTA cuenta.
     · `config`   — el adaptador de la app (`ajustes.config`).
     · `valores`  — lo que hay guardado; lo lee la app, no el panel.
     · `acciones` — lo que guarda o hace; cada una devuelve una promesa.
   Un panel no lee la base, no guarda nada por su cuenta y no inventa textos:
   pinta filas y llama acciones. Lo que la app no pasa, no se dibuja. */

const fila = (t, clave) => ({ nombre: t(clave), explicacion: t(`${clave}.d`) });

/* El formulario de una fila (nombre, correo): «GUARDAR» de contorno que se
   habilita solo cuando algo cambió (guion §2). */
function FilaDeCampo({ t, clave, valor = '', accion, tipo = 'text', autoComplete }) {
  const [texto, setTexto] = React.useState(valor);
  React.useEffect(() => setTexto(valor), [valor]);
  const [guardadoEn, guardar] = useGuardar(accion);
  const [ocupado, setOcupado] = React.useState(false);
  const cambio = texto.trim() !== String(valor).trim() && texto.trim() !== '';
  return (
    <FilaAjuste {...fila(t, clave)} guardadoEn={guardadoEn} textoGuardado={t('settings.saved')}>
      <form
        style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}
        onSubmit={async (e) => { e.preventDefault(); setOcupado(true); try { await guardar(texto.trim()); } finally { setOcupado(false); } }}
      >
        <Campo aria-label={t(clave)} value={texto} onChange={(e) => setTexto(e.target.value)} type={tipo} autoComplete={autoComplete} style={{ flex: '1 1 14rem', minWidth: 0, maxWidth: '20rem' }} />
        <Boton type="submit" tamano="chico" disabled={!cambio} cargando={ocupado}>{t('settings.save')}</Boton>
      </form>
    </FilaAjuste>
  );
}

/* Un interruptor que guarda solo y avisa «Guardado». */
function FilaDeInterruptor({ nombre, explicacion, activo, accion, textoGuardado, fijo = false }) {
  const [on, setOn] = React.useState(Boolean(activo));
  React.useEffect(() => setOn(Boolean(activo)), [activo]);
  const [guardadoEn, guardar] = useGuardar(accion);
  return (
    <FilaAjuste nombre={nombre} explicacion={explicacion} guardadoEn={guardadoEn} textoGuardado={textoGuardado}>
      <Switch
        checked={fijo ? true : on}
        disabled={fijo}
        aria-label={typeof nombre === 'string' ? nombre : undefined}
        onChange={(e) => { const v = e.target.checked; setOn(v); guardar(v).catch(() => setOn(!v)); }}
      />
    </FilaAjuste>
  );
}

/* Una fila con un botón de contorno a la derecha (Ver, Sumar, Exportar…). */
function FilaDeBoton({ nombre, explicacion, texto, onClick, variante }) {
  return (
    <FilaAjuste nombre={nombre} explicacion={explicacion}>
      {onClick ? <Boton tamano="chico" variante={variante} onClick={onClick}>{texto}</Boton> : null}
    </FilaAjuste>
  );
}

// ── TÚ ───────────────────────────────────────────────────────────────────

export function PanelPerfil({ t, valores = {}, acciones = {} }) {
  const p = valores.perfil || {};
  return (
    <>
      <CabeceraSeccion titulo={t('settings.profile')} hint={t('settings.profile.hint')} />
      <Bloque>
        <FilaAjuste {...fila(t, 'settings.profile.photo')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            <AvatarPersona nombre={p.nombre} fotoUrl={p.fotoUrl} size={48} />
            {acciones.subirFoto ? <Boton tamano="chico" variante="secundario" onClick={acciones.subirFoto}>{t('settings.profile.photo.upload')}</Boton> : null}
            {acciones.quitarFoto && p.fotoUrl ? <Enlace tono="apagado" onClick={acciones.quitarFoto}>{t('comun.quitar')}</Enlace> : null}
          </div>
        </FilaAjuste>
        <FilaDeCampo t={t} clave="settings.profile.name" valor={p.nombre} accion={acciones.guardarNombre} autoComplete="name" />
        {acciones.cambiarZona ? (
          <FilaDeBoton {...fila(t, 'settings.profile.timezone')} texto={p.zona || t('settings.change')} onClick={acciones.cambiarZona} variante="secundario" />
        ) : null}
      </Bloque>
    </>
  );
}

export function PanelCuenta({ t, ctx = {}, valores = {}, acciones = {} }) {
  const totp = valores.totp || {};
  const filas = filasDeCuenta(ctx, valores);
  const aparatos = valores.aparatos || [];
  const piezas = {
    email: <FilaDeCampo key="email" t={t} clave="settings.profile.email" valor={valores.correo} accion={acciones.guardarCorreo} tipo="email" autoComplete="email" />,
    totp: (
      <FilaDeBoton
        key="totp" nombre={t('settings.security.totp')}
        explicacion={t(claveDelAutenticador(ctx, totp), { fecha: totp.fecha })}
        texto={t('settings.security.totp.activate')}
        onClick={!totp.activo ? acciones.activarAutenticador : undefined}
      />
    ),
    totpSecond: <FilaDeBoton key="totpSecond" {...fila(t, 'settings.security.totpSecond')} texto={t('settings.security.totpSecond.add')} onClick={acciones.sumarAutenticador} variante="secundario" />,
    backup: (
      <FilaAjuste key="backup" nombre={t('settings.security.backup')} explicacion={t('settings.security.backup.d', { n: valores.respaldoQuedan ?? 0 })}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {acciones.verRespaldo ? <Boton tamano="chico" variante="secundario" onClick={acciones.verRespaldo}>{t('settings.security.backup.view')}</Boton> : null}
          {acciones.generarRespaldo ? <Boton tamano="chico" variante="secundario" onClick={acciones.generarRespaldo}>{t('settings.security.backup.new')}</Boton> : null}
        </div>
      </FilaAjuste>
    ),
    devices: (
      <div key="devices" style={{ display: 'flex', flexDirection: 'column' }}>
        <FilaAjuste nombre={t('settings.security.devices')} explicacion={t('settings.security.devices.d', { n: aparatos.length })} />
        {aparatos.map((a) => (
          <FilaAjuste
            key={a.id}
            nombre={a.este ? <>{a.nombre} · <span style={{ color: 'var(--primary-text)' }}>{t('settings.security.devices.this')}</span></> : a.nombre}
            explicacion={a.ultima ? t('settings.security.devices.lastSeen', { cuando: a.ultima }) : undefined}
            style={{ paddingLeft: 'var(--space-12)' }}
          >
            {!a.este && acciones.cerrarAparato ? <Enlace tono="apagado" onClick={() => acciones.cerrarAparato(a.id)}>{t('comun.cerrar')}</Enlace> : null}
          </FilaAjuste>
        ))}
      </div>
    ),
    signOutAll: <FilaDeBoton key="signOutAll" {...fila(t, 'settings.security.signOutAll')} texto={t('settings.security.signOutAll.button')} onClick={acciones.cerrarTodos} variante="peligro" />,
    resetPending: (
      <FilaDeBoton key="resetPending" nombre={t('settings.security.resetPending')}
        explicacion={t('settings.security.resetPending.d', { fecha: valores.reseteoPendiente?.vence })}
        texto={t('comun.cancelar')} onClick={acciones.cancelarReseteo} variante="secundario" />
    ),
    activity: <FilaDeBoton key="activity" {...fila(t, 'settings.team.activity')} texto={t('settings.team.activity.open')} onClick={acciones.abrirActividad} variante="secundario" />,
  };
  return (
    <>
      <CabeceraSeccion titulo={t('settings.account')} hint={t('settings.account.hint')} />
      <Bloque>{filas.map((id) => piezas[id])}</Bloque>
    </>
  );
}

export function PanelApariencia({ t, valores = {}, acciones = {} }) {
  return (
    <>
      <CabeceraSeccion titulo={t('settings.appearance')} hint={t('settings.appearance.hint')} />
      <Bloque>
        <FilaDeOpciones
          {...fila(t, 'settings.appearance.theme')} valor={valores.tema || 'sistema'} accion={acciones.cambiarTema} textoGuardado={t('settings.saved')}
          opciones={[
            { value: 'claro', label: t('settings.appearance.theme.light') },
            { value: 'oscuro', label: t('settings.appearance.theme.dark') },
            { value: 'sistema', label: t('settings.appearance.theme.system') },
          ]}
        />
        <FilaDeOpciones
          {...fila(t, 'settings.appearance.textSize')} valor={valores.tamano || 'normal'} accion={acciones.cambiarTamano} textoGuardado={t('settings.saved')}
          opciones={[
            { value: 'normal', label: t('settings.appearance.textSize.normal') },
            { value: 'grande', label: t('settings.appearance.textSize.large') },
          ]}
        />
      </Bloque>
    </>
  );
}

export function PanelIdioma({ t, valores = {}, acciones = {} }) {
  const [guardadoEn, guardar] = useGuardar(acciones.cambiarIdioma);
  return (
    <>
      <CabeceraSeccion titulo={t('settings.language')} hint={t('settings.language.hint')} />
      <Bloque>
        <FilaAjuste {...fila(t, 'settings.profile.language')} guardadoEn={guardadoEn} textoGuardado={t('settings.saved')}>
          <Idioma valor={valores.idioma || t.idioma} onCambiar={(i) => { guardar(i).catch(() => {}); }} etiqueta={t('settings.language')} />
        </FilaAjuste>
      </Bloque>
    </>
  );
}

/* La hora del resumen: guarda sola al elegirla, como el resto de las filas. */
function FilaDeHora({ t, valor, accion }) {
  const [hora, setHora] = React.useState(valor);
  React.useEffect(() => setHora(valor), [valor]);
  const [guardadoEn, guardar] = useGuardar(accion);
  return (
    <FilaAjuste {...fila(t, 'settings.notifications.digest.hour')} guardadoEn={guardadoEn} textoGuardado={t('settings.saved')}>
      <CampoHora
        aria-label={t('settings.notifications.digest.hour')}
        value={hora}
        onChange={(h) => { setHora(h); guardar(h).catch(() => setHora(valor)); }}
        style={{ width: '8rem' }}
      />
    </FilaAjuste>
  );
}

export function PanelNotificaciones({ t, valores = {}, acciones = {}, config = {} }) {
  const n = valores.notificaciones || {};
  const canales = config.canales || ['email', 'app'];
  // El resumen se mira en vivo: si la persona lo pone en «No», la hora se va en el acto.
  const [resumen, setResumen] = React.useState(n.resumen || 'semanal');
  React.useEffect(() => setResumen(n.resumen || 'semanal'), [n.resumen]);
  const cambiarResumen = acciones.cambiarResumen ? async (v) => { setResumen(v); await acciones.cambiarResumen(v); } : undefined;
  return (
    <>
      <CabeceraSeccion titulo={t('settings.notifications')} hint={t('settings.notifications.hint')} />
      <Bloque>
        {/* Los de seguridad no se apagan, y se ve que no se apagan. */}
        <FilaDeInterruptor {...fila(t, 'settings.notifications.security')} activo fijo />
        {/* Los tipos de aviso son de cada app: llegan con su nombre ya traducido. */}
        {(n.tipos || []).map((tipo) => (
          <FilaDeInterruptor
            key={tipo.id} nombre={tipo.nombre} explicacion={tipo.explicacion} activo={tipo.activo}
            accion={acciones.cambiarAviso ? (v) => acciones.cambiarAviso(tipo.id, v) : undefined}
            textoGuardado={t('settings.saved')}
          />
        ))}
        <FilaDeOpciones
          {...fila(t, 'settings.notifications.digest')} valor={resumen} accion={cambiarResumen} textoGuardado={t('settings.saved')}
          opciones={[
            { value: 'diario', label: t('settings.notifications.digest.daily') },
            { value: 'semanal', label: t('settings.notifications.digest.weekly') },
            { value: 'no', label: t('settings.notifications.digest.none') },
          ]}
        />
        {muestraHoraDelResumen(resumen) ? (
          <FilaDeHora t={t} valor={n.horaResumen || HORA_DEL_RESUMEN} accion={acciones.cambiarHoraResumen} />
        ) : null}
        <FilaDeOpciones
          {...fila(t, 'settings.notifications.channel')} valor={n.canal || canales[0]} accion={acciones.cambiarCanal} textoGuardado={t('settings.saved')}
          opciones={canales.map((c) => ({ value: c, label: t(`settings.notifications.channel.${c}`) }))}
        />
      </Bloque>
    </>
  );
}

export function PanelAsistente({ t, ctx = {}, valores = {}, acciones = {}, config = {} }) {
  const a = valores.asistente || {};
  const filas = filasDelAsistente(ctx, config.asistente || {});
  return (
    <>
      <CabeceraSeccion titulo={t('settings.assistant')} hint={t('settings.assistant.hint')} />
      <Bloque>
        {filas.includes('show') ? (
          <FilaDeInterruptor nombre={t('settings.assistant.show')} explicacion={t('settings.assistant.show.d')} activo={a.mostrar !== false}
            accion={acciones.mostrarAsistente} textoGuardado={t('settings.saved')} />
        ) : null}
      </Bloque>
      {filas.includes('actions') ? (
        <Bloque antetitulo={t('settings.assistant.actions')} style={{ marginTop: 'var(--space-16)' }}>
          <p style={{ color: 'var(--text-3)', padding: 'var(--space-4) 0' }}>{t('settings.assistant.actions.d')}</p>
          {(a.acciones || []).map((x) => (
            <FilaDeInterruptor key={x.id} nombre={x.nombre} explicacion={x.explicacion} activo={x.activo}
              accion={acciones.permitirAccion ? (v) => acciones.permitirAccion(x.id, v) : undefined} textoGuardado={t('settings.saved')} />
          ))}
        </Bloque>
      ) : null}
      {filas.includes('night') ? (
        <Bloque antetitulo={t('settings.assistant.night')} style={{ marginTop: 'var(--space-16)' }}>
          <p style={{ color: 'var(--text-3)', padding: 'var(--space-4) 0' }}>{t('settings.assistant.night.d')}</p>
          {(a.noche || []).map((x) => (
            <FilaDeInterruptor key={x.id} nombre={x.nombre} explicacion={x.explicacion} activo={x.activo}
              accion={acciones.permitirDeNoche ? (v) => acciones.permitirDeNoche(x.id, v) : undefined} textoGuardado={t('settings.saved')} />
          ))}
        </Bloque>
      ) : null}
      {filas.includes('usage') ? (
        <Bloque style={{ marginTop: 'var(--space-16)' }}>
          <FilaDeBoton {...fila(t, 'settings.assistant.usage')} texto={t('settings.assistant.usage.open')} onClick={acciones.irAlUso} variante="secundario" />
        </Bloque>
      ) : null}
    </>
  );
}

export function PanelIntegraciones({ t, config = {}, acciones = {} }) {
  return (
    <>
      <CabeceraSeccion titulo={t('settings.integrations')} hint={t('settings.integrations.hint')} />
      <Bloque>
        {(config.integraciones || []).map((i) => (
          <FilaAjuste key={i.id} nombre={i.nombre} explicacion={i.explicacion}>
            {i.conectada ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success-text)' }}>{t('settings.integrations.connected')}</span>
                {acciones.desconectar ? <Enlace tono="apagado" onClick={() => acciones.desconectar(i.id)}>{t('settings.integrations.disconnect')}</Enlace> : null}
              </div>
            ) : acciones.conectar ? (
              <Boton tamano="chico" variante="secundario" onClick={() => acciones.conectar(i.id)}>{t('settings.integrations.connect')}</Boton>
            ) : null}
          </FilaAjuste>
        ))}
      </Bloque>
    </>
  );
}

export function PanelPrivacidad({ t, config = {}, acciones = {} }) {
  const copias = config.copias;
  const palabra = t('settings.data.delete.word');
  return (
    <>
      <CabeceraSeccion titulo={t('settings.privacy')} hint={t('settings.privacy.hint')} />
      <Bloque>
        <FilaDeBoton {...fila(t, 'settings.data.export')} texto={t('settings.data.export.button')} onClick={acciones.exportar} variante="secundario" />
        {copias ? (
          <FilaAjuste nombre={t('settings.data.backups')} explicacion={t('settings.data.backups.d', { frecuencia: copias.frecuencia, dias: copias.dias })} />
        ) : null}
      </Bloque>
      {acciones.borrarCuenta ? (
        <ZonaPeligrosa
          style={{ marginTop: 'var(--space-20)' }}
          antetitulo={t('settings.danger')}
          {...fila(t, 'settings.data.delete')}
          palabra={palabra}
          textos={{
            abrir: t('settings.data.delete'), escribiPalabra: t('settings.danger.type', { palabra }),
            codigo: t('auth.code.label'), confirmar: t('settings.danger.confirm'), cancelar: t('comun.cancelar'),
          }}
          onConfirmar={acciones.borrarCuenta}
        />
      ) : null}
    </>
  );
}

// ── {APP} ────────────────────────────────────────────────────────────────

export function PanelDatos({ t, valores = {}, acciones = {}, config = {} }) {
  const c = valores.cuenta || {};
  const Extra = config.datosExtra;
  return (
    <>
      <CabeceraSeccion titulo={t('settings.data')} hint={t('settings.data.hint')} />
      <Bloque>
        <FilaDeCampo t={t} clave="settings.org.name" valor={c.nombre} accion={acciones.guardarNombreDeCuenta} autoComplete="organization" />
        <FilaDeCampo t={t} clave="settings.org.phone" valor={c.telefono} accion={acciones.guardarTelefono} tipo="tel" autoComplete="tel" />
      </Bloque>
      {/* Logo, color y datos fiscales son de cada app (cada una los guarda distinto): van acá. */}
      {Extra ? <div style={{ marginTop: 'var(--space-16)' }}><Extra t={t} valores={valores} acciones={acciones} /></div> : null}
    </>
  );
}

export function PanelAvisos({ t, config = {}, valores = {}, acciones = {} }) {
  return (
    <>
      <CabeceraSeccion titulo={t('settings.notices')} hint={t('settings.notices.hint')} />
      <Bloque>
        {/* Qué manda la casa hacia afuera: es de cada app (recordatorio de turno, aviso de pago…). */}
        {((config.avisos && config.avisos.filas) || []).map((a) => (
          <FilaDeInterruptor key={a.id} nombre={a.nombre} explicacion={a.explicacion}
            activo={(valores.avisos || {})[a.id]}
            accion={acciones.cambiarAvisoDeLaCuenta ? (v) => acciones.cambiarAvisoDeLaCuenta(a.id, v) : undefined}
            textoGuardado={t('settings.saved')} />
        ))}
      </Bloque>
    </>
  );
}

// ── Sueltas ──────────────────────────────────────────────────────────────

export function PanelPlan({ t, valores = {}, acciones = {}, config = {} }) {
  const p = valores.plan || {};
  const alm = p.almacenamiento;
  const facturas = p.facturas || [];
  return (
    <>
      <CabeceraSeccion titulo={t('settings.billing')} hint={t('settings.billing.hint')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
        <Bloque antetitulo={t('settings.billing.plan')}>
          <FilaDeBoton nombre={p.nombre} explicacion={p.incluye} texto={t('settings.billing.upgrade')} onClick={acciones.mejorarPlan} />
        </Bloque>
        {alm ? (
          <Bloque antetitulo={t('settings.billing.storage')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6) 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-6)', fontVariantNumeric: 'tabular-nums' }}>
                <span>{alm.usado} / {alm.total}</span>
              </div>
              <Barra valor={alm.proporcion} etiqueta={t('settings.billing.storage')} alto={6} />
              <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-3)' }}>{t('settings.billing.storage.d')}</p>
            </div>
          </Bloque>
        ) : null}
        {/* Uso de IA: solo si la app tiene asistente; el contador llega armado. */}
        {config.asistente && p.uso ? (
          <BloqueUsoIA uso={p.uso} onSumar={acciones.sumarTokens} textos={{
            antetitulo: t('settings.billing.ai'), titulo: t('settings.ai.title'), aviso: t('settings.ai.warn'), porDia: t('settings.ai.byDay'),
            hace30: t('settings.ai.ago30'), porPersona: t('settings.ai.byPerson'), enQue: t('settings.ai.byUse'), sumar: t('settings.billing.addTokens'),
          }} />
        ) : null}
        <Bloque antetitulo={t('settings.billing.invoices')}>
          {facturas.length === 0 ? (
            <p style={{ color: 'var(--text-3)', padding: 'var(--space-6) 0' }}>{t('settings.billing.invoices.none')}</p>
          ) : facturas.map((f) => (
            <FilaAjuste key={f.id} nombre={<span style={{ fontVariantNumeric: 'tabular-nums' }}>{f.fecha} · {f.importe}</span>} explicacion={f.estado}>
              {f.url ? <Enlace href={f.url}>{t('settings.billing.invoices.download')}</Enlace> : null}
            </FilaAjuste>
          ))}
        </Bloque>
        {p.pago ? (
          <Bloque>
            <FilaDeBoton nombre={t('settings.billing.payment')} explicacion={t('settings.billing.payment.d', { tarjeta: p.pago })} texto={t('settings.change')} onClick={acciones.cambiarPago} variante="secundario" />
          </Bloque>
        ) : null}
      </div>
    </>
  );
}

export function PanelAcerca({ t, config = {} }) {
  const novedades = config.novedades || leerNovedades(config.changelog || '');
  const v = config.version || {};
  return (
    <>
      <CabeceraSeccion titulo={t('settings.about')} hint={t('settings.about.hint')} />
      <Bloque>
        {v.numero ? <FilaAjuste nombre={t('settings.about.version', { v: v.numero, fecha: v.fecha || '' })} /> : null}
      </Bloque>
      <Bloque antetitulo={t('settings.about.news')} style={{ marginTop: 'var(--space-16)' }}>
        {novedades.length === 0 ? <p style={{ color: 'var(--text-3)', padding: 'var(--space-6) 0' }}>{t('settings.about.news.none')}</p> : null}
        {novedades.map((n) => (
          <div key={n.version} style={{ padding: 'var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ fontWeight: 'var(--weight-semibold)', fontVariantNumeric: 'tabular-nums' }}>{n.version}{n.fecha ? <span style={{ color: 'var(--text-3)', fontWeight: 'var(--weight-regular)' }}> · {n.fecha}</span> : null}</span>
            <ul style={{ paddingLeft: 'var(--space-10)', color: 'var(--text-2)', listStyle: 'disc' }}>
              {n.cambios.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        ))}
      </Bloque>
      <Bloque style={{ marginTop: 'var(--space-16)' }}>
        {config.enlaces && config.enlaces.terminos ? (
          <FilaAjuste nombre={t('settings.about.terms')}><Enlace href={config.enlaces.terminos}>{t('auth.legal.terms')}</Enlace>{config.enlaces.privacidad ? <> · <Enlace href={config.enlaces.privacidad}>{t('auth.legal.privacy')}</Enlace></> : null}</FilaAjuste>
        ) : null}
        {config.contacto ? <FilaAjuste nombre={t('settings.about.contact')} explicacion={<Enlace href={`mailto:${config.contacto}`}>{config.contacto}</Enlace>} /> : null}
      </Bloque>
    </>
  );
}

export const PANELES = {
  perfil: PanelPerfil, cuenta: PanelCuenta, apariencia: PanelApariencia, idioma: PanelIdioma,
  notificaciones: PanelNotificaciones, asistente: PanelAsistente, integraciones: PanelIntegraciones,
  privacidad: PanelPrivacidad, datos: PanelDatos, avisos: PanelAvisos, plan: PanelPlan, acerca: PanelAcerca,
};
