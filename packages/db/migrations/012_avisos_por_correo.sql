-- ===========================================================================
-- 012 · avisos por correo: la persona decide si se los mandamos
--
-- QUÉ TRAE: una columna, `personas.avisos_por_correo boolean not null default
-- true`. Es la única preferencia de Ajustes → Notificaciones: «Avisarme por
-- correo cuando mi lugar quede confirmado o cuando el equipo revise mi
-- comprobante». La API de `pagos` la lee antes de mandar el correo de
-- confirmado / rechazado (#27 C.3) y, si está apagada, no lo manda.
--
-- ORDEN QUE LA APROBÓ: Códice #34, B.3 (`mi-espacio/15-barra-y-ajustes`),
-- aprobada por dirección el 2/10/2026, que define la columna con estas
-- palabras. Commit propio, separado del código.
--
-- APLICADA: 2/10/2026 23:47 (UY), en `armandoduarte-familia`, desde 77b46d6.
--   Guardada en el editor SQL como `012_avisos_por_correo`. Corrida por el CEO con
--   autorización de Germán, desde la rama (mi-espacio/15-barra-y-ajustes, antes del merge de la #34).
--
-- ── IMPORTANTE: se corre ANTES del merge de la #34 ─────────────────────────
-- `GET /api/yo` y el correo de `pagos` leen `avisos_por_correo`. Desplegada sin
-- esta migración, esa lectura da `42703` y **nadie entra a Mi espacio**. Es el
-- caso de la 009 y la 011: migración corrida, mergeá.
--
-- ── Sin policies ni grants nuevos ──────────────────────────────────────────
-- La 007 da `select, update` sobre `personas` a `authenticated` **por tabla**,
-- no por columna, así que la columna nueva queda cubierta. Quién la edita lo
-- sigue diciendo `personas_edito_la_mia` (001): cada quien la suya, y el equipo
-- ninguna (el banco lo prueba con la mutación). El equipo la **lee** por
-- territorio con `personas_equipo_lee_su_territorio`, que es justo lo que hace
-- falta para que el correo de `pagos` —que corre con el token de quien
-- confirma— sepa si mandarlo.
--
-- `default true` y `not null`: las filas que ya existen quedan encendidas, como
-- se comportaba hasta hoy (el correo salía siempre), y nunca hay un «no sé».
-- ===========================================================================

alter table public.personas
  add column avisos_por_correo boolean not null default true;

comment on column public.personas.avisos_por_correo is
  'Orden #34: si la persona quiere el correo de lugar confirmado / comprobante revisado. Lo edita solo ella.';
