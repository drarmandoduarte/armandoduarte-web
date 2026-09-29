-- ===========================================================================
-- 001 · personas y miembros
--
-- QUÉ TRAE: las dos tablas de las que cuelga todo lo demás —una fila por cada
-- persona que entra, y la lista de quién es equipo— y **las cinco funciones que
-- son la única forma de escribir las policies de las migraciones siguientes**.
-- La regla del territorio (D11) vive acá y en ningún otro archivo: si Gabi ve
-- México y Diana lo internacional, es porque `veo_pais()` lo dice, no porque
-- veinte policies lo repitan.
--
-- ORDEN QUE LA APROBÓ: Códice #13 (Mi espacio, PR 1), aprobada por dirección el
-- 29/9/2026. Especificación: `03 Producto/mi-espacio/especificacion-v1.md` §3.
--
-- APLICADA: —
--   (esta línea la completa SOLO Germán, el día que la corre en el editor SQL de
--    `armandoduarte-familia`, y se escribe cuando se vio terminar.)
--
-- NINGUNA POLICY DE ACÁ SE COPIÓ de Bitácora ni de Omnia. Están escritas de cero
-- porque Códice es un tercer modelo de inquilino: no el profesional (Bitácora) ni
-- la clínica (Omnia), sino una organización con **territorios** y con una
-- población entera —los clientes— que no es miembro de nada.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Un detalle de convención que se escribe una vez y vale para las seis
-- migraciones: **los nombres de valores van en texto con `check`, no como tipos
-- enum.** Un `check` se ensancha con un `alter table` de dos renglones que se lee
-- en un diff; agregarle un valor a un enum en Postgres es una operación aparte
-- que no se puede deshacer dentro de una transacción.
--
-- Y los identificadores van en ASCII: `dueno`, no `dueño`. Los textos que ve la
-- gente son cosa de i18n (`packages/core`), no de la base.
-- ---------------------------------------------------------------------------

-- ── personas ────────────────────────────────────────────────────────────────
-- Una fila por `auth.users`. Nace por trigger al primer ingreso con el mail y
-- nada más; el resto lo completa la persona.
create table public.personas (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text,
  apellido      text,
  -- El mail es el que verificó Supabase Auth, en minúsculas. La fuente de verdad
  -- es `auth.users`; acá es una copia de lectura, y por eso hay un trigger más
  -- abajo que niega cambiarla. Dos mails distintos para la misma persona es la
  -- clase de desincronización que después sostiene un mail que no llega.
  email         text not null unique check (email = lower(email) and email like '%@%'),
  whatsapp      text,
  -- ISO 3166-1 alfa-2. Es lo que decide el territorio, así que su forma se
  -- vigila acá y no en un formulario.
  pais          text check (pais ~ '^[A-Z]{2}$'),
  -- D15: nombre IANA, NUNCA un offset. `es_zona_iana()` consulta
  -- `pg_timezone_names`, que no se puede poner en un `check` directamente
  -- —Postgres no acepta subconsultas ahí— pero sí a través de una función.
  zona_horaria  text,
  idioma        text not null default 'es' check (idioma in ('es', 'en', 'pt')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── miembros ────────────────────────────────────────────────────────────────
-- Quién es equipo. **Sin seed**: el primer `dueno` lo inserta Germán a mano el
-- día que Armando entre por primera vez (la línea está en el README). Una app
-- que nace con un dueño sembrado nace con una cuenta que nadie pidió.
create table public.miembros (
  user_id      uuid primary key references public.personas(id) on delete cascade,
  rol          text not null check (rol in ('dueno', 'equipo')),
  -- D11: el territorio NO es un botón que se dibuja o no. Decide qué filas
  -- existen para esa sesión.
  territorio   text not null check (territorio in ('mexico', 'internacional', 'todos')),
  activo       boolean not null default true,
  invitado_por uuid references public.personas(id),
  created_at   timestamptz not null default now()
);

create index miembros_activos_idx on public.miembros (user_id) where activo;

-- ===========================================================================
-- LAS FUNCIONES · la única forma de escribir las policies
--
-- Todas `security definer` con `search_path` fijo en la cadena vacía. Las dos
-- cosas son necesarias y por motivos distintos:
--
--   · `security definer` porque `soy_miembro_activo()` lee `miembros`, y
--     `miembros` tiene RLS que a su vez llamaría a `soy_miembro_activo()`:
--     recursión infinita. Corriendo como dueña de la tabla, la función se saltea
--     la RLS y corta el ciclo.
--   · `search_path = ''` porque una función `security definer` corre con los
--     privilegios de quien la creó. Si alguien pudiera crear un esquema propio
--     antes que `public` en el camino de búsqueda, le cambiaría el significado a
--     `miembros` desde afuera. Con el camino vacío, cada nombre va calificado y
--     no hay nada que resolver. (`pg_catalog` se busca siempre, así que los
--     operadores y `now()` siguen funcionando.)
-- ===========================================================================

-- La zona horaria es IANA o no es. Separada en función porque un `check` no
-- acepta subconsultas, y `stable` porque `pg_timezone_names` no cambia dentro de
-- una consulta.
create or replace function public.es_zona_iana(zona text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = zona)
$$;

alter table public.personas
  add constraint personas_zona_horaria_iana
  check (zona_horaria is null or public.es_zona_iana(zona_horaria));

-- ---------------------------------------------------------------------------
-- `territorio_de_pais` — México es un territorio, todo lo demás es el otro.
--
-- Un país en nulo cae en `internacional`, y eso es una decisión, no un descuido:
-- `personas` nace con el mail y nada más, así que entre el primer ingreso y el
-- formulario hay un rato en el que no se sabe de dónde es. Se eligió que en ese
-- rato la vea Diana (y Armando, que ve todo) antes que nadie, porque «nadie» deja
-- a una persona a medio registrar sin dueña. **Es lo literal de la orden #13
-- §B.1 —«MX → mexico, todo lo demás internacional»— y queda escrito acá para que
-- se pueda cambiar en un solo lugar si dirección decide otra cosa.**
-- ---------------------------------------------------------------------------
create or replace function public.territorio_de_pais(pais text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when pais = 'MX' then 'mexico' else 'internacional' end
$$;

create or replace function public.soy_miembro_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembros
     where user_id = auth.uid() and activo
  )
$$;

create or replace function public.soy_dueno()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembros
     where user_id = auth.uid() and activo and rol = 'dueno'
  )
$$;

-- El corazón de D11. Un miembro activo ve un país si su territorio es `todos` o
-- si coincide con el territorio de ese país. Quien no es miembro no ve ninguno:
-- `exists` sobre cero filas es falso, y por eso un cliente nunca entra por acá.
create or replace function public.veo_pais(pais text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembros m
     where m.user_id = auth.uid()
       and m.activo
       and (m.territorio = 'todos'
            or m.territorio = public.territorio_de_pais(pais))
  )
$$;

-- Kit de Seguridad 512, S3: el freno vive en el servidor **y en la base**. Que
-- la pantalla pida el segundo paso no alcanza; que la API lo pida tampoco, sola.
-- Un cliente ve lo suyo con `aal1`; un miembro no ve a nadie más sin `aal2`.
--
-- `coalesce` a falso a propósito: sin sesión `auth.jwt()` es nulo y un nulo en un
-- `using` deniega igual, pero una función booleana que puede devolver nulo es una
-- trampa para quien la lea en la próxima policy.
create or replace function public.con_segundo_paso()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

-- `updated_at` lo escribe la base, no la app: una app que se olvida deja una
-- fecha que miente y nadie la audita.
create or replace function public.toca_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger personas_updated_at
  before update on public.personas
  for each row execute function public.toca_updated_at();

-- ---------------------------------------------------------------------------
-- La persona nace con el usuario.
--
-- `security definer`: corre como dueña de la tabla y por eso puede insertar
-- aunque `personas` no tenga ninguna policy de insert — y no la tiene a
-- propósito, porque nadie se crea una fila de `personas` a mano.
--
-- Si `auth.users.email` viniera en nulo, el insert falla y el ingreso falla con
-- él. Es el modo de falla que se quiere: Códice entra por mail y nada más (kit
-- S2), así que un usuario sin mail es una configuración equivocada de Supabase,
-- y es mejor que se note el primer día que una fila de `personas` sin mail que
-- después no recibe ninguno de los cinco avisos.
-- ---------------------------------------------------------------------------
create or replace function public.persona_nace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.personas (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger personas_nacen_con_el_usuario
  after insert on auth.users
  for each row execute function public.persona_nace();

-- El mail y el id no se cambian, y el freno es un trigger y no un `with check`
-- porque un `with check` solo ve la fila nueva: no puede comparar contra la
-- vieja. Así aplica a todos —a la persona, al equipo y a la `service_role`—, que
-- es lo que corresponde cuando la fuente de verdad está en otra tabla.
create or replace function public.personas_lo_que_no_se_cambia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id then
    raise exception 'personas.id no se cambia: es el id de auth.users';
  end if;
  if new.email <> old.email then
    raise exception 'personas.email no se cambia acá: la fuente de verdad es auth.users';
  end if;
  return new;
end;
$$;

create trigger personas_id_y_email_quietos
  before update on public.personas
  for each row execute function public.personas_lo_que_no_se_cambia();

-- ===========================================================================
-- RLS · habilitada y default deny en las dos tablas
--
-- Sin policy, nadie ve nada: incluida la `service_role`, que se saltea la RLS por
-- `bypassrls` y no por una policy que la nombre. Esa distinción importa el día
-- que alguien exponga la base sin la API en el medio.
-- ===========================================================================

alter table public.personas enable row level security;
alter table public.miembros enable row level security;

-- ── personas · lectura ──────────────────────────────────────────────────────
create policy personas_leo_la_mia on public.personas
  for select to authenticated
  using (id = auth.uid());

create policy personas_equipo_lee_su_territorio on public.personas
  for select to authenticated
  using (public.veo_pais(pais));

-- ── personas · escritura ────────────────────────────────────────────────────
-- Cada quien edita la suya y nada más. El equipo NO edita fichas de clientes en
-- v1: no hay policy de update para miembros, y eso es la decisión.
create policy personas_edito_la_mia on public.personas
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Sin policy de insert (la crea el trigger) ni de delete (la baja de cuenta es
-- otro PR y va a ser un borrado en cascada desde `auth.users`).

-- ---------------------------------------------------------------------------
-- LA POLICY QUE SOSTIENE S3, y es la que la mutación (a) de la orden se lleva.
--
-- `as restrictive` significa que se suma con AND a todas las permisivas: con una
-- sola permisiva que diga sí, esta tiene que decir sí también. Se lee así: **tu
-- propia fila, siempre; cualquier otra, con segundo paso.**
--
-- Por eso no dice `con_segundo_paso()` a secas: un cliente no tiene TOTP y no se
-- le impone (kit S0), así que un aal2 obligatorio lo dejaría sin ver sus propios
-- datos. Lo que exige `aal2` es exactamente lo que un miembro hace **como
-- miembro**: mirar a otras personas.
--
-- Quitala y Gabi con `aal1` ve a Laura. Eso es la mutación (a), y el test
-- «Gabi con aal1 no ve a nadie que no sea ella misma» es el que cae.
-- ---------------------------------------------------------------------------
create policy personas_segundo_paso on public.personas
  as restrictive for all to authenticated
  using (id = auth.uid() or public.con_segundo_paso())
  with check (id = auth.uid() or public.con_segundo_paso());

-- ── miembros ────────────────────────────────────────────────────────────────
-- Cada miembro lee su fila: es lo que la app necesita para saber qué dibujar.
create policy miembros_leo_la_mia on public.miembros
  for select to authenticated
  using (user_id = auth.uid());

create policy miembros_dueno_lee on public.miembros
  for select to authenticated
  using (public.soy_dueno());

create policy miembros_dueno_invita on public.miembros
  for insert to authenticated
  with check (public.soy_dueno());

-- Desactivar, no borrar. El update queda abierto al dueño —también para corregir
-- un `territorio` mal puesto, que es la enmienda más probable— y cada paso queda
-- en `auditoria` (migración 004). **No hay policy de delete en ninguna parte de
-- este esquema**: un miembro que se fue es una fila con `activo = false`, porque
-- lo que hizo mientras estaba tiene que seguir teniendo autor.
create policy miembros_dueno_desactiva on public.miembros
  for update to authenticated
  using (public.soy_dueno())
  with check (public.soy_dueno());

create policy miembros_segundo_paso on public.miembros
  as restrictive for all to authenticated
  using (user_id = auth.uid() or public.con_segundo_paso())
  with check (public.con_segundo_paso());
