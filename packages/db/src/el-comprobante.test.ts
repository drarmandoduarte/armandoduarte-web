/**
 * El comprobante de pago, de punta a punta, contra el esquema de verdad —
 * orden #27, PR C (migración 010).
 *
 * Lo que la base decide y la pantalla no: quién declara, quién confirma,
 * quién rechaza y quién anula; qué estado sale de cada paso; y qué ve cada uno
 * de los cuatro perfiles en `libro_de_edicion()` — **Armando** (dueño, todos),
 * **Gabi** (equipo, México), **Diana** (equipo, internacional) y **Laura**
 * (clienta, México). Pilar es la clienta española.
 *
 * Que el `anulado` sea solo del dueño **no** lo decide la base: la policy
 * `libro_el_equipo_resuelve` (003) se lo permite a todo el equipo, y el freno
 * está en la API (`pagos.controller.ts`, defensa doble como el panel). Acá se
 * afirma lo que la base sí hace: que el dueño anula y el estado lo sigue.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, reventar, sembrar, type Aal, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;
let deLaura: string;
let dePilar: string;
/** Una integrante del equipo con territorio `todos` y ficha en España: su ficha no la ve Gabi. */
let marta: string;

const uuid = () => crypto.randomUUID();

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
  const inscribir = (persona: string) => banco.como(persona, 'aal1', async () => {
    const [f] = await banco.sql<{ id: string }>(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`,
      [s.edicionAbierta, persona]);
    return f.id;
  });
  deLaura = await inscribir(s.laura);
  dePilar = await inscribir(s.pilar);

  const [u] = await banco.sql<{ id: string }>(`insert into auth.users (email) values ('marta@ejemplo.es') returning id`);
  await banco.sql(`update public.personas set nombre = 'Marta', pais = 'ES' where id = $1`, [u.id]);
  await banco.sql(`insert into public.miembros (user_id, rol, territorio) values ($1, 'equipo', 'todos')`, [u.id]);
  marta = u.id;
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

const estado = async (inscripcion: string) => {
  const [f] = await banco.sql<{ e: string }>(`select public.estado_inscripcion($1) as e`, [inscripcion]);
  return f.e;
};

/** El cliente sube a su carpeta (la policy de la 006) y declara con el path. */
const declarar = (quien: string, inscripcion: string, path = `${inscripcion}/${uuid()}.pdf`) =>
  banco.como(quien, 'aal1', async () => {
    await banco.sql(`insert into storage.objects (bucket_id, name, owner) values ('comprobantes', $1, $2)`, [path, quien]);
    await banco.sql(
      `insert into public.pagos_libro
         (inscripcion_id, tipo, monto, moneda, fecha_transferencia, banco, ultimos4_o_folio, comprobante_path, hecho_por)
       values ($1, 'declarado', 1500.00, 'MXN', current_date, 'Banco de prueba', '0000', $2, $3)`,
      [inscripcion, path, quien]);
    return path;
  });

const resolver = (quien: string, aal: Aal, inscripcion: string, tipo: string, nota: string | null = null) =>
  banco.como(quien, aal, () => banco.sql(
    `insert into public.pagos_libro (inscripcion_id, tipo, monto, moneda, nota, hecho_por)
     values ($1, $2, 1500.00, 'MXN', $3, $4)`, [inscripcion, tipo, nota, quien]));

interface Fila {
  inscripcion_id: string;
  ultimo_tipo: string | null;
  ultimo_por: string | null;
  ultima_nota: string | null;
  monto_declarado: string | null;
  comprobante_path: string | null;
  monto_confirmado: string | null;
}
const libro = (quien: string, aal: Aal) =>
  banco.como(quien, aal, () => banco.sql<Fila>(`select * from public.libro_de_edicion($1)`, [s.edicionAbierta]));
const de = (filas: Fila[], inscripcion: string) => filas.find((f) => f.inscripcion_id === inscripcion);

describe('el piso', () => {
  it('EL PISO, PRIMERO: la 010 corrió y sus dos funciones existen; la edición tiene las dos inscripciones', async () => {
    const funciones = await banco.sql<{ proname: string; prosecdef: boolean }>(
      `select proname, prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and proname in ('libro_de_edicion', 'firma_del_libro') order by proname`);
    expect(funciones).toEqual([
      { proname: 'firma_del_libro', prosecdef: true },
      { proname: 'libro_de_edicion', prosecdef: false },
    ]);
    const [{ n }] = await banco.sql<{ n: number }>(
      `select count(*)::int as n from public.inscripciones where edicion_id = $1`, [s.edicionAbierta]);
    expect(n).toBe(2);
  });

  it('`anon` no las ejecuta', async () => {
    for (const f of ['public.libro_de_edicion(uuid)', 'public.firma_del_libro(uuid)']) {
      const [r] = await banco.sql<{ puede: boolean }>(`select has_function_privilege('anon', $1, 'execute') as puede`, [f]);
      expect(r.puede, f).toBe(false);
    }
  });
});

describe('declarar', () => {
  it('Laura declara sobre la suya → en revisión', async () => {
    expect(await estado(deLaura)).toBe('pendiente_de_pago');
    await declarar(s.laura, deLaura);
    expect(await estado(deLaura)).toBe('en_revision');
  });

  it('Laura NO declara sobre la de Pilar: 42501, y el estado de Pilar no se mueve', async () => {
    const error = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.pagos_libro (inscripcion_id, tipo, hecho_por) values ($1, 'declarado', $2)`,
      [dePilar, s.laura])));
    expect(error).toMatch(/row-level security/);
    expect(await estado(dePilar)).toBe('pendiente_de_pago');
  });

  it('Laura NO sube su comprobante a la carpeta de Pilar', async () => {
    const error = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into storage.objects (bucket_id, name, owner) values ('comprobantes', $1, $2)`,
      [`${dePilar}/${uuid()}.pdf`, s.laura])));
    expect(error).toMatch(/row-level security/);
  });

  it('Laura NO confirma la suya: 42501', async () => {
    expect(await reventar(() => resolver(s.laura, 'aal1', deLaura, 'confirmado'))).toMatch(/row-level security/);
    expect(await reventar(() => resolver(s.laura, 'aal2', deLaura, 'confirmado'))).toMatch(/row-level security/);
    expect(await estado(deLaura)).toBe('en_revision');
  });
});

describe('el equipo revisa', () => {
  it('Diana NO confirma la de Laura (otro territorio): 42501', async () => {
    expect(await reventar(() => resolver(s.diana, 'aal2', deLaura, 'confirmado'))).toMatch(/row-level security/);
    expect(await estado(deLaura)).toBe('en_revision');
  });

  it('Gabi sin segundo paso NO confirma', async () => {
    expect(await reventar(() => resolver(s.gabi, 'aal1', deLaura, 'confirmado'))).toMatch(/row-level security/);
  });

  it('Gabi con aal2 rechaza la de Laura → pendiente de pago, con el motivo', async () => {
    await resolver(s.gabi, 'aal2', deLaura, 'rechazado', 'El monto no coincide');
    expect(await estado(deLaura)).toBe('pendiente_de_pago');
  });

  it('Laura vuelve a declarar después del rechazo, y Gabi confirma → confirmada', async () => {
    await declarar(s.laura, deLaura);
    expect(await estado(deLaura)).toBe('en_revision');
    await resolver(s.gabi, 'aal2', deLaura, 'confirmado');
    expect(await estado(deLaura)).toBe('confirmada');
  });

  it('Diana con aal2 confirma la de Pilar (su territorio)', async () => {
    await declarar(s.pilar, dePilar);
    await resolver(s.diana, 'aal2', dePilar, 'confirmado');
    expect(await estado(dePilar)).toBe('confirmada');
  });

  it('Armando (dueño) anula la de Pilar → anulada', async () => {
    await resolver(s.armando, 'aal2', dePilar, 'anulado', 'Pidió la devolución');
    expect(await estado(dePilar)).toBe('anulada');
  });
});

describe('libro_de_edicion: lo que ve cada uno', () => {
  it('Armando ve las dos, con el último renglón, lo declarado y lo confirmado', async () => {
    const filas = await libro(s.armando, 'aal2');
    expect(filas).toHaveLength(2);
    const laura = de(filas, deLaura)!;
    expect(laura.ultimo_tipo).toBe('confirmado');
    expect(laura.ultimo_por, 'la firma es el nombre de quien escribió el renglón').toBe('Gabi');
    expect(laura.comprobante_path, 'el path del ÚLTIMO declarado').toMatch(new RegExp(`^${deLaura}/`));
    expect(Number(laura.monto_declarado)).toBe(1500);
    expect(Number(laura.monto_confirmado)).toBe(1500);
    const pilar = de(filas, dePilar)!;
    expect(pilar).toMatchObject({ ultimo_tipo: 'anulado', ultimo_por: 'Armando', ultima_nota: 'Pidió la devolución' });
  });

  it('Gabi (México) ve la de Laura y NO la de Pilar', async () => {
    const filas = await libro(s.gabi, 'aal2');
    expect(filas.map((f) => f.inscripcion_id)).toEqual([deLaura]);
  });

  it('Diana (internacional) ve la de Pilar y NO la de Laura', async () => {
    const filas = await libro(s.diana, 'aal2');
    expect(filas.map((f) => f.inscripcion_id)).toEqual([dePilar]);
  });

  it('Laura (clienta) recibe vacío, aunque sea su propia inscripción', async () => {
    expect(await libro(s.laura, 'aal1')).toEqual([]);
    expect(await libro(s.laura, 'aal2')).toEqual([]);
  });

  it('Gabi sin segundo paso recibe vacío', async () => {
    expect(await libro(s.gabi, 'aal1')).toEqual([]);
  });

  it('el path que devuelve es uno que Gabi puede leer en Storage (la policy de la 006 manda)', async () => {
    const [laura] = await libro(s.gabi, 'aal2');
    const vistos = await banco.como(s.gabi, 'aal2', () => banco.sql<{ name: string }>(
      `select name from storage.objects where bucket_id = 'comprobantes' and name = $1`, [laura.comprobante_path]));
    expect(vistos).toHaveLength(1);
  });
});

describe('firma_del_libro: el nombre del equipo, y nada más', () => {
  it('EL PISO: Gabi NO puede leer la ficha de Marta (es de España)', async () => {
    const filas = await banco.como(s.gabi, 'aal2', () => banco.sql(`select nombre from public.personas where id = $1`, [marta]));
    expect(filas).toEqual([]);
  });

  it('…y aun así, si Marta rechaza la de Laura, Gabi lee «Marta» en el libro', async () => {
    await declarar(s.laura, deLaura);
    await resolver(marta, 'aal2', deLaura, 'rechazado', 'El comprobante es de otra cuenta');
    const [laura] = await libro(s.gabi, 'aal2');
    expect(laura).toMatchObject({ ultimo_tipo: 'rechazado', ultimo_por: 'Marta', ultima_nota: 'El comprobante es de otra cuenta' });
  });

  it('la firma de un renglón `declarado` es el nombre de la clienta, que el equipo ya ve por territorio', async () => {
    await declarar(s.laura, deLaura);
    const [laura] = await libro(s.gabi, 'aal2');
    expect(laura).toMatchObject({ ultimo_tipo: 'declarado', ultimo_por: 'Laura' });
  });

  it('de un cliente no devuelve nada, ni a un miembro: no es una puerta a las fichas', async () => {
    const [f] = await banco.como(s.diana, 'aal2', () =>
      banco.sql<{ n: string | null }>(`select public.firma_del_libro($1) as n`, [s.laura]));
    expect(f.n).toBeNull();
  });

  it('a quien no es miembro con segundo paso, nulo', async () => {
    for (const [quien, aal] of [[s.laura, 'aal1'], [s.laura, 'aal2'], [s.gabi, 'aal1']] as const) {
      const [f] = await banco.como(quien, aal, () =>
        banco.sql<{ n: string | null }>(`select public.firma_del_libro($1) as n`, [s.gabi]));
      expect(f.n, `${quien} ${aal}`).toBeNull();
    }
  });
});
