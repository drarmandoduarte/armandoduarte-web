/**
 * El camino entero de una inscripción, y el libro que lo anota.
 *
 * Es la regla de Omnia #74 puesta a prueba: **`inscripciones` no tiene columna
 * estado**, el estado se deduce del último renglón de `pagos_libro`, y
 * `pagos_libro` es insert-only con trigger. Lo que se afirma acá es que las tres
 * cosas se sostienen entre sí — y que la única manera de corregir un renglón es
 * escribir otro, incluso siendo dueño de la base.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, num, reventar, sembrar, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

const estado = async (inscripcion: string) => {
  const [f] = await banco.sql<{ e: string }>(
    `select public.estado_inscripcion($1) as e`, [inscripcion]);
  return f.e;
};

/** La inscripción de Laura a la edición abierta. La crea el primer test. */
let inscripcionDeLaura: string;

describe('(5) inscribirse', () => {
  it('Laura se inscribe en la edición abierta y la referencia sale AD-0001', async () => {
    await banco.como(s.laura, 'aal1', async () => {
      const [f] = await banco.sql<{ id: string; referencia: string }>(
        `insert into public.inscripciones (edicion_id, persona_id)
         values ($1, $2) returning id, referencia`,
        [s.edicionAbierta, s.laura],
      );
      inscripcionDeLaura = f.id;
      expect(f.referencia).toBe('AD-0001');
    });
  });

  it('la referencia la pone la base: lo que mande el cliente se ignora', async () => {
    await banco.como(s.pilar, 'aal1', async () => {
      const [f] = await banco.sql<{ referencia: string }>(
        `insert into public.inscripciones (edicion_id, persona_id, referencia)
         values ($1, $2, 'AD-9999') returning referencia`,
        [s.edicionAbierta, s.pilar],
      );
      expect(f.referencia).toBe('AD-0002');
    });
  });

  it('una segunda inscripción de Laura a la misma edición falla', async () => {
    const e = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`,
      [s.edicionAbierta, s.laura])));
    expect(e).toMatch(/inscripciones_edicion_id_persona_id_key|duplicate key/i);
  });

  it('inscribirse al borrador falla, aunque su edición esté «abierta»', async () => {
    // La edición del borrador tiene `estado = 'abierta'` a propósito: lo que la
    // cierra es que su CURSO no está publicado. Sin esa condición en el
    // `with check`, este test pasaría y el borrador sería inscribible.
    const e = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`,
      [s.edicionDelBorrador, s.laura])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('inscribirse después de `inscripciones_hasta` falla', async () => {
    const [cerrada] = await banco.sql<{ id: string }>(
      `insert into public.ediciones (curso_id, inicio, fin, zona, inscripciones_hasta, estado)
       values ($1, now() + interval '10 days', now() + interval '10 days 3 hours',
               'America/Merida', now() - interval '1 day', 'abierta')
       returning id`, [s.cursoPublicado]);
    const e = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`,
      [cerrada.id, s.laura])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('una edición SIN `inscripciones_hasta` tampoco se inscribe', async () => {
    /* La orden #13 §B.3 escribe la condición como `now() < inscripciones_hasta`,
       y un nulo ahí no es «abierta para siempre»: es cerrada. Está afirmado acá
       para que la elección sea visible — si dirección la cambia, este test es lo
       que hay que venir a cambiar. Sube en el informe. */
    const [sinFecha] = await banco.sql<{ id: string }>(
      `insert into public.ediciones (curso_id, inicio, fin, zona, estado)
       values ($1, now() + interval '20 days', now() + interval '20 days 3 hours',
               'America/Merida', 'abierta')
       returning id`, [s.cursoPublicado]);
    const e = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`,
      [sinFecha.id, s.laura])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('nadie inscribe por otro: Laura no puede anotar a Pilar', async () => {
    const e = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`,
      [s.edicionAbierta, s.pilar])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('el equipo tampoco inscribe por otro en v1, ni con aal2', async () => {
    const e = await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`,
      [s.edicionAbierta, s.laura])));
    expect(e).toMatch(/row-level security|policy/i);
  });
});

describe('(6) el estado se deduce, y recorre el camino entero', () => {
  it('sin renglón: pendiente de pago', async () => {
    expect(await estado(inscripcionDeLaura)).toBe('pendiente_de_pago');
  });

  it('Laura declara → en revisión', async () => {
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.pagos_libro
         (inscripcion_id, tipo, monto, moneda, fecha_transferencia, banco, ultimos4_o_folio)
       values ($1, 'declarado', 1500.00, 'MXN', current_date, 'BBVA', '4821')`,
      [inscripcionDeLaura]));
    expect(await estado(inscripcionDeLaura)).toBe('en_revision');
  });

  it('Gabi con aal2 confirma → confirmada', async () => {
    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo, monto, moneda)
       values ($1, 'confirmado', 1500.00, 'MXN')`, [inscripcionDeLaura]));
    expect(await estado(inscripcionDeLaura)).toBe('confirmada');
  });

  it('y el otro camino: Gabi rechaza → vuelve a pendiente de pago, con el motivo escrito', async () => {
    const [otra] = await banco.sql<{ id: string }>(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`,
      [s.edicionAbierta, s.armando]);
    await banco.como(s.armando, 'aal2', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo) values ($1, 'declarado')`, [otra.id]));
    expect(await estado(otra.id)).toBe('en_revision');

    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo, nota)
       values ($1, 'rechazado', 'El comprobante es de otra cuenta')`, [otra.id]));
    expect(await estado(otra.id)).toBe('pendiente_de_pago');

    // El motivo no se pierde al volver a «pendiente»: sigue siendo un renglón.
    const [f] = await banco.sql<{ nota: string }>(
      `select nota from public.pagos_libro where inscripcion_id = $1 and tipo = 'rechazado'`,
      [otra.id]);
    expect(f.nota).toBe('El comprobante es de otra cuenta');
  });

  it('«el último renglón» está definido aunque dos se escriban en la MISMA transacción', async () => {
    /* ── Por qué `pagos_libro` tiene una columna `orden` ────────────────────
       `now()` es la hora de INICIO de la transacción, así que dos renglones
       escritos juntos comparten `created_at` al microsegundo. Se probó
       `clock_timestamp()` en el banco y tampoco alcanza: dos inserts seguidos
       dieron el mismo valor. Sin una secuencia, «el último» sale de desempatar
       por un uuid aleatorio y el estado cambia en cada consulta.

       Este test escribe `anulado` y después `confirmado` en una sola
       transacción y afirma que gana el segundo. Con el orden por `created_at`,
       falla la mitad de las veces — que es peor que fallar siempre. */
    const [tercera] = await banco.sql<{ id: string }>(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`,
      [s.edicionAbierta, s.gabi]);
    await banco.sql(`begin`);
    await banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo, hecho_por) values ($1, 'anulado', $2)`,
      [tercera.id, s.gabi]);
    await banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo, hecho_por) values ($1, 'confirmado', $2)`,
      [tercera.id, s.gabi]);
    await banco.sql(`commit`);

    const renglones = await banco.sql<{ tipo: string; created_at: string; orden: string }>(
      `select tipo, created_at, orden from public.pagos_libro
        where inscripcion_id = $1 order by orden`, [tercera.id]);
    // Las dos fechas son la misma: es el defecto que `orden` existe para cubrir.
    expect(renglones[0].created_at).toEqual(renglones[1].created_at);
    expect(num(renglones[1].orden)).toBeGreaterThan(num(renglones[0].orden));
    expect(await estado(tercera.id)).toBe('confirmada');
  });
});

describe('(7) quién puede escribir qué renglón', () => {
  it('Laura NO puede insertar un `confirmado`', async () => {
    const e = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo) values ($1, 'confirmado')`,
      [inscripcionDeLaura])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('Diana con aal2 NO puede confirmar la inscripción de Laura — es de otro territorio', async () => {
    const e = await reventar(() => banco.como(s.diana, 'aal2', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo) values ($1, 'confirmado')`,
      [inscripcionDeLaura])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('Gabi con aal1 NO puede confirmar', async () => {
    const e = await reventar(() => banco.como(s.gabi, 'aal1', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo) values ($1, 'confirmado')`,
      [inscripcionDeLaura])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('Diana con aal2 SÍ confirma la de Pilar — el corte es el territorio y no el rol', async () => {
    const [f] = await banco.sql<{ id: string }>(
      `select id from public.inscripciones where persona_id = $1`, [s.pilar]);
    await banco.como(s.diana, 'aal2', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo) values ($1, 'confirmado')`, [f.id]));
    expect(await estado(f.id)).toBe('confirmada');
  });

  it('el cliente lee su libro; el equipo, el de su territorio y nada más', async () => {
    const cuantos = (usuario: string, aal: 'aal1' | 'aal2') =>
      banco.como(usuario, aal, async () =>
        (await banco.sql(`select id from public.pagos_libro`)).length);

    const deLaura = await cuantos(s.laura, 'aal1');
    expect(deLaura).toBeGreaterThan(0);

    // Diana no ve ni un renglón de la inscripción mexicana de Laura.
    await banco.como(s.diana, 'aal2', async () => {
      const filas = await banco.sql(
        `select id from public.pagos_libro where inscripcion_id = $1`, [inscripcionDeLaura]);
      expect(filas).toHaveLength(0);
      // El piso: Diana SÍ ve los de Pilar, así que el cero de arriba es la RLS.
      const suyos = await banco.sql(`select id from public.pagos_libro`);
      expect(suyos.length).toBeGreaterThan(0);
    });
  });

  it('(9) `hecho_por` no se puede fijar a otro', async () => {
    const e = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo, hecho_por)
       values ($1, 'declarado', $2)`, [inscripcionDeLaura, s.gabi])));
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('y si no se manda, la base la firma sola con quien escribe', async () => {
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo) values ($1, 'declarado')`,
      [inscripcionDeLaura]));
    const [f] = await banco.sql<{ hecho_por: string }>(
      `select hecho_por from public.pagos_libro where inscripcion_id = $1 order by orden desc limit 1`,
      [inscripcionDeLaura]);
    expect(f.hecho_por).toBe(s.laura);
  });
});

describe('(8) el libro anota, no opina', () => {
  it('`update` sobre `pagos_libro` falla TAMBIÉN como superusuario', async () => {
    const e = await reventar(() => banco.sql(
      `update public.pagos_libro set monto = 1 where inscripcion_id = $1`, [inscripcionDeLaura]));
    expect(e).toMatch(/solo se agrega/);
  });

  it('`delete` también', async () => {
    const e = await reventar(() => banco.sql(
      `delete from public.pagos_libro where inscripcion_id = $1`, [inscripcionDeLaura]));
    expect(e).toMatch(/solo se agrega/);
  });

  it('y `truncate`, que no dispara triggers de fila y vaciaría el libro entero', async () => {
    const e = await reventar(() => banco.sql(`truncate public.pagos_libro`));
    expect(e).toMatch(/solo se agrega/);
  });

  it('el piso de los tres de arriba: el libro SÍ tiene renglones', async () => {
    // Sin esto, los tres ceros de arriba se cumplirían igual sobre una tabla
    // vacía, y un `create table` que se perdiera pasaría en verde.
    const [f] = await banco.sql<{ n: string }>(`select count(*) as n from public.pagos_libro`);
    expect(num(f.n)).toBeGreaterThan(3);
  });
});
