/**
 * Los datos de cobro —que la #12 H prometió que no están en la web— y la
 * auditoría, que es lo que D11 exige como contrapartida de que Gabi y Diana vean
 * todo dentro de su territorio.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, num, reventar, sembrar, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;
let cuenta: string;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
  const [f] = await banco.sql<{ id: string }>(
    `insert into public.datos_de_cobro (banco, titular, clabe, concepto_sugerido)
     values ('BBVA', 'Armando Duarte', '012914002109876543', 'Tu referencia AD-XXXX')
     returning id`);
  cuenta = f.id;
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

describe('(10) datos de cobro', () => {
  it('Laura, con sesión y aal1, lee la vigente', async () => {
    await banco.como(s.laura, 'aal1', async () => {
      const filas = await banco.sql<{ clabe: string }>(`select clabe from public.datos_de_cobro`);
      expect(filas).toHaveLength(1);
      expect(filas[0].clabe).toBe('012914002109876543');
    });
  });

  it('`anon` NO lee nada — y desde la 007 ni siquiera puede preguntar', async () => {
    /* ── Esto cambió de mecanismo con la 007, y el cambio es a mejor ────────
       Antes `anon` hacía el `select`, la RLS lo filtraba y volvían **cero
       filas**. Ahora ni llega a la RLS: no tiene `select` sobre la tabla y
       Postgres corta con `42501 permission denied`.

       Se afirma el mecanismo nuevo y no «cero filas o error» a propósito. Un
       `toHaveLength(0)` seguiría pasando el día que alguien le diera `select` a
       `anon` —volvería a cero filas por la RLS— y esta tabla es la cuenta donde
       entra la plata: el freno que queremos es el de más afuera. Si alguien
       abre el permiso, este test se pone rojo. */
    const e = await reventar(() => banco.comoAnonimo(
      () => banco.sql(`select * from public.datos_de_cobro`)));
    expect(e, 'a `anon` no se le da `select` sobre datos_de_cobro (migración 007)').toMatch(/permission denied/i);
    // El piso, al lado del cero: la fila existe.
    const [f] = await banco.sql<{ n: string }>(`select count(*) as n from public.datos_de_cobro`);
    expect(num(f.n)).toBe(1);
  });

  it('Gabi NO puede insertar: la cuenta donde entra la plata es del dueño', async () => {
    const e = await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.datos_de_cobro (banco, titular, clabe)
       values ('Otro', 'Otra persona', '012914002100000000')`)));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('`update` de la cuenta falla — también como superusuario', async () => {
    const e = await reventar(() => banco.sql(
      `update public.datos_de_cobro set clabe = '012914002100000000' where id = $1`, [cuenta]));
    expect(e).toMatch(/lo unico que se puede cambiar es vigente_hasta/);
  });

  it('pero cerrarla sí se puede: es lo que hace posible «se cierra la vigente y se inserta otra»', async () => {
    /* La orden dice «sin update» y también «el dueño inserta **y cierra**».
       Cerrar ES un update de `vigente_hasta`, así que el freno no podía ser un
       no-update a secas: es un update de UNA columna. Las dos mitades van
       afirmadas, porque un freno que también impide cerrar deja a Armando sin
       forma de cambiar de banco. */
    await banco.como(s.armando, 'aal2', () => banco.sql(
      `update public.datos_de_cobro set vigente_hasta = now() where id = $1`, [cuenta]));
    await banco.como(s.armando, 'aal2', () => banco.sql(
      `insert into public.datos_de_cobro (banco, titular, clabe)
       values ('Banorte', 'Armando Duarte', '072914002109876543')`));

    // Laura ve una sola: la nueva.
    await banco.como(s.laura, 'aal1', async () => {
      const filas = await banco.sql<{ banco: string }>(`select banco from public.datos_de_cobro`);
      expect(filas).toEqual([{ banco: 'Banorte' }]);
    });
  });

  it('una fila cerrada no se reabre, y no puede haber dos vigentes a la vez', async () => {
    const reabrir = await reventar(() => banco.sql(
      `update public.datos_de_cobro set vigente_hasta = null where id = $1`, [cuenta]));
    expect(reabrir).toMatch(/ya esta cerrada|cerrar es poner/);

    const dosVigentes = await reventar(() => banco.sql(
      `insert into public.datos_de_cobro (banco, titular, clabe)
       values ('Tercero', 'Armando Duarte', '002914002109876543')`));
    expect(dosVigentes).toMatch(/datos_de_cobro_una_sola_vigente|duplicate key/i);
  });

  it('una CLABE que no tiene 18 dígitos no entra', async () => {
    const e = await reventar(() => banco.sql(
      `insert into public.datos_de_cobro (banco, titular, clabe)
       values ('X', 'Y', '12345')`));
    expect(e).toMatch(/clabe_check|check constraint/i);
  });

  it('nadie borra una cuenta: se cierra', async () => {
    const e = await reventar(() => banco.sql(
      `delete from public.datos_de_cobro where id = $1`, [cuenta]));
    expect(e).toMatch(/solo se agrega/);
  });
});

describe('(11) la auditoría', () => {
  it('confirmar un pago deja un renglón con `quien` = Gabi', async () => {
    const [i] = await banco.sql<{ id: string }>(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`,
      [s.edicionAbierta, s.laura]);
    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo, monto, moneda)
       values ($1, 'confirmado', 1500.00, 'MXN')`, [i.id]));

    const [f] = await banco.sql<{ quien: string; accion: string; tabla: string; detalle: Record<string, unknown> }>(
      `select quien, accion, tabla, detalle from public.auditoria
        where tabla = 'pagos_libro' order by id desc limit 1`);
    expect(f.quien).toBe(s.gabi);
    expect(f.accion).toBe('insert');
    expect(f.detalle).toMatchObject({ tipo: 'confirmado', moneda: 'MXN' });
  });

  it('un `declarado` NO deja renglón: no es una acción del equipo', async () => {
    const antes = await banco.sql(`select id from public.auditoria where tabla = 'pagos_libro'`);
    const [i] = await banco.sql<{ id: string }>(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`,
      [s.edicionAbierta, s.pilar]);
    await banco.como(s.pilar, 'aal1', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo) values ($1, 'declarado')`, [i.id]));
    const despues = await banco.sql(`select id from public.auditoria where tabla = 'pagos_libro'`);
    expect(despues.length).toBe(antes.length);
    // Piso: el renglón del libro SÍ se escribió. Sin esto, un insert que fallara
    // en silencio daría el mismo «no creció» y se leería como un acierto.
    const [n] = await banco.sql<{ n: string }>(
      `select count(*) as n from public.pagos_libro where inscripcion_id = $1`, [i.id]);
    expect(num(n.n)).toBe(1);
  });

  it('el alta de un miembro y el cambio de un curso también se anotan', async () => {
    const [u] = await banco.sql<{ id: string }>(
      `insert into auth.users (email) values ('nueva@armandoduarte.com') returning id`);
    await banco.como(s.armando, 'aal2', () => banco.sql(
      `insert into public.miembros (user_id, rol, territorio) values ($1, 'equipo', 'mexico')`, [u.id]));
    const [m] = await banco.sql<{ fila: string; detalle: Record<string, unknown> }>(
      `select fila, detalle from public.auditoria where tabla = 'miembros' order by id desc limit 1`);
    // `miembros` no tiene columna `id`: su clave es `user_id`, y el anotador lo
    // resuelve leyendo el json. Si volviera a `new.id`, este test se pone rojo.
    expect(m.fila).toBe(u.id);
    expect(m.detalle).toMatchObject({ rol: 'equipo', territorio: 'mexico', activo: true });

    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `update public.cursos set titulo = 'Titulo nuevo' where id = $1`, [s.cursoPublicado]));
    const [c] = await banco.sql<{ accion: string }>(
      `select accion from public.auditoria where tabla = 'cursos' order by id desc limit 1`);
    expect(c.accion).toBe('update');
  });

  it('LA CLABE NO ENTRA A LA AUDITORÍA', async () => {
    /* Es lo único de la migración 004 que no hace falta para saber qué pasó y sí
       sería un dato bancario copiado en una tabla append-only de siete años. Por
       eso `detalle` se arma columna por columna y no con `to_jsonb(new)`. */
    const filas = await banco.sql<{ detalle: Record<string, unknown> }>(
      `select detalle from public.auditoria where tabla = 'datos_de_cobro'`);
    expect(filas.length).toBeGreaterThan(0);
    for (const f of filas) {
      expect(Object.keys(f.detalle)).not.toContain('clabe');
      expect(JSON.stringify(f.detalle)).not.toContain('914002');
      expect(f.detalle).toHaveProperty('banco');
    }
  });

  it('Laura no lee la auditoría; Gabi tampoco; Armando con aal2 sí', async () => {
    const cuantos = (usuario: string, aal: 'aal1' | 'aal2') =>
      banco.como(usuario, aal, async () =>
        (await banco.sql(`select id from public.auditoria`)).length);
    expect(await cuantos(s.laura, 'aal1')).toBe(0);
    expect(await cuantos(s.gabi, 'aal2')).toBe(0);
    expect(await cuantos(s.armando, 'aal2')).toBeGreaterThan(0);
    // Y el dueño con aal1 tampoco: la auditoría es de las cosas que exigen el
    // segundo paso siempre.
    expect(await cuantos(s.armando, 'aal1')).toBe(0);
  });

  it('la auditoría no se corrige ni se vacía, ni como superusuario', async () => {
    const porUpdate = await reventar(() => banco.sql(`update public.auditoria set accion = 'nada'`));
    expect(porUpdate).toMatch(/solo se agrega/);
    const porDelete = await reventar(() => banco.sql(`delete from public.auditoria`));
    expect(porDelete).toMatch(/solo se agrega/);
    const porTruncate = await reventar(() => banco.sql(`truncate public.auditoria`));
    expect(porTruncate).toMatch(/solo se agrega/);
  });
});
