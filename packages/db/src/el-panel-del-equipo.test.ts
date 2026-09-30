/**
 * El panel del equipo, contra el esquema de verdad — migración 008, orden #24 A.
 *
 * Cada consulta del panel corre acá con los cuatro perfiles de la orden:
 * **Armando** (dueño, todos), **Gabi** (equipo, México), **Diana** (equipo,
 * internacional) y **Laura** (cliente). Lo que se afirma es lo que la orden
 * dice que decide la base y no la pantalla: quién ve qué filas.
 *
 * La semilla del banco (`sembrar()`) tiene a Laura en México y a Pilar en
 * España. Acá las dos se anotan en la edición abierta, como se anotarían ellas:
 * con su propia sesión y sin segundo paso.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, reventar, sembrar, type Aal, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
  for (const quien of [s.laura, s.pilar]) {
    await banco.como(quien, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`,
      [s.edicionAbierta, quien],
    ));
  }
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

interface EdicionDelPanel { id: string; inscriptos: number | null; zona: string }
interface CursoDelPanel { id: string; titulo: string; estado: string; ediciones: EdicionDelPanel[] }

const cursos = (quien: string, aal: Aal) => banco.como(quien, aal, async () => {
  const [fila] = await banco.sql<{ panel: CursoDelPanel[] }>(`select public.panel_cursos() as panel`);
  return fila.panel;
});

const inscriptos = (quien: string, aal: Aal) => banco.como(quien, aal, () =>
  banco.sql<{ referencia: string; nombre: string; email: string; estado: string }>(
    `select * from public.panel_inscriptos($1)`, [s.edicionAbierta],
  ));

const clientes = (quien: string, aal: Aal) => banco.como(quien, aal, () =>
  banco.sql<{ nombre: string; cursos: number; ultimo_curso: string | null; rol: string | null; territorio: string | null }>(
    `select * from public.panel_clientes()`,
  ));

const nombres = (filas: { nombre: string }[]) => filas.map((f) => f.nombre).sort();

describe('Inscriptos: el territorio lo decide la base', () => {
  it('EL PISO, PRIMERO: la edición tiene las dos inscripciones del arranque', async () => {
    const [{ n }] = await banco.sql<{ n: number }>(
      `select count(*)::int as n from public.inscripciones where edicion_id = $1`, [s.edicionAbierta],
    );
    expect(n).toBe(2);
  });

  it('Armando (dueño, todos) ve a Laura y a Pilar, con referencia AD- y estado derivado del libro', async () => {
    const filas = await inscriptos(s.armando, 'aal2');
    expect(nombres(filas)).toEqual(['Laura', 'Pilar']);
    for (const f of filas) {
      expect(f.referencia).toMatch(/^AD-\d{4,}$/);
      expect(f.estado, 'sin pagos, la inscripción está pendiente de pago').toBe('pendiente_de_pago');
      expect(f.email).toMatch(/@/);
    }
  });

  it('Gabi (México) ve a Laura y NO a Pilar', async () => {
    expect(nombres(await inscriptos(s.gabi, 'aal2'))).toEqual(['Laura']);
  });

  it('Diana (internacional) ve a Pilar y NO a Laura', async () => {
    expect(nombres(await inscriptos(s.diana, 'aal2'))).toEqual(['Pilar']);
  });

  it('Laura (cliente) no lee nada del panel, ni siquiera su propia inscripción', async () => {
    expect(await inscriptos(s.laura, 'aal1')).toEqual([]);
  });

  it('Gabi sin segundo paso no ve a nadie', async () => {
    expect(await inscriptos(s.gabi, 'aal1')).toEqual([]);
  });
});

describe('Clientes: las personas que cada uno ve', () => {
  it('Armando ve a las cinco, con cuántos cursos y el último', async () => {
    const filas = await clientes(s.armando, 'aal2');
    expect(nombres(filas)).toEqual(['Armando', 'Diana', 'Gabi', 'Laura', 'Pilar']);
    const laura = filas.find((f) => f.nombre === 'Laura')!;
    expect(laura.cursos).toBe(1);
    expect(laura.ultimo_curso).toBe('El arte de amar a tu hijo adolescente');
    const gabi = filas.find((f) => f.nombre === 'Gabi')!;
    expect(gabi.rol, 'el dueño ve quién es del equipo').toBe('equipo');
    expect(gabi.territorio).toBe('mexico');
  });

  it('Gabi ve las de México y NO a Pilar; y no ve quién es del equipo', async () => {
    const filas = await clientes(s.gabi, 'aal2');
    expect(nombres(filas)).toContain('Laura');
    expect(nombres(filas)).not.toContain('Pilar');
    expect(filas.every((f) => f.rol === null || f.nombre === 'Gabi'),
      'el equipo no lee `miembros` ajenos: el rol de los demás viene en nulo').toBe(true);
  });

  it('Diana ve a Pilar y NO a Laura', async () => {
    const filas = await clientes(s.diana, 'aal2');
    expect(nombres(filas)).toContain('Pilar');
    expect(nombres(filas)).not.toContain('Laura');
  });

  it('Laura (cliente) no lee nada', async () => {
    expect(await clientes(s.laura, 'aal1')).toEqual([]);
  });
});

describe('Cursos: la lista con sus ediciones y los anotados', () => {
  it('Armando y Gabi ven los dos cursos —el publicado y el borrador— y la misma cuenta de anotados', async () => {
    for (const quien of [s.armando, s.gabi, s.diana]) {
      const lista = await cursos(quien, 'aal2');
      expect(lista.map((c) => c.estado).sort()).toEqual(['borrador', 'publicado']);
      const publicado = lista.find((c) => c.id === s.cursoPublicado)!;
      /* El cupo es uno solo: 2 / 60 para los tres, aunque Gabi vea a una
         persona y Diana a la otra. */
      expect(publicado.ediciones[0].inscriptos).toBe(2);
      expect(publicado.ediciones[0].zona).toBe('America/Merida');
    }
  });

  it('Laura (cliente) recibe la lista vacía, aunque haya un curso publicado', async () => {
    expect(await cursos(s.laura, 'aal1')).toEqual([]);
  });

  it('la cuenta de anotados es nula para quien no es miembro con segundo paso', async () => {
    for (const [quien, aal] of [[s.laura, 'aal1'], [s.laura, 'aal2'], [s.gabi, 'aal1']] as const) {
      const [{ n }] = await banco.como(quien, aal, () =>
        banco.sql<{ n: number | null }>(`select public.inscriptos_de_edicion($1) as n`, [s.edicionAbierta]));
      expect(n, `${quien} ${aal}`).toBeNull();
    }
  });

  it('sin sesión, las cuatro funciones no se pueden ni llamar', async () => {
    for (const consulta of [
      `select public.panel_cursos()`,
      `select * from public.panel_clientes()`,
      `select * from public.panel_inscriptos('${s.edicionAbierta}')`,
      `select public.inscriptos_de_edicion('${s.edicionAbierta}')`,
    ]) {
      const error = await reventar(() => banco.comoAnonimo(() => banco.sql(consulta)));
      expect(error, consulta).toMatch(/permission denied/);
    }
  });
});

describe('Lo que el panel escribe, con las policies de siempre', () => {
  it('el equipo carga un curso y una edición; el cliente no; y sin segundo paso tampoco', async () => {
    const [curso] = await banco.como(s.gabi, 'aal2', () => banco.sql<{ id: string }>(
      `insert into public.cursos (slug, titulo, modalidad) values ('taller-de-prueba', 'Taller de prueba', 'en_linea') returning id`,
    ));
    expect(curso.id).toBeTruthy();
    const edicion = await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.ediciones (curso_id, inicio, fin, zona) values ($1, now() + interval '5 days', now() + interval '5 days 2 hours', 'America/Merida')`,
      [curso.id],
    )));
    expect(edicion).toBeNull();

    expect(await reventar(() => banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.cursos (slug, titulo, modalidad) values ('de-laura', 'De Laura', 'en_linea')`,
    )))).toMatch(/row-level security/);
    expect(await reventar(() => banco.como(s.gabi, 'aal1', () => banco.sql(
      `insert into public.cursos (slug, titulo, modalidad) values ('sin-segundo-paso', 'Sin segundo paso', 'en_linea')`,
    )))).toMatch(/row-level security/);
  });

  it('solo el dueño suma a alguien al equipo, y queda en auditoría', async () => {
    expect(await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.miembros (user_id, rol, territorio, invitado_por) values ($1, 'equipo', 'mexico', $2)`,
      [s.laura, s.gabi],
    )))).toMatch(/row-level security/);
    expect(await reventar(() => banco.como(s.armando, 'aal1', () => banco.sql(
      `insert into public.miembros (user_id, rol, territorio, invitado_por) values ($1, 'equipo', 'mexico', $2)`,
      [s.laura, s.armando],
    )))).toMatch(/row-level security/);

    await banco.como(s.armando, 'aal2', () => banco.sql(
      `insert into public.miembros (user_id, rol, territorio, invitado_por) values ($1, 'equipo', 'mexico', $2)`,
      [s.laura, s.armando],
    ));
    const [anotado] = await banco.sql<{ quien: string; accion: string }>(
      `select quien, accion from public.auditoria where tabla = 'miembros' and fila = $1 order by id desc limit 1`,
      [s.laura],
    );
    expect(anotado).toEqual({ quien: s.armando, accion: 'insert' });

    /* Y ahora Laura es equipo de México: ve el panel. */
    expect(nombres(await inscriptos(s.laura, 'aal2'))).toEqual(['Laura']);
  });

  it('«Quitar del equipo» la desactiva —no la borra— y deja de ver el panel', async () => {
    await banco.como(s.armando, 'aal2', () => banco.sql(
      `update public.miembros set activo = false where user_id = $1`, [s.laura],
    ));
    const [fila] = await banco.sql<{ activo: boolean }>(
      `select activo from public.miembros where user_id = $1`, [s.laura],
    );
    expect(fila.activo).toBe(false);
    expect(await inscriptos(s.laura, 'aal2')).toEqual([]);
    const [anotado] = await banco.sql<{ accion: string; detalle: { activo: boolean } }>(
      `select accion, detalle from public.auditoria where tabla = 'miembros' and fila = $1 order by id desc limit 1`,
      [s.laura],
    );
    expect(anotado.accion).toBe('update');
    expect(anotado.detalle.activo).toBe(false);
  });
});

describe('La semilla del taller de Mérida', () => {
  const SEMILLA = readFileSync(join(import.meta.dirname, '..', 'semillas', '001_taller_de_merida.sql'), 'utf8');

  it('carga el curso en borrador con su edición del 5 de noviembre, 8:30–13:00 en Mérida', async () => {
    await banco.comoServicio(() => banco.script(SEMILLA));
    const [fila] = await banco.sql<{
      estado: string; inicio_local: string; fin_local: string; zona: string; sede: string;
      precio: string; moneda: string; inicio_utc: string;
    }>(
      `select c.estado, e.zona, e.sede, e.precio_monto::text as precio, e.precio_moneda as moneda,
              to_char(e.inicio at time zone e.zona, 'YYYY-MM-DD HH24:MI') as inicio_local,
              to_char(e.fin at time zone e.zona, 'HH24:MI') as fin_local,
              to_char(e.inicio at time zone 'UTC', 'YYYY-MM-DD HH24:MI') as inicio_utc
         from public.cursos c join public.ediciones e on e.curso_id = c.id
        where c.slug = 'el-arte-de-amar-a-tu-adolescente'`,
    );
    expect(fila).toEqual({
      estado: 'borrador', zona: 'America/Merida', sede: 'Fiesta Inn Mérida',
      precio: '1170.00', moneda: 'MXN',
      inicio_local: '2026-11-05 08:30', fin_local: '13:00',
      /* Mérida es UTC−6 todo el año: 8:30 allá son las 14:30 UTC. */
      inicio_utc: '2026-11-05 14:30',
    });
  });

  it('correrla otra vez no duplica nada', async () => {
    await banco.comoServicio(() => banco.script(SEMILLA));
    const [{ n }] = await banco.sql<{ n: number }>(
      `select count(*)::int as n from public.ediciones e join public.cursos c on c.id = e.curso_id
        where c.slug = 'el-arte-de-amar-a-tu-adolescente'`,
    );
    expect(n).toBe(1);
  });

  it('en borrador, nadie de afuera la ve y nadie se puede anotar', async () => {
    const vistos = await banco.comoAnonimo(() => banco.sql<{ slug: string }>(`select slug from public.cursos`));
    expect(vistos.map((v) => v.slug)).not.toContain('el-arte-de-amar-a-tu-adolescente');
    const [{ id }] = await banco.sql<{ id: string }>(
      `select e.id from public.ediciones e join public.cursos c on c.id = e.curso_id
        where c.slug = 'el-arte-de-amar-a-tu-adolescente'`,
    );
    expect(await reventar(() => banco.como(s.pilar, 'aal1', () => banco.sql(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`, [id, s.pilar],
    )))).toMatch(/row-level security/);
  });
});
