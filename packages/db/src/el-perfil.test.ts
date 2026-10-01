/**
 * El perfil del cliente y las notas del equipo, contra el esquema de verdad —
 * orden #27, PR D (migración 011).
 *
 * Los cuatro perfiles: **Armando** (dueño, todos), **Gabi** (equipo, México),
 * **Diana** (equipo, internacional) y **Laura** (clienta, México). Pilar es la
 * clienta española. Lo que se afirma: que el cliente edita sus columnas nuevas
 * y el equipo no edita las de nadie; que las notas las lee y escribe el equipo
 * por territorio y con segundo paso, y que **el cliente no las lee nunca**, ni
 * con su propio `persona_id`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, reventar, sembrar, type Aal, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

const nota = (quien: string, aal: Aal, persona: string, texto = 'Pagó en efectivo en el taller') =>
  banco.como(quien, aal, () => banco.sql(
    `insert into public.notas_de_persona (persona_id, autor, texto) values ($1, $2, $3)`, [persona, quien, texto]));
const notasQueVe = (quien: string, aal: Aal) =>
  banco.como(quien, aal, () => banco.sql<{ persona_id: string; texto: string }>(`select persona_id, texto from public.notas_de_persona`));

describe('el piso', () => {
  it('EL PISO, PRIMERO: la 011 corrió — las tres columnas, la tabla con RLS y su trigger', async () => {
    const columnas = await banco.sql<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = 'personas'
          and column_name in ('ciudad', 'anio_nacimiento', 'nivel_educativo') order by 1`);
    expect(columnas.map((c) => c.column_name)).toEqual(['anio_nacimiento', 'ciudad', 'nivel_educativo']);
    const [t] = await banco.sql<{ rls: boolean }>(`select relrowsecurity as rls from pg_class where relname = 'notas_de_persona'`);
    expect(t.rls).toBe(true);
  });
});

describe('el perfil: lo edita la persona, y nadie más', () => {
  it('Laura carga su ciudad, su año y su nivel', async () => {
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `update public.personas set ciudad = 'Mérida', anio_nacimiento = 1984, nivel_educativo = 'licenciatura' where id = $1`, [s.laura]));
    const [f] = await banco.sql(`select ciudad, anio_nacimiento, nivel_educativo from public.personas where id = $1`, [s.laura]);
    expect(f).toEqual({ ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'licenciatura' });
  });

  it('y las puede dejar vacías otra vez: nada es obligatorio', async () => {
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `update public.personas set nivel_educativo = null where id = $1`, [s.laura]));
    const [f] = await banco.sql<{ nivel_educativo: string | null }>(`select nivel_educativo from public.personas where id = $1`, [s.laura]);
    expect(f.nivel_educativo).toBeNull();
  });

  it('el año fuera de rango (antes de 1920, o menor de 14 años) y un nivel inventado: los rechaza la base', async () => {
    const anio = new Date().getFullYear();
    for (const [col, valor] of [['anio_nacimiento', 1919], ['anio_nacimiento', anio - 13], ['nivel_educativo', 'doctorado']] as const) {
      const error = await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
        `update public.personas set ${col} = $2 where id = $1`, [s.laura, valor])));
      expect(error, `${col} = ${valor}`).toMatch(/check constraint/);
    }
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `update public.personas set anio_nacimiento = $2 where id = $1`, [s.laura, anio - 14]));
  });

  it('Gabi (equipo, aal2) NO edita la ficha de Laura aunque la vea: ninguna fila cambia', async () => {
    const filas = await banco.como(s.gabi, 'aal2', () => banco.sql(
      `update public.personas set ciudad = 'Otra' where id = $1 returning id`, [s.laura]));
    expect(filas).toEqual([]);
    const [f] = await banco.sql<{ ciudad: string }>(`select ciudad from public.personas where id = $1`, [s.laura]);
    expect(f.ciudad).toBe('Mérida');
  });

  it('Armando (dueño) tampoco', async () => {
    const filas = await banco.como(s.armando, 'aal2', () => banco.sql(
      `update public.personas set ciudad = 'Otra' where id = $1 returning id`, [s.pilar]));
    expect(filas).toEqual([]);
  });
});

describe('las notas', () => {
  it('Gabi escribe una sobre Laura (su territorio)', async () => {
    await nota(s.gabi, 'aal2', s.laura);
    expect((await notasQueVe(s.gabi, 'aal2')).map((n) => n.persona_id)).toEqual([s.laura]);
  });

  it('Gabi NO escribe sobre Pilar (otro territorio): 42501', async () => {
    expect(await reventar(() => nota(s.gabi, 'aal2', s.pilar))).toMatch(/row-level security/);
  });

  it('Gabi sin segundo paso no escribe ni lee', async () => {
    expect(await reventar(() => nota(s.gabi, 'aal1', s.laura))).toMatch(/row-level security/);
    expect(await notasQueVe(s.gabi, 'aal1')).toEqual([]);
  });

  it('nadie firma por otro: Gabi no escribe a nombre de Diana', async () => {
    const error = await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.notas_de_persona (persona_id, autor, texto) values ($1, $2, 'x')`, [s.laura, s.diana])));
    expect(error).toMatch(/row-level security/);
  });

  it('Diana escribe sobre Pilar; ve la suya y NO la de Laura', async () => {
    await nota(s.diana, 'aal2', s.pilar, 'Pidió factura');
    expect((await notasQueVe(s.diana, 'aal2')).map((n) => n.texto)).toEqual(['Pidió factura']);
  });

  it('Armando (todos) ve las dos', async () => {
    expect((await notasQueVe(s.armando, 'aal2')).length).toBe(2);
  });

  it('LAURA NO LEE NINGUNA, ni la que es sobre ella', async () => {
    expect(await notasQueVe(s.laura, 'aal1')).toEqual([]);
    expect(await notasQueVe(s.laura, 'aal2')).toEqual([]);
    const sobreElla = await banco.como(s.laura, 'aal1', () => banco.sql(
      `select * from public.notas_de_persona where persona_id = $1`, [s.laura]));
    expect(sobreElla).toEqual([]);
  });

  it('Laura tampoco escribe una (ni sobre sí misma)', async () => {
    expect(await reventar(() => nota(s.laura, 'aal1', s.laura))).toMatch(/row-level security/);
  });

  it('solo se agrega: update y delete fallan también como superusuario; texto vacío o de más de 2000, no', async () => {
    expect(await reventar(() => banco.sql(`update public.notas_de_persona set texto = 'otra'`))).toMatch(/solo se agrega/);
    expect(await reventar(() => banco.sql(`delete from public.notas_de_persona`))).toMatch(/solo se agrega/);
    expect(await reventar(() => nota(s.gabi, 'aal2', s.laura, ''))).toMatch(/check constraint/);
    expect(await reventar(() => nota(s.gabi, 'aal2', s.laura, 'x'.repeat(2001)))).toMatch(/check constraint/);
  });

  it('auditoría anota cada alta, con quién', async () => {
    const filas = await banco.sql<{ quien: string }>(
      `select quien from public.auditoria where tabla = 'notas_de_persona' and accion = 'insert' order by id`);
    expect(filas.map((f) => f.quien)).toEqual([s.gabi, s.diana]);
  });
});

describe('panel_clientes con el perfil', () => {
  const clientes = (quien: string, aal: Aal) => banco.como(quien, aal, () => banco.sql<{
    nombre: string; ciudad: string | null; anio_nacimiento: number | null; nivel_educativo: string | null; cuantas_notas: number;
  }>(`select * from public.panel_clientes()`));

  it('trae ciudad, año, nivel y cuántas notas; Gabi ve a Laura con su nota y NO a Pilar', async () => {
    const filas = await clientes(s.gabi, 'aal2');
    const laura = filas.find((f) => f.nombre === 'Laura')!;
    expect(laura).toMatchObject({ ciudad: 'Mérida', anio_nacimiento: new Date().getFullYear() - 14, cuantas_notas: 1 });
    expect(filas.find((f) => f.nombre === 'Pilar')).toBeUndefined();
  });

  it('Armando ve las notas de Pilar contadas; un cliente sigue recibiendo vacío', async () => {
    const pilar = (await clientes(s.armando, 'aal2')).find((f) => f.nombre === 'Pilar')!;
    expect(pilar.cuantas_notas).toBe(1);
    expect(await clientes(s.laura, 'aal1')).toEqual([]);
  });
});
