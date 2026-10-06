/**
 * El banco de pruebas de las migraciones.
 *
 * **Copiado de Omnia (`packages/db/src/banco.ts`) como mecanismo, y se declara.**
 * Lo que viene de allá es la forma de ejecutar migraciones contra un Postgres de
 * verdad; no vino ni una policy. Las de Códice están escritas de cero
 * (`packages/db/README.md`).
 *
 * Levanta un Postgres **de verdad** —PGlite, el mismo Postgres compilado a
 * WebAssembly— dentro del proceso de los tests, le pone encima el entorno de
 * Supabase (`supabase-base.sql`) y le corre las migraciones del repo, todas, en
 * orden y sin tocar una coma. Lo que corre acá es exactamente el archivo que
 * Germán va a pegar en el editor SQL de `armandoduarte-familia`.
 *
 * Por qué existe: las reglas de este esquema —que Gabi no vea a una persona de
 * España, que el libro no se pueda corregir, que un renglón del libro no se pueda
 * firmar por otro— **no son reglas de la pantalla**. Viven en checks, en triggers
 * y en policies, y la única forma honesta de verificarlas es ejecutarlas. Un test
 * que simule la base prueba la simulación.
 *
 * No toca Supabase, no toca la red, no necesita Docker ni un demonio corriendo.
 * Nace vacío en cada suite y muere con ella.
 *
 * ── Lo que este banco tiene y el de Omnia no: el `aal` ────────────────────
 * `como(usuarioId, aal, hacer)` lleva el nivel de autenticación en los claims.
 * Sin eso no se puede probar S3 del Kit de Acceso —«lo que un miembro ve
 * de otras personas exige `aal2` en la base, no solo en la API»—, que es el test
 * que más importa de la orden #13.
 *
 * ── Lo que el banco NO prueba, dicho para que no se lea como «todo» ───────
 *   · **La RLS de `service_role`.** Lleva `bypassrls` y probar eso sería probar
 *     que `bypassrls` bypassea. Lo que sí se prueba con ese rol desde la
 *     corrección de la #15 es lo otro: que las consultas de la API **existan**
 *     —tabla, columna y permiso—, que es lo único que `bypassrls` no tapa. Para
 *     eso está `comoServicio()`.
 *   · **Storage de verdad.** No se sube un archivo: se prueban las policies sobre
 *     `storage.objects`, que son filas como cualquier otra. El tope de 5 MB y los
 *     tres tipos MIME los aplica el servicio de Storage, no una policy; acá se
 *     comprueba que el bucket los **declare**.
 *   · **La versión de Postgres.** PGlite trae 18.x y el proyecto de Supabase corre
 *     una anterior. Nada de estas seis migraciones usa sintaxis posterior a
 *     Postgres 15, pero la diferencia existe y queda escrita.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PAQUETE = join(AQUI, '..');
const MIGRACIONES = join(PAQUETE, 'migrations');
const BASE = join(PAQUETE, 'supabase-base.sql');

/** El nivel de autenticación, tal como Supabase lo pone en el JWT. */
export type Aal = 'aal1' | 'aal2';

/** Los archivos de migración, en el orden en que los corre dirección. */
export function migracionesEnOrden(): string[] {
  return readdirSync(MIGRACIONES)
    .filter((f) => /^\d{3}_.*\.sql$/.test(f))
    .sort();
}

export interface Banco {
  /** Corre SQL crudo como superusuario y devuelve las filas. */
  sql<T = Record<string, unknown>>(consulta: string, params?: unknown[]): Promise<T[]>;
  /** Un archivo SQL entero, con varias sentencias y sin parámetros: una semilla, como se corre en Supabase. */
  script(texto: string): Promise<void>;
  /**
   * Corre algo como ese usuario, con el rol `authenticated` —el mismo con el que
   * PostgREST atiende al navegador, y por lo tanto el único que choca contra la
   * RLS— y con el `aal` que se le pase.
   *
   * Vuelve al rol de superusuario al terminar, pase lo que pase.
   */
  como<T>(usuarioId: string, aal: Aal, hacer: () => Promise<T>): Promise<T>;
  /** Lo mismo, sin sesión: el rol `anon`, que es con el que se ve la web. */
  comoAnonimo<T>(hacer: () => Promise<T>): Promise<T>;
  /**
   * Lo mismo con el rol `service_role`, que es el de la API cuando usa la clave
   * de administrador.
   *
   * **No sirve para probar RLS** —lleva `bypassrls`— y por eso el banco no lo
   * tuvo hasta la corrección de la #15. Sirve para lo que `bypassrls` NO tapa:
   * que la tabla exista, que la columna exista y que el `grant` esté puesto. Un
   * `42703` se lo come igual que cualquiera, y ése fue el defecto que llegó a
   * producción: `totp_backup_codes.persona_id`, que no existe.
   */
  comoServicio<T>(hacer: () => Promise<T>): Promise<T>;
  cierre(): Promise<void>;
}

/** Un Postgres limpio con el entorno de Supabase y todas las migraciones aplicadas. */
export async function levantarBanco(): Promise<Banco> {
  const db = new PGlite();
  await db.exec(readFileSync(BASE, 'utf8'));

  /*
   * ── Y acá el banco aprende lo que le faltó, que costó un despliegue ──────
   *
   * `supabase-base.sql` reproduce lo que Supabase da **cuando se le deja
   * exponer las tablas nuevas automáticamente**: `grant all on tables` por
   * default privilege, y la RLS como único freno. El proyecto
   * `armandoduarte-familia` se creó con esa opción en **no** —que es la
   * decisión correcta— y Supabase lo implementa quitando `select, insert,
   * update, delete` de esos defaults.
   *
   * Resultado: en producción las diez tablas nacían sin un solo permiso, acá
   * nacían con los cuatro, y los 83 tests de la #13 pasaban en verde sobre una
   * base que no se parecía a la de verdad. Un cliente con token válido recibía
   * `42501 permission denied for table miembros` y la pantalla lo mandaba a
   * enrolar un autenticador. **El banco no probaba nada sobre permisos porque
   * el banco los regalaba.**
   *
   * Esto se corre ANTES de las migraciones a propósito: así alcanza a todo lo
   * que ellas creen, igual que en el proyecto. Lo que cada rol puede hacer a
   * partir de acá lo dice la `007`, tabla por tabla y verbo por verbo, y
   * `los-permisos-estan-puestos.test.ts` lo afirma uno por uno.
   */
  await db.exec(`
    alter default privileges in schema public
      revoke select, insert, update, delete on tables from anon, authenticated, service_role;
    alter default privileges in schema public
      revoke usage, select, update on sequences from anon, authenticated, service_role;
    alter default privileges in schema public
      revoke execute on functions from anon, authenticated, service_role;
  `);

  const archivos = migracionesEnOrden();
  /* Un piso, y va antes de correr nada: si el glob se rompe —una carpeta que se
     mueve, un renombre— `readdirSync` devuelve `[]`, las migraciones «corren»
     sin error y los tests fallan después hablando de tablas que no existen. Con
     esto, el rojo dice la causa. */
  if (archivos.length < 14) {
    throw new Error(
      `el banco encontró ${archivos.length} migraciones en ${MIGRACIONES} y hoy son 14 `
      + '(seis de la #13, la 007 de permisos, la 008 del panel, la 009 de «me anoto», la 010 del libro en el panel, la 011 del perfil, '
      + 'la 012 de los avisos, la 013 de los rescates y la 014 de ajustes y papelera). '
      + 'O el glob no las ve, o alguien las movió: no se corrió nada.',
    );
  }

  for (const archivo of archivos) {
    const sql = readFileSync(join(MIGRACIONES, archivo), 'utf8');
    try {
      await db.exec(sql);
    } catch (e) {
      // Sin el nombre del archivo, un error de sintaxis en la 004 parece un
      // error del test. Con él, se abre el archivo y se arregla.
      throw new Error(`migracion ${archivo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function sql<T = Record<string, unknown>>(consulta: string, params?: unknown[]): Promise<T[]> {
    const r = await db.query<T>(consulta, params as never[]);
    return r.rows;
  }

  async function conSesion<T>(claims: string | null, rol: string, hacer: () => Promise<T>): Promise<T> {
    // Los claims van por parámetro y no interpolados: un uuid viene de un test,
    // pero la costumbre de interpolar es la que un día mete una comilla.
    await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims ?? '']);
    await db.exec(`set role ${rol};`);
    try {
      return await hacer();
    } finally {
      // `reset role` incluso si la prueba explotó: si no, el test siguiente
      // correría como `authenticated` sin saberlo y sus fallas serían mentira.
      await db.exec(`reset role;`);
      await db.query(`select set_config('request.jwt.claims', $1, false)`, ['']);
    }
  }

  const como = <T>(usuarioId: string, aal: Aal, hacer: () => Promise<T>) =>
    conSesion(JSON.stringify({ sub: usuarioId, aal }), 'authenticated', hacer);

  const comoAnonimo = <T>(hacer: () => Promise<T>) => conSesion(null, 'anon', hacer);

  const comoServicio = <T>(hacer: () => Promise<T>) =>
    conSesion(JSON.stringify({ role: 'service_role' }), 'service_role', hacer);

  async function script(texto: string): Promise<void> {
    await db.exec(texto);
  }

  return { sql, script, como, comoAnonimo, comoServicio, cierre: () => db.close() };
}

/* ── Sembrado ──────────────────────────────────────────────────────────────── */

/**
 * La semilla mínima de la orden #13 §C, escrita **como superusuario**: sembrar
 * por RLS sería probar la RLS al sembrar, y entonces un fallo del sembrado se
 * confundiría con un fallo de lo que se quiere probar.
 *
 * Los nombres son los de la orden, que son los de las personas de verdad del
 * caso: Armando dueño con territorio `todos`, Gabi equipo en México, Diana equipo
 * en lo internacional, Laura clienta mexicana, Pilar clienta española.
 */
export interface Semilla {
  armando: string;
  gabi: string;
  diana: string;
  laura: string;
  pilar: string;
  cursoPublicado: string;
  cursoBorrador: string;
  edicionAbierta: string;
  edicionDelBorrador: string;
}

/** Un usuario de `auth.users` y su `personas`, que nace por trigger. */
async function sembrarPersona(
  banco: Banco,
  email: string,
  campos: { nombre?: string; pais?: string } = {},
): Promise<string> {
  const [u] = await banco.sql<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`,
    [email],
  );
  // La fila de `personas` la creó el trigger `personas_nacen_con_el_usuario`.
  // Acá solo se completa lo que la persona completaría desde el formulario.
  await banco.sql(
    `update public.personas set nombre = coalesce($2, nombre), pais = coalesce($3, pais) where id = $1`,
    [u.id, campos.nombre ?? null, campos.pais ?? null],
  );
  return u.id;
}

export async function sembrar(banco: Banco): Promise<Semilla> {
  const armando = await sembrarPersona(banco, 'armando@armandoduarte.com', { nombre: 'Armando', pais: 'MX' });
  const gabi = await sembrarPersona(banco, 'gabi@armandoduarte.com', { nombre: 'Gabi', pais: 'MX' });
  const diana = await sembrarPersona(banco, 'diana@armandoduarte.com', { nombre: 'Diana', pais: 'MX' });
  const laura = await sembrarPersona(banco, 'laura@ejemplo.mx', { nombre: 'Laura', pais: 'MX' });
  const pilar = await sembrarPersona(banco, 'pilar@ejemplo.es', { nombre: 'Pilar', pais: 'ES' });

  await banco.sql(
    `insert into public.miembros (user_id, rol, territorio) values
       ($1, 'dueno', 'todos'), ($2, 'equipo', 'mexico'), ($3, 'equipo', 'internacional')`,
    [armando, gabi, diana],
  );

  const [publicado] = await banco.sql<{ id: string }>(
    `insert into public.cursos (slug, titulo, modalidad, estado)
     values ('el-arte-de-amar-a-tu-hijo-adolescente', 'El arte de amar a tu hijo adolescente', 'presencial', 'publicado')
     returning id`,
  );
  const [borrador] = await banco.sql<{ id: string }>(
    `insert into public.cursos (slug, titulo, modalidad, estado)
     values ('taller-que-todavia-no-sale', 'Taller que todavia no sale', 'en_linea', 'borrador')
     returning id`,
  );

  // La edición de Mérida: `America/Merida`, y las inscripciones abiertas hasta
  // dentro de treinta días para que no dependan del día en que corran los tests.
  const [abierta] = await banco.sql<{ id: string }>(
    `insert into public.ediciones
       (curso_id, inicio, fin, zona, sede, ciudad, pais, cupo,
        precio_monto, precio_moneda, inscripciones_hasta, estado)
     values ($1, now() + interval '40 days', now() + interval '40 days 4 hours',
             'America/Merida', 'Fiesta Inn', 'Merida', 'MX', 60,
             1500.00, 'MXN', now() + interval '30 days', 'abierta')
     returning id`,
    [publicado.id],
  );
  const [delBorrador] = await banco.sql<{ id: string }>(
    `insert into public.ediciones
       (curso_id, inicio, fin, zona, pais, inscripciones_hasta, estado)
     values ($1, now() + interval '90 days', now() + interval '90 days 3 hours',
             'America/Merida', 'MX', now() + interval '80 days', 'abierta')
     returning id`,
    [borrador.id],
  );

  return {
    armando, gabi, diana, laura, pilar,
    cursoPublicado: publicado.id,
    cursoBorrador: borrador.id,
    edicionAbierta: abierta.id,
    edicionDelBorrador: delBorrador.id,
  };
}

/**
 * Espera que algo reviente y devuelve el mensaje para poder mirarlo. Devuelve
 * `null` si NO reventó, que es lo que hace que el test pueda afirmar las dos
 * cosas: que falló, y con qué motivo.
 */
export async function reventar(hacer: () => Promise<unknown>): Promise<string | null> {
  try {
    await hacer();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/** `numeric` vuelve de Postgres como string; sin esto, comparar da sorpresas. */
export function num(v: unknown): number {
  return Number(v);
}
