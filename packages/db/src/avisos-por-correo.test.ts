/**
 * Avisos por correo, contra el esquema de verdad — orden #34, B.3 (migración 012).
 *
 * Los perfiles de siempre: **Armando** (dueño), **Gabi** (equipo, México),
 * **Laura** (clienta, México) y **Pilar** (clienta, España). Lo que se afirma:
 * la columna existe, nace encendida para todos, cada quien apaga **la suya** y
 * nadie la de otro —ni otra clienta, ni el equipo, ni el dueño—, y el equipo sí
 * la **lee** en su territorio, que es lo que necesita el correo de `pagos`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, sembrar, type Aal, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

const avisoDe = async (persona: string) =>
  (await banco.sql<{ avisos_por_correo: boolean }>(
    `select avisos_por_correo from public.personas where id = $1`, [persona]))[0]?.avisos_por_correo;
const apagar = (quien: string, aal: Aal, persona: string) => banco.como(quien, aal, () => banco.sql(
  `update public.personas set avisos_por_correo = false where id = $1 returning id`, [persona]));

describe('el piso', () => {
  it('EL PISO, PRIMERO: la 012 corrió — la columna es boolean, not null, default true', async () => {
    const [c] = await banco.sql<{ data_type: string; is_nullable: string; column_default: string }>(
      `select data_type, is_nullable, column_default from information_schema.columns
        where table_schema = 'public' and table_name = 'personas' and column_name = 'avisos_por_correo'`);
    expect(c).toEqual({ data_type: 'boolean', is_nullable: 'NO', column_default: 'true' });
  });

  it('nace encendida: todas las personas sembradas la tienen en true', async () => {
    const filas = await banco.sql<{ avisos_por_correo: boolean }>(`select avisos_por_correo from public.personas`);
    expect(filas.length, 'el banco sembró personas').toBeGreaterThanOrEqual(4);
    expect(filas.every((f) => f.avisos_por_correo === true)).toBe(true);
  });
});

describe('cada quien la suya', () => {
  it('EL CASO: Laura apaga la suya', async () => {
    expect(await apagar(s.laura, 'aal1', s.laura)).toHaveLength(1);
    expect(await avisoDe(s.laura)).toBe(false);
  });

  it('LA MUTACIÓN: Laura NO apaga la de Pilar — ninguna fila cambia', async () => {
    expect(await apagar(s.laura, 'aal1', s.pilar)).toEqual([]);
    expect(await avisoDe(s.pilar)).toBe(true);
  });

  it('Gabi (equipo, aal2) la ve pero no la cambia; Armando tampoco', async () => {
    expect(await apagar(s.gabi, 'aal2', s.laura)).toEqual([]);
    expect(await apagar(s.armando, 'aal2', s.pilar)).toEqual([]);
    expect(await avisoDe(s.pilar)).toBe(true);
  });

  it('el equipo la lee en su territorio (lo necesita el correo de pagos)', async () => {
    const [f] = await banco.como(s.gabi, 'aal2', () => banco.sql<{ avisos_por_correo: boolean }>(
      `select avisos_por_correo from public.personas where id = $1`, [s.laura]));
    expect(f?.avisos_por_correo).toBe(false);
  });

  it('null no entra: es sí o no', async () => {
    const filas = banco.como(s.laura, 'aal1', () => banco.sql(
      `update public.personas set avisos_por_correo = null where id = $1`, [s.laura]));
    await expect(filas).rejects.toThrow(/null/);
  });
});
