-- ===========================================================================
-- 011 · el perfil del cliente, y las notas del equipo
--
-- QUÉ TRAE: tres columnas opcionales en `personas` (`ciudad`,
-- `anio_nacimiento`, `nivel_educativo`) para la analítica que pidió Lucía; la
-- tabla **`notas_de_persona`**, solo-agregar, que lee y escribe el equipo por
-- territorio con segundo paso y el cliente nunca lee; una función
-- `veo_a_la_persona(uuid)` para su policy; sus `grant` (lo que la 007 hace para
-- las demás); y `panel_clientes()` con las columnas nuevas y `cuantas_notas`.
--
-- ORDEN QUE LA APROBÓ: Códice #27, PR D (`mi-espacio/09-el-perfil`), aprobada
-- por dirección el 1/10/2026, que define el esquema con estas palabras (D.1).
-- Es 011 y no 010 porque el PR C usó la 010 (`libro_de_edicion`).
--
-- APLICADA: 1/10/2026 16:20 (UY), en `armandoduarte-familia`, desde 157a2ff.
--   Guardada en el editor SQL como `011_el_perfil`. Corrida por el CEO con
--   autorización de Germán, desde `main` (157a2ff), antes de desplegar el PR D.
--
-- ── IMPORTANTE: se corre ANTES de desplegar el PR D ────────────────────────
-- La API de este PR lee `ciudad`, `anio_nacimiento` y `nivel_educativo` en
-- `GET /api/yo`. Desplegada sin esta migración, esa lectura da `42703` y **nadie
-- entra a Mi espacio**. Es el caso de la 009: se corre antes del merge.
--
-- ── Minimización (LFPDPPP) ─────────────────────────────────────────────────
-- Se guarda **el año, no la fecha** de nacimiento: para un rango de edad
-- alcanza, y es el dato mínimo. Las tres columnas son **nulas por defecto** y
-- ninguna es obligatoria en ninguna pantalla.
--
-- ── Las notas son datos personales igual ───────────────────────────────────
-- «Pagó en efectivo en el taller», «pidió factura»: son notas operativas que el
-- cliente no ve, pero **son datos sobre una persona** y entran en los derechos
-- ARCO. Si alguien los pide, el dueño los exporta (lee todas: territorio
-- `todos`). No se borran ni se corrigen —el trigger `solo_se_agrega` de la
-- 003—: una nota equivocada se corrige con otra. `auditoria` (004) anota cada
-- alta con quién y cuándo.
-- ===========================================================================

-- ── El perfil ───────────────────────────────────────────────────────────────
-- El tope del año (`now()` en un `check`) es lo literal de la orden. Postgres lo
-- acepta, con una salvedad que se deja escrita: el `check` se evalúa al
-- escribir la fila, así que una fila válida hoy no se vuelve inválida el año que
-- viene, y está bien que así sea.
alter table public.personas
  add column ciudad text check (ciudad is null or length(ciudad) between 1 and 120),
  add column anio_nacimiento integer
    check (anio_nacimiento between 1920 and extract(year from now())::int - 14),
  add column nivel_educativo text
    check (nivel_educativo in ('primaria', 'secundaria', 'preparatoria', 'licenciatura', 'posgrado', 'prefiero_no_decir'));

-- ── ¿Quien llama ve a esta persona? ─────────────────────────────────────────
-- `veo_pais()` (001) sobre el país de la persona: el mismo corte de territorio
-- que `personas_equipo_lee_su_territorio`. `security definer` por la razón de
-- siempre: la policy de `notas_de_persona` no tiene que depender de la RLS de
-- otra tabla.
create or replace function public.veo_a_la_persona(persona uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.veo_pais((select p.pais from public.personas p where p.id = persona))
     and exists (select 1 from public.personas p where p.id = persona)
$$;

-- ── Las notas del equipo ────────────────────────────────────────────────────
create table public.notas_de_persona (
  id          uuid primary key default gen_random_uuid(),
  persona_id  uuid not null references public.personas(id) on delete restrict,
  -- Quién la escribió: `default auth.uid()` y la policy exige que sea quien firma.
  autor       uuid not null default auth.uid() references public.personas(id),
  texto       text not null check (length(texto) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index notas_de_persona_por_persona_idx on public.notas_de_persona (persona_id, created_at desc);

create trigger notas_de_persona_solo_se_agrega
  before update or delete on public.notas_de_persona
  for each row execute function public.solo_se_agrega();

create trigger notas_de_persona_ni_truncate
  before truncate on public.notas_de_persona
  for each statement execute function public.solo_se_agrega();

create trigger notas_de_persona_auditoria
  after insert on public.notas_de_persona
  for each row execute function public.anotar_en_auditoria();

alter table public.notas_de_persona enable row level security;

-- El equipo lee las notas de las personas de su territorio.
create policy notas_el_equipo_lee_su_territorio on public.notas_de_persona
  for select to authenticated
  using (public.veo_a_la_persona(persona_id));

-- Y agrega, firmando con su nombre, sobre las de su territorio.
create policy notas_el_equipo_agrega_en_su_territorio on public.notas_de_persona
  for insert to authenticated
  with check (autor = auth.uid() and public.veo_a_la_persona(persona_id));

-- Siempre con segundo paso. **El cliente no tiene ninguna policy**: no lee sus
-- notas ni con su propio `persona_id`. Esa ausencia es la decisión.
create policy notas_segundo_paso on public.notas_de_persona
  as restrictive for all to authenticated
  using (public.con_segundo_paso())
  with check (public.con_segundo_paso());

-- ── Permisos (lo que la 007 hace para las otras tablas) ─────────────────────
-- Sin `update` ni `delete` para `authenticated`: solo se agrega.
grant select, insert on public.notas_de_persona to authenticated;
grant select, insert, update, delete on public.notas_de_persona to service_role;
revoke execute on function public.veo_a_la_persona(uuid) from public, anon;
grant execute on function public.veo_a_la_persona(uuid) to authenticated, service_role;

-- ── panel_clientes, con el perfil y las notas ───────────────────────────────
-- **Reemplazo de la 008, no `panel_clientes_v2`**: la regla de nombres de la
-- casa dice «sin `_v2`», y la API llama a esta función por su nombre, así que
-- sigue funcionando entre el momento en que se corre esto y el despliegue (le
-- llegan columnas de más, que no lee). Como cambian las columnas que devuelve,
-- `create or replace` no alcanza: es `drop` + `create`, **en una transacción**
-- para que no haya un instante sin la función.
--
-- `anio_nacimiento` viaja en crudo: la **edad** la calcula `@codice/core` y la
-- tabla nunca muestra el año. `cuantas_notas` cuenta por la RLS de las notas:
-- lo que quien llama puede leer.
begin;

drop function public.panel_clientes();

create function public.panel_clientes()
returns table (
  persona_id         uuid,
  nombre             text,
  apellido           text,
  email              text,
  whatsapp           text,
  pais               text,
  ciudad             text,
  anio_nacimiento    integer,
  nivel_educativo    text,
  alta               timestamptz,
  cursos             integer,
  ultimo_curso       text,
  ultima_inscripcion timestamptz,
  cuantas_notas      integer,
  rol                text,
  territorio         text,
  activo             boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, p.nombre, p.apellido, p.email, p.whatsapp, p.pais,
         p.ciudad, p.anio_nacimiento, p.nivel_educativo, p.created_at,
         (select count(*)::int from public.inscripciones i where i.persona_id = p.id),
         (select c.titulo
            from public.inscripciones i
            join public.ediciones e on e.id = i.edicion_id
            join public.cursos c on c.id = e.curso_id
           where i.persona_id = p.id
           order by i.created_at desc
           limit 1),
         (select max(i.created_at) from public.inscripciones i where i.persona_id = p.id),
         (select count(*)::int from public.notas_de_persona n where n.persona_id = p.id),
         m.rol, m.territorio, m.activo
    from public.personas p
    left join public.miembros m on m.user_id = p.id
   where public.soy_miembro_activo()
   order by p.created_at desc, p.email
$$;

revoke execute on function public.panel_clientes() from public, anon;
grant execute on function public.panel_clientes() to authenticated, service_role;

commit;
