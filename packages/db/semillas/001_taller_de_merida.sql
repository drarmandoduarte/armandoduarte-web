-- ===========================================================================
-- Semilla 001 · el taller de Mérida, en borrador
--
-- QUÉ TRAE: el primer curso del panel, para que no nazca vacío: «El arte de amar
-- a tu adolescente» y su edición del jueves 5 de noviembre de 2026, de 8:30 a
-- 13:00 en Mérida, en el Fiesta Inn, a $1,170 MXN. **En `borrador`**: lo publica
-- Armando desde el panel cuando lo mire. Mientras sea borrador no se ve fuera
-- del equipo (002) y nadie se puede inscribir (003, `edicion_abierta()`).
--
-- ORDEN QUE LA APROBÓ: Códice #24, PR A, punto 1.
--
-- APLICADA: 30/9/2026 21:58 (UY), en `armandoduarte-familia`, desde db747a1,
--   después de la 008 y en la misma sesión. Corrida por el CEO con autorización
--   de Germán. Verificado contra la base: el curso en **borrador**, **una**
--   edición (no duplicó), 5/11/2026 8:30 hora de Mérida, `America/Merida`,
--   Fiesta Inn Mérida, 1170.00 MXN, edición abierta. Guardada en el editor SQL
--   como `semilla_02_taller_de_merida` (el nombre del editor no es el del
--   archivo: la `semilla_01` del editor es el alta de Armando como dueño).
--   Fuente: `03 Producto/mi-espacio/infraestructura-2026-09-29.md`, «30/9 21:55».
--
-- ── Una semilla no es una migración ─────────────────────────────────────────
-- No cambia el esquema: carga una fila de datos. Por eso vive en `semillas/` y
-- no en `migrations/`, y el banco no la corre sola (la corre su test). Se corre
-- en Supabase **después** de la 008, con la misma regla del README: se mira la
-- barra del proyecto antes de ejecutar.
--
-- ── Se puede correr dos veces ───────────────────────────────────────────────
-- El curso se encuentra por su `slug` y la edición por curso + inicio. Correrla
-- otra vez no duplica nada ni pisa lo que Armando haya cambiado desde el panel.
--
-- ── Lo que la orden no dice, y cómo se cargó (se completa desde el panel) ──
--   · `cupo`: nulo (sin tope). La web dice «cupo limitado» sin número.
--   · `inscripciones_hasta`: el inicio del taller. Con nulo, `edicion_abierta()`
--     no deja inscribir a nadie, y eso sería una decisión escondida en un dato.
--   · `pais`: MX. `ciudad`: Mérida. `zona`: `America/Merida`, nunca un offset
--     (D15): las horas se escriben como hora de pared **en esa zona**.
-- ===========================================================================

insert into public.cursos (slug, titulo, bajada, modalidad, estado)
values (
  'el-arte-de-amar-a-tu-adolescente',
  'El arte de amar a tu adolescente',
  'Taller presencial en Mérida',
  'presencial',
  'borrador'
)
on conflict (slug) do nothing;

insert into public.ediciones
  (curso_id, inicio, fin, zona, sede, ciudad, pais, cupo,
   precio_monto, precio_moneda, inscripciones_hasta, estado)
select c.id,
       timestamp '2026-11-05 08:30' at time zone 'America/Merida',
       timestamp '2026-11-05 13:00' at time zone 'America/Merida',
       'America/Merida', 'Fiesta Inn Mérida', 'Mérida', 'MX', null,
       1170.00, 'MXN',
       timestamp '2026-11-05 08:30' at time zone 'America/Merida',
       'abierta'
  from public.cursos c
 where c.slug = 'el-arte-de-amar-a-tu-adolescente'
   and not exists (
     select 1 from public.ediciones e
      where e.curso_id = c.id
        and e.inicio = timestamp '2026-11-05 08:30' at time zone 'America/Merida'
   );
