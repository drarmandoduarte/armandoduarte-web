/**
 * «Me anoto», contra el esquema de verdad — migración 009, orden #24 B.
 *
 * Lo que la orden pide verificar en el banco: **inscribirse, duplicado, cupo
 * lleno, edición cerrada y que un cliente no vea nada ajeno**. Cada caso corre
 * con la sesión de la persona (`authenticated`, `aal1`, como un cliente de
 * verdad) y llama a las mismas funciones que llama la API.
 *
 * ── Lo que NO prueba, dicho para que el verde no se lea de más ──────────
 *   · **Dos inscripciones en el mismo instante.** El banco es una sola conexión
 *     y no hay dos transacciones a la vez: el `for update` del trigger del cupo
 *     está escrito y explicado en la 009, pero acá no se lo ve esperar. Lo que sí
 *     se prueba es la otra mitad, la que no depende de la concurrencia: que el
 *     trigger frena **cualquier** insert sobre una edición llena, también el que
 *     no pasa por `inscribirme()`.
 *   · **La traducción a la pantalla** (`SIN_LUGARES`, `EDICION_CERRADA`). De eso
 *     se ocupa `apps/api/src/las-consultas-corren-contra-la-base.spec.ts`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, migracionesEnOrden, sembrar, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

interface Taller { edicion_id: string; curso_slug: string; lugares: number | null; mi_referencia: string | null }
interface Mio { referencia: string; curso_titulo: string; estado: string; zona: string }

const talleres = (quien: string) => banco.como(quien, 'aal1', () =>
  banco.sql<Taller>(`select * from public.talleres_abiertos()`));
const misTalleres = (quien: string) => banco.como(quien, 'aal1', () =>
  banco.sql<Mio>(`select * from public.mis_talleres()`));
const inscribirme = async (quien: string, edicion: string) => {
  const [fila] = await banco.como(quien, 'aal1', () =>
    banco.sql<{ referencia: string; ya_estaba: boolean }>(`select * from public.inscribirme($1)`, [edicion]));
  return fila;
};
/** El SQLSTATE con el que revienta algo, o `null` si no revienta. */
const codigoDe = async (hacer: () => Promise<unknown>): Promise<string | null> => {
  try {
    await hacer();
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? (e instanceof Error ? e.message : String(e));
  }
};
const ultimaReferencia = async () => {
  const [{ n }] = await banco.sql<{ n: string }>(`select last_value::text as n from public.inscripciones_referencia_seq`);
  return Number(n);
};

/** Una edición nueva del curso publicado, sembrada como superusuario. */
async function edicion(campos: { cupo?: number | null; estado?: string; hasta?: string; curso?: string }) {
  const [e] = await banco.sql<{ id: string }>(
    `insert into public.ediciones
       (curso_id, inicio, fin, zona, sede, ciudad, pais, cupo, precio_monto, precio_moneda, inscripciones_hasta, estado)
     values ($1, now() + interval '50 days', now() + interval '50 days 4 hours', 'America/Merida',
             'Sede de prueba', 'Merida', 'MX', $2, 900, 'MXN', ${campos.hasta ?? `now() + interval '30 days'`}, $3)
     returning id`,
    [campos.curso ?? s.cursoPublicado, campos.cupo ?? null, campos.estado ?? 'abierta'],
  );
  return e.id;
}

describe('el piso', () => {
  it('EL PISO, PRIMERO: la 009 corrió y sus cuatro funciones existen', async () => {
    expect(migracionesEnOrden()).toContain('009_me_anoto.sql');
    const funciones = await banco.sql<{ proname: string }>(
      `select proname from pg_proc where pronamespace = 'public'::regnamespace
         and proname in ('talleres_abiertos', 'mis_talleres', 'inscribirme', 'lugares_de_edicion')
       order by proname`);
    expect(funciones.map((f) => f.proname)).toEqual(['inscribirme', 'lugares_de_edicion', 'mis_talleres', 'talleres_abiertos']);
  });
});

describe('Talleres abiertos', () => {
  it('Laura ve la edición abierta del curso publicado, con 60 lugares, y no la del borrador', async () => {
    const lista = await talleres(s.laura);
    const ids = lista.map((t) => t.edicion_id);
    expect(ids).toContain(s.edicionAbierta);
    expect(ids).not.toContain(s.edicionDelBorrador);
    const abierta = lista.find((t) => t.edicion_id === s.edicionAbierta)!;
    expect(abierta.lugares).toBe(60);
    expect(abierta.mi_referencia).toBeNull();
  });

  it('sin sesión no se llama: `anon` no tiene permiso', async () => {
    expect(await codigoDe(() => banco.comoAnonimo(() => banco.sql(`select * from public.talleres_abiertos()`)))).toBe('42501');
  });
});

describe('Inscribirse y el duplicado', () => {
  let referencia: string;

  it('Laura se anota: recibe su referencia AD- y no «ya estaba»', async () => {
    const r = await inscribirme(s.laura, s.edicionAbierta);
    expect(r.referencia).toMatch(/^AD-\d{4,}$/);
    expect(r.ya_estaba).toBe(false);
    referencia = r.referencia;
  });

  it('una segunda vez a la misma edición no crea otra: devuelve la que ya tiene', async () => {
    const r = await inscribirme(s.laura, s.edicionAbierta);
    expect(r).toEqual({ referencia, ya_estaba: true });
    const [{ n }] = await banco.sql<{ n: number }>(
      `select count(*)::int as n from public.inscripciones where edicion_id = $1 and persona_id = $2`,
      [s.edicionAbierta, s.laura]);
    expect(n).toBe(1);
  });

  it('la lista la muestra anotada y con un lugar menos; «Mis talleres» la trae pendiente de pago', async () => {
    const abierta = (await talleres(s.laura)).find((t) => t.edicion_id === s.edicionAbierta)!;
    expect(abierta.mi_referencia).toBe(referencia);
    expect(abierta.lugares).toBe(59);
    const mios = await misTalleres(s.laura);
    expect(mios).toHaveLength(1);
    expect(mios[0]).toMatchObject({
      referencia, curso_titulo: 'El arte de amar a tu hijo adolescente', estado: 'pendiente_de_pago', zona: 'America/Merida',
    });
  });

  it('si el curso pasa a borrador, la inscripción sigue en «Mis talleres» (es suya)', async () => {
    await banco.sql(`update public.cursos set estado = 'borrador' where id = $1`, [s.cursoPublicado]);
    try {
      expect((await misTalleres(s.laura)).map((m) => m.referencia)).toEqual([referencia]);
    } finally {
      await banco.sql(`update public.cursos set estado = 'publicado' where id = $1`, [s.cursoPublicado]);
    }
  });
});

describe('Un cliente no ve nada ajeno', () => {
  it('Pilar no ve la inscripción de Laura: ni en «Mis talleres», ni como su referencia, ni en la tabla', async () => {
    /* El piso: la de Laura existe. Sin esto, «Pilar no ve nada» se cumple solo. */
    const [{ n }] = await banco.sql<{ n: number }>(
      `select count(*)::int as n from public.inscripciones where persona_id = $1`, [s.laura]);
    expect(n).toBe(1);

    expect(await misTalleres(s.pilar)).toEqual([]);
    const abierta = (await talleres(s.pilar)).find((t) => t.edicion_id === s.edicionAbierta)!;
    expect(abierta.mi_referencia, 'la referencia de Laura no le aparece a Pilar').toBeNull();
    const directas = await banco.como(s.pilar, 'aal1', () => banco.sql(`select * from public.inscripciones`));
    expect(directas).toEqual([]);
  });
});

describe('Cupo lleno', () => {
  let llena: string;

  beforeAll(async () => {
    llena = await edicion({ cupo: 1 });
  });

  it('con cupo 1, Laura entra y Pilar recibe CD409 (sin lugares)', async () => {
    expect((await inscribirme(s.laura, llena)).ya_estaba).toBe(false);
    expect((await talleres(s.pilar)).find((t) => t.edicion_id === llena)?.lugares).toBe(0);
    expect(await codigoDe(() => inscribirme(s.pilar, llena))).toBe('CD409');
  });

  it('el trigger frena también el insert que no pasa por `inscribirme()`', async () => {
    expect(await codigoDe(() => banco.como(s.pilar, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`, [llena, s.pilar])))).toBe('CD409');
  });

  it('una inscripción rechazada por cupo no quema un número AD-', async () => {
    const antes = await ultimaReferencia();
    await codigoDe(() => inscribirme(s.pilar, llena));
    expect(await ultimaReferencia()).toBe(antes);
  });

  it('quien ya tiene su lugar en un taller lleno ve su referencia, no «sin lugares»', async () => {
    expect((await inscribirme(s.laura, llena)).ya_estaba).toBe(true);
  });

  it('sin cupo (nulo, como la semilla de Mérida) no hay tope y los lugares vienen en nulo', async () => {
    const sinTope = await edicion({ cupo: null });
    expect((await talleres(s.laura)).find((t) => t.edicion_id === sinTope)?.lugares).toBeNull();
    expect((await inscribirme(s.pilar, sinTope)).ya_estaba).toBe(false);
  });
});

describe('Edición cerrada', () => {
  it('cerrada, vencida o de un curso en borrador: CD410 y fuera de la lista', async () => {
    const cerrada = await edicion({ cupo: 10, estado: 'cerrada' });
    const vencida = await edicion({ cupo: 10, hasta: `now() - interval '1 hour'` });
    const lista = (await talleres(s.laura)).map((t) => t.edicion_id);
    for (const [nombre, id] of [['cerrada', cerrada], ['vencida', vencida], ['del borrador', s.edicionDelBorrador]] as const) {
      expect(lista, `${nombre} no tiene que estar en «Talleres abiertos»`).not.toContain(id);
      expect(await codigoDe(() => inscribirme(s.laura, id)), nombre).toBe('CD410');
    }
  });

  it('`lugares_de_edicion()` no dice nada de una edición que no se ve', async () => {
    const [{ n }] = await banco.como(s.laura, 'aal1', () =>
      banco.sql<{ n: number | null }>(`select public.lugares_de_edicion($1) as n`, [s.edicionDelBorrador]));
    expect(n).toBeNull();
  });
});

describe('La semilla de Mérida, con «me anoto»', () => {
  it('en borrador no aparece; publicada, aparece sin tope de lugares', async () => {
    await banco.script(readFileSync(join(import.meta.dirname, '..', 'semillas', '001_taller_de_merida.sql'), 'utf8'));
    const slug = 'el-arte-de-amar-a-tu-adolescente';
    expect((await talleres(s.laura)).map((t) => t.curso_slug)).not.toContain(slug);
    await banco.sql(`update public.cursos set estado = 'publicado' where slug = $1`, [slug]);
    const merida = (await talleres(s.laura)).find((t) => t.curso_slug === slug);
    expect(merida, 'publicada, la edición del 5/11 tiene que estar en la lista').toBeDefined();
    expect(merida!.lugares).toBeNull();
  });
});
