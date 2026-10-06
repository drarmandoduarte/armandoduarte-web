-- ===========================================================================
-- 014 · ajustes y papelera: lo que guarda Ajustes, borrar la cuenta y la papelera
--
-- QUÉ TRAE, en tres partes:
--   1. **Ajustes e Inicio** (fase-2 §6 y §9 del molde): cuatro columnas en
--      `personas` —el tema, el tamaño del texto, cómo acomodó su Inicio y
--      cuándo borró su cuenta—. El idioma ya estaba (`personas.idioma`, 001).
--   2. **Borrar mi cuenta** (§6 de la orden: «borrar cuenta con palabra y
--      código, obligatorio»): `borrar_mi_cuenta()`, que anonimiza la ficha y
--      conserva inscripciones y libro, que son registros contables.
--   3. **La papelera** (§9): qué hay en ella, restaurar y el borrado definitivo
--      a los 30 días, hecho por la app en su base.
--
-- ORDEN QUE LA APROBÓ: Códice #37, PR 3 (`molde/03-ajustes-inicio-shell`),
-- §6 y §9 de la orden. Commit propio, separado del código.
--
-- APLICADA: —
--
-- ── IMPORTANTE: se corre ANTES del merge del PR 3 de la #37 ────────────────
-- `GET /api/yo` lee las columnas nuevas: desplegado sin esta migración, la
-- entrada de TODOS da `42703`. `POST /api/cuenta/borrar` y `/api/papelera`
-- llaman a las funciones de abajo. Migración corrida, mergeá.
-- ===========================================================================

-- ── 1 · Ajustes e Inicio ───────────────────────────────────────────────────
-- Por persona y no por aparato: «Apariencia» e «Inicio» son de la persona, y
-- quien entra desde el teléfono y la computadora ve lo mismo en los dos.
alter table public.personas
  add column tema text not null default 'sistema'
    check (tema in ('claro', 'oscuro', 'sistema')),
  add column tamano_texto text not null default 'normal'
    check (tamano_texto in ('normal', 'grande')),
  -- Cómo acomodó su Inicio: `{ orden: [...], tamanos: {...} }`. Nulo = lo que
  -- el molde propone para su rol (y lo que proponga mañana). La forma la vigila
  -- `sanear()` del molde al leerla; acá solo se pone un techo para que nadie
  -- guarde un megabyte en su ficha.
  add column inicio jsonb
    check (inicio is null or (jsonb_typeof(inicio) = 'object' and pg_column_size(inicio) <= 4096)),
  -- Cuándo borró su cuenta. Lo escribe SOLO `borrar_mi_cuenta()` (ver el
  -- trigger de abajo): con esto puesto, la ficha ya no es de nadie.
  add column borrada_el timestamptz;

-- ---------------------------------------------------------------------------
-- El mail y el id no se cambian (001)… salvo en un caso: **la cuenta que se
-- borra**. Ahí el mail pasa a `borrado+<id>@cuenta-borrada.invalid` y
-- `borrada_el` se llena, y las dos cosas las hace únicamente
-- `borrar_mi_cuenta()`, que deja una marca de la transacción
-- (`codice.borrando_cuenta` = el id) antes de tocar la fila. Un `update` de la
-- persona por su cuenta —PostgREST le da `update` en `personas`— no puede poner
-- esa marca: `set_config` no está expuesto, y la marca vale solo dentro de la
-- transacción de la función.
--
-- Se reemplaza la función de la 001 entera para que la regla siga en un solo
-- lugar. Lo de la 001 queda igual, palabra por palabra.
-- ---------------------------------------------------------------------------
create or replace function public.personas_lo_que_no_se_cambia()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  borrando boolean := coalesce(current_setting('codice.borrando_cuenta', true), '') = old.id::text;
begin
  if new.id <> old.id then
    raise exception 'personas.id no se cambia: es el id de auth.users';
  end if;
  if new.email <> old.email
     and not (borrando and new.email = 'borrado+' || old.id::text || '@cuenta-borrada.invalid') then
    raise exception 'personas.email no se cambia acá: la fuente de verdad es auth.users';
  end if;
  if new.borrada_el is distinct from old.borrada_el and not borrando then
    raise exception 'personas.borrada_el la escribe solo borrar_mi_cuenta()';
  end if;
  return new;
end;
$$;

-- ── 2 · Borrar mi cuenta ───────────────────────────────────────────────────
-- ---------------------------------------------------------------------------
-- Qué se borra y qué se conserva (orden #37, §6):
--   · **se anonimiza** la ficha: nombre, apellido, WhatsApp, ciudad, año de
--     nacimiento y nivel educativo → nulos; el correo → `borrado+<id>@…`; los
--     avisos por correo, apagados; el Inicio, a cero.
--   · **se conserva** el país: es lo que decide el territorio, y sin él una
--     inscripción ya pagada quedaría sin quién la vea en el equipo.
--   · **se conservan** inscripciones y libro: son registros contables, y sus
--     claves foráneas (`on delete restrict`, 003) no dejan borrarlas igual.
--   · si era del equipo, deja de serlo (`miembros.activo = false`): la fila
--     queda, porque lo que hizo mientras estaba tiene que seguir teniendo autor.
--   · un rescate abierto se cancela.
-- Los factores del autenticador, los códigos de respaldo, las sesiones y el
-- correo de `auth.users` los borra la API después (son del esquema `auth` o de
-- las tablas del kit, que escribe solo ella).
--
-- **Un dueño no se borra mientras sea el único dueño activo**: el negocio se
-- quedaría sin nadie que pueda sumar equipo. Error `UNICO_DUENO`, que la API
-- traduce a un mensaje claro.
--
-- `security definer` porque toca `miembros` y `rescates`, que la persona no
-- puede escribir por RLS; por eso mismo, todo lo que hace es sobre `auth.uid()`
-- y nada más: no recibe a quién borrar.
-- ---------------------------------------------------------------------------
create or replace function public.borrar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
begin
  if yo is null then
    raise exception 'SIN_SESION' using errcode = '28000';
  end if;

  -- Dos veces es una: si ya estaba borrada, no hay nada más que hacer.
  if exists (select 1 from public.personas where id = yo and borrada_el is not null) then
    return;
  end if;

  if exists (select 1 from public.miembros where user_id = yo and activo and rol = 'dueno')
     and (select count(*) from public.miembros where activo and rol = 'dueno') = 1 then
    raise exception 'UNICO_DUENO' using errcode = 'P0001';
  end if;

  perform set_config('codice.borrando_cuenta', yo::text, true);

  update public.personas
     set nombre = null, apellido = null, whatsapp = null, ciudad = null,
         anio_nacimiento = null, nivel_educativo = null,
         email = 'borrado+' || yo::text || '@cuenta-borrada.invalid',
         avisos_por_correo = false, inicio = null, borrada_el = now()
   where id = yo;

  update public.miembros set activo = false where user_id = yo and activo;

  -- Uno abierto (confirmado o no) se cancela; el trigger de la 013 lo permite.
  update public.rescates set cancelado_el = now()
   where user_id = yo and cancelado_el is null and usado_el is null;

  insert into public.auditoria (quien, accion, tabla, fila, detalle)
  values (yo, 'borrar_cuenta', 'personas', yo, '{}'::jsonb);

  perform set_config('codice.borrando_cuenta', '', true);
end;
$$;

revoke execute on function public.borrar_mi_cuenta() from public;
grant execute on function public.borrar_mi_cuenta() to authenticated;

-- ── 3 · La papelera ────────────────────────────────────────────────────────
-- ---------------------------------------------------------------------------
-- **Qué entra**, y la regla que lo decide. La 002 dejó escrito «Nadie borra: se
-- archiva», porque «un curso borrado se lleva sus ediciones, y una edición se
-- lleva las inscripciones de gente que pagó». La papelera no rompe eso:
--   · un **curso archivado** entra si ninguna de sus ediciones tiene una
--     inscripción;
--   · una **edición cerrada** entra si no tiene inscripciones (y su curso no
--     está archivado: ahí ya entra el curso entero).
-- Lo que tiene inscripciones se queda archivado o cerrado para siempre, como
-- hasta hoy: son registros contables y no van a la papelera.
--
-- **Cuándo y quién**: no hay columnas nuevas para eso. `auditoria` (004) ya
-- anota cada cambio de `estado` de cursos y ediciones con quién y cuándo; el
-- borrado es el último paso a `archivado` / `cerrada`. Si no hay renglón (una
-- fila que nació así), cuenta `updated_at`.
--
-- La ven el equipo y el dueño, con segundo paso. `security definer` porque lee
-- `auditoria`, que por RLS solo lee el dueño; por eso pregunta ella misma.
-- ---------------------------------------------------------------------------
create or replace function public.en_la_papelera()
returns table (tipo text, id uuid, nombre text, borrado_el timestamptz, persona text)
language sql
stable
security definer
set search_path = ''
as $$
  with cursos as (
    select 'curso'::text as tipo, c.id, c.titulo as nombre, c.updated_at
      from public.cursos c
     where c.estado = 'archivado'
       and not exists (
         select 1 from public.ediciones e join public.inscripciones i on i.edicion_id = e.id
          where e.curso_id = c.id)
  ),
  ediciones as (
    select 'edicion'::text as tipo, e.id,
           c.titulo || ' · ' || to_char(e.inicio at time zone e.zona, 'DD/MM/YYYY') as nombre,
           e.updated_at
      from public.ediciones e join public.cursos c on c.id = e.curso_id
     where e.estado = 'cerrada' and c.estado <> 'archivado'
       and not exists (select 1 from public.inscripciones i where i.edicion_id = e.id)
  ),
  todo as (select * from cursos union all select * from ediciones)
  select t.tipo, t.id, t.nombre,
         coalesce(a.created_at, t.updated_at) as borrado_el,
         coalesce(nullif(trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellido, '')), ''), '—') as persona
    from todo t
    left join lateral (
      select au.created_at, au.quien from public.auditoria au
       where au.tabla = case t.tipo when 'curso' then 'cursos' else 'ediciones' end
         and au.fila = t.id
         and au.detalle ->> 'estado' = case t.tipo when 'curso' then 'archivado' else 'cerrada' end
       order by au.id desc limit 1
    ) a on true
    left join public.personas p on p.id = a.quien
   where public.soy_miembro_activo() and public.con_segundo_paso()
   order by borrado_el desc
$$;

-- Restaurar: vuelve al estado que tenía antes de ir a la papelera (el renglón
-- de `auditoria` anterior); si no hay, el más prudente —un curso vuelve como
-- borrador, que no se ve en la web; una edición vuelve abierta, que es lo que
-- era antes de cerrarse—. `security invoker`: escribe con la RLS de quien lo
-- pide (`cursos_equipo_edita`, `ediciones_equipo_edita` y el segundo paso).
create or replace function public.restaurar_de_la_papelera(tipo text, fila uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  tabla text := case tipo when 'curso' then 'cursos' when 'edicion' then 'ediciones' end;
  borrado text := case tipo when 'curso' then 'archivado' when 'edicion' then 'cerrada' end;
  antes text;
  tocadas integer;
begin
  if tabla is null then
    raise exception 'NO_VALIDO' using errcode = '22023';
  end if;
  if not exists (select 1 from public.en_la_papelera() x where x.tipo = restaurar_de_la_papelera.tipo and x.id = fila) then
    raise exception 'NO_ESTA' using errcode = 'P0002';
  end if;
  -- Lo lee la función `security definer` de abajo: la auditoría la lee el dueño.
  antes := public.estado_antes_de_la_papelera(tabla, fila, borrado);
  if tabla = 'cursos' then
    update public.cursos set estado = coalesce(antes, 'borrador') where id = fila;
  else
    update public.ediciones set estado = coalesce(antes, 'abierta') where id = fila;
  end if;
  get diagnostics tocadas = row_count;
  if tocadas = 0 then
    raise exception 'NO_ESTA' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.estado_antes_de_la_papelera(tabla text, fila uuid, borrado text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select au.detalle ->> 'estado' from public.auditoria au
   where au.tabla = estado_antes_de_la_papelera.tabla and au.fila = estado_antes_de_la_papelera.fila
     and au.detalle ->> 'estado' is not null and au.detalle ->> 'estado' <> borrado
     and au.id < coalesce((
       select max(b.id) from public.auditoria b
        where b.tabla = estado_antes_de_la_papelera.tabla and b.fila = estado_antes_de_la_papelera.fila
          and b.detalle ->> 'estado' = borrado), 0)
     and public.soy_miembro_activo() and public.con_segundo_paso()
   order by au.id desc limit 1
$$;

-- ---------------------------------------------------------------------------
-- El borrado definitivo, a los 30 días (`DIAS_EN_PAPELERA` del molde). Lo hace
-- la app en su base: la API lo llama cada vez que alguien del equipo abre la
-- papelera, antes de leerla. Borra SOLO lo que `en_la_papelera()` muestra —nada
-- con inscripciones— y deja un renglón en `auditoria` por cada cosa borrada,
-- con su título: el `delete` no pasa por los triggers de auditoría (004), que
-- miran altas y cambios.
-- ---------------------------------------------------------------------------
create or replace function public.vaciar_la_papelera()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  x record;
  borradas integer := 0;
begin
  if not (public.soy_miembro_activo() and public.con_segundo_paso()) then
    return 0;
  end if;
  for x in select * from public.en_la_papelera() where borrado_el < now() - interval '30 days' loop
    insert into public.auditoria (quien, accion, tabla, fila, detalle)
    values (auth.uid(), 'borrado_definitivo', case x.tipo when 'curso' then 'cursos' else 'ediciones' end,
            x.id, jsonb_build_object('nombre', x.nombre));
    if x.tipo = 'curso' then
      delete from public.ediciones where curso_id = x.id;
      delete from public.cursos where id = x.id;
    else
      delete from public.ediciones where id = x.id;
    end if;
    borradas := borradas + 1;
  end loop;
  return borradas;
end;
$$;

revoke execute on function public.en_la_papelera(), public.restaurar_de_la_papelera(text, uuid),
  public.estado_antes_de_la_papelera(text, uuid, text), public.vaciar_la_papelera() from public;
grant execute on function public.en_la_papelera(), public.restaurar_de_la_papelera(text, uuid),
  public.estado_antes_de_la_papelera(text, uuid, text), public.vaciar_la_papelera() to authenticated;
