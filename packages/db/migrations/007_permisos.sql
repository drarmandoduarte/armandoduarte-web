-- ===========================================================================
-- 007 · Los permisos que el proyecto no da solo
--
-- QUÉ TRAE: los `grant` de tabla, secuencia y función que faltaban. Ni uno más.
--
-- ORDEN QUE LA APROBÓ: Códice #15, «Corrección del CEO, 30 minutos después»,
-- punto 0. Aprobada por dirección el 29/9/2026.
--
-- APLICADA: —
--
-- ── EL SÍNTOMA, Y POR QUÉ NO ERA LO QUE PARECÍA ────────────────────────────
-- Un cliente con token válido no podía entrar a Mi espacio. El camino completo,
-- medido contra el proyecto real:
--
--     RolMiddleware.rolDe → select sobre `miembros` → ERROR 42501
--       → el middleware lo atrapa en silencio (por diseño: no autentica)
--       → el pedido sigue SIN `profile`
--       → Aal2Guard, que falla cerrado, le exige `aal2` a todo el mundo
--       → 403 AAL2_REQUIRED
--       → la pantalla manda a enrolar un autenticador
--
-- Parecía el segundo paso y era un permiso de tabla. **42501 no es RLS**: la RLS
-- devuelve cero filas, no un error. Consultado `information_schema.role_table_-
-- grants` del proyecto, en las **diez** tablas de `public` los roles `anon`,
-- `authenticated` y `service_role` tenían solo `REFERENCES, TRIGGER, TRUNCATE`.
--
-- La causa no es un olvido: el proyecto se creó con «exponer tablas nuevas
-- automáticamente: **no**», que es la decisión correcta, y Supabase lo
-- implementa quitando esos cuatro verbos de los *default privileges* de
-- `public`. Las migraciones 001–006 no traen un solo `grant` porque el banco de
-- pruebas corría como superusuario y nunca se enteró. Eso también se arregla en
-- este PR (`src/banco.ts`).
--
-- ── POR QUÉ ESTO ES MEJOR QUE EL DEFAULT DE SUPABASE ───────────────────────
-- El default —`grant all on tables to anon, authenticated`— le da a cualquier
-- usuario con sesión los cuatro verbos sobre **todas** las tablas, presentes y
-- futuras, y deja que la RLS sea el único freno. Acá cada verbo está escrito, y
-- la tabla que nazca mañana **no hereda nada**: hay que venir a este archivo, y
-- eso es un renglón en un diff que alguien lee.
--
-- Es también el segundo freno que la 005 ya había escrito para las dos tablas
-- del kit (`revoke insert, update, delete … from anon, authenticated`): esta
-- migración **no se lo devuelve**.
--
-- ── LO QUE NO ENTRA, Y ES DELIBERADO ───────────────────────────────────────
--   · `delete` a `authenticated`: **en ninguna tabla**. Desde la app no se borra
--     nada. Lo que se «borra» se desactiva (`miembros.activo`) o se anula, y el
--     borrado de verdad es de dirección, con `service_role`.
--   · `insert` en `personas`: la fila nace del trigger `persona_nace` sobre
--     `auth.users`, que es `security definer` y corre como su dueña. Un
--     `insert` directo no hace falta y sería una puerta de más.
--   · `anon` no recibe nada fuera del catálogo (`cursos`, `ediciones`): lo único
--     que la web pública muestra sin sesión.
-- ===========================================================================

-- ── Tablas ──────────────────────────────────────────────────────────────────

-- `personas`: cada quien lee y corrige su ficha. No la crea (la crea el trigger).
grant select, update on public.personas to authenticated;

-- `miembros`: el dueño invita y desactiva; quién puede hacerlo lo decide la RLS.
grant select, insert, update on public.miembros to authenticated;

-- El catálogo es lo único que se ve sin entrar (#13, `el-catalogo-se-ve-sin-entrar`).
grant select on public.cursos, public.ediciones to anon;
grant select, insert, update on public.cursos, public.ediciones to authenticated;

-- Inscripciones: se crean y se actualizan; no se borran.
grant select, insert, update on public.inscripciones to authenticated;

-- El libro y la auditoría son **insert-only**, y por eso no llevan `update`:
-- lo que se escribe queda. La 003 y la 004 ya lo imponen con triggers; el
-- permiso es el segundo freno, del mismo modo que en la 005.
grant select, insert on public.pagos_libro to authenticated;
grant select, insert on public.auditoria to authenticated;

-- Los datos de cobro se completan y se cierran.
grant select, insert, update on public.datos_de_cobro to authenticated;

-- Las dos del kit: **solo lectura**. La 005 ya revocó el resto y esto no se lo
-- devuelve — quien escribe ahí es la API con `service_role`.
grant select on public.totp_backup_codes to authenticated;
grant select on public.security_devices to authenticated;

-- `service_role` es el cliente administrador de la API: salta la RLS por diseño
-- y hoy estaba tan ciego como los demás. Sin esto, «cerrar las otras sesiones» y
-- los códigos de respaldo fallan apenas alguien llegue a usarlos.
grant select, insert, update, delete on
  public.personas, public.miembros, public.cursos, public.ediciones,
  public.inscripciones, public.pagos_libro, public.datos_de_cobro,
  public.auditoria, public.totp_backup_codes, public.security_devices
to service_role;

-- ── Secuencias ──────────────────────────────────────────────────────────────
-- `inscripciones_referencia_seq` (la referencia AD-0001) y los `bigserial` de
-- `pagos_libro.orden` y `auditoria.id`. Sin `usage`, un insert permitido falla
-- igual, y el error habla de la secuencia y no de la tabla.
grant usage on all sequences in schema public to authenticated, service_role;

-- ── Funciones ───────────────────────────────────────────────────────────────
-- Solo las que una policy invoca, más la que corre dentro de un `check`. Si el
-- default privilege de funciones también quedó revocado en el proyecto, sin
-- esto la RLS misma tira 42501 — el freno se cae por donde nadie mira.
--
-- Las que NO están acá es porque nadie las llama desde una sesión: son cuerpos
-- de trigger (`persona_nace`, `toca_updated_at`, `anotar_en_auditoria`,
-- `solo_se_agrega`, `cobro_solo_se_cierra`, `inscripcion_referencia`,
-- `personas_lo_que_no_se_cambia`), o las llama otra función `security definer`
-- desde adentro (`territorio_de_pais`, dentro de `veo_pais`), o no las usa nadie
-- todavía (`estado_inscripcion`).
grant execute on function
  public.soy_dueno(), public.soy_miembro_activo(), public.con_segundo_paso(),
  public.veo_pais(text), public.curso_publicado(uuid), public.edicion_abierta(uuid),
  public.inscripcion_es_mia(uuid), public.veo_la_inscripcion(uuid),
  public.inscripcion_de_ruta(text), public.es_zona_iana(text)
to anon, authenticated, service_role;
