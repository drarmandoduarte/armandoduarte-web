/**
 * Ajustes, borrar la cuenta y la papelera, contra el esquema de verdad — orden
 * #37, PR 3 (migración 014).
 *
 * Los perfiles de siempre: **Armando** (dueño), **Gabi** (equipo, México),
 * **Diana** (equipo, internacional), **Laura** (clienta, México) y **Pilar**
 * (clienta, España). Lo que se afirma es lo que dice la orden:
 *   · Inicio se guarda en la ficha de cada quien, y nada más;
 *   · borrar la cuenta anonimiza la ficha y conserva inscripciones y libro, y un
 *     dueño no se borra si es el único;
 *   · a la papelera va lo archivado o cerrado SIN inscripciones, con quién y
 *     cuándo; se restaura, y a los 30 días se borra para siempre.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, reventar, sembrar, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

const ficha = async (persona: string) => (await banco.sql<Record<string, unknown>>(
  `select * from public.personas where id = $1`, [persona]))[0];

/** Un curso con una edición, como superusuario (sembrar no es lo que se prueba). */
async function cursoConEdicion(slug: string, estado = 'publicado'): Promise<{ curso: string; edicion: string }> {
  const [c] = await banco.sql<{ id: string }>(
    `insert into public.cursos (slug, titulo, modalidad, estado) values ($1, $2, 'presencial', $3) returning id`,
    [slug, `Taller ${slug}`, estado]);
  const [e] = await banco.sql<{ id: string }>(
    `insert into public.ediciones (curso_id, inicio, fin, zona, pais, inscripciones_hasta, estado)
     values ($1, now() + interval '20 days', now() + interval '20 days 3 hours', 'America/Merida', 'MX',
             now() + interval '10 days', 'abierta') returning id`, [c.id]);
  return { curso: c.id, edicion: e.id };
}

const papelera = (quien: string, aal: 'aal1' | 'aal2' = 'aal2') => banco.como(quien, aal, () =>
  banco.sql<{ tipo: string; id: string; nombre: string; borrado_el: string; persona: string }>(
    `select * from public.en_la_papelera()`));

describe('el piso', () => {
  it('EL PISO, PRIMERO: la 014 corrió — las dos columnas y las funciones (y el tema no: es del aparato)', async () => {
    const columnas = await banco.sql<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = 'personas'
          and column_name in ('tema', 'tamano_texto', 'inicio', 'borrada_el') order by column_name`);
    expect(columnas.map((c) => c.column_name)).toEqual(['borrada_el', 'inicio']);
    const funciones = await banco.sql<{ proname: string }>(
      `select proname from pg_proc where pronamespace = 'public'::regnamespace
          and proname in ('borrar_mi_cuenta', 'en_la_papelera', 'restaurar_de_la_papelera', 'vaciar_la_papelera')
        order by proname`);
    expect(funciones.map((f) => f.proname)).toEqual(['borrar_mi_cuenta', 'en_la_papelera', 'restaurar_de_la_papelera', 'vaciar_la_papelera']);
  });

  it('nacen con Inicio sin tocar y sin borrar', async () => {
    const f = await ficha(s.pilar);
    expect([f.inicio, f.borrada_el]).toEqual([null, null]);
  });
});

describe('Inicio: cada quien guarda lo suyo', () => {
  it('EL CASO: Laura guarda cómo acomodó su Inicio', async () => {
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `update public.personas set inicio = $2 where id = $1 returning id`,
      [s.laura, JSON.stringify({ orden: ['proximo', 'ayuda'] })]));
    expect((await ficha(s.laura)).inicio).toEqual({ orden: ['proximo', 'ayuda'] });
  });

  it('nadie guarda lo de otra persona: Laura no toca a Pilar, ni el dueño a Laura', async () => {
    const otro = JSON.stringify({ orden: ['ayuda'] });
    const r1 = await banco.como(s.laura, 'aal1', () => banco.sql(
      `update public.personas set inicio = $2 where id = $1 returning id`, [s.pilar, otro]));
    const r2 = await banco.como(s.armando, 'aal2', () => banco.sql(
      `update public.personas set inicio = $2 where id = $1 returning id`, [s.laura, otro]));
    expect([r1.length, r2.length]).toEqual([0, 0]);
  });

  it('LA MUTACIÓN: un Inicio que no es un objeto, o de más de 4 KB, no entra', async () => {
    const intentar = (valor: unknown) => reventar(() => banco.como(s.pilar, 'aal1', () => banco.sql(
      `update public.personas set inicio = $2 where id = $1`, [s.pilar, valor])));
    expect(await intentar(JSON.stringify(['proximo']))).toMatch(/check/i);
    expect(await intentar(JSON.stringify('proximo'))).toMatch(/check/i);
    expect(await intentar(JSON.stringify({ orden: ['x'.repeat(5000)] }))).toMatch(/check/i);
  });

  it('nadie se marca como borrada ni se cambia el correo por su cuenta', async () => {
    expect(await reventar(() => banco.como(s.pilar, 'aal1', () => banco.sql(
      `update public.personas set borrada_el = now() where id = $1`, [s.pilar])))).toMatch(/borrar_mi_cuenta/);
    expect(await reventar(() => banco.como(s.pilar, 'aal1', () => banco.sql(
      `update public.personas set email = $2 where id = $1`, [s.pilar, `borrado+${s.pilar}@cuenta-borrada.invalid`])))).toMatch(/no se cambia/);
  });
});

describe('borrar mi cuenta', () => {
  it('EL CASO: Laura borra la suya — se anonimiza la ficha y la inscripción queda', async () => {
    const [ins] = await banco.sql<{ id: string }>(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`, [s.edicionAbierta, s.laura]);
    await banco.sql(`update public.personas set apellido = 'Pérez', whatsapp = '+529991112233', ciudad = 'Mérida',
                     anio_nacimiento = 1985, nivel_educativo = 'licenciatura' where id = $1`, [s.laura]);

    await banco.como(s.laura, 'aal1', () => banco.sql(`select public.borrar_mi_cuenta()`));

    const f = await ficha(s.laura);
    expect([f.nombre, f.apellido, f.whatsapp, f.ciudad, f.anio_nacimiento, f.nivel_educativo, f.inicio]).toEqual([null, null, null, null, null, null, null]);
    expect(f.email).toBe(`borrado+${s.laura}@cuenta-borrada.invalid`);
    expect(f.avisos_por_correo).toBe(false);
    expect(f.borrada_el).not.toBeNull();
    // El país queda: decide el territorio de lo que se conserva.
    expect(f.pais).toBe('MX');
    const [sigue] = await banco.sql(`select id from public.inscripciones where id = $1`, [ins.id]);
    expect(sigue, 'la inscripción es un registro contable').toBeTruthy();
    const [a] = await banco.sql<{ accion: string; quien: string }>(
      `select accion, quien from public.auditoria where tabla = 'personas' and fila = $1 order by id desc limit 1`, [s.laura]);
    expect(a).toEqual({ accion: 'borrar_cuenta', quien: s.laura });
  });

  it('dos veces es una: borrar una cuenta ya borrada no cambia nada', async () => {
    const antes = await ficha(s.laura);
    await banco.como(s.laura, 'aal1', () => banco.sql(`select public.borrar_mi_cuenta()`));
    expect((await ficha(s.laura)).borrada_el).toEqual(antes.borrada_el);
  });

  it('un rescate abierto se cancela', async () => {
    await banco.comoServicio(() => banco.sql(
      `insert into public.rescates (user_id, pedido_el, vence_el, token_hash)
         values ($1, now(), now() + interval '48 hours', $2)`, [s.pilar, 'c'.repeat(64)]));
    await banco.como(s.pilar, 'aal1', () => banco.sql(`select public.borrar_mi_cuenta()`));
    const [r] = await banco.sql<{ cancelado_el: unknown }>(`select cancelado_el from public.rescates where user_id = $1`, [s.pilar]);
    expect(r.cancelado_el).not.toBeNull();
  });

  it('Diana (equipo) borra la suya y deja de ser del equipo; la fila de miembros queda', async () => {
    await banco.como(s.diana, 'aal2', () => banco.sql(`select public.borrar_mi_cuenta()`));
    const [m] = await banco.sql<{ activo: boolean }>(`select activo from public.miembros where user_id = $1`, [s.diana]);
    expect(m.activo).toBe(false);
  });

  it('EL CASO DEL DUEÑO: Armando no se borra mientras sea el único dueño activo', async () => {
    expect(await reventar(() => banco.como(s.armando, 'aal2', () => banco.sql(`select public.borrar_mi_cuenta()`)))).toMatch(/UNICO_DUENO/);
    expect((await ficha(s.armando)).borrada_el).toBeNull();
  });

  it('con un segundo dueño activo, sí', async () => {
    await banco.sql(`update public.miembros set rol = 'dueno' where user_id = $1`, [s.gabi]);
    await banco.como(s.armando, 'aal2', () => banco.sql(`select public.borrar_mi_cuenta()`));
    expect((await ficha(s.armando)).borrada_el).not.toBeNull();
    // Y ahora Gabi es la única: tampoco se puede borrar.
    expect(await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(`select public.borrar_mi_cuenta()`)))).toMatch(/UNICO_DUENO/);
  });

  it('sin sesión no se puede llamar', async () => {
    expect(await reventar(() => banco.comoAnonimo(() => banco.sql(`select public.borrar_mi_cuenta()`)))).toMatch(/permission denied/);
  });
});

describe('la papelera', () => {
  /* Gabi quedó como única dueña en el bloque anterior; para la papelera
     alcanza con que sea miembro activo con segundo paso. */
  it('EL CASO: Gabi archiva un curso sin inscripciones — entra, con ella y la fecha', async () => {
    const { curso } = await cursoConEdicion('para-la-papelera');
    await banco.como(s.gabi, 'aal2', () => banco.sql(`update public.cursos set estado = 'archivado' where id = $1`, [curso]));
    const item = (await papelera(s.gabi)).find((x) => x.id === curso);
    expect(item).toMatchObject({ tipo: 'curso', nombre: 'Taller para-la-papelera', persona: 'Gabi' });
    expect(Date.now() - new Date(item!.borrado_el).getTime()).toBeLessThan(60_000);
  });

  it('LA REGLA DE LA 002: un curso archivado CON inscripciones no entra (no se borra nunca)', async () => {
    const { curso, edicion } = await cursoConEdicion('con-gente');
    await banco.sql(`insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`, [edicion, s.laura]);
    await banco.como(s.gabi, 'aal2', () => banco.sql(`update public.cursos set estado = 'archivado' where id = $1`, [curso]));
    expect((await papelera(s.gabi)).some((x) => x.id === curso)).toBe(false);
  });

  it('una edición cerrada sin inscripciones entra; con inscripciones, no', async () => {
    const vacia = await cursoConEdicion('edicion-vacia');
    const llena = await cursoConEdicion('edicion-llena');
    await banco.sql(`insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`, [llena.edicion, s.laura]);
    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `update public.ediciones set estado = 'cerrada' where id = any($1::uuid[])`, [[vacia.edicion, llena.edicion]]));
    const ids = (await papelera(s.gabi)).map((x) => x.id);
    expect(ids).toContain(vacia.edicion);
    expect(ids).not.toContain(llena.edicion);
  });

  it('la ve solo el equipo con segundo paso: ni una clienta ni Gabi con aal1', async () => {
    expect(await papelera(s.laura, 'aal1')).toEqual([]);
    expect(await papelera(s.gabi, 'aal1')).toEqual([]);
    expect((await papelera(s.gabi)).length).toBeGreaterThan(0);
  });

  it('restaurar devuelve el estado de antes (publicado) y lo saca de la papelera', async () => {
    const { curso } = await cursoConEdicion('ida-y-vuelta');
    await banco.como(s.gabi, 'aal2', () => banco.sql(`update public.cursos set estado = 'archivado' where id = $1`, [curso]));
    await banco.como(s.gabi, 'aal2', () => banco.sql(`select public.restaurar_de_la_papelera('curso', $1)`, [curso]));
    const [c] = await banco.sql<{ estado: string }>(`select estado from public.cursos where id = $1`, [curso]);
    expect(c.estado).toBe('publicado');
    expect((await papelera(s.gabi)).some((x) => x.id === curso)).toBe(false);
  });

  it('restaurar algo que no está en la papelera no hace nada (NO_ESTA), y una clienta no restaura', async () => {
    expect(await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `select public.restaurar_de_la_papelera('curso', $1)`, [s.cursoPublicado])))).toMatch(/NO_ESTA/);
    const { curso } = await cursoConEdicion('no-para-laura');
    await banco.como(s.gabi, 'aal2', () => banco.sql(`update public.cursos set estado = 'archivado' where id = $1`, [curso]));
    expect(await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `select public.restaurar_de_la_papelera('curso', $1)`, [curso])))).toMatch(/NO_ESTA/);
  });

  it('EL CASO DE LOS 30 DÍAS: lo que pasó los 30 días se borra para siempre y queda anotado', async () => {
    const viejo = await cursoConEdicion('viejo');
    const nuevo = await cursoConEdicion('nuevo');
    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `update public.cursos set estado = 'archivado' where id = any($1::uuid[])`, [[viejo.curso, nuevo.curso]]));
    // Hace 31 días: un renglón de auditoría (solo se agrega) más nuevo que el real, con la fecha de entonces.
    await banco.sql(
      `insert into public.auditoria (quien, accion, tabla, fila, detalle, created_at)
       values ($1, 'update', 'cursos', $2, '{"estado":"archivado"}', now() - interval '31 days')`, [s.gabi, viejo.curso]);

    const [{ vaciar_la_papelera: n }] = await banco.como(s.gabi, 'aal2', () =>
      banco.sql<{ vaciar_la_papelera: number }>(`select public.vaciar_la_papelera()`));
    expect(n).toBe(1);
    expect(await banco.sql(`select id from public.cursos where id = $1`, [viejo.curso])).toEqual([]);
    expect(await banco.sql(`select id from public.ediciones where id = $1`, [viejo.edicion])).toEqual([]);
    expect((await banco.sql(`select id from public.cursos where id = $1`, [nuevo.curso])).length).toBe(1);
    const [a] = await banco.sql<{ accion: string; detalle: { nombre: string } }>(
      `select accion, detalle from public.auditoria where fila = $1 order by id desc limit 1`, [viejo.curso]);
    expect(a).toEqual({ accion: 'borrado_definitivo', detalle: { nombre: 'Taller viejo' } });
  });

  it('LA MUTACIÓN: lo que tiene inscripciones no se borra aunque pasen los 30 días, y una clienta no vacía nada', async () => {
    const { curso, edicion } = await cursoConEdicion('viejo-con-gente');
    await banco.sql(`insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`, [edicion, s.laura]);
    await banco.como(s.gabi, 'aal2', () => banco.sql(`update public.cursos set estado = 'archivado' where id = $1`, [curso]));
    await banco.sql(
      `insert into public.auditoria (quien, accion, tabla, fila, detalle, created_at)
       values ($1, 'update', 'cursos', $2, '{"estado":"archivado"}', now() - interval '90 days')`, [s.gabi, curso]);
    await banco.como(s.gabi, 'aal2', () => banco.sql(`select public.vaciar_la_papelera()`));
    expect((await banco.sql(`select id from public.cursos where id = $1`, [curso])).length).toBe(1);
    const [{ vaciar_la_papelera: n }] = await banco.como(s.laura, 'aal1', () =>
      banco.sql<{ vaciar_la_papelera: number }>(`select public.vaciar_la_papelera()`));
    expect(n).toBe(0);
  });

  it('nadie borra un curso por fuera de la papelera: authenticated sigue sin delete', async () => {
    expect(await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `delete from public.cursos where id = $1`, [s.cursoBorrador])))).toMatch(/permission denied/);
  });
});
