/**
 * Los rescates, contra el esquema de verdad — orden #37, PR 2 (migración 013).
 *
 * Los perfiles de siempre: **Armando** (dueño), **Gabi** (equipo, México),
 * **Laura** (clienta, México) y **Pilar** (clienta, España). Lo que se afirma,
 * que es lo que dice la orden: «nadie lee más que lo suyo, solo se agrega y se
 * cierra», y las 48 horas.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, sembrar, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

const HASH = 'a'.repeat(64);
const OTRO_HASH = 'b'.repeat(64);

/** Lo que hace la API al pedir: con `service_role`, `vence_el` = `pedido_el` + 48 h. */
async function pedir(persona: string, hash = HASH): Promise<string> {
  const [fila] = await banco.comoServicio(() => banco.sql<{ id: string }>(
    `insert into public.rescates (user_id, pedido_el, vence_el, token_hash)
       values ($1, now(), now() + interval '48 hours', $2) returning id`, [persona, hash]));
  return fila.id;
}

const cerrar = (id: string, columna: 'confirmado_el' | 'cancelado_el' | 'usado_el') =>
  banco.comoServicio(() => banco.sql(`update public.rescates set ${columna} = now() where id = $1 returning id`, [id]));

describe('el piso', () => {
  it('EL PISO, PRIMERO: la 013 corrió — la tabla y sus columnas son las de la orden', async () => {
    const columnas = await banco.sql<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = 'rescates' order by ordinal_position`);
    expect(columnas.map((c) => c.column_name)).toEqual([
      'id', 'user_id', 'pedido_el', 'vence_el', 'confirmado_el', 'cancelado_el', 'usado_el', 'token_hash',
    ]);
  });

  it('la RLS está encendida', async () => {
    const [t] = await banco.sql<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class where oid = 'public.rescates'::regclass`);
    expect(t.relrowsecurity).toBe(true);
  });
});

describe('las 48 horas', () => {
  it('EL CASO: el pedido nace abierto, con vence_el a 48 h exactas', async () => {
    const id = await pedir(s.gabi);
    const [r] = await banco.sql<{ horas: number; confirmado_el: unknown; cancelado_el: unknown; usado_el: unknown }>(
      `select extract(epoch from (vence_el - pedido_el)) / 3600 as horas, confirmado_el, cancelado_el, usado_el
         from public.rescates where id = $1`, [id]);
    expect(Number(r.horas)).toBe(48);
    expect([r.confirmado_el, r.cancelado_el, r.usado_el]).toEqual([null, null, null]);
    await cerrar(id, 'cancelado_el');
  });

  it('LA MUTACIÓN: un vence_el que no es +48 h no entra', async () => {
    await expect(banco.comoServicio(() => banco.sql(
      `insert into public.rescates (user_id, pedido_el, vence_el, token_hash)
         values ($1, now(), now() + interval '1 hour', $2)`, [s.gabi, HASH]))).rejects.toThrow(/48/);
  });

  it('el token se guarda hasheado: un token en claro no entra', async () => {
    await expect(banco.comoServicio(() => banco.sql(
      `insert into public.rescates (user_id, pedido_el, vence_el, token_hash)
         values ($1, now(), now() + interval '48 hours', 'esto-es-un-token')`, [s.gabi]))).rejects.toThrow();
  });
});

describe('nadie lee más que lo suyo', () => {
  it('Gabi ve el suyo; Laura, Armando (dueño) y anon no lo ven', async () => {
    const id = await pedir(s.gabi);
    const ve = (quien: string) => banco.como(quien, 'aal2', () =>
      banco.sql(`select id from public.rescates where id = $1`, [id]));
    expect(await ve(s.gabi)).toHaveLength(1);
    expect(await ve(s.laura)).toEqual([]);
    expect(await ve(s.armando), 'ni el dueño ve el rescate de otra persona').toEqual([]);
    expect(await banco.comoAnonimo(() => banco.sql(`select id from public.rescates`).catch(() => []))).toEqual([]);
    await cerrar(id, 'cancelado_el');
  });
});

describe('solo se agrega y se cierra', () => {
  it('desde la app nadie escribe: ni la dueña del rescate puede insertarlo, cerrarlo ni borrarlo', async () => {
    const id = await pedir(s.laura);
    await expect(banco.como(s.laura, 'aal1', () => banco.sql(
      `insert into public.rescates (user_id, pedido_el, vence_el, token_hash)
         values ($1, now(), now() + interval '48 hours', $2)`, [s.laura, OTRO_HASH]))).rejects.toThrow(/permission denied/);
    await expect(banco.como(s.laura, 'aal1', () => banco.sql(
      `update public.rescates set confirmado_el = now() where id = $1`, [id]))).rejects.toThrow(/permission denied/);
    await expect(banco.como(s.laura, 'aal1', () => banco.sql(
      `delete from public.rescates where id = $1`, [id]))).rejects.toThrow(/permission denied/);
    await cerrar(id, 'cancelado_el');
  });

  it('ni service_role borra: un rescate se cierra, no se borra', async () => {
    const id = await pedir(s.pilar);
    await expect(banco.comoServicio(() => banco.sql(
      `delete from public.rescates where id = $1`, [id]))).rejects.toThrow(/permission denied/);
    await cerrar(id, 'cancelado_el');
  });

  it('EL CASO: se confirma y, vencido, se usa', async () => {
    const id = await pedir(s.diana);
    expect(await cerrar(id, 'confirmado_el')).toHaveLength(1);
    expect(await cerrar(id, 'usado_el')).toHaveLength(1);
  });

  it('LA MUTACIÓN: correr vence_el, cambiar de dueña o de token, no', async () => {
    const id = await pedir(s.armando);
    for (const cambio of [
      `vence_el = vence_el - interval '47 hours'`,
      `user_id = '${s.laura}'`,
      `token_hash = '${OTRO_HASH}'`,
    ]) {
      await expect(banco.comoServicio(() => banco.sql(
        `update public.rescates set ${cambio} where id = $1`, [id])), cambio).rejects.toThrow(/solo se cierra/);
    }
    await cerrar(id, 'cancelado_el');
  });

  it('un rescate cancelado no se reabre ni se usa', async () => {
    const id = await pedir(s.gabi);
    await cerrar(id, 'cancelado_el');
    await expect(banco.comoServicio(() => banco.sql(
      `update public.rescates set cancelado_el = null where id = $1`, [id]))).rejects.toThrow(/una sola vez/);
    await expect(cerrar(id, 'confirmado_el')).rejects.toThrow(/ya no cambia/);
  });

  it('sin confirmar no se usa', async () => {
    const id = await pedir(s.gabi);
    await expect(cerrar(id, 'usado_el')).rejects.toThrow(/rescates_se_usa_confirmado/);
    await cerrar(id, 'cancelado_el');
  });

  it('uno abierto por persona: un segundo pedido mientras hay uno en curso no entra', async () => {
    const id = await pedir(s.gabi);
    await expect(pedir(s.gabi, OTRO_HASH)).rejects.toThrow(/rescates_uno_abierto/);
    await cerrar(id, 'cancelado_el');
    /* Cerrado el primero, se puede pedir otro. */
    const otro = await pedir(s.gabi, OTRO_HASH);
    await cerrar(otro, 'cancelado_el');
  });
});
