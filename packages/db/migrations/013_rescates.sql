-- ===========================================================================
-- 013 · rescates: el reseteo del autenticador que pide la persona y espera 48 h
--
-- QUÉ TRAE: la tabla `public.rescates`. Mi espacio es de **rescate solo**
-- (fase-2 §8 del molde): nadie resetea el autenticador de otra persona. Quien
-- perdió el teléfono y los códigos de respaldo pide el reseteo con su correo,
-- lo confirma desde el enlace que le llega, y **48 horas después** entra con el
-- código por correo y configura un autenticador nuevo. Mientras tanto, el
-- correo de aviso trae un enlace para cancelarlo: si no fue ella, lo frena.
--
-- ORDEN QUE LA APROBÓ: Códice #37, PR 2 (`molde/02-acceso`), §8 de la orden:
-- «tabla `rescates` (migración 013, commit propio: `id`, `user_id`,
-- `pedido_el`, `vence_el` = +48 h, `confirmado_el` nulo, `cancelado_el` nulo,
-- `usado_el` nulo, `token_hash`; RLS: nadie lee más que lo suyo, solo se agrega
-- y se cierra)». Commit propio, separado del código.
--
-- APLICADA: 6/10/2026 00:46 (UY), en `armandoduarte-familia`, desde a20e155.
--   Guardada en el editor SQL como `013_rescates`. Corrida por el CEO con
--   autorización de Germán, desde la rama (molde/02-acceso, antes del merge del PR 2 de la #37).
--
-- ── IMPORTANTE: se corre ANTES del merge del PR 2 de la #37 ────────────────
-- Las cuatro rutas de `/api/rescate/*` leen y escriben acá: desplegado sin esta
-- migración, pedir, confirmar, cancelar y aplicar un reseteo dan `42P01`.
-- `GET /api/yo` también la lee («Reseteo pendiente»), pero a propósito no se
-- cae si falta: sin la tabla no hay reseteo que mostrar y la entrada sigue.
-- Migración corrida, mergeá.
--
-- ── Lo que se guarda, y lo que NO ──────────────────────────────────────────
--   · `token_hash`: el SHA-256 (hex) del token de los enlaces del correo. El
--     token en claro (32 bytes al azar) viaja solo en el correo y nunca se
--     guarda: con la base en la mano no se puede confirmar ni cancelar nada.
--   · Ni la IP ni el aparato desde el que se pidió: no le dicen nada a nadie.
--   · Ni el correo: sale de `personas` por `user_id` cuando hace falta.
--
-- ── «Solo se agrega y se cierra» ───────────────────────────────────────────
-- Escribe **solo la API**, con `service_role`, como en las tablas del kit de la
-- 005: `authenticated` no tiene insert, update ni delete, y **nadie** tiene
-- delete —ni `service_role`—: un rescate no se borra, se cierra. Cerrar es
-- llenar UNA vez `confirmado_el`, `cancelado_el` o `usado_el`; el trigger de
-- abajo rechaza cualquier otro cambio (mover `vence_el`, cambiar de dueña,
-- reabrir uno cerrado). Lo prueba `packages/db/src/rescates.test.ts`.
-- ===========================================================================

create table public.rescates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  pedido_el      timestamptz not null default now(),
  vence_el       timestamptz not null,
  confirmado_el  timestamptz,
  cancelado_el   timestamptz,
  usado_el       timestamptz,
  -- SHA-256 (hex, 64 caracteres) del token de los enlaces. NUNCA el token.
  token_hash     text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  -- Las 48 horas no son configurables: son la regla del rescate solo.
  constraint rescates_espera_de_48_horas check (vence_el = pedido_el + interval '48 hours'),
  -- Se usa solo uno confirmado y sin cancelar.
  constraint rescates_se_usa_confirmado check (
    usado_el is null or (confirmado_el is not null and cancelado_el is null)
  )
);

-- Un solo rescate abierto por persona: pedir otro mientras hay uno en curso
-- devuelve el que ya está (la API), y la base lo sostiene si dos pedidos
-- llegan juntos.
create unique index rescates_uno_abierto
  on public.rescates (user_id) where cancelado_el is null and usado_el is null;

alter table public.rescates enable row level security;

-- SELECT: cada quien ve SOLO los suyos («Reseteo pendiente» en Cuenta y
-- seguridad). Ni el dueño ve los del equipo.
create policy rescates_select_own on public.rescates
  for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.rescates from anon, authenticated;
grant select on public.rescates to authenticated;
grant select, insert, update on public.rescates to service_role;

-- ---------------------------------------------------------------------------
-- El trigger que sostiene «solo se cierra».
-- ---------------------------------------------------------------------------
create function public.rescates_solo_se_cierran() returns trigger
language plpgsql as $$
begin
  if new.id <> old.id or new.user_id <> old.user_id or new.pedido_el <> old.pedido_el
     or new.vence_el <> old.vence_el or new.token_hash <> old.token_hash then
    raise exception 'rescates: solo se cierra (confirmado_el, cancelado_el o usado_el); lo demás no cambia';
  end if;
  if (old.confirmado_el is not null and new.confirmado_el is distinct from old.confirmado_el)
     or (old.cancelado_el is not null and new.cancelado_el is distinct from old.cancelado_el)
     or (old.usado_el is not null and new.usado_el is distinct from old.usado_el) then
    raise exception 'rescates: una fecha de cierre se escribe una sola vez';
  end if;
  if old.cancelado_el is not null or old.usado_el is not null then
    raise exception 'rescates: un rescate cancelado o usado ya no cambia';
  end if;
  return new;
end;
$$;

create trigger rescates_solo_se_cierran
  before update on public.rescates
  for each row execute function public.rescates_solo_se_cierran();

comment on table public.rescates is
  'Orden #37 PR 2 (rescate solo): el reseteo del autenticador que pide la persona y espera 48 h. Escribe solo la API.';
