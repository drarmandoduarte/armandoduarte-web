/**
 * Lo que `anon` ve, que es la decisión de la migración 002: **el catálogo se ve
 * sin entrar; inscribirse no.**
 *
 * Es lo que hace que la ficha del taller tenga precio y fecha en un link que se
 * comparte por WhatsApp sin que eso abra una sola fila de una persona. Y es una
 * afirmación de dos mitades, porque las dos se rompen distinto: que el curso
 * publicado **sí** se vea (si no, la web queda vacía y nadie lo nota hasta que
 * alguien entra) y que **nada más** se vea (si no, los datos de las personas
 * quedan en una consulta pública).
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

describe('(4) sin sesión', () => {
  it('ve el curso publicado y su edición', async () => {
    await banco.comoAnonimo(async () => {
      const cursos = await banco.sql<{ slug: string }>(`select slug from public.cursos`);
      expect(cursos.map((c) => c.slug)).toEqual(['el-arte-de-amar-a-tu-hijo-adolescente']);

      const ediciones = await banco.sql<{ id: string; sede: string }>(
        `select id, sede from public.ediciones`);
      expect(ediciones).toHaveLength(1);
      expect(ediciones[0].id).toBe(s.edicionAbierta);
      expect(ediciones[0].sede).toBe('Fiesta Inn');
    });
  });

  it('NO ve el borrador — ni el curso ni su edición', async () => {
    await banco.comoAnonimo(async () => {
      const borrador = await banco.sql(
        `select id from public.cursos where id = $1`, [s.cursoBorrador]);
      expect(borrador).toHaveLength(0);
      const suEdicion = await banco.sql(
        `select id from public.ediciones where id = $1`, [s.edicionDelBorrador]);
      expect(suEdicion).toHaveLength(0);
      // El piso, al lado del cero: el barrido SÍ ve el catálogo publicado, así
      // que los dos ceros de arriba son una decisión y no una consulta rota.
      const publicados = await banco.sql(`select id from public.cursos`);
      expect(publicados).toHaveLength(1);
    });
  });

  it('NO ve personas, ni miembros, ni inscripciones, ni el libro, ni los datos de cobro, ni la auditoría', async () => {
    await banco.comoAnonimo(async () => {
      for (const tabla of [
        'personas', 'miembros', 'inscripciones', 'pagos_libro',
        'datos_de_cobro', 'auditoria', 'totp_backup_codes', 'security_devices',
      ]) {
        const filas = await banco.sql(`select * from public.${tabla}`);
        expect(filas, `anon alcanzó a ver filas de ${tabla}`).toHaveLength(0);
      }
    });
    // Y el piso: como superusuario esas tablas SÍ tienen filas. Sin esto, un
    // esquema vacío daría ocho ceros y se leería como ocho aciertos.
    const [f] = await banco.sql<{ n: string }>(`select count(*) as n from public.personas`);
    expect(Number(f.n)).toBeGreaterThan(0);
  });

  it('tampoco escribe: no puede inscribirse ni cargar un curso', async () => {
    await banco.comoAnonimo(async () => {
      for (const consulta of [
        `insert into public.inscripciones (edicion_id, persona_id) values ('${s.edicionAbierta}', '${s.laura}')`,
        `insert into public.cursos (slug, titulo, modalidad) values ('colado', 'Colado', 'en_linea')`,
      ]) {
        let reventó = false;
        try { await banco.sql(consulta); } catch { reventó = true; }
        expect(reventó, `anon pudo correr: ${consulta}`).toBe(true);
      }
    });
  });
});

describe('el equipo ve el borrador, y solo con aal2', () => {
  it('Gabi con aal2 ve los dos cursos; con aal1, solo el publicado', async () => {
    const cuantos = (aal: 'aal1' | 'aal2') => banco.como(s.gabi, aal, async () =>
      (await banco.sql(`select id from public.cursos`)).length);
    expect(await cuantos('aal2')).toBe(2);
    expect(await cuantos('aal1')).toBe(1);
  });

  it('el catálogo no se parte por territorio: Diana ve el mismo curso mexicano que Gabi', async () => {
    // Un curso no es de nadie. Lo que se parte por territorio son las personas y
    // sus inscripciones, no el contenido — y queda afirmado para que nadie le
    // agregue un `veo_pais()` a estas policies «por coherencia».
    const cuantos = (usuario: string) => banco.como(usuario, 'aal2', async () =>
      (await banco.sql(`select id from public.cursos`)).length);
    expect(await cuantos(s.diana)).toBe(await cuantos(s.gabi));
  });

  it('el equipo carga y edita cursos; nadie los borra, se archivan', async () => {
    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `insert into public.cursos (slug, titulo, modalidad) values ('curso-de-gabi', 'Curso de Gabi', 'en_linea')`));
    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `update public.cursos set estado = 'archivado' where slug = 'curso-de-gabi'`));
    const [f] = await banco.sql<{ estado: string }>(
      `select estado from public.cursos where slug = 'curso-de-gabi'`);
    expect(f.estado).toBe('archivado');

    // Borrar no levanta error: borra cero filas, porque no hay policy de delete.
    // Se afirma mirando que la fila siga ahí (ver la nota en
    // `territorio-y-segundo-paso.test.ts`).
    await banco.como(s.gabi, 'aal2', () => banco.sql(
      `delete from public.cursos where slug = 'curso-de-gabi'`));
    const [n] = await banco.sql<{ n: string }>(
      `select count(*) as n from public.cursos where slug = 'curso-de-gabi'`);
    expect(Number(n.n)).toBe(1);
  });
});

describe('la edición lleva su reloj, y es IANA', () => {
  it('la de Mérida guarda `America/Merida`, no un offset', async () => {
    const [f] = await banco.sql<{ zona: string }>(
      `select zona from public.ediciones where id = $1`, [s.edicionAbierta]);
    expect(f.zona).toBe('America/Merida');
  });

  it('un offset no entra (D15)', async () => {
    let reventó = false;
    try {
      await banco.sql(
        `insert into public.ediciones (curso_id, inicio, fin, zona)
         values ($1, now(), now() + interval '2 hours', '-05:00')`, [s.cursoPublicado]);
    } catch { reventó = true; }
    expect(reventó).toBe(true);
  });

  it('una edición que termina antes de empezar no entra', async () => {
    let reventó = false;
    try {
      await banco.sql(
        `insert into public.ediciones (curso_id, inicio, fin, zona)
         values ($1, now() + interval '2 hours', now(), 'America/Merida')`, [s.cursoPublicado]);
    } catch { reventó = true; }
    expect(reventó).toBe(true);
  });
});
