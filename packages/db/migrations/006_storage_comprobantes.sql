-- ===========================================================================
-- 006 · el bucket de los comprobantes
--
-- QUÉ TRAE: el bucket privado `comprobantes` y las policies sobre
-- `storage.objects` que deciden quién sube y quién ve.
--
-- ORDEN QUE LA APROBÓ: Códice #13 (Mi espacio, PR 1), aprobada por dirección el
-- 29/9/2026.
--
-- APLICADA: 29/9/2026 02:34 (UY), en `armandoduarte-familia`, desde fd93eab.
--   Corrida por el CEO con autorización de Germán; verificada contra la base
--   (10 tablas con RLS, 39 policies en `public`, 3 en `storage`, bucket
--   `comprobantes` privado). Guardada en el editor SQL como `006_storage_comprobantes`.
--
-- ── LO QUE HAY QUE SABER ANTES DE CORRERLA ────────────────────────────────
-- `storage.objects` no es de `postgres`: es de `supabase_storage_admin`. En el
-- editor SQL del panel esto normalmente funciona porque Supabase le da a
-- `postgres` lo necesario para crear policies ahí. **Si esta migración es la única
-- que da un error de permisos, no se fuerza nada**: el bucket se crea desde
-- Storage → New bucket (privado, 5 MB, los tres tipos) y las policies desde
-- Storage → Policies, con estas mismas expresiones. Dicho acá para que no se
-- convierta en media hora de buscar.
--
-- ── LA RUTA ES LA AUTORIZACIÓN ────────────────────────────────────────────
-- La ruta es `inscripcion_id/<uuid>.<ext>`. La primera carpeta no es decorativa:
-- **es lo que decide de quién es el archivo.** Así el permiso se responde sin una
-- tabla de permisos de archivos, que sería una segunda verdad al lado de
-- `inscripciones`.
-- ===========================================================================

-- El bucket. Privado, 5 MB, tres tipos. El tope y los tipos van acá y no en el
-- formulario: un límite del formulario es un límite que no existe para quien no
-- usa el formulario.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprobantes',
  'comprobantes',
  false,
  5242880,                                    -- 5 MB exactos (5 × 1024 × 1024)
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- `inscripcion_de_ruta` — la primera carpeta de la ruta, si y solo si es un uuid.
--
-- El cast tiene que ir adentro de un `case` que primero comprueba la forma. Un
-- `((storage.foldername(name))[1])::uuid` a secas **revienta la consulta** cuando
-- la ruta no empieza con un uuid, y una policy que revienta no es una policy que
-- deniega: es un error 500 en vez de un «no». Con esto, una ruta inventada
-- devuelve `null`, y `null` no es la inscripción de nadie.
--
-- Probado en el banco con `'../etc/passwd'`: devuelve `null` y no levanta nada.
-- ---------------------------------------------------------------------------
create or replace function public.inscripcion_de_ruta(ruta text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when (storage.foldername(ruta))[1] ~
         '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    then ((storage.foldername(ruta))[1])::uuid
  end
$$;

-- ---------------------------------------------------------------------------
-- Las policies. Cada una empieza por `bucket_id = 'comprobantes'`: son policies
-- sobre `storage.objects`, que es una tabla sola para todos los buckets, y sin esa
-- cláusula una policy de acá alcanzaría a cualquier bucket que se cree después.
-- ---------------------------------------------------------------------------

create policy comprobantes_el_cliente_sube_al_suyo on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes'
    and public.inscripcion_es_mia(public.inscripcion_de_ruta(name))
  );

create policy comprobantes_el_cliente_lee_el_suyo on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprobantes'
    and public.inscripcion_es_mia(public.inscripcion_de_ruta(name))
  );

-- El equipo, por territorio y con segundo paso. Acá el `aal2` va **dentro** de la
-- policy permisiva y no como una restrictiva aparte, y el motivo es que
-- `storage.objects` es una tabla compartida: una policy restrictiva sobre ella
-- alcanzaría a todos los buckets futuros de la app, incluidos los que no tengan
-- nada que ver con datos de personas.
create policy comprobantes_el_equipo_lee_su_territorio on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprobantes'
    and public.con_segundo_paso()
    and public.veo_la_inscripcion(public.inscripcion_de_ruta(name))
  );

-- **Nadie actualiza ni borra.** No hay policy de update ni de delete, y la
-- ausencia es la decisión: un comprobante es la prueba de una transferencia. Si
-- una persona sube el archivo equivocado, sube otro y el libro anota cuál se miró.
