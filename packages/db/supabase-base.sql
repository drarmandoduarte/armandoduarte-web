-- Lo que Supabase pone y un Postgres limpio no tiene.
--
-- **Copiado de Omnia (`packages/db/supabase-base.sql`) como MECANISMO, y se
-- declara.** No trae ni una policy: trae la forma de ejecutarlas. Lo que se
-- reproduce acá es el ENTORNO, y de la forma más literal posible —`auth.uid()`
-- lee `request.jwt.claims` exactamente como en Supabase—, así que una policy que
-- funciona acá funciona allá.
--
-- Ninguna migración se toca para poder probarla: si el banco de pruebas
-- necesitara una migración distinta de la que corre en producción, no estaría
-- probando nada.
--
-- Este archivo NO es una migración: no va a la base de nadie. Vive junto a los
-- tests porque es parte del banco, no del producto.
--
-- ── Lo que se le AGREGÓ al de Omnia, y por qué ────────────────────────────
--   · `auth.jwt()` — Omnia no la necesitaba. Códice sí: el Kit de Acceso
--     (S3) exige que lo que un miembro ve de otras personas dependa de `aal2`
--     **en la base**, y el nivel de autenticación llega en el claim `aal`. Sin
--     esta función, `con_segundo_paso()` no se puede probar — y es el test que
--     más importa de la orden #13.
--   · `storage.buckets.file_size_limit` y `.allowed_mime_types` — la migración
--     006 declara el bucket con su tope de 5 MB y sus tres tipos. Sin las dos
--     columnas, la 006 no compilaría acá y sí en producción, que es la única
--     forma de que el banco deje de servir (la cicatriz de Omnia #47).
--   · `auth.users.created_at` — el trigger de nacimiento de `personas` cuelga de
--     un insert en `auth.users`; tener la columna hace que el banco se parezca a
--     lo que hay del otro lado, sin costo.

create schema if not exists auth;
create schema if not exists storage;

-- ── auth ────────────────────────────────────────────────────────────────────
create table auth.users (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  created_at timestamptz not null default now()
);

-- La función de la que cuelga TODA la seguridad de Códice. Misma implementación
-- que la de Supabase: el id del usuario sale del claim `sub` del JWT, que llega
-- como una variable de sesión. Cambiar de usuario en un test es cambiar esa
-- variable — igual que cambiar de sesión en el navegador.
--
-- El `nullif` va sobre el TEXTO y antes del cast, como en Supabase, y no
-- después. La diferencia no es de estilo: sin sesión la variable vale la cadena
-- vacía, y `''::json` no es un JSON vacío — es un error de sintaxis que revienta
-- la consulta entera. Con el cast primero, cualquier función que llame a
-- `auth.uid()` fuera de una sesión —un trigger, un `select` del banco corrido
-- como superusuario— moría en vez de recibir el `null` que le corresponde.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', '')::uuid
$$;

-- El JWT entero, para leer `aal`. Mismo cuidado con el `nullif` y por el mismo
-- motivo: sin sesión devuelve `null`, no revienta. Un `null` que llega a un
-- `using` de policy deniega la fila —probado en la sonda—, que es exactamente lo
-- que tiene que pasar cuando no hay segundo paso.
create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb
$$;

-- ── Roles ───────────────────────────────────────────────────────────────────
-- `authenticated` es el rol con el que PostgREST atiende a un usuario con
-- sesión. Es el que importa: es quien tiene que chocar contra la RLS.
--
-- Que NO sea el dueño de las tablas no es un detalle del banco, es la razón por
-- la que el banco sirve: en Postgres el dueño de una tabla se saltea su propia
-- RLS. Un test que corriera como `postgres` vería todas las filas y diría que
-- todo está bien.
--
-- `service_role` lleva `bypassrls` igual que en Supabase. **No entra en estos
-- tests**: es el rol de la API y probarlo sería probar que `bypassrls` bypassea.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema storage to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;

-- Supabase da permiso de tabla por default y deja que la RLS sea la que decide.
-- Se declara ANTES de correr las migraciones para que alcance a todo lo que
-- ellas creen.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- ── storage ─────────────────────────────────────────────────────────────────
-- Lo mínimo para que la migración 006 corra entera: el bucket con su tope y sus
-- tipos, los objetos, y `storage.foldername()`, que es de donde sale el
-- `inscripcion_id` de la ruta.
--
-- El banco NO prueba Storage de verdad —eso necesita subir un archivo— pero sí
-- prueba lo único que decide quién ve qué: las policies sobre `storage.objects`,
-- que son filas como cualquier otra.
create table storage.buckets (
  id                 text primary key,
  name               text,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz not null default now()
);

create table storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name      text,
  owner     uuid,
  -- El tamaño del archivo vive aquí en Supabase, en `metadata->>'size'`, y no en
  -- una columna propia.
  metadata  jsonb
);

alter table storage.objects enable row level security;

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select string_to_array(name, '/')
$$;

grant all on storage.buckets, storage.objects to anon, authenticated, service_role;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
