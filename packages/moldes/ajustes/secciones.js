/**
 * Las secciones de Ajustes: cuáles hay, en qué orden y quién ve cada una.
 *
 * Es DATO, no pantalla: se prueba sin dibujar nada, y la pantalla (`Ajustes.jsx`)
 * solo pinta lo que esto devuelve. Manda el guion de Ajustes v1.2 y las reglas
 * de `docs/reglas-pr-3.md`.
 *
 * ── El orden (guion v1.2 §2) ───────────────────────────────────────────────
 *
 *   TÚ        te cambia la app solo a ti
 *     Perfil · Cuenta y seguridad · Apariencia · Idioma · Notificaciones ·
 *     Asistente de IA · Integraciones · Privacidad y datos
 *   {APP}     se la cambia a todo el equipo · solo quien manda
 *     Datos · …las propias de la app… · Avisos
 *   ─────     suelto, después del filete
 *     Plan y facturación · Acerca de
 *
 * ── Lo que el v1.2 corrigió del v1/v1.1, y por eso no está ──────────────────
 * · **Seguridad no es una sección**: va dentro de «Cuenta y seguridad» (son una
 *   forma de entrar a la cuenta, no un tema aparte). `?s=seguridad` sigue
 *   andando por el alias.
 * · **Equipo no está en Ajustes**: vive en el menú principal (las personas se
 *   administran todos los días; eso no es un ajuste). En Ajustes queda solo la
 *   fila «Actividad», dentro de Cuenta, para quien manda.
 * · **El correo va en Cuenta y seguridad**, no en Perfil.
 *
 * ── Quién ve qué ───────────────────────────────────────────────────────────
 * El contexto dice tres cosas de la persona en ESTA cuenta (la misma persona
 * puede mandar en una y no en otra): `manda` (dueño o administrador: es lo que la
 * base permite, no un candado de pantalla), `equipo` (rol de equipo o cliente
 * final) y `dueno`. Una sección que no corresponde **no aparece**: no se deja
 * vacía ni con un cartel.
 */

export const GRUPOS = { tu: 'tu', app: 'app' };

/**
 * Las comunes, en su orden. `grupo` ausente = suelta, después del filete.
 * `visible(ctx, config)` decide si aparece; ausente = siempre.
 */
export const COMUNES = [
  { id: 'perfil', grupo: 'tu', clave: 'settings.profile' },
  { id: 'cuenta', grupo: 'tu', clave: 'settings.account' },
  { id: 'apariencia', grupo: 'tu', clave: 'settings.appearance' },
  { id: 'idioma', grupo: 'tu', clave: 'settings.language' },
  { id: 'notificaciones', grupo: 'tu', clave: 'settings.notifications' },
  // Solo si la app tiene asistente y el rol lo usa (guion v1 §3.5).
  { id: 'asistente', grupo: 'tu', clave: 'settings.assistant', visible: (ctx, cfg) => Boolean(cfg.asistente) && ctx.asistente !== false },
  // Solo si la app tiene al menos una integración (v1.1 §2.10): sin cartel de «próximamente».
  { id: 'integraciones', grupo: 'tu', clave: 'settings.integrations', visible: (ctx, cfg) => (cfg.integraciones || []).length > 0 },
  { id: 'privacidad', grupo: 'tu', clave: 'settings.privacy' },
  // {APP}: lo que la cuenta ES. Primero de su grupo.
  { id: 'datos', grupo: 'app', clave: 'settings.data', visible: (ctx) => ctx.manda },
  // {APP}: lo que la casa manda hacia afuera (no es «lo que me llega a mí»: eso es Notificaciones).
  // Último de su grupo; las propias de la app van entre Datos y Avisos.
  { id: 'avisos', grupo: 'app', clave: 'settings.notices', visible: (ctx, cfg) => ctx.manda && Boolean(cfg.avisos) },
  // Suelto: no se configura, se mira. Lo ve quien manda (dueño o administrador).
  { id: 'plan', clave: 'settings.billing', visible: (ctx) => ctx.manda },
  { id: 'acerca', clave: 'settings.about' },
];

/**
 * Ids viejos que pueden venir en un enlace guardado o en la URL (`?s=…`) y a
 * dónde aterrizan. Un enlace viejo tiene que llegar donde la cosa está ahora, no
 * a la primera sección.
 */
export const ALIAS = {
  seguridad: 'cuenta',
  sesiones: 'cuenta',
  facturacion: 'plan',
};
/* Los alias de cada app (sus ids viejos propios) llegan por `config.alias` y
   se suman a estos: el molde no conoce los nombres viejos de ninguna app. */
/* `equipo` NO tiene alias a propósito: Equipo vive en el menú, y mandar ese
   enlace a «Cuenta y seguridad» sería aterrizar en el lugar equivocado. La app
   que tenía `?s=equipo` lo redirige a su pantalla de Equipo. */

/**
 * Las secciones que ve esta persona, en orden.
 *
 * @param {object} ctx     `{ manda, equipo, dueno, asistente }` de la persona en esta cuenta
 * @param {object} config  el adaptador de la app (`ajustes.config`): `comunes` (las que la
 *                         app usa; por defecto todas), `propias` (sus secciones del grupo
 *                         {APP}, en su orden), `asistente`, `integraciones`, `avisos`
 * @returns {Array<{ id, grupo?, clave?, etiqueta?, propia?: boolean }>}
 */
export function seccionesVisibles(ctx = {}, config = {}) {
  const usa = config.comunes ? new Set(config.comunes) : null;
  const comunes = COMUNES.filter((s) => (!usa || usa.has(s.id)) && (!s.visible || s.visible(ctx, config)));
  /* Las propias: del grupo {APP}, entre Datos y Avisos, en el orden en que la
     app las declara. Por defecto solo las ve quien manda; `paraTodos` es la
     excepción del v1.2 («lo que el equipo entero tiene que VER aunque no edite»). */
  const propias = (config.propias || [])
    .filter((p) => p.paraTodos || ctx.manda)
    .map((p) => ({ id: p.id, grupo: 'app', etiqueta: p.etiqueta, propia: true }));
  const i = comunes.findIndex((s) => s.id === 'avisos');
  const corte = i >= 0 ? i : comunes.findIndex((s) => !s.grupo);
  return corte < 0 ? [...comunes, ...propias] : [...comunes.slice(0, corte), ...propias, ...comunes.slice(corte)];
}

/**
 * De lo pedido (la URL, un enlace) a una sección que existe para esta persona.
 * Pasa por el alias; si no existe o no la puede ver, devuelve `porDefecto`
 * (la primera en escritorio, `null` en celular: la lista).
 */
export function resolverSeccion(pedida, visibles, porDefecto = visibles[0]?.id ?? null, aliasDeLaApp = {}) {
  const alias = { ...ALIAS, ...aliasDeLaApp };
  const id = pedida && alias[pedida] ? alias[pedida] : pedida;
  return visibles.some((s) => s.id === id) ? id : porDefecto;
}
