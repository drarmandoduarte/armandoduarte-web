-- ===========================================================================
-- 003 · inscripciones y el libro de la plata
--
-- QUÉ TRAE: quién se inscribió a qué, y el libro donde se anota lo que pasó con
-- cada pago. Más `estado_inscripcion()`, que **deduce** el estado en vez de
-- leerlo de una columna.
--
-- ORDEN QUE LA APROBÓ: Códice #13 (Mi espacio, PR 1), aprobada por dirección el
-- 29/9/2026. Especificación: `03 Producto/mi-espacio/especificacion-v1.md` §3.
--
-- APLICADA: —
--
-- ── LA REGLA DE LA CASA · Omnia #74: el libro anota, no opina ──────────────
-- `inscripciones` **no tiene columna estado**, y eso no es una omisión: es lo que
-- hace que el estado no pueda mentir. Una columna `estado` es un resumen, y un
-- resumen se desincroniza del detalle en el primer camino que nadie previó —una
-- confirmación que se revierte, dos pestañas abiertas, un `update` a mano para
-- «arreglar» algo—. Y cuando se desincroniza, gana el resumen, porque es lo que
-- la pantalla lee. Entonces alguien queda confirmado sin haber pagado, o pagando
-- sin quedar confirmado, y el libro dice lo contrario sin que nadie lo mire.
--
-- Acá el libro es lo único que existe. `pagos_libro` es **insert-only con
-- trigger**, y el estado se calcula del último renglón. La única forma de
-- corregir un renglón es escribir otro, así que la corrección también queda
-- anotada, con fecha y con autor.
-- ===========================================================================

-- ── inscripciones ───────────────────────────────────────────────────────────
-- `referencia` es el número que la persona escribe en el concepto de la
-- transferencia y el que dice por WhatsApp. Sale de una secuencia y la escribe un
-- trigger: generarla en la app la haría depender de una consulta previa y de que
-- dos personas no se inscriban en el mismo segundo.
create sequence public.inscripciones_referencia_seq;

create table public.inscripciones (
  id          uuid primary key default gen_random_uuid(),
  edicion_id  uuid not null references public.ediciones(id) on delete restrict,
  persona_id  uuid not null references public.personas(id) on delete restrict,
  referencia  text not null unique,
  created_at  timestamptz not null default now(),
  -- Una persona, una inscripción por edición. Sin esto, un doble clic en
  -- «Inscribirme» son dos referencias y dos transferencias esperadas.
  unique (edicion_id, persona_id)
);

create index inscripciones_por_edicion_idx on public.inscripciones (edicion_id);
create index inscripciones_por_persona_idx on public.inscripciones (persona_id);

create or replace function public.inscripcion_referencia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Se sobreescribe lo que venga: la referencia no es un dato que el cliente
  -- proponga. `AD-0001`, `AD-0002`… con cuatro dígitos como piso, y más cuando
  -- haga falta —`lpad` no recorta, así que la número 10.000 sale `AD-10000` y no
  -- un duplicado.
  new.referencia := 'AD-' || lpad(nextval('public.inscripciones_referencia_seq')::text, 4, '0');
  return new;
end;
$$;

create trigger inscripciones_referencia_la_pone_la_base
  before insert on public.inscripciones
  for each row execute function public.inscripcion_referencia();

-- ── pagos_libro ─────────────────────────────────────────────────────────────
create table public.pagos_libro (
  id                uuid primary key default gen_random_uuid(),
  -- ---------------------------------------------------------------------
  -- `orden` · LA COLUMNA QUE NO ESTABA EN LA ORDEN, Y POR QUÉ ESTÁ
  --
  -- `estado_inscripcion()` es «el último renglón». Sin una columna monótona, «el
  -- último» no está definido: `now()` es la hora de **inicio de la transacción**,
  -- así que dos renglones escritos en la misma transacción —confirmar y anotar la
  -- corrección, por ejemplo— comparten `created_at` al microsegundo. Ordenar por
  -- `created_at` y desempatar por `id` desempataría por un uuid aleatorio: el
  -- estado saldría distinto en cada consulta.
  --
  -- Se probó `clock_timestamp()` en el banco y **tampoco alcanza**: dos inserts
  -- seguidos dieron el mismo valor (el reloj de PGlite no tiene la resolución).
  -- Una secuencia sí es monótona por construcción. Queda declarado acá y en el
  -- informe de la orden.
  -- ---------------------------------------------------------------------
  orden             bigserial not null unique,
  inscripcion_id    uuid not null references public.inscripciones(id) on delete restrict,
  tipo              text not null
                    check (tipo in ('declarado', 'confirmado', 'rechazado', 'anulado')),
  monto             numeric(10,2) check (monto >= 0),
  moneda            char(3) check (moneda ~ '^[A-Z]{3}$'),
  -- `date` y no `timestamptz`: es la fecha que dice el comprobante del banco, que
  -- no tiene hora útil. D15 habla de fechas CON hora; ésta no la tiene, y
  -- fabricarle una la haría depender de una zona que nadie eligió.
  fecha_transferencia date,
  banco             text,
  ultimos4_o_folio  text,
  comprobante_path  text,
  nota              text,
  -- Quién escribió el renglón. `default auth.uid()` para que la app no tenga que
  -- acordarse, y `not null` para que no se pueda anotar sin firma. La policy le
  -- agrega lo que un default no puede: que no se pueda firmar por otro.
  hecho_por         uuid not null default auth.uid() references public.personas(id),
  created_at        timestamptz not null default now()
);

create index pagos_libro_por_inscripcion_idx on public.pagos_libro (inscripcion_id, orden desc);

-- ---------------------------------------------------------------------------
-- El trigger que hace que el libro sea un libro.
--
-- `before update or delete` **y** `before truncate`: el primero es de fila y el
-- segundo de sentencia, y hacen falta los dos porque `truncate` no dispara
-- triggers de fila —vaciaría el libro entero sin que nada se queje—.
--
-- Dispara para TODOS, incluido el dueño de la base y la `service_role`: los
-- triggers no se saltean por ser dueño (lo que se saltea por ser dueño es la
-- RLS). Hay un test que lo afirma corriendo como superusuario, porque es la
-- diferencia entre «la app no puede» y «no se puede».
-- ---------------------------------------------------------------------------
create or replace function public.solo_se_agrega()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception
    '%: solo se agrega. Un renglon no se corrige: se escribe otro. (intento de % )',
    tg_table_name, tg_op;
end;
$$;

create trigger pagos_libro_solo_se_agrega
  before update or delete on public.pagos_libro
  for each row execute function public.solo_se_agrega();

create trigger pagos_libro_ni_truncate
  before truncate on public.pagos_libro
  for each statement execute function public.solo_se_agrega();

-- ---------------------------------------------------------------------------
-- `estado_inscripcion` — el estado, deducido.
--
-- Cinco valores y cuatro caminos de entrada. `rechazado` vuelve a
-- `pendiente_de_pago` porque eso es lo que la persona tiene que hacer: volver a
-- declarar. El motivo del rechazo está en la `nota` del renglón, que sigue ahí.
-- ---------------------------------------------------------------------------
create or replace function public.estado_inscripcion(inscripcion uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select case p.tipo
              when 'declarado'  then 'en_revision'
              when 'confirmado' then 'confirmada'
              when 'rechazado'  then 'pendiente_de_pago'
              when 'anulado'    then 'anulada'
            end
       from public.pagos_libro p
      where p.inscripcion_id = inscripcion
      order by p.orden desc
      limit 1),
    'pendiente_de_pago')
$$;

-- ---------------------------------------------------------------------------
-- Tres funciones más para las policies. Las tres `security definer` por el mismo
-- motivo de siempre: preguntan por un dato de otra tabla que tiene su propia RLS,
-- y una policy que dependa de otra policy es una policy que cambia cuando alguien
-- toca algo que parecía no tener nada que ver.
-- ---------------------------------------------------------------------------

-- Si una edición admite una inscripción nueva. Las tres condiciones de la orden
-- #13 §B.3, juntas y en un solo lugar.
--
-- `inscripciones_hasta` en nulo **no se inscribe**: `now() < null` es nulo y
-- `coalesce` lo baja a falso, explícito para que se lea. Es lo literal de la
-- orden, y es el modo de falla que se prefiere — una edición sin fecha de cierre
-- se nota el primer día (nadie puede anotarse) en vez de quedar abierta para
-- siempre sin que nadie se entere.
create or replace function public.edicion_abierta(edicion uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.ediciones e
      join public.cursos c on c.id = e.curso_id
     where e.id = edicion
       and e.estado = 'abierta'
       and c.estado = 'publicado'
       and coalesce(now() < e.inscripciones_hasta, false)
  )
$$;

create or replace function public.inscripcion_es_mia(inscripcion uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.inscripciones
     where id = inscripcion and persona_id = auth.uid()
  )
$$;

-- El territorio de una inscripción es el de la persona inscrita. Una sola línea,
-- y por eso `veo_pais()` sigue siendo el único lugar donde vive D11.
create or replace function public.veo_la_inscripcion(inscripcion uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.veo_pais((
    select p.pais
      from public.inscripciones i
      join public.personas p on p.id = i.persona_id
     where i.id = inscripcion
  ))
$$;

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.inscripciones enable row level security;
alter table public.pagos_libro enable row level security;

-- ── inscripciones ───────────────────────────────────────────────────────────
-- El cliente se inscribe a sí mismo, y las tres condiciones de la edición van en
-- el `with check` y no en la app: una condición en la app es una condición que se
-- saltea con una petición hecha a mano.
create policy inscripciones_me_inscribo on public.inscripciones
  for insert to authenticated
  with check (
    persona_id = auth.uid()
    and public.edicion_abierta(edicion_id)
  );

create policy inscripciones_leo_las_mias on public.inscripciones
  for select to authenticated
  using (persona_id = auth.uid());

create policy inscripciones_equipo_su_territorio on public.inscripciones
  for select to authenticated
  using (public.veo_la_inscripcion(id));

-- Sin update ni delete para nadie: una inscripción no se edita. Lo que cambia es
-- el libro, y el estado sale de ahí. **El equipo no inscribe por otros en v1** —
-- no hay policy que se lo permita, y esa ausencia es la decisión.

create policy inscripciones_segundo_paso on public.inscripciones
  as restrictive for all to authenticated
  using (persona_id = auth.uid() or public.con_segundo_paso())
  with check (persona_id = auth.uid() or public.con_segundo_paso());

-- ── pagos_libro ─────────────────────────────────────────────────────────────
-- El cliente declara, y solo puede declarar: `tipo = 'declarado'` está en el
-- `with check`, así que «ya transferí» no puede convertirse en «confirmado» por
-- más que alguien arme la petición a mano.
create policy libro_el_cliente_declara on public.pagos_libro
  for insert to authenticated
  with check (
    tipo = 'declarado'
    and hecho_por = auth.uid()
    and public.inscripcion_es_mia(inscripcion_id)
  );

-- El equipo resuelve, sobre las inscripciones de su territorio. `hecho_por =
-- auth.uid()` en las dos policies y no solo en una: es lo que hace que la firma
-- del libro sea una firma. Un default se cambia mandando la columna.
create policy libro_el_equipo_resuelve on public.pagos_libro
  for insert to authenticated
  with check (
    tipo in ('confirmado', 'rechazado', 'anulado')
    and hecho_por = auth.uid()
    and public.veo_la_inscripcion(inscripcion_id)
  );

create policy libro_el_cliente_lee_el_suyo on public.pagos_libro
  for select to authenticated
  using (public.inscripcion_es_mia(inscripcion_id));

create policy libro_el_equipo_lee_su_territorio on public.pagos_libro
  for select to authenticated
  using (public.veo_la_inscripcion(inscripcion_id));

-- Sin update ni delete, y además el trigger. Dos frenos y no uno: la policy dice
-- que la app no puede, el trigger dice que nadie puede.

create policy libro_segundo_paso on public.pagos_libro
  as restrictive for all to authenticated
  using (public.inscripcion_es_mia(inscripcion_id) or public.con_segundo_paso())
  with check (public.inscripcion_es_mia(inscripcion_id) or public.con_segundo_paso());
