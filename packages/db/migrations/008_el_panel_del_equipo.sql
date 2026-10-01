-- ===========================================================================
-- 008 · el panel del equipo
--
-- QUÉ TRAE: las cuatro consultas del panel `/equipo` (Cursos, Inscriptos,
-- Clientes) como funciones, y sus permisos. **Ninguna tabla, ninguna columna y
-- ninguna policy nueva**: lo que el panel escribe —cursos, ediciones, sumar y
-- quitar del equipo— ya lo permiten las policies de la 001 y la 002 y los
-- `grant` de la 007, y lo anota la auditoría de la 004.
--
-- ORDEN QUE LA APROBÓ: Códice #24, PR A (`mi-espacio/06-el-panel`), aprobada por
-- dirección el 30/9/2026.
--
-- APLICADA: 30/9/2026 21:55 (UY), en `armandoduarte-familia`, desde db747a1.
--   Corrida por el CEO con autorización de Germán, desde `main` (merge del PR
--   #37), texto idéntico al archivo (7708 caracteres). Verificado contra la
--   base: `panel_clientes`, `panel_cursos` y `panel_inscriptos` presentes.
--   Guardada en el editor SQL como `008_el_panel_del_equipo`. Fuente:
--   `03 Producto/mi-espacio/infraestructura-2026-09-29.md`, «30/9 21:55».
--
-- ── Por qué funciones y no consultas armadas en la API ─────────────────────
-- Porque así **cada consulta del panel se prueba en el banco** con los cuatro
-- perfiles —dueño, equipo México, equipo internacional y cliente—, que es lo que
-- pide la orden y la regla de la casa: un test de la API que no toca la base no
-- prueba una consulta. La API solo las llama por nombre (`rpc`).
--
-- ── Tres son `security invoker`, y eso es lo que las hace seguras ──────────
-- Corren con los permisos y la RLS de **quien llama**: el territorio (D11) lo
-- sigue decidiendo `veo_pais()` en las policies de `personas` e `inscripciones`,
-- no un `where` de acá. Gabi llama a `panel_inscriptos()` y recibe las filas de
-- México porque la base no le deja ver otras. **La pantalla no filtra: filtra
-- la base.** Además cada una devuelve vacío a quien no es miembro activo, para
-- que un cliente que las llame no reciba ni siquiera su propia fila con forma de
-- panel.
--
-- ── Y una es `security definer`, a propósito y con su freno ────────────────
-- `inscriptos_de_edicion()` cuenta **todas** las inscripciones de una edición,
-- sin mirar territorio: el cupo es uno solo y «23 / 60» tiene que decir lo mismo
-- para Gabi que para Diana. Devuelve un número y ningún dato de nadie, y solo a
-- un miembro activo con segundo paso; a cualquier otro, nulo.
-- ===========================================================================

-- ── Cuántos hay anotados en una edición ─────────────────────────────────────
create or replace function public.inscriptos_de_edicion(edicion uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.soy_miembro_activo() and public.con_segundo_paso()
      then (select count(*)::int from public.inscripciones where edicion_id = edicion)
  end
$$;

-- ── Cursos: la lista, con sus ediciones y cuántos hay anotados ─────────────
-- Un solo `jsonb` y no dos consultas: la pantalla muestra cada curso con sus
-- ediciones debajo, y armarlo acá evita un viaje por curso. Los instantes van
-- como `timestamptz` (ISO con offset) y la zona IANA al lado: la hora de pared
-- «8:30 en Mérida» la arma `@codice/core` con las dos cosas (D15).
create or replace function public.panel_cursos()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id,
           'slug', c.slug,
           'titulo', c.titulo,
           'bajada', c.bajada,
           'descripcion', c.descripcion,
           'modalidad', c.modalidad,
           'estado', c.estado,
           'ediciones', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'id', e.id,
                      'inicio', e.inicio,
                      'fin', e.fin,
                      'zona', e.zona,
                      'sede', e.sede,
                      'ciudad', e.ciudad,
                      'pais', e.pais,
                      'cupo', e.cupo,
                      'precio_monto', e.precio_monto,
                      'precio_moneda', e.precio_moneda,
                      'inscripciones_hasta', e.inscripciones_hasta,
                      'estado', e.estado,
                      'inscriptos', public.inscriptos_de_edicion(e.id)
                    ) order by e.inicio)
               from public.ediciones e
              where e.curso_id = c.id
           ), '[]'::jsonb)
         ) order by c.orden, c.created_at), '[]'::jsonb)
    from public.cursos c
   where public.soy_miembro_activo()
$$;

-- ── Inscriptos de una edición ───────────────────────────────────────────────
-- Las filas que la RLS de `inscripciones` y `personas` le deja ver a quien
-- llama. El estado sale de `estado_inscripcion()` (003): se deriva del libro, no
-- se guarda.
create or replace function public.panel_inscriptos(edicion uuid)
returns table (
  inscripcion_id uuid,
  referencia     text,
  nombre         text,
  apellido       text,
  email          text,
  whatsapp       text,
  pais           text,
  inscripto_el   timestamptz,
  estado         text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id, i.referencia, p.nombre, p.apellido, p.email, p.whatsapp, p.pais,
         i.created_at, public.estado_inscripcion(i.id)
    from public.inscripciones i
    join public.personas p on p.id = i.persona_id
   where i.edicion_id = edicion
     and public.soy_miembro_activo()
   order by i.created_at, i.referencia
$$;

-- ── Clientes: todas las personas que quien llama puede ver ──────────────────
-- Con cuántos cursos tiene y el último. Las subconsultas sobre `inscripciones`
-- también pasan por la RLS, y dan lo mismo que si no pasaran: la inscripción de
-- una persona es del territorio de su país, igual que la persona.
--
-- `rol`, `territorio` y `activo` salen de `miembros`, que solo el dueño lee
-- entera (001): para el equipo vienen en nulo, y es lo que corresponde, porque
-- «Sumar al equipo» es solo del dueño.
create or replace function public.panel_clientes()
returns table (
  persona_id         uuid,
  nombre             text,
  apellido           text,
  email              text,
  whatsapp           text,
  pais               text,
  alta               timestamptz,
  cursos             integer,
  ultimo_curso       text,
  ultima_inscripcion timestamptz,
  rol                text,
  territorio         text,
  activo             boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, p.nombre, p.apellido, p.email, p.whatsapp, p.pais, p.created_at,
         (select count(*)::int from public.inscripciones i where i.persona_id = p.id),
         (select c.titulo
            from public.inscripciones i
            join public.ediciones e on e.id = i.edicion_id
            join public.cursos c on c.id = e.curso_id
           where i.persona_id = p.id
           order by i.created_at desc
           limit 1),
         (select max(i.created_at) from public.inscripciones i where i.persona_id = p.id),
         m.rol, m.territorio, m.activo
    from public.personas p
    left join public.miembros m on m.user_id = p.id
   where public.soy_miembro_activo()
   order by p.created_at desc, p.email
$$;

-- ── Permisos ────────────────────────────────────────────────────────────────
-- Postgres le da `execute` a `public` sobre toda función nueva. Se le quita, y
-- se le da a `authenticated` y a `service_role` y a nadie más: el panel no
-- existe sin sesión. `estado_inscripcion()` es de la 003 y la 007 no la
-- listaba, porque hasta hoy ninguna consulta con el token de una persona la
-- llamaba; `panel_inscriptos()` la llama como quien llama, así que la necesita.
revoke execute on function
  public.inscriptos_de_edicion(uuid), public.panel_cursos(),
  public.panel_inscriptos(uuid), public.panel_clientes()
from public, anon;

grant execute on function
  public.inscriptos_de_edicion(uuid), public.panel_cursos(),
  public.panel_inscriptos(uuid), public.panel_clientes(),
  public.estado_inscripcion(uuid)
to authenticated, service_role;
