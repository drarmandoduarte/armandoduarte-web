-- ===========================================================================
-- 010 · el libro en el panel
--
-- QUÉ TRAE: lo que Inscriptos necesita para que el equipo revise un pago y
-- `panel_inscriptos()` (008) no trae: **el último renglón del libro** de cada
-- inscripción (qué, cuándo, quién y la nota), **lo declarado** (monto, fecha,
-- banco, folio y el path del comprobante) y **lo confirmado**. Dos funciones,
-- `libro_de_edicion(uuid)` y `firma_del_libro(uuid)`. **Ninguna tabla, ninguna
-- columna y ninguna policy nueva**: el libro sigue siendo el de la 003 y el
-- bucket el de la 006.
--
-- ORDEN QUE LA APROBÓ: Códice #27, PR C (`mi-espacio/08-el-comprobante`),
-- aprobada por dirección el 1/10/2026. La orden la prevé: «si la 008 no trae
-- lo necesario (último renglón del libro, path del comprobante), migración 010
-- con `panel_inscriptos_v2` o una función `libro_de_inscripcion(uuid)`
-- (`security invoker`, RLS manda) … Se declara cuál».
--
-- APLICADA: —
--
-- ── Cuál se eligió, y por qué ──────────────────────────────────────────────
-- Ni `panel_inscriptos_v2` ni `libro_de_inscripcion(uuid)`:
--   · `_v2` no, por la regla de nombres de la casa (CLAUDE.md: «sin `_v2`»), y
--     porque cambiar las columnas de `panel_inscriptos()` obliga a un
--     `drop function` sobre una función aplicada que la API de `main` usa.
--   · Una por inscripción no, porque la tabla de Inscriptos muestra todas las
--     de una edición: serían N viajes a la base por pantalla.
-- Así que es **`libro_de_edicion(edicion)`**: una fila por inscripción de esa
-- edición, con la misma llave (`inscripcion_id`) que `panel_inscriptos()`. La
-- API llama a las dos y las junta por esa llave.
--
-- ── `libro_de_edicion` es `security invoker`, y eso la hace segura ────────
-- Corre con la RLS de quien llama: el territorio (D11) y el segundo paso los
-- deciden las policies de `inscripciones` y `pagos_libro` (003), no un `where`
-- de acá. Gabi recibe los renglones de México porque la base no le deja ver
-- otros. Y como las del panel de la 008, a quien no es miembro activo le
-- devuelve vacío: un cliente no recibe su propio libro con forma de panel (su
-- libro lo lee por `libro_el_cliente_lee_el_suyo`, como siempre).
--
-- ── `firma_del_libro` es `security definer`, a propósito y con su freno ───
-- «Rechazado el 3/11 **por Diana**»: el renglón lo firma `hecho_por`, que es
-- una persona. Si Diana tiene su ficha con un país que no es de México, Gabi no
-- puede leerla (`personas_equipo_lee_su_territorio`) y la firma saldría vacía.
-- Esta función devuelve **solo el nombre de pila de un miembro del equipo** —
-- nunca de un cliente, nunca el correo ni nada más— y solo a un miembro activo
-- con segundo paso. A cualquier otro, nulo. La firma de un renglón `declarado`
-- (la escribe el cliente) sale de su propia ficha, que el equipo ya ve por
-- territorio, con la RLS de siempre.
-- ===========================================================================

-- ── El nombre de quien firmó un renglón, si es del equipo ──────────────────
create or replace function public.firma_del_libro(persona uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.soy_miembro_activo() and public.con_segundo_paso()
      then (select p.nombre
              from public.personas p
              join public.miembros m on m.user_id = p.id
             where p.id = persona)
  end
$$;

-- ── El libro de cada inscripción de una edición ────────────────────────────
-- Tres renglones por inscripción, cada uno el último de su clase (`orden desc`,
-- la columna monótona de la 003): el último de todos —que es el que decide el
-- estado—, el último `declarado` —el comprobante que se revisa— y el último
-- `confirmado` —lo que el equipo dio por recibido—. Una inscripción sin libro
-- viene con todo en nulo: está pendiente de pago y no hay nada que revisar.
create or replace function public.libro_de_edicion(edicion uuid)
returns table (
  inscripcion_id      uuid,
  ultimo_tipo         text,
  ultimo_el           timestamptz,
  ultimo_por          text,
  ultima_nota         text,
  monto_declarado     numeric,
  moneda_declarada    text,
  fecha_transferencia date,
  banco               text,
  ultimos4_o_folio    text,
  comprobante_path    text,
  monto_confirmado    numeric,
  moneda_confirmada   text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id,
         u.tipo,
         u.created_at,
         coalesce(public.firma_del_libro(u.hecho_por),
                  (select x.nombre from public.personas x where x.id = u.hecho_por)),
         u.nota,
         d.monto, d.moneda::text, d.fecha_transferencia, d.banco, d.ultimos4_o_folio, d.comprobante_path,
         c.monto, c.moneda::text
    from public.inscripciones i
    left join lateral (
      select p.tipo, p.created_at, p.hecho_por, p.nota
        from public.pagos_libro p
       where p.inscripcion_id = i.id
       order by p.orden desc
       limit 1
    ) u on true
    left join lateral (
      select p.monto, p.moneda, p.fecha_transferencia, p.banco, p.ultimos4_o_folio, p.comprobante_path
        from public.pagos_libro p
       where p.inscripcion_id = i.id and p.tipo = 'declarado'
       order by p.orden desc
       limit 1
    ) d on true
    left join lateral (
      select p.monto, p.moneda
        from public.pagos_libro p
       where p.inscripcion_id = i.id and p.tipo = 'confirmado'
       order by p.orden desc
       limit 1
    ) c on true
   where i.edicion_id = edicion
     and public.soy_miembro_activo()
   order by i.created_at, i.referencia
$$;

-- ── Permisos ────────────────────────────────────────────────────────────────
-- El criterio de la 008 y la 009: `public` y `anon` afuera; `authenticated` y
-- `service_role` adentro. `firma_del_libro()` necesita `execute` para quien
-- llama porque la invoca `libro_de_edicion()`, que corre como quien llama.
revoke execute on function
  public.firma_del_libro(uuid), public.libro_de_edicion(uuid)
from public, anon;

grant execute on function
  public.firma_del_libro(uuid), public.libro_de_edicion(uuid)
to authenticated, service_role;
