import React from 'react';
import {
  Icon, IconButton, Badge, Tooltip, AvatarPersona, BarraInferior, HojaInferior, Antetitulo, Titulo, useEsCelular,
} from '@moldes/ui';

/**
 * El esqueleto de toda app (Molde de app §2, orden de la fase 1 §5) —
 * extraído de la barra lateral de las apps de origen.
 *
 *   [Marca]              [campana n] [✦] [‹]
 *   Pregúntale a {app}                    ⌘K
 *   Inicio
 *   …los módulos de la app…
 *   Centro de alertas                      n
 *   Papelera
 *   …lo transversal de la app (Pagos, Biblioteca)…
 *   ─────
 *   [avatar] Nombre · Plan                     ← abre Perfil
 *   Cerrar sesión                          ⚙   ← el engranaje abre Ajustes
 *
 * «Pregúntale a {app}» reemplaza a «Buscar»: preguntar es buscar. Mismo lugar,
 * mismo atajo (⌘K / Ctrl+K). Si la app todavía no tiene asistente, la fila no
 * aparece: una puerta que no abre nada es peor que ninguna.
 *
 * En CELULAR la barra se vuelve un menú (una hoja desde abajo) y las cuatro cosas
 * más usadas van en una pestaña inferior: Inicio, el módulo principal,
 * Pregúntale y Ajustes.
 *
 * El shell no navega: avisa con `onIr(id)` y la app decide la ruta.
 */

/* El ritmo de la barra, de la de origen: 16 en cabecera y navegación, 12 en el
   pie, 8 a los lados, 8 × 12 en cada fila, 4 entre filas. Un solo lugar. */
const PAD_SECCION = 'var(--space-8)';
const PAD_PIE = 'var(--space-6)';
const PAD_LADO = 'var(--space-4)';
const ANCHO_CONTRAIDA = 64;

function estiloFila({ activa, encima, contraida }) {
  return {
    display: 'flex', alignItems: 'center', gap: 'var(--space-6)', width: '100%',
    justifyContent: contraida ? 'center' : 'flex-start',
    padding: contraida ? 'var(--space-4) 0' : 'var(--space-4) var(--space-6)',
    borderRadius: 'var(--radius-boton)', border: 'none', textAlign: 'left', cursor: 'pointer',
    background: activa ? 'var(--primary-soft)' : encima ? 'var(--surface-2)' : 'transparent',
    color: activa ? 'var(--primary-soft-fg)' : 'var(--text-2)',
    fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
    fontWeight: activa ? 'var(--weight-semibold)' : 'var(--weight-medium)',
    transition: 'background var(--dur-fast) var(--ease-standard)',
  };
}

/**
 * Qué texto usa una fila con dos versiones (Dirección, PR 5): la larga si entra,
 * la corta si no. «Pregúntale a {app}» con un nombre largo pasa a «Pregúntale».
 */
export function etiquetaQueEntra({ larga, corta, entra }) {
  return !corta || entra ? larga : corta;
}

function Fila({ item, activa, contraida, onClick }) {
  const [encima, setEncima] = React.useState(false);
  /* Se mide de verdad: si el texto largo no entra en su lugar, va el corto. Se
     vuelve a medir si cambia el ancho (contraer, la letra grande de Ajustes). */
  const texto = React.useRef(null);
  const [entra, setEntra] = React.useState(true);
  React.useLayoutEffect(() => {
    const el = texto.current;
    if (!el || !item.etiquetaCorta || contraida) return undefined;
    const medir = () => {
      const antes = el.textContent;
      el.textContent = item.etiqueta;
      const cabe = el.scrollWidth <= el.clientWidth;
      el.textContent = antes;
      setEntra(cabe);
    };
    medir();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [item.etiqueta, item.etiquetaCorta, contraida]);
  const visible = etiquetaQueEntra({ larga: item.etiqueta, corta: item.etiquetaCorta, entra });
  const boton = (
    <button
      type="button" onClick={onClick} data-fila={item.id}
      onMouseEnter={() => setEncima(true)} onMouseLeave={() => setEncima(false)}
      aria-current={activa ? 'page' : undefined}
      aria-keyshortcuts={item.atajo ? 'Meta+K Control+K' : undefined}
      aria-label={contraida ? item.etiqueta : undefined}
      style={estiloFila({ activa, encima, contraida })}
    >
      <Icon name={item.icono} size={16} aria-hidden />
      {!contraida ? <span ref={texto} title={visible !== item.etiqueta ? item.etiqueta : undefined} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{visible}</span> : null}
      {!contraida && item.atajo ? <span aria-hidden="true" style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)' }}>{item.atajo}</span> : null}
      {/* Contraída, el número vive solo en la campana: en 64 px no hay lugar para un globito al lado. */}
      {!contraida && item.cuenta ? <Badge count={item.cuenta} tone={item.tono || 'danger'} /> : null}
    </button>
  );
  return contraida ? <Tooltip label={item.atajo ? `${item.etiqueta} · ${item.atajo}` : item.etiqueta} placement="right">{boton}</Tooltip> : boton;
}

/** El nombre de la app como marca: en su serif, en cursiva y en el acento. Una app con logo lo pasa en `marca`. */
function Marca({ app, marca, contraida }) {
  if (marca) return marca;
  const texto = contraida ? app.nombre.slice(0, 1) : app.nombre;
  return (
    /* `block` y no en línea: el recorte con «…» solo existe en una caja, y sin él
       un nombre largo se monta encima de la campana. */
    <span title={app.nombre} style={{ display: 'block', fontFamily: 'var(--font-acento)', fontStyle: 'italic', fontSize: 'var(--text-2xl)', color: 'var(--primary-text)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {texto}
    </span>
  );
}

/** Las filas de la navegación, en el orden del molde. Dato puro: se prueba sin pantalla. */
export function filasDeNavegacion({ t, app, modulos = [], transversales = [], alertas = 0, conAsistente = false }) {
  // `etiquetaCorta`: la que va si la larga no entra (ver `etiquetaQueEntra`).
  return [
    ...(conAsistente ? [{ id: 'preguntar', etiqueta: t('asistente.abrir'), etiquetaCorta: t('asistente.abrirCorto'), icono: 'sparkles', atajo: '⌘K' }] : []),
    { id: 'inicio', etiqueta: t('shell.inicio'), icono: 'house' },
    ...modulos.map((m) => ({ id: m.id, etiqueta: m.etiqueta, icono: m.icono || 'circle', cuenta: m.cuenta })),
    { id: 'alertas', etiqueta: t('shell.alertas'), icono: 'bell-ring', cuenta: alertas || undefined, tono: 'danger' },
    { id: 'papelera', etiqueta: t('shell.papelera'), icono: 'trash-2' },
    ...transversales.map((m) => ({ id: m.id, etiqueta: m.etiqueta, icono: m.icono || 'circle' })),
  ].map((f) => (f.id === 'preguntar' ? { ...f, etiqueta: f.etiqueta.replace('{app}', app.nombre) } : f));
}

/** Las cuatro de la pestaña inferior en celular: Inicio, el módulo principal, Pregúntale y Ajustes. */
export function pestanasDelCelular({ t, modulos = [], principal, conAsistente = false }) {
  const mod = modulos.find((m) => m.id === principal) || modulos[0];
  return [
    { id: 'inicio', label: t('shell.inicio'), icon: 'house' },
    ...(mod ? [{ id: mod.id, label: mod.etiqueta, icon: mod.icono || 'circle' }] : []),
    // En la pestaña entra una palabra: «Preguntar», no «Asistente de {app}».
    ...(conAsistente ? [{ id: 'preguntar', label: t('shell.preguntar'), icon: 'sparkles' }] : []),
    { id: 'ajustes', label: t('settings.title'), icon: 'settings' },
  ];
}

export function Shell({
  t, app, marca, modulos = [], transversales = [], principal, activo, onIr,
  alertas = 0, usuario = {}, onSalir, onPreguntar, contraidaInicial = false, children,
}) {
  const celular = useEsCelular();
  const [contraida, setContraida] = React.useState(contraidaInicial);
  const [menu, setMenu] = React.useState(false);
  const conAsistente = Boolean(onPreguntar);
  const ir = (id) => {
    setMenu(false);
    if (id === 'preguntar') { if (onPreguntar) onPreguntar(); return; }
    if (onIr) onIr(id);
  };

  /* ⌘K / Ctrl+K abre el asistente desde cualquier pantalla. */
  React.useEffect(() => {
    if (!onPreguntar) return undefined;
    const tecla = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onPreguntar(); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onPreguntar]);

  const filas = filasDeNavegacion({ t, app, modulos, transversales, alertas, conAsistente });
  const campana = (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <IconButton icon="bell" size="sm" label={t('shell.avisos', { n: alertas })} onClick={() => ir('alertas')} />
      {alertas ? <Badge count={alertas} tone="danger" style={{ position: 'absolute', top: -4, right: -6, pointerEvents: 'none' }} /> : null}
    </span>
  );

  const navegacion = (enMenu) => (
    <nav aria-label={t('comun.navegacion')} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {filas.map((f) => <Fila key={f.id} item={f} activa={f.id === activo} contraida={!enMenu && contraida} onClick={() => ir(f.id)} />)}
    </nav>
  );

  const pie = (enMenu) => {
    const c = !enMenu && contraida;
    return (
      <div style={{ borderTop: 'var(--border-w) solid var(--border)', padding: `${PAD_PIE} ${PAD_LADO}`, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <button type="button" onClick={() => ir('perfil')} aria-label={t('shell.perfil')}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', border: 0, background: 'none', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', textAlign: 'left', justifyContent: c ? 'center' : 'flex-start', borderRadius: 'var(--radius-md)' }}>
          <AvatarPersona nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} size={32} />
          {!c ? (
            <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.nombre}</span>
              {usuario.plan ? <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{usuario.plan}</span> : null}
            </span>
          ) : null}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: c ? 'center' : 'space-between', flexDirection: c ? 'column' : 'row', gap: 'var(--space-2)' }}>
          {onSalir ? (
            <button type="button" onClick={onSalir} aria-label={c ? t('auth.signout') : undefined}
              style={{ ...estiloFila({ contraida: c }), width: c ? '100%' : 'auto', flex: c ? undefined : 1 }}>
              <Icon name="log-out" size={16} aria-hidden />{!c ? t('auth.signout') : null}
            </button>
          ) : null}
          <IconButton icon="settings" size="sm" variant="outline" label={t('settings.title')} active={activo === 'ajustes'} onClick={() => ir('ajustes')} />
        </div>
      </div>
    );
  };

  if (celular) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--shell-bg)', display: 'flex', flexDirection: 'column' }} data-shell="celular">
        <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', padding: 'var(--space-6) var(--space-8)', background: 'var(--sidebar-bg)', borderBottom: 'var(--border-w) solid var(--border)' }}>
          <IconButton icon="menu" size="sm" label={t('shell.menu')} onClick={() => setMenu(true)} />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}><Marca app={app} marca={marca} /></span>
          {campana}
        </header>
        <main style={{ flex: 1, minWidth: 0, padding: 'var(--space-12) var(--space-8) var(--space-40)' }}>{children}</main>
        <div style={{ position: 'sticky', bottom: 0 }}>
          <BarraInferior items={pestanasDelCelular({ t, modulos, principal, conAsistente })} activeId={activo} onNavigate={ir} etiqueta={t('comun.navegacion')} />
        </div>
        <HojaInferior open={menu} onClose={() => setMenu(false)} closeLabel={t('comun.cerrar')} title={app.nombre}>
          {navegacion(true)}
          <div style={{ marginTop: 'var(--space-8)' }}>{pie(true)}</div>
        </HojaInferior>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--shell-bg)' }} data-shell="escritorio">
      <aside style={{
        flex: `0 0 ${contraida ? `${ANCHO_CONTRAIDA}px` : 'var(--sidebar-w)'}`, width: contraida ? ANCHO_CONTRAIDA : 'var(--sidebar-w)',
        background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100dvh',
        transition: 'flex-basis var(--dur-slow) var(--ease-standard), width var(--dur-slow) var(--ease-standard)',
      }} data-contraida={contraida || undefined}>
        {/* La marca va sola en su línea (Dirección, PR 5): es lo único de la barra
            que dice de quién es la app, y no se corta para hacerle lugar a tres
            íconos. Los íconos, en la fila de abajo. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: `${PAD_SECCION} ${PAD_LADO} ${PAD_SECCION} ${contraida ? PAD_LADO : 'var(--space-8)'}`, alignItems: contraida ? 'center' : 'stretch' }}>
          <span style={{ minWidth: 0, overflow: 'hidden' }} data-marca="si"><Marca app={app} marca={marca} contraida={contraida} /></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexDirection: contraida ? 'column' : 'row', marginLeft: contraida ? 0 : 'calc(-1 * var(--space-3))' }}>
            {campana}
            {conAsistente && !contraida ? <IconButton icon="sparkles" size="sm" label={t('shell.asistente')} onClick={onPreguntar} /> : null}
            {!contraida ? <span style={{ flex: 1 }} /> : null}
            <IconButton icon={contraida ? 'chevron-right' : 'chevron-left'} size="sm" label={t(contraida ? 'shell.expandir' : 'shell.contraer')} onClick={() => setContraida(!contraida)} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${PAD_LADO} ${PAD_SECCION}` }}>{navegacion(false)}</div>
        {pie(false)}
      </aside>
      {/* El contenido: 1100 px como máximo, con la canaleta de la casa a los lados. */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--space-20) var(--app-canaleta) var(--space-40)' }}>{children}</div>
      </main>
    </div>
  );
}

/**
 * La cabecera de toda pantalla de módulo: `§ · MÓDULO`, el título grande con
 * su palabra acentuada y punto final, una línea, y las acciones a la derecha.
 */
export function Pantalla({ antetitulo, titulo, hint, acciones, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
          {antetitulo ? <Antetitulo texto={antetitulo} /> : null}
          <Titulo texto={titulo} />
          {hint ? <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-lg)', maxWidth: '60ch' }}>{hint}</p> : null}
        </div>
        {acciones ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>{acciones}</div> : null}
      </header>
      {children}
    </div>
  );
}
