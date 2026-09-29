-- ===========================================================================
-- 004 · datos de cobro y auditoría
--
-- QUÉ TRAE: la cuenta a la que se transfiere —que **no está en la web pública**,
-- y esta migración es lo que cumple esa promesa— y el registro append-only de lo
-- que el equipo hace.
--
-- ORDEN QUE LA APROBÓ: Códice #13 (Mi espacio, PR 1), aprobada por dirección el
-- 29/9/2026. Especificación: `03 Producto/mi-espacio/especificacion-v1.md` §3.
--
-- APLICADA: —
--
-- ── LO QUE PROMETIÓ LA #12 H, ESCRITO EN UNA POLICY ───────────────────────
-- Los datos bancarios de Armando no están en la web. La #12 lo decidió y lo dejó
-- fuera del HTML; acá se vuelve imposible de otra forma: **`anon` no tiene una
-- sola policy sobre `datos_de_cobro`**, así que con RLS default deny no hay
-- consulta que los devuelva. Una promesa que vive en «no lo pusimos» dura hasta
-- la próxima orden; una que vive en una policy que falta, no.
-- ===========================================================================

-- ── datos_de_cobro ──────────────────────────────────────────────────────────
-- Vigencia por filas, no por edición. Cambiar de cuenta es cerrar la vigente
-- (poner `vigente_hasta`) e insertar otra: así una inscripción de marzo se puede
-- leer contra la cuenta que estaba vigente en marzo, que es lo que hace falta el
-- día que alguien pregunte «¿a dónde transferí?».
create table public.datos_de_cobro (
  id                uuid primary key default gen_random_uuid(),
  banco             text not null,
  titular           text not null,
  -- CLABE mexicana: 18 dígitos exactos. El check está porque una CLABE con un
  -- dígito de menos es una transferencia que rebota una semana después, y porque
  -- es de las cosas que se copian y pegan mal. **Si algún día hay una cuenta que
  -- no es mexicana, esto es un `alter table` de dos renglones** — queda declarado
  -- para que nadie lo descubra como una sorpresa.
  clabe             text not null check (clabe ~ '^[0-9]{18}$'),
  concepto_sugerido text,
  vigente_desde     timestamptz not null default now(),
  vigente_hasta     timestamptz,
  created_at        timestamptz not null default now(),
  constraint datos_de_cobro_vigencia_coherente
    check (vigente_hasta is null or vigente_hasta > vigente_desde)
);

-- Una sola cuenta vigente a la vez. Es un índice único parcial y no un check
-- porque la condición es entre filas: sin esto, dos filas abiertas hacen que
-- «la vigente» dependa de cuál devuelva primero el planificador.
create unique index datos_de_cobro_una_sola_vigente
  on public.datos_de_cobro ((true)) where vigente_hasta is null;

-- ---------------------------------------------------------------------------
-- «Sin update», y qué significa exactamente.
--
-- La orden dice dos cosas que hay que leer juntas: «**sin `update`**: para
-- cambiar, se cierra la vigente y se inserta otra» y «el dueño inserta **y
-- cierra**, con aal2». Cerrar ES un update de `vigente_hasta`. Así que el freno
-- no puede ser un no-update a secas: es un update de **una sola columna**.
--
-- Este trigger permite exactamente eso y nada más. Cambiar la CLABE, el banco o
-- el titular de una fila que ya existe queda prohibido para todos —incluida la
-- `service_role`—, porque es lo que haría que una inscripción vieja apunte a una
-- cuenta que nunca vio.
-- ---------------------------------------------------------------------------
create or replace function public.cobro_solo_se_cierra()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'vigente_hasta') <> (to_jsonb(old) - 'vigente_hasta') then
    raise exception
      'datos_de_cobro: lo unico que se puede cambiar es vigente_hasta. Para cambiar la cuenta, se cierra esta y se inserta otra';
  end if;
  if old.vigente_hasta is not null then
    raise exception 'datos_de_cobro: esta fila ya esta cerrada y no se reabre';
  end if;
  if new.vigente_hasta is null then
    raise exception 'datos_de_cobro: cerrar es poner vigente_hasta, no quitarlo';
  end if;
  return new;
end;
$$;

create trigger datos_de_cobro_solo_se_cierra
  before update on public.datos_de_cobro
  for each row execute function public.cobro_solo_se_cierra();

create trigger datos_de_cobro_no_se_borra
  before delete on public.datos_de_cobro
  for each row execute function public.solo_se_agrega();

-- ── auditoria ───────────────────────────────────────────────────────────────
-- Append-only, con el mismo trigger que el libro. Retención 7 años (CLAUDE.md);
-- la política de retención no se implementa acá porque borrar con este trigger
-- puesto es, a propósito, un trabajo que alguien tiene que decidir hacer.
create table public.auditoria (
  id         bigserial primary key,
  quien      uuid,
  accion     text not null,
  tabla      text not null,
  fila       uuid,
  detalle    jsonb,
  created_at timestamptz not null default now()
);

create index auditoria_por_fila_idx on public.auditoria (tabla, fila, id desc);
create index auditoria_por_quien_idx on public.auditoria (quien, id desc);

create trigger auditoria_solo_se_agrega
  before update or delete on public.auditoria
  for each row execute function public.solo_se_agrega();

create trigger auditoria_ni_truncate
  before truncate on public.auditoria
  for each statement execute function public.solo_se_agrega();

-- ---------------------------------------------------------------------------
-- El anotador. **Se escribe por triggers, no desde la app**, y ésa es toda la
-- diferencia: una auditoría que la app escribe es una auditoría que la app puede
-- olvidarse de escribir, y el olvido no se ve en ninguna parte.
--
-- `detalle` se arma columna por columna y no con `to_jsonb(new)` a secas. Dos
-- motivos, y el segundo es el que manda:
--   · un `to_jsonb(new)` crece solo cada vez que alguien agrega una columna, y
--     nadie vuelve a mirar qué terminó guardado;
--   · **la CLABE no entra a la auditoría.** Es el único dato de esta migración que
--     no hace falta para saber qué pasó y sí sería un dato bancario copiado en una
--     tabla append-only de siete años de retención. Se anota que la cuenta cambió,
--     el banco y el titular; el número, no.
--
-- `security definer` para poder insertar en `auditoria`, que no tiene policy de
-- insert para nadie: la única puerta es este trigger.
-- ---------------------------------------------------------------------------
create or replace function public.anotar_en_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fila_json jsonb := to_jsonb(new);
  fila_id   uuid;
  detalle   jsonb;
  -- Las columnas que se anotan de cada tabla. La lista es explícita y es lo que
  -- deja la CLABE afuera (ver el comentario de arriba).
  columnas  text[] := case tg_table_name
    when 'miembros'       then array['rol', 'territorio', 'activo']
    when 'cursos'         then array['slug', 'estado', 'titulo']
    when 'ediciones'      then array['curso_id', 'estado', 'inicio', 'precio_monto']
    when 'pagos_libro'    then array['tipo', 'inscripcion_id', 'monto', 'moneda']
    when 'datos_de_cobro' then array['banco', 'titular', 'vigente_desde', 'vigente_hasta']
    else array[]::text[]
  end;
begin
  -- ---------------------------------------------------------------------
  -- TODO lo que mira este trigger sale de `fila_json`, y **nunca de `new.<campo>`**.
  --
  -- No es estilo: es lo que hace que un solo trigger pueda estar sobre cinco
  -- tablas distintas. plpgsql resuelve una expresión SQL **entera** antes de
  -- evaluarla, así que un `if tg_table_name = 'pagos_libro' and new.tipo = …`
  -- revienta con «record "new" has no field "tipo"» al insertar un curso —aunque
  -- la primera mitad sea falsa—. Lo mismo un `case` cuyas ramas nombren columnas
  -- de otras tablas: todas se resuelven. Se descubrió corriendo el sembrado del
  -- banco, con las seis migraciones puestas.
  -- ---------------------------------------------------------------------

  -- Un `declarado` es la persona diciendo «ya transferí»: no es una acción del
  -- equipo y no va a la auditoría. Lo que se audita es lo que el equipo decide.
  if tg_table_name = 'pagos_libro' and fila_json ->> 'tipo' = 'declarado' then
    return new;
  end if;

  -- `miembros` tiene `user_id` como clave y no `id`; las demás tienen `id`.
  fila_id := coalesce(fila_json ->> 'id', fila_json ->> 'user_id')::uuid;

  select coalesce(jsonb_object_agg(k, fila_json -> k), '{}'::jsonb)
    into detalle
    from unnest(columnas) as k;

  insert into public.auditoria (quien, accion, tabla, fila, detalle)
  values (auth.uid(), lower(tg_op), tg_table_name, fila_id, detalle);

  return new;
end;
$$;

create trigger miembros_auditoria
  after insert or update on public.miembros
  for each row execute function public.anotar_en_auditoria();

create trigger cursos_auditoria
  after insert or update on public.cursos
  for each row execute function public.anotar_en_auditoria();

create trigger ediciones_auditoria
  after insert or update on public.ediciones
  for each row execute function public.anotar_en_auditoria();

create trigger pagos_libro_auditoria
  after insert on public.pagos_libro
  for each row execute function public.anotar_en_auditoria();

create trigger datos_de_cobro_auditoria
  after insert or update on public.datos_de_cobro
  for each row execute function public.anotar_en_auditoria();

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.datos_de_cobro enable row level security;
alter table public.auditoria enable row level security;

-- ── datos_de_cobro ──────────────────────────────────────────────────────────
-- Con sesión se lee la vigente, y nada más: es lo que la pantalla «cómo pagar»
-- necesita. `anon` no está en la lista de roles de ninguna policy de esta tabla.
create policy cobro_con_sesion_lee_la_vigente on public.datos_de_cobro
  for select to authenticated
  using (vigente_hasta is null and vigente_desde <= now());

create policy cobro_dueno_lee_el_historial on public.datos_de_cobro
  for select to authenticated
  using (public.soy_dueno());

-- Solo el dueño. Gabi y Diana no cambian la cuenta a la que entra la plata, y eso
-- no es desconfianza: es que el que cobra es Armando.
create policy cobro_dueno_inserta on public.datos_de_cobro
  for insert to authenticated
  with check (public.soy_dueno());

create policy cobro_dueno_cierra on public.datos_de_cobro
  for update to authenticated
  using (public.soy_dueno())
  with check (public.soy_dueno());

-- La vigente se lee con `aal1` —la necesita cualquiera que esté por transferir—;
-- el historial y toda escritura, con `aal2`. La línea de corte va acá y no en
-- `soy_miembro_activo()` a propósito: si el segundo paso alcanzara a la lectura de
-- la vigente, Gabi con `aal1` vería menos que un cliente, que es una regla que
-- nadie podría explicar en voz alta.
create policy cobro_segundo_paso_al_leer on public.datos_de_cobro
  as restrictive for select to authenticated
  using ((vigente_hasta is null and vigente_desde <= now()) or public.con_segundo_paso());

create policy cobro_segundo_paso_al_escribir on public.datos_de_cobro
  as restrictive for insert to authenticated
  with check (public.con_segundo_paso());

create policy cobro_segundo_paso_al_cerrar on public.datos_de_cobro
  as restrictive for update to authenticated
  using (public.con_segundo_paso())
  with check (public.con_segundo_paso());

-- ── auditoria ───────────────────────────────────────────────────────────────
-- **Solo el dueño lee.** Gabi no lee la auditoría, y tampoco la suya: un registro
-- que la persona registrada puede leer se convierte en un registro que la persona
-- registrada sabe cómo evitar. No hay policy de insert: la única puerta es el
-- trigger, que corre como dueña de la tabla.
create policy auditoria_dueno_lee on public.auditoria
  for select to authenticated
  using (public.soy_dueno());

create policy auditoria_segundo_paso on public.auditoria
  as restrictive for select to authenticated
  using (public.con_segundo_paso());
