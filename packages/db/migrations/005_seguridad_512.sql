-- ===========================================================================
-- 005 · Kit de Seguridad 512 · las dos tablas del kit
--
-- QUÉ TRAE: los códigos de respaldo de 2FA y los aparatos conocidos por persona.
-- Las dos son del kit, no de Códice: quien las mantiene es el kit.
--
-- ORDEN QUE LA APROBÓ: Códice #13 (Mi espacio, PR 1), aprobada por dirección el
-- 29/9/2026.
--
-- APLICADA: 29/9/2026 02:34 (UY), en `armandoduarte-familia`, desde fd93eab.
--   Corrida por el CEO con autorización de Germán; verificada contra la base
--   (10 tablas con RLS, 39 policies en `public`, 3 en `storage`, bucket
--   `comprobantes` privado). Guardada en el editor SQL como `005_seguridad_512`.
--
-- ── DE DÓNDE VIENEN Y QUÉ SE CAMBIÓ ───────────────────────────────────────
-- Copiadas de `512 web solutions/Kit de Seguridad/v1/referencia-cenit/migraciones/`:
--
--   · `0005_totp_backup_codes.sql` → `public.totp_backup_codes`, tal cual salvo
--     lo de abajo.
--   · `0035_seguridad_avisos.sql`  → `public.security_devices`, tal cual salvo
--     lo de abajo.
--
-- Lo que se cambió, y nada más que esto:
--
--   1. **Fuera `agency_id` y `agencies`.** Son de Cenit (una inmobiliaria por
--      inquilino). Códice no parte por inmobiliaria: parte por territorio, y el
--      territorio es de `personas`, no de un aparato ni de un código de respaldo.
--      Con `agency_id` se fue también el trigger `security_devices_agency_coherence`
--      y la mitad de su policy (`agency_id = current_agency_id() and …`), que queda
--      en `user_id = auth.uid()`.
--   2. **Renumeradas** de `0005`/`0035` a esta única `005`, porque en Códice las
--      dos entran el mismo día.
--   3. **NO se trae el tramo de `email_log.kind`** de la `0035`. Ensancha un
--      `check` de una tabla de Cenit que en Códice no existe todavía —los cinco
--      avisos y su registro son PR 5, con Resend—. Traerlo sería inventar una
--      tabla para poder alterarla.
--   4. Los nombres de tabla y columna quedan **en inglés, como en el kit**. Es un
--      desvío deliberado de la convención en español del resto del esquema: el
--      código del kit (`two-factor.repository.ts`) las nombra así byte por byte y
--      el guardián del kit compara huellas. Traducirlas sería romper el kit para
--      ganar coherencia cosmética.
--
-- Lo que **NO** se cambió: el hash scrypt (el plaintext se muestra una vez en el
-- enrolamiento y no se persiste ni se loguea), el `sha256` del id del aparato en
-- vez del id en claro, y la RLS —cada quien lee los suyos, escribe solo la
-- `service_role`—.
--
-- `rescates` NO va acá: es el PR 3 (`mi-espacio/03-rescate`).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- totp_backup_codes — los 10 códigos de respaldo, hasheados.
--
-- El factor TOTP en sí lo administra Supabase Auth (`auth.mfa_factors`); esta
-- tabla solo guarda los códigos para recuperar acceso si se pierde el
-- autenticador. Los genera, hashea y consume el BACKEND con `service_role`. La
-- RLS es el freno: cada quien solo puede LEER los suyos, para el conteo de
-- cuántos quedan.
-- ---------------------------------------------------------------------------
create table public.totp_backup_codes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  code_hash    text not null,                 -- scrypt "salt:hash" (hex). NUNCA plaintext.
  used_at      timestamptz,
  generated_at timestamptz not null default now()
);

-- Lookups baratos de los códigos sin usar.
create index totp_backup_codes_user_idx
  on public.totp_backup_codes (user_id) where used_at is null;

alter table public.totp_backup_codes enable row level security;

-- SELECT: cada quien ve SOLO los suyos (conteo de códigos restantes).
create policy totp_backup_codes_select_own on public.totp_backup_codes
  for select to authenticated
  using (auth.uid() = user_id);

-- Escritura (generar / consumir / regenerar): SOLO backend con `service_role`.
-- Sin policies de insert/update/delete, la RLS ya las deniega; el `revoke` es el
-- segundo freno, para que un `grant` futuro a `authenticated` no las abra sin que
-- nadie lo note.
revoke insert, update, delete on public.totp_backup_codes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- security_devices — aparatos desde los que ya vimos entrar a cada persona.
--
-- Sirve para UNA pregunta: «¿este navegador ya entró antes?». Si no, sale un mail
-- de «entraste desde un aparato nuevo».
--
-- Qué NO se guarda, a propósito:
--   · El id del aparato en claro. Se guarda su SHA-256. El id no es un secreto,
--     pero tampoco hace falta tenerlo en claro para contestar la única pregunta
--     que esta tabla contesta — y así no sirve para rastrear a nadie.
--   · La dirección IP. Ni acá ni en el cuerpo del aviso: no le dice nada a nadie y
--     convierte un aviso en un dato de ubicación.
--   · El user-agent crudo. El aviso dice «Chrome en Android» y se calcula al
--     vuelo; no se persiste.
-- ---------------------------------------------------------------------------
create table public.security_devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- SHA-256 (hex, 64 chars) del id que genera el navegador. Nunca el id crudo.
  device_hash   text not null check (char_length(device_hash) = 64),
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (user_id, device_hash)
);

create index security_devices_user_idx
  on public.security_devices (user_id, last_seen_at desc);

-- RLS — cada quien ve SOLO sus propios aparatos. **Ni el dueño ve los del
-- equipo**: saber desde cuántos aparatos entra cada persona no le sirve para
-- administrar nada y sí es vigilancia. La escritura es 100 % backend.
alter table public.security_devices enable row level security;

create policy security_devices_select_own on public.security_devices
  for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.security_devices from anon, authenticated;
