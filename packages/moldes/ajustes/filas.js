/**
 * Las reglas de las filas: cuáles aparecen y qué texto llevan, según quién mira.
 *
 * Como `secciones.js`, es dato: las pantallas preguntan acá y pintan. Los textos
 * son claves de `@moldes/idiomas` (anexo de filas del guion v1, con lo que
 * cambió en el v1.2 y en `docs/reglas-pr-3.md`).
 */

/**
 * El texto de la fila del autenticador, según el rol (reglas-pr-3 §6).
 * El equipo lo tiene obligatorio y no lo puede apagar; el cliente final lo
 * tiene opcional y lo puede desactivar con un código.
 */
export function claveDelAutenticador(ctx = {}, totp = {}) {
  if (!totp.activo) return 'settings.security.totp.d.inactivo';
  return ctx.equipo ? 'settings.security.totp.d.obligatorio' : 'settings.security.totp.d.opcional';
}

/**
 * Las filas de «Cuenta y seguridad», en orden (guion v1.2: el correo, las
 * formas de entrar, el autenticador, el respaldo, los aparatos, cerrar en todos
 * y, para quien manda, Actividad).
 */
export function filasDeCuenta(ctx = {}, valores = {}) {
  const totp = valores.totp || {};
  return [
    'email',
    'totp',
    // El segundo autenticador y el respaldo solo tienen sentido con el primero puesto.
    totp.activo ? 'totpSecond' : null,
    totp.activo ? 'backup' : null,
    'devices',
    'signOutAll',
    // Solo si hay un reseteo pedido (apps con `rescate: 'solo'`): no se dibuja un «ninguno».
    valores.reseteoPendiente ? 'resetPending' : null,
    // La auditoría, solo para quien manda (reglas-pr-3 §2).
    ctx.manda ? 'activity' : null,
  ].filter(Boolean);
}

/**
 * Las filas del Asistente (guion v1 §3.5 y anexo §5). «Mientras no estás» —lo
 * que hace solo cada mañana— es del dueño y solo en el nivel 4 del asistente.
 */
export function filasDelAsistente(ctx = {}, asistente = {}) {
  return [
    'show',
    'actions',
    ctx.dueno && (asistente.nivel ?? 0) >= 4 ? 'night' : null,
    'usage',
  ].filter(Boolean);
}

/**
 * Las filas de la pantalla de Equipo, que vive en el menú y no en Ajustes
 * (reglas-pr-3 §2). Están acá porque las claves y las reglas son del mismo
 * anexo; la pantalla llega con el app-shell.
 *
 * `reset2fa` se oculta cuando el kit de acceso tiene `rescate: 'solo'`: ahí el
 * reseteo lo pide la persona y espera 48 h, y nadie lo resetea por ella
 * (reglas-pr-3 §5). La clave de idioma se queda.
 */
export function filasDeEquipo(ctx = {}, kit = {}) {
  if (!ctx.manda) return [];
  return [
    'list',
    'invite',
    'role',
    'suspend',
    kit.rescate === 'solo' ? null : 'reset2fa',
  ].filter(Boolean);
}

/** La hora del resumen, si nadie la eligió (Dirección, PR 4): las 8:00, hora local. */
export const HORA_DEL_RESUMEN = '08:00';

/**
 * ¿Se muestra la fila «A qué hora»? Solo si hay resumen: elegir la hora de
 * algo que no llega es una pregunta sin sentido.
 */
export function muestraHoraDelResumen(resumen = 'semanal') {
  return resumen !== 'no';
}
