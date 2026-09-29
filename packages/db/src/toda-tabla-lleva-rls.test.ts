/**
 * (13) El censo: **toda tabla de `public` tiene RLS habilitada.**
 *
 * Es el único test de este paquete que no mira una regla: mira que las reglas
 * existan. Cae el día que alguien agregue una migración con una tabla sin
 * `enable row level security` — que es el defecto más barato de cometer y el más
 * caro de descubrir, porque una tabla sin RLS no se ve distinta desde ninguna
 * pantalla: simplemente devuelve todo a todos.
 *
 * Va con su piso, como manda la casa: al lado del «ninguna sin RLS» va **cuántas
 * sí vio**. Un censo que solo afirma un cero no distingue una casa limpia de un
 * glob roto —o de un esquema que no se creó—.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, migracionesEnOrden, type Banco } from './banco';

/** Las diez tablas que la orden #13 deja. El número es medido, no estimado. */
const TABLAS_ESPERADAS = [
  'auditoria', 'cursos', 'datos_de_cobro', 'ediciones', 'inscripciones',
  'miembros', 'pagos_libro', 'personas', 'security_devices', 'totp_backup_codes',
];

let banco: Banco;
beforeAll(async () => { banco = await levantarBanco(); }, 120_000);
afterAll(async () => { await banco?.cierre(); });

const tablas = () => banco.sql<{ relname: string; relrowsecurity: boolean }>(
  `select c.relname, c.relrowsecurity
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname`,
);

describe('el censo de RLS', () => {
  it('EL PISO, PRIMERO: las diez tablas de la orden #13 están', async () => {
    /* Va antes de la afirmación que sostiene. Si corriera después, un esquema a
       medio crear daría «ninguna tabla sin RLS» —porque no hay tablas— y el
       verde hablaría de lo que no es. */
    const nombres = (await tablas()).map((t) => t.relname);
    expect(nombres).toEqual(TABLAS_ESPERADAS);
  });

  it('ninguna tabla de `public` está sin RLS', async () => {
    const sinRls = (await tablas()).filter((t) => !t.relrowsecurity).map((t) => t.relname);
    expect(sinRls, 'estas tablas no tienen RLS habilitada').toEqual([]);
  });

  it('y el censo sabe ver una que no la tenga — probado con una de mentira', async () => {
    /* Un test que exige cero no está terminado hasta que se lo vio encontrar
       algo. Se crea una tabla sin RLS, se comprueba que el censo la caza, y se
       borra. Sin esto, un `relrowsecurity` mal escrito daría una lista vacía
       para siempre y este archivo sería un adorno. */
    await banco.sql(`create table public.tabla_de_mentira (id int)`);
    const cazadas = (await tablas()).filter((t) => !t.relrowsecurity).map((t) => t.relname);
    expect(cazadas).toEqual(['tabla_de_mentira']);
    await banco.sql(`drop table public.tabla_de_mentira`);
    expect((await tablas()).filter((t) => !t.relrowsecurity)).toEqual([]);
  });
});

/**
 * Las migraciones que **todavía no corrió dirección**, con su motivo.
 *
 * ── Por qué una lista y no una regla ────────────────────────────────────
 * Es la misma forma que `qa/skips-permitidos.md`: una fila con su razón, que
 * alguien tiene que escribir y alguien tiene que borrar. Una regla del tipo «la
 * última puede estar pendiente» se cumpliría sola para siempre y dejaría de
 * decir nada; una fila obliga a venir dos veces —al escribirla y al sacarla— y
 * las dos veces se ven en un diff.
 *
 * **Y sobra tan rojo como falta**: si una de acá ya dice su fecha, el test de
 * abajo se pone rojo pidiendo que se borre la fila. Un permiso que sobra es una
 * mentira con formato de tabla.
 */
const PENDIENTES: Record<string, string> = {
  '007_permisos.sql':
    'los GRANT que el proyecto no da solo (corrección de la #15, punto 0). La corre dirección '
    + 'en `armandoduarte-familia` y completa su cabecera; hasta entonces un cliente no entra.',
};

describe('las migraciones', () => {
  it('son siete, numeradas de tres dígitos y en orden', async () => {
    expect(migracionesEnOrden()).toEqual([
      '001_personas_y_miembros.sql',
      '002_cursos_y_ediciones.sql',
      '003_inscripciones_y_libro.sql',
      '004_datos_de_cobro_y_auditoria.sql',
      '005_seguridad_512.sql',
      '006_storage_comprobantes.sql',
      '007_permisos.sql',
    ]);
  });

  it('cada una declara su cabecera, y la línea APLICADA que solo completa Germán', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    for (const archivo of migracionesEnOrden()) {
      const texto = readFileSync(join(import.meta.dirname, '..', 'migrations', archivo), 'utf8');
      expect(texto, `${archivo}: falta «QUÉ TRAE»`).toMatch(/QUÉ TRAE/);
      expect(texto, `${archivo}: falta la orden que la aprobó`).toMatch(/ORDEN QUE LA APROBÓ|Códice #13/);
      expect(texto, `${archivo}: falta la línea APLICADA`).toMatch(/^-- APLICADA: /m);
    }
  });

  it('las corridas están aplicadas y dicen dónde, cuándo y desde qué commit; las pendientes, declaradas', async () => {
    /* ── La fecha de vencimiento se cumplió, y por eso este test cambió ──────
       Hasta el 29/9/2026 esta afirmación era la contraria: «ninguna se aplicó
       todavía; las seis dicen APLICADA: —», con un comentario que decía que el
       día que se corrieran se iba a poner rojo y obligar a alguien a venir. Pasó
       exactamente eso, y se lo vio en rojo antes de tocarlo:

         × ninguna se aplicó todavía: las seis dicen «APLICADA: —»
           AssertionError: expected [] to have a length of 6 but got +0

       Lo que NO se hizo es aflojar la afirmación para devolverla a verde. Un test
       que se actualiza para volver a pasar sin cambiar lo que dice es un test
       apagado con cara de test. Éste cambió de afirmación porque cambió el mundo:
       ahora vigila que la cabecera **siga contando la verdad**, que es lo que a
       partir de hoy se puede perder en silencio.

       ── Qué vigila ahora, y por qué cada parte ────────────────────────────
       Las tres cosas que hacen falta para poder reconstruir qué hay en la base
       mirando solo el repo: **dónde** se corrió, **cuándo**, y **desde qué
       commit**. La tercera es la que más vale: es la que permite saber qué SQL
       exacto se ejecutó, porque el archivo de hoy puede no ser el de aquel día.

       Y el commit se compara **entre las seis**, no contra una copia escrita acá:
       las seis se corrieron en la misma sesión, así que si una dice otro commit,
       o alguien la rehízo o alguien copió mal la cabecera. Comparar contra un
       `fd93eab` escrito en este archivo sería vigilar la copia y no el hecho —la
       lección de la #06 con el token duplicado—. */
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const leer = (a: string) =>
      readFileSync(join(import.meta.dirname, '..', 'migrations', a), 'utf8');

    /* EL PISO, PRIMERO: sin esto, «ninguna quedó en —» sobre una lista vacía de
       migraciones se lee igual que sobre las siete en orden. */
    const archivos = migracionesEnOrden();
    expect(archivos.length, 'el barrido no encontró las migraciones').toBeGreaterThanOrEqual(7);

    const pendiente = (a: string) => a in PENDIENTES;
    const corridas = archivos.filter((a) => !pendiente(a));

    const sinAplicar = corridas.filter((a) => /^-- APLICADA: —\s*$/m.test(leer(a)));
    expect(
      sinAplicar,
      'estas migraciones siguen diciendo «APLICADA: —» y no están en PENDIENTES. O se corrieron y '
      + 'falta completar la cabecera, o falta declararlas como pendientes con su motivo.',
    ).toEqual([]);

    /* Y al revés, que es la mitad que se olvida: una fila de PENDIENTES que ya
       dice su fecha es una fila que sobra, y hay que venir a borrarla. */
    const yaCorridas = Object.keys(PENDIENTES)
      .filter((a) => archivos.includes(a) && !/^-- APLICADA: —\s*$/m.test(leer(a)));
    expect(
      yaCorridas,
      'estas migraciones están declaradas como pendientes y su cabecera ya dice cuándo se '
      + 'corrieron: se borra la fila de PENDIENTES. Una lista de excepciones que no se limpia se '
      + 'convierte en una lista de mentiras.',
    ).toEqual([]);

    /* Y que las declaradas existan: una fila que nombra un archivo que no está
       tapa el hueco que debería denunciar. */
    const fantasmas = Object.keys(PENDIENTES).filter((a) => !archivos.includes(a));
    expect(fantasmas, 'PENDIENTES nombra migraciones que no existen').toEqual([]);

    const cabeceras = corridas.map((a) => {
      const texto = leer(a);
      const linea = texto.match(/^-- APLICADA: (.+)$/m)?.[1] ?? '';
      const bloque = texto.slice(texto.indexOf('-- APLICADA:'), texto.indexOf('-- APLICADA:') + 400);
      return {
        archivo: a,
        proyecto: /armandoduarte-familia/.test(bloque),
        fecha: /\b29\/9\/2026 02:34\b/.test(linea),
        commit: bloque.match(/\bdesde ([0-9a-f]{7,40})\b/)?.[1] ?? null,
        /* Cada una dice con qué nombre quedó guardada en el editor SQL, y ese
           nombre es el suyo: es lo que permite encontrarla allá sin adivinar. */
        guardadaComoSuNombre: bloque.includes(`\`${a.replace(/\.sql$/, '')}\``),
      };
    });

    expect(
      cabeceras.filter((c) => !c.proyecto).map((c) => c.archivo),
      'la cabecera no nombra el proyecto donde se corrió',
    ).toEqual([]);
    expect(
      cabeceras.filter((c) => !c.fecha).map((c) => c.archivo),
      'la cabecera no lleva la fecha y la hora en que se corrió',
    ).toEqual([]);
    expect(
      cabeceras.filter((c) => !c.commit).map((c) => c.archivo),
      'la cabecera no dice desde qué commit se corrió, que es lo que permite saber qué SQL se ejecutó',
    ).toEqual([]);
    expect(
      cabeceras.filter((c) => !c.guardadaComoSuNombre).map((c) => c.archivo),
      'la cabecera no dice con qué nombre quedó guardada en el editor SQL, o dice el de otra',
    ).toEqual([]);

    /* Las seis, el mismo commit: se corrieron en una sola sesión. */
    expect(
      [...new Set(cabeceras.map((c) => c.commit))],
      'las seis se corrieron en la misma sesión y desde el mismo commit: si hay dos, una cabecera miente',
    ).toHaveLength(1);
  });
});

describe('las funciones de las policies', () => {
  it('las cinco de la migración 001 existen, y las de territorio son `security definer`', async () => {
    const filas = await banco.sql<{ proname: string; prosecdef: boolean; config: string[] | null }>(
      `select p.proname, p.prosecdef, p.proconfig as config
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('territorio_de_pais','soy_miembro_activo','soy_dueno','veo_pais','con_segundo_paso')
        order by p.proname`);
    expect(filas.map((f) => f.proname)).toEqual([
      'con_segundo_paso', 'soy_dueno', 'soy_miembro_activo', 'territorio_de_pais', 'veo_pais',
    ]);

    // Las tres que leen `miembros` van `security definer`, porque si no caerían
    // en la recursión de la RLS de esa misma tabla.
    for (const nombre of ['soy_dueno', 'soy_miembro_activo', 'veo_pais']) {
      const f = filas.find((x) => x.proname === nombre)!;
      expect(f.prosecdef, `${nombre} tendría que ser security definer`).toBe(true);
    }
  });

  it('TODA función `security definer` de `public` lleva el `search_path` fijo', async () => {
    /* Una `security definer` corre con los privilegios de quien la creó. Sin
       `search_path` fijo, alguien que pudiera anteponer un esquema propio le
       cambiaría el significado a `miembros` desde afuera. Es una regla de las
       que se olvidan en la función número once, así que la vigila un test y no
       la memoria. */
    const sinCamino = await banco.sql<{ proname: string }>(
      `select p.proname
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef
          and (p.proconfig is null
               or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
        order by p.proname`);
    expect(sinCamino.map((f) => f.proname)).toEqual([]);

    // Piso: cuántas security definer SÍ vio. Sin esto, una consulta rota daría
    // una lista vacía y se leería como que están todas bien.
    const [n] = await banco.sql<{ n: string }>(
      `select count(*) as n from pg_proc p join pg_namespace nn on nn.oid = p.pronamespace
        where nn.nspname = 'public' and p.prosecdef`);
    expect(Number(n.n)).toBeGreaterThanOrEqual(8);
  });
});
