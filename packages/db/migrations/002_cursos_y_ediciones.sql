-- ===========================================================================
-- 002 · cursos y ediciones
--
-- QUÉ TRAE: el catálogo. Un `curso` es lo que Armando ofrece («El arte de amar a
-- tu hijo adolescente»); una `edicion` es una vez que lo da, con su fecha, su
-- sede, su cupo y su precio. El taller del 5/11 en Mérida es una edición.
--
-- ORDEN QUE LA APROBÓ: Códice #13 (Mi espacio, PR 1), aprobada por dirección el
-- 29/9/2026. Especificación: `03 Producto/mi-espacio/especificacion-v1.md` §3.
--
-- APLICADA: 29/9/2026 02:34 (UY), en `armandoduarte-familia`, desde fd93eab.
--   Corrida por el CEO con autorización de Germán; verificada contra la base
--   (10 tablas con RLS, 39 policies en `public`, 3 en `storage`, bucket
--   `comprobantes` privado). Guardada en el editor SQL como `002_cursos_y_ediciones`.
--
-- LA DECISIÓN QUE LLEVA ADENTRO: **el catálogo se ve sin entrar; inscribirse no.**
-- `anon` lee los cursos publicados y sus ediciones, y nada más de toda la base.
-- Es lo que hace posible que la ficha del taller tenga precio y fecha en un link
-- que se comparte por WhatsApp, sin que eso abra una sola fila de una persona.
-- ===========================================================================

create table public.cursos (
  id           uuid primary key default gen_random_uuid(),
  -- El slug va en la URL, así que su forma se vigila en la base: minúsculas,
  -- números y guiones simples. Un slug con una mayúscula es un 404 que aparece
  -- meses después, cuando alguien comparte el link.
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo       text not null,
  bajada       text,
  descripcion  text,
  modalidad    text not null check (modalidad in ('presencial', 'en_linea')),
  -- Nace en borrador. Un curso que naciera publicado es un curso a medio cargar
  -- que ya está en la web.
  estado       text not null default 'borrador'
               check (estado in ('borrador', 'publicado', 'archivado')),
  portada_path text,
  orden        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.ediciones (
  id                  uuid primary key default gen_random_uuid(),
  -- `restrict` y no `cascade`: un curso no se borra (se archiva), y si algún día
  -- alguien lo intenta, que se lo impida la edición y no el silencio.
  curso_id            uuid not null references public.cursos(id) on delete restrict,
  -- D15: con hora y con zona. Las dos cosas. `inicio` dice el instante;
  -- `zona` dice en qué reloj se anuncia («9:00 en Mérida»), que es lo que va en
  -- el mail, en el `.ics` y en la ficha.
  inicio              timestamptz not null,
  fin                 timestamptz not null,
  zona                text not null check (public.es_zona_iana(zona)),
  sede                text,
  ciudad              text,
  pais                text check (pais ~ '^[A-Z]{2}$'),
  cupo                integer check (cupo > 0),
  precio_monto        numeric(10,2) check (precio_monto >= 0),
  precio_moneda       char(3) check (precio_moneda ~ '^[A-Z]{3}$'),
  -- Nullable en la columna, cerrada en la policy: la migración 003 exige
  -- `now() < inscripciones_hasta`, y un nulo ahí NO se inscribe. Está declarado
  -- en la 003 y hay un test que lo afirma.
  inscripciones_hasta timestamptz,
  estado              text not null default 'abierta'
                      check (estado in ('abierta', 'cerrada', 'realizada')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint ediciones_fin_despues_del_inicio check (fin > inicio)
);

create index ediciones_por_curso_idx on public.ediciones (curso_id, inicio);

create trigger cursos_updated_at
  before update on public.cursos
  for each row execute function public.toca_updated_at();

create trigger ediciones_updated_at
  before update on public.ediciones
  for each row execute function public.toca_updated_at();

-- ---------------------------------------------------------------------------
-- `curso_publicado` — que un curso esté publicado, preguntado desde una policy.
--
-- `security definer` por el mismo motivo que las funciones de la 001, pero con un
-- giro propio: la policy de `ediciones` necesita mirar `cursos`, y `cursos` tiene
-- su propia RLS. Preguntando con un `exists` a secas, la respuesta dependería de
-- lo que la sesión puede ver de `cursos` — o sea, una policy cuyo resultado
-- cambia según otra policy. Eso funciona hoy y se rompe el día que alguien
-- ajuste la RLS de `cursos` por un motivo que no tiene nada que ver con esto.
-- Con la función, la pregunta es sobre el dato y no sobre lo visible.
-- ---------------------------------------------------------------------------
create or replace function public.curso_publicado(curso uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cursos
     where id = curso and estado = 'publicado'
  )
$$;

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.cursos enable row level security;
alter table public.ediciones enable row level security;

-- ── lo que se ve sin entrar ─────────────────────────────────────────────────
create policy cursos_publicados_a_la_vista on public.cursos
  for select to anon, authenticated
  using (estado = 'publicado');

create policy ediciones_de_curso_publicado on public.ediciones
  for select to anon, authenticated
  using (public.curso_publicado(curso_id));

-- ── lo que ve y escribe el equipo ───────────────────────────────────────────
-- Borradores incluidos: cargar un curso es trabajo de varios días y el borrador
-- es donde vive mientras.
create policy cursos_equipo_ve_todo on public.cursos
  for select to authenticated
  using (public.soy_miembro_activo());

create policy cursos_equipo_carga on public.cursos
  for insert to authenticated
  with check (public.soy_miembro_activo());

create policy cursos_equipo_edita on public.cursos
  for update to authenticated
  using (public.soy_miembro_activo())
  with check (public.soy_miembro_activo());

create policy ediciones_equipo_ve_todo on public.ediciones
  for select to authenticated
  using (public.soy_miembro_activo());

create policy ediciones_equipo_carga on public.ediciones
  for insert to authenticated
  with check (public.soy_miembro_activo());

create policy ediciones_equipo_edita on public.ediciones
  for update to authenticated
  using (public.soy_miembro_activo())
  with check (public.soy_miembro_activo());

-- **Nadie borra: se archiva.** No hay policy de delete, y la que falta es la
-- decisión. Un curso borrado se lleva sus ediciones, y una edición se lleva las
-- inscripciones de gente que pagó.

-- ---------------------------------------------------------------------------
-- El segundo paso, otra vez como policy restrictiva, y con la línea de corte
-- puesta donde corresponde: **lo publicado se lee siempre; el borrador y toda
-- escritura, con `aal2`.**
--
-- El territorio NO entra acá a propósito, y vale decirlo porque es la pregunta
-- que se hace al leer: un curso no es de nadie. Gabi carga un curso que Diana va
-- a ver, porque el catálogo es uno. Lo que se parte por territorio son las
-- personas y sus inscripciones, no el contenido.
-- ---------------------------------------------------------------------------
create policy cursos_segundo_paso on public.cursos
  as restrictive for all to authenticated
  using (estado = 'publicado' or public.con_segundo_paso())
  with check (public.con_segundo_paso());

create policy ediciones_segundo_paso on public.ediciones
  as restrictive for all to authenticated
  using (public.curso_publicado(curso_id) or public.con_segundo_paso())
  with check (public.con_segundo_paso());
