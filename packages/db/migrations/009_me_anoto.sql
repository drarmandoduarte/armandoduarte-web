-- ===========================================================================
-- 009 · me anoto
--
-- QUÉ TRAE: lo que el cliente necesita para ver los talleres abiertos y
-- anotarse desde Mi espacio: **el cupo, cumplido por la base**, y tres
-- consultas (`talleres_abiertos`, `mis_talleres`, `inscribirme`). **Ninguna
-- tabla, ninguna columna y ninguna policy nueva**: la inscripción la sigue
-- permitiendo `inscripciones_me_inscribo` (003), y la ficha la corrige
-- `personas_edito_la_mia` (001).
--
-- ORDEN QUE LA APROBÓ: Códice #24, PR B (`mi-espacio/07-me-anoto`), aprobada
-- por dirección el 30/9/2026. La orden la prevé: «si algo necesita una columna
-- o una policy nueva, es una migración en su propio commit, con test en el
-- banco».
--
-- APLICADA: —
--
-- ── El hueco que esta migración cierra ─────────────────────────────────────
-- La orden pide que nadie se anote «a una edición sin cupo». La 003 no lo
-- cumplía: `edicion_abierta()` mira estado, publicación y fecha de cierre, y
-- **no cuenta a nadie**. Con cupo 60, la inscripción 61 entraba. Y no se podía
-- arreglar en la API: el cliente no ve las inscripciones de los demás (RLS), así
-- que contarlas con su token da siempre su propia fila; y contar con
-- `service_role` sería saltear la base para decidir algo que es de la base.
--
-- ── Por qué un trigger con `for update`, y no una condición en la policy ───
-- Dos personas que se anotan en el mismo segundo con un lugar libre leen las
-- dos «59 de 60» y entran las dos: un `count` en un `with check` no ve la fila
-- que la otra transacción todavía no confirmó. El trigger **bloquea la fila de
-- la edición** antes de contar, así que la segunda espera a que la primera
-- termine y cuenta 60. Es el mismo freno que se usa para un asiento de avión.
--
-- ── Dos códigos de error propios, para que la pantalla diga lo que pasó ───
--   · `CD409` — la edición no tiene lugares.
--   · `CD410` — la edición no está abierta (cerrada, en borrador o vencida).
-- PostgREST los devuelve tal cual en `code`, y la API los traduce a
-- `SIN_LUGARES` y `EDICION_CERRADA`. Un `42501` de la RLS diría «no tienes
-- permiso», que es cierto y no le sirve a nadie.
-- ===========================================================================

-- ── Cuántos lugares quedan ──────────────────────────────────────────────────
-- `security definer` por lo mismo que `inscriptos_de_edicion()` (008): cuenta
-- todas las inscripciones, que el cliente no ve. Devuelve **un número y ningún
-- dato de nadie**, y solo de ediciones de cursos publicados. Nulo = sin tope
-- (cupo vacío, como la semilla de Mérida) o edición que no se ve.
create or replace function public.lugares_de_edicion(edicion uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
           when e.cupo is null then null
           else greatest(e.cupo - (select count(*)::int from public.inscripciones i
                                    where i.edicion_id = e.id), 0)
         end
    from public.ediciones e
   where e.id = edicion
     and public.curso_publicado(e.curso_id)
$$;

-- ── El cupo, cumplido ───────────────────────────────────────────────────────
-- Corre para TODOS, como los triggers del libro: no hay rol que se lo saltee.
-- El nombre empieza con `inscripciones_cupo_…` a propósito: los triggers
-- `before` corren por orden alfabético, y así éste corre **antes** que
-- `inscripciones_referencia_la_pone_la_base` (003). Una inscripción rechazada
-- por cupo no quema un número `AD-`.
create or replace function public.inscripcion_respeta_el_cupo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tope     integer;
  anotados integer;
begin
  select e.cupo into tope
    from public.ediciones e
   where e.id = new.edicion_id
     for update;

  if tope is not null then
    select count(*)::int into anotados
      from public.inscripciones i
     where i.edicion_id = new.edicion_id;
    if anotados >= tope then
      raise exception 'inscripciones: la edicion no tiene lugares (cupo %)', tope
        using errcode = 'CD409';
    end if;
  end if;
  return new;
end;
$$;

create trigger inscripciones_cupo_antes_de_la_referencia
  before insert on public.inscripciones
  for each row execute function public.inscripcion_respeta_el_cupo();

-- ── Talleres abiertos ───────────────────────────────────────────────────────
-- Las ediciones en las que alguien se puede anotar hoy (`edicion_abierta()`,
-- 003), con cuántos lugares quedan y, si quien llama ya está anotado, su
-- referencia. `security invoker`: el catálogo lo filtra la RLS de la 002 y la
-- inscripción propia la de la 003. Una edición llena **sigue en la lista**,
-- con 0 lugares: la pantalla dice «sin lugares» en vez de hacerla desaparecer.
create or replace function public.talleres_abiertos()
returns table (
  edicion_id    uuid,
  curso_slug    text,
  curso_titulo  text,
  curso_bajada  text,
  modalidad     text,
  inicio        timestamptz,
  fin           timestamptz,
  zona          text,
  sede          text,
  ciudad        text,
  pais          text,
  precio_monto  numeric,
  precio_moneda text,
  lugares       integer,
  mi_referencia text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.id, c.slug, c.titulo, c.bajada, c.modalidad, e.inicio, e.fin, e.zona,
         e.sede, e.ciudad, e.pais, e.precio_monto, e.precio_moneda::text,
         public.lugares_de_edicion(e.id),
         (select i.referencia from public.inscripciones i
           where i.edicion_id = e.id and i.persona_id = auth.uid())
    from public.ediciones e
    join public.cursos c on c.id = e.curso_id
   where public.edicion_abierta(e.id)
   order by e.inicio, c.titulo
$$;

-- ── Mis talleres ────────────────────────────────────────────────────────────
-- Las inscripciones de quien llama, con el curso y la fecha. `security definer`
-- y **filtrada por `auth.uid()` adentro**, por un caso concreto: si Armando pasa
-- un curso a borrador después de que alguien se anotó, la RLS de la 002 le
-- oculta el curso al cliente y un `join` como invoker haría desaparecer la
-- inscripción de su lista. La inscripción es suya aunque el curso ya no se
-- publique. El `where` es lo único que la hace segura, y lo prueba el banco
-- (un cliente no ve las de otro).
create or replace function public.mis_talleres()
returns table (
  referencia   text,
  inscripto_el timestamptz,
  curso_titulo text,
  curso_slug   text,
  inicio       timestamptz,
  fin          timestamptz,
  zona         text,
  sede         text,
  ciudad       text,
  estado       text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.referencia, i.created_at, c.titulo, c.slug, e.inicio, e.fin, e.zona,
         e.sede, e.ciudad, public.estado_inscripcion(i.id)
    from public.inscripciones i
    join public.ediciones e on e.id = i.edicion_id
    join public.cursos c on c.id = e.curso_id
   where auth.uid() is not null
     and i.persona_id = auth.uid()
   order by e.inicio desc, i.referencia
$$;

-- ── Me anoto ────────────────────────────────────────────────────────────────
-- Una sola llamada que contesta las tres cosas que la pantalla tiene que decir:
-- «ya estabas anotado» (con tu referencia), «no está abierta» (`CD410`) y «no
-- quedan lugares» (`CD409`, del trigger). `security invoker`: el `insert` pasa
-- por `inscripciones_me_inscribo` (003) como cualquier otro, y la persona es
-- siempre `auth.uid()` — no hay argumento para anotar a otro.
--
-- Primero se mira si ya está anotado, y recién después si está abierta y si
-- hay lugar: quien ya tiene su lugar en un taller lleno tiene que ver su
-- referencia, no «sin lugares». El `unique_violation` cubre el doble clic: dos
-- pedidos que pasan juntos la primera mirada, y el segundo vuelve con la
-- referencia del primero.
create or replace function public.inscribirme(edicion uuid)
returns table (referencia text, ya_estaba boolean)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  ref text;
begin
  if auth.uid() is null then
    raise exception 'inscribirme: sin sesion' using errcode = '42501';
  end if;

  select i.referencia into ref
    from public.inscripciones i
   where i.edicion_id = edicion and i.persona_id = auth.uid();
  if ref is not null then
    return query select ref, true;
    return;
  end if;

  if not public.edicion_abierta(edicion) then
    raise exception 'inscribirme: la edicion no esta abierta' using errcode = 'CD410';
  end if;

  begin
    insert into public.inscripciones (edicion_id, persona_id)
    values (edicion, auth.uid())
    returning public.inscripciones.referencia into ref;
  exception when unique_violation then
    select i.referencia into ref
      from public.inscripciones i
     where i.edicion_id = edicion and i.persona_id = auth.uid();
    return query select ref, true;
    return;
  end;

  return query select ref, false;
end;
$$;

-- ── Permisos ────────────────────────────────────────────────────────────────
-- Mismo criterio que la 008: `public` y `anon` afuera; `authenticated` y
-- `service_role` adentro. `lugares_de_edicion()` necesita `execute` para quien
-- llama porque la invoca `talleres_abiertos()`, que corre como quien llama. La
-- función del trigger no se concede: la corre el trigger, no una sesión.
revoke execute on function
  public.lugares_de_edicion(uuid), public.talleres_abiertos(),
  public.mis_talleres(), public.inscribirme(uuid),
  public.inscripcion_respeta_el_cupo()
from public, anon;

grant execute on function
  public.lugares_de_edicion(uuid), public.talleres_abiertos(),
  public.mis_talleres(), public.inscribirme(uuid)
to authenticated, service_role;
