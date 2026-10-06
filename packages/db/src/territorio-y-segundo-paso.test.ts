/**
 * El territorio (D11) y el segundo paso (Kit de Acceso, S3), afirmados
 * fila por fila sobre un Postgres de verdad.
 *
 * Es el archivo que la orden #13 llama «lo que después nadie puede saltarse desde
 * una pantalla». Las dos reglas que prueba no son de la pantalla ni de la API:
 *
 *   · **Territorio.** Gabi ve México, Diana ve lo internacional, Armando ve todo.
 *     No como botones que se dibujan o no: como **filas que existen o no existen**
 *     para esa sesión. Un botón se rodea con una petición hecha a mano.
 *   · **Segundo paso.** Lo que un miembro ve de otras personas exige `aal2` en la
 *     base. Un cliente ve lo suyo con `aal1`, porque no se le impone TOTP.
 *
 * La semilla es la de la orden §C: Armando (dueño, `todos`), Gabi (equipo,
 * `mexico`), Diana (equipo, `internacional`), Laura (clienta, MX), Pilar
 * (clienta, ES).
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

/** Los nombres que esa sesión alcanza a ver en `personas`, ordenados. */
const quienVe = (usuario: string, aal: 'aal1' | 'aal2') =>
  banco.como(usuario, aal, async () => {
    const filas = await banco.sql<{ nombre: string }>(
      `select nombre from public.personas order by nombre`,
    );
    return filas.map((f) => f.nombre);
  });

describe('el territorio decide qué filas existen', () => {
  it('(1) Gabi con aal2 ve a Laura y NO ve a Pilar', async () => {
    const vistos = await quienVe(s.gabi, 'aal2');
    expect(vistos).toContain('Laura');
    expect(vistos).not.toContain('Pilar');
  });

  it('(1) Diana con aal2 ve a Pilar y NO ve a Laura', async () => {
    const vistos = await quienVe(s.diana, 'aal2');
    expect(vistos).toContain('Pilar');
    expect(vistos).not.toContain('Laura');
  });

  it('(1) Armando con aal2 ve a las dos', async () => {
    const vistos = await quienVe(s.armando, 'aal2');
    expect(vistos).toEqual(expect.arrayContaining(['Laura', 'Pilar']));
  });

  it('el territorio sale de una sola función: MX es México, lo demás internacional', async () => {
    const [f] = await banco.sql<{ mx: string; es: string; nulo: string }>(
      `select public.territorio_de_pais('MX') as mx,
              public.territorio_de_pais('ES') as es,
              public.territorio_de_pais(null) as nulo`,
    );
    expect(f.mx).toBe('mexico');
    expect(f.es).toBe('internacional');
    /* Una persona sin país declarado cae en `internacional`. Es la decisión
       escrita en la migración 001 y va afirmada acá para que no cambie sin que
       alguien venga a cambiar este renglón. Sube a dirección en el informe. */
    expect(f.nulo).toBe('internacional');
  });
});

describe('el segundo paso vive en la base, no en la pantalla', () => {
  /* ─────────────────────────────────────────────────────────────────────────
     EL TEST QUE MÁS IMPORTA DE LA ORDEN (§C.2).

     Es el que la mutación (a) tira: quitando la policy restrictiva
     `personas_segundo_paso` de la migración 001, Gabi con `aal1` vuelve a ver a
     Laura y este test se pone rojo. Todo lo demás del archivo sigue verde, que
     es lo que lo hace un test y no un decorado.
     ───────────────────────────────────────────────────────────────────────── */
  it('(2) Gabi con aal1 NO ve a nadie que no sea ella misma', async () => {
    const vistos = await quienVe(s.gabi, 'aal1');
    expect(vistos).toEqual(['Gabi']);
  });

  it('(2) y con aal2 sí ve a las de su territorio — la diferencia es el aal y nada más', async () => {
    const conUno = await quienVe(s.gabi, 'aal1');
    const conDos = await quienVe(s.gabi, 'aal2');
    expect(conUno.length).toBe(1);
    expect(conDos.length).toBeGreaterThan(conUno.length);
  });

  it('`con_segundo_paso()` lee el claim `aal` y nada más', async () => {
    const leer = (usuario: string, aal: 'aal1' | 'aal2') =>
      banco.como(usuario, aal, async () => {
        const [f] = await banco.sql<{ ok: boolean }>(`select public.con_segundo_paso() as ok`);
        return f.ok;
      });
    expect(await leer(s.gabi, 'aal2')).toBe(true);
    expect(await leer(s.gabi, 'aal1')).toBe(false);
    // Sin sesión devuelve falso y no nulo: una booleana que puede ser nula es
    // una trampa para la próxima policy que la use.
    const [sinSesion] = await banco.sql<{ ok: boolean }>(`select public.con_segundo_paso() as ok`);
    expect(sinSesion.ok).toBe(false);
  });
});

describe('el cliente ve lo suyo, con aal1, y nada más', () => {
  it('(3) Laura ve solo su fila de personas', async () => {
    const vistos = await quienVe(s.laura, 'aal1');
    expect(vistos).toEqual(['Laura']);
  });

  it('(3) Laura no puede leer la fila de Pilar ni la de Gabi, ni nombrándolas', async () => {
    await banco.como(s.laura, 'aal1', async () => {
      const filas = await banco.sql(
        `select id from public.personas where id = any($1::uuid[])`,
        [[s.pilar, s.gabi]],
      );
      // Cero filas, y al lado lo que el barrido SÍ vio: su propia fila. Sin
      // esto, una consulta rota devolvería cero y se leería como un sí.
      expect(filas).toHaveLength(0);
      const propia = await banco.sql(`select id from public.personas`);
      expect(propia).toHaveLength(1);
    });
  });

  it('nadie cambia su mail ni su id, ni siquiera como superusuario', async () => {
    const porMail = await reventar(() =>
      banco.sql(`update public.personas set email = 'otro@ejemplo.mx' where id = $1`, [s.laura]));
    expect(porMail).toMatch(/email no se cambia/);

    const porId = await reventar(() =>
      banco.sql(`update public.personas set id = $2 where id = $1`, [s.laura, s.pilar]));
    expect(porId).toMatch(/id no se cambia/);
  });

  it('Laura edita su nombre y su zona horaria; la zona tiene que ser IANA', async () => {
    await banco.como(s.laura, 'aal1', async () => {
      await banco.sql(
        `update public.personas set nombre = 'Laura', zona_horaria = 'America/Merida' where id = $1`,
        [s.laura],
      );
    });
    const [f] = await banco.sql<{ zona_horaria: string }>(
      `select zona_horaria from public.personas where id = $1`, [s.laura]);
    expect(f.zona_horaria).toBe('America/Merida');

    // D15: nombre IANA, nunca un offset. El freno es un `check`, no el formulario.
    const conOffset = await reventar(() =>
      banco.sql(`update public.personas set zona_horaria = 'UTC-5' where id = $1`, [s.laura]));
    expect(conOffset).toMatch(/zona_horaria_iana/);
  });

  it('la persona nace por trigger al primer ingreso, con el mail y nada más', async () => {
    const [u] = await banco.sql<{ id: string }>(
      `insert into auth.users (email) values ('recien@ejemplo.mx') returning id`);
    const [p] = await banco.sql<{ email: string; nombre: string | null; pais: string | null }>(
      `select email, nombre, pais from public.personas where id = $1`, [u.id]);
    expect(p.email).toBe('recien@ejemplo.mx');
    expect(p.nombre).toBeNull();
    expect(p.pais).toBeNull();
  });
});

describe('miembros', () => {
  it('cada miembro lee su fila; el dueño lee todas, con aal2', async () => {
    const cuantos = (usuario: string, aal: 'aal1' | 'aal2') =>
      banco.como(usuario, aal, async () =>
        (await banco.sql(`select user_id from public.miembros`)).length);
    expect(await cuantos(s.gabi, 'aal2')).toBe(1);
    expect(await cuantos(s.armando, 'aal2')).toBe(3);
  });

  it('Gabi no invita a nadie: invitar es del dueño', async () => {
    const [u] = await banco.sql<{ id: string }>(
      `insert into auth.users (email) values ('aspirante@armandoduarte.com') returning id`);
    const porGabi = await reventar(() => banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.miembros (user_id, rol, territorio) values ($1, 'equipo', 'mexico')`, [u.id])));
    expect(porGabi).toMatch(/row-level security|policy/i);

    // Y el dueño sí, con aal2.
    await banco.como(s.armando, 'aal2', () => banco.sql(
      `insert into public.miembros (user_id, rol, territorio, invitado_por)
       values ($1, 'equipo', 'mexico', $2)`, [u.id, s.armando]));
    const [f] = await banco.sql<{ rol: string }>(
      `select rol from public.miembros where user_id = $1`, [u.id]);
    expect(f.rol).toBe('equipo');

    // …y con aal1 no, aunque sea el dueño.
    const [otro] = await banco.sql<{ id: string }>(
      `insert into auth.users (email) values ('otro-aspirante@armandoduarte.com') returning id`);
    const conAal1 = await reventar(() => banco.como(s.armando, 'aal1', () => banco.sql(
      `insert into public.miembros (user_id, rol, territorio) values ($1, 'equipo', 'mexico')`, [otro.id])));
    expect(conAal1).toMatch(/row-level security|policy/i);
  });

  it('un miembro se desactiva, no se borra — y desactivado deja de ver su territorio', async () => {
    await banco.como(s.armando, 'aal2', () => banco.sql(
      `update public.miembros set activo = false where user_id = $1`, [s.diana]));

    expect(await quienVe(s.diana, 'aal2')).toEqual(['Diana']);

    /* ── «Nadie borra»: dos frenos, y se afirman los dos ───────────────────
       El primero lo descubrió este test la primera vez que corrió: un `delete`
       sin policy **no levanta error**. La RLS filtra en select, update y delete
       —la fila no existe para esa sesión, así que no hay nada que borrar— y solo
       levanta excepción cuando un `with check` de insert o update no se cumple.
       Por eso «nadie borra» se afirmaba mirando que la fila siguiera ahí: un
       `expect(reventar(...))` sobre el delete habría pasado en verde el día que
       alguien agregara la policy.

       Desde la **007** hay un freno más afuera, y es el que corta hoy: a
       `authenticated` no se le da `delete` en **ninguna** tabla, así que el
       intento muere en el permiso. Se afirman los dos —el de afuera porque es
       el que decide, el de adentro porque tiene que seguir ahí el día que
       alguien devuelva el `grant`—, que es la regla de la casa: cada mitad se
       prueba por separado. */
    const e = await reventar(() => banco.como(s.armando, 'aal2', () => banco.sql(
      `delete from public.miembros where user_id = $1`, [s.diana])));
    expect(e, '`authenticated` no tiene `delete` en ninguna tabla (migración 007)').toMatch(/permission denied/i);
    const [sigue] = await banco.sql<{ n: string }>(
      `select count(*) as n from public.miembros where user_id = $1`, [s.diana]);
    expect(Number(sigue.n), 'y la fila sigue ahí: el segundo freno es la falta de policy de delete').toBe(1);

    // Se deja como estaba: los demás tests de este archivo ya corrieron, pero
    // dejar el banco torcido para el próximo que lo lea es una trampa.
    await banco.sql(`update public.miembros set activo = true where user_id = $1`, [s.diana]);
  });
});
