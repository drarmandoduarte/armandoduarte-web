/**
 * (12) El bucket de comprobantes, que es el único lugar de v1 donde un archivo
 * de una persona vive en algún lado.
 *
 * Lo que se prueba son las **policies sobre `storage.objects`**, que son filas
 * como cualquier otra. Lo que NO se prueba, y está dicho para que no se lea como
 * «todo»: no se sube un archivo de verdad, así que el tope de 5 MB y los tres
 * tipos MIME —que los aplica el servicio de Storage y no una policy— se afirman
 * solo como **declaración del bucket**.
 *
 * La ruta es `inscripcion_id/<uuid>.<ext>` y **la primera carpeta es la
 * autorización**: así el permiso se responde sin una tabla de permisos de
 * archivos, que sería una segunda verdad al lado de `inscripciones`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, num, reventar, sembrar, type Banco, type Semilla } from './banco';

let banco: Banco;
let s: Semilla;
let deLaura: string;
let dePilar: string;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
  const inscribir = async (persona: string) => {
    const [f] = await banco.sql<{ id: string }>(
      `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`,
      [s.edicionAbierta, persona]);
    return f.id;
  };
  deLaura = await inscribir(s.laura);
  dePilar = await inscribir(s.pilar);
}, 120_000);
afterAll(async () => { await banco?.cierre(); });

const subir = (usuario: string, aal: 'aal1' | 'aal2', ruta: string) =>
  reventar(() => banco.como(usuario, aal, () => banco.sql(
    `insert into storage.objects (bucket_id, name, owner) values ('comprobantes', $1, $2)`,
    [ruta, usuario])));

const leer = (usuario: string, aal: 'aal1' | 'aal2') =>
  banco.como(usuario, aal, async () => {
    const filas = await banco.sql<{ name: string }>(
      `select name from storage.objects where bucket_id = 'comprobantes' order by name`);
    return filas.map((f) => f.name);
  });

describe('el bucket se declara privado, con su tope y sus tres tipos', () => {
  it('privado, 5 MB, jpeg/png/pdf', async () => {
    const [b] = await banco.sql<{
      public: boolean; file_size_limit: string; allowed_mime_types: string[];
    }>(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'comprobantes'`);
    expect(b.public).toBe(false);
    expect(num(b.file_size_limit)).toBe(5 * 1024 * 1024);
    expect(b.allowed_mime_types).toEqual(['image/jpeg', 'image/png', 'application/pdf']);
  });
});

describe('subir', () => {
  it('Laura sube a su inscripción', async () => {
    expect(await subir(s.laura, 'aal1', `${deLaura}/comprobante.jpg`)).toBeNull();
  });

  it('Laura NO sube a la de Pilar', async () => {
    const e = await subir(s.laura, 'aal1', `${dePilar}/colado.jpg`);
    expect(e).toMatch(/row-level security|policy/i);
  });

  it('ni a una carpeta que no es un uuid — y la policy no revienta, deniega', async () => {
    /* Un `((storage.foldername(name))[1])::uuid` a secas levanta un error de
       cast cuando la ruta no empieza con un uuid, y una policy que revienta no
       es una policy que deniega: es un 500 en vez de un «no».
       `inscripcion_de_ruta()` valida la forma antes del cast y devuelve nulo. */
    for (const ruta of ['../etc/passwd', 'suelto.jpg', 'no-es-un-uuid/x.pdf']) {
      const e = await subir(s.laura, 'aal1', ruta);
      expect(e, `la ruta «${ruta}» no fue denegada`).toMatch(/row-level security|policy/i);
      expect(e, `la ruta «${ruta}» reventó en vez de denegar`).not.toMatch(/invalid input syntax/i);
    }
  });

  it('el equipo tampoco sube por otro: subir es del cliente', async () => {
    const e = await subir(s.gabi, 'aal2', `${deLaura}/puesto-por-gabi.jpg`);
    expect(e).toMatch(/row-level security|policy/i);
  });
});

describe('leer', () => {
  beforeAll(async () => {
    await banco.como(s.pilar, 'aal1', () => banco.sql(
      `insert into storage.objects (bucket_id, name, owner) values ('comprobantes', $1, $2)`,
      [`${dePilar}/comprobante.pdf`, s.pilar]));
  });

  it('Laura ve el suyo y no el de Pilar', async () => {
    expect(await leer(s.laura, 'aal1')).toEqual([`${deLaura}/comprobante.jpg`]);
  });

  it('Gabi con aal2 lee el de Laura y NO el de Pilar', async () => {
    const vistos = await leer(s.gabi, 'aal2');
    expect(vistos).toEqual([`${deLaura}/comprobante.jpg`]);
  });

  it('Gabi con aal1 no lee ninguno', async () => {
    expect(await leer(s.gabi, 'aal1')).toEqual([]);
    // Piso al lado del cero: con aal2 sí lee uno, así que el cero es el aal.
    expect((await leer(s.gabi, 'aal2')).length).toBe(1);
  });

  it('Diana con aal2 lee el de Pilar y no el de Laura — el corte es el territorio', async () => {
    expect(await leer(s.diana, 'aal2')).toEqual([`${dePilar}/comprobante.pdf`]);
  });

  it('`anon` no ve ninguno', async () => {
    await banco.comoAnonimo(async () => {
      const filas = await banco.sql(`select name from storage.objects`);
      expect(filas).toHaveLength(0);
    });
    const [n] = await banco.sql<{ n: string }>(`select count(*) as n from storage.objects`);
    expect(num(n.n)).toBe(2);
  });
});

describe('nadie actualiza ni borra un comprobante', () => {
  it('el delete no borra nada: no hay policy', async () => {
    // Como en `miembros` y en `cursos`: un delete sin policy borra cero filas y
    // no levanta error. Se afirma mirando que el archivo siga ahí.
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `delete from storage.objects where bucket_id = 'comprobantes'`));
    const [n] = await banco.sql<{ n: string }>(`select count(*) as n from storage.objects`);
    expect(num(n.n)).toBe(2);
  });

  it('el update tampoco: Laura no puede renombrar el suyo a la carpeta de Pilar', async () => {
    await banco.como(s.laura, 'aal1', () => banco.sql(
      `update storage.objects set name = $1 where bucket_id = 'comprobantes'`,
      [`${dePilar}/robado.jpg`]));
    const [n] = await banco.sql<{ n: string }>(
      `select count(*) as n from storage.objects where name like $1`, [`${dePilar}/robado%`]);
    expect(num(n.n)).toBe(0);
  });
});
