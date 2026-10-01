/**
 * Las consultas de la API, corridas contra el esquema de verdad.
 *
 * ── El defecto que este archivo existe para que no vuelva ───────────────
 * El 29/9/2026, con la migración `007` ya aplicada y los permisos puestos,
 * `GET /api/yo` seguía devolviendo `403 AAL2_REQUIRED` a un cliente con token
 * válido. La causa:
 *
 *     supabase.service.ts:  .eq('persona_id', personaId)   sobre `miembros`
 *     001_personas_y_miembros.sql:  create table public.miembros (user_id uuid …)
 *
 * `42703 column miembros.persona_id does not exist`. El middleware se lo tragaba
 * —por diseño: no autentica—, el pedido seguía sin `profile`, y el guard, que
 * falla cerrado, le exigía `aal2` a todo el mundo. Lo mismo en `respaldo`:
 * `persona_id` por `user_id` y `usado_en` por `used_at`, más las tres escrituras
 * hechas con el token de la persona cuando la `005` las reservó para
 * `service_role`. **Ninguna de esas consultas habría funcionado nunca.**
 *
 * ── Por qué los 48 tests de esta app estaban en verde ───────────────────
 * Porque **ninguno tocaba la base**. Todos le daban a `SupabaseService` un doble
 * que devolvía lo que el test quería, así que probaban el cableado de Nest —el
 * guard, el middleware, los decoradores— y ni una sola vez el texto de una
 * consulta. Un doble contesta igual de bien a `persona_id` que a `user_id`: es
 * la pregunta la que estaba mal, y a la pregunta no la mira nadie.
 *
 * La regla que salió de acá está en `docs/tareas.md`: **un test de la API que no
 * toca la base no prueba una consulta.**
 *
 * ── Qué hace este archivo, entonces ─────────────────────────────────────
 * Levanta el banco PGlite de `@codice/db` —un Postgres de verdad con las
 * **siete** migraciones puestas, la `007` incluida— y le corre por encima los
 * métodos de la API **sin tocarlos**: `SupabaseService.rolDe`, `personaDe`, y
 * los tres de `RespaldoController`. Lo único que se reemplaza es a quién le
 * hablan: en vez de PostgREST, un traductor que convierte la misma cadena de
 * `.from().select().eq()` en SQL y la ejecuta contra el banco, como
 * `authenticated` o como `service_role` según qué cliente haya pedido el método.
 *
 * Una columna que no existe cae acá, con `42703`. Un permiso que falta cae acá,
 * con `42501`. Los dos son los códigos que se vieron en producción.
 *
 * ── Lo que NO prueba, dicho para que el verde no se lea de más ──────────
 *   · **No es PostgREST.** El traductor entiende el pedacito del constructor que
 *     esta API usa —`select` (con `count`/`head`), `insert`, `update`, `delete`,
 *     `eq`, `is(col, null)`, `maybeSingle`— y nada más: sin `or`, sin `in`, sin
 *     embebidos, sin `order`, sin rangos. Si alguien escribe una consulta con
 *     algo de eso, el traductor **tira** en vez de inventar, y el rojo dice qué
 *     le faltó. Se prefiere así: un traductor que adivina prueba al traductor.
 *   · **No prueba la validación del token.** Acá el token ES el id de la persona
 *     y `getUserFromToken` lo devuelve sin mirar nada. De la firma se ocupa
 *     `src/el-token-se-verifica-de-verdad.spec.ts`.
 *   · **No prueba el guard ni el middleware.** Eso ya está probado en los otros
 *     archivos de esta app, y con dobles, que para eso alcanzan.
 *   · **No prueba PostgreSQL de Supabase.** PGlite trae una versión más nueva.
 *     Es la misma salvedad que `packages/db/README.md` ya declara.
 *
 * ── Y por qué el traductor vive acá adentro y no en su propio archivo ───
 * Porque `apps/familia/src/la-api-llega-compilada.test.ts` recorre el cierre de
 * la función de Vercel entrando al `src/` de cada paquete, y de ahí saltea
 * **solo** lo que termina en `.spec.ts` / `.test.ts`. Un archivo suelto de
 * ayuda metería `@codice/db` —que exporta fuente— en el cierre de algo que se
 * despliega, y el rojo de ese guardián sería correcto. Mientras esto sea
 * andamio de un test, vive en el test.
 */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { levantarBanco, sembrar, type Aal, type Banco, type Semilla } from '@codice/db';
import { SupabaseService } from './identidad/supabase.service';
import { RespaldoController } from './respaldo/respaldo.controller';
import { EquipoController } from './equipo/equipo.controller';
import { EquipoRepositorio } from './equipo/equipo.repositorio';
import type { CursoDto, EdicionNuevaDto } from './equipo/equipo.dto';
import { TalleresController } from './talleres/talleres.controller';
import { TalleresRepositorio } from './talleres/talleres.repositorio';
import { PagosController } from './pagos/pagos.controller';
import { PagosRepositorio } from './pagos/pagos.repositorio';
import type { Correo, CorreoService } from './correo/correo.service';
import { BACKUP_CODE_COUNT } from './seguridad-512/nucleo/backup-codes';

/* El constructor de `SupabaseService` exige la variable, y hace bien: es la
   regla de la orden #15 §B. Acá se le da una que no resuelve a ninguna parte,
   porque en este archivo nunca se sale a la red — `getUserFromToken` está
   reemplazado y las consultas van al banco. */
process.env.SUPABASE_URL ??= 'https://no-se-usa.invalid';

/* ── El traductor ──────────────────────────────────────────────────────── */

type Ejecutar = (sql: string, params: unknown[]) => Promise<Record<string, unknown>[]>;

interface Resultado {
  data: unknown;
  error: { code?: string; message: string } | null;
  count: number | null;
}

/**
 * La cadena de `.from(…)` que esta API escribe, convertida a SQL.
 *
 * Es `PromiseLike` y no `Promise` por la misma razón que lo es la de
 * `supabase-js`: la consulta se arma mientras se encadena y recién se ejecuta
 * cuando alguien la espera.
 */
class Consulta implements PromiseLike<Resultado> {
  private verbo: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private columnas = '*';
  private soloLaCuenta = false;
  private readonly iguales: { columna: string; valor: unknown }[] = [];
  private readonly nulas: string[] = [];
  private filas: Record<string, unknown>[] = [];
  private cambios: Record<string, unknown> = {};
  private devolver: string | null = null;
  private una = false;

  constructor(private readonly ejecutar: Ejecutar, private readonly tabla: string) {}

  select(columnas = '*', opciones?: { count?: 'exact'; head?: boolean }): this {
    if (this.verbo === 'select') {
      this.columnas = columnas;
      this.soloLaCuenta = opciones?.head === true;
    } else {
      // El `.select()` que va DESPUÉS de un `update`: es un `returning`.
      this.devolver = columnas;
    }
    return this;
  }

  insert(filas: Record<string, unknown> | Record<string, unknown>[]): this {
    this.verbo = 'insert';
    this.filas = Array.isArray(filas) ? filas : [filas];
    return this;
  }

  update(cambios: Record<string, unknown>): this {
    this.verbo = 'update';
    this.cambios = cambios;
    return this;
  }

  delete(): this {
    this.verbo = 'delete';
    return this;
  }

  eq(columna: string, valor: unknown): this {
    this.iguales.push({ columna, valor });
    return this;
  }

  is(columna: string, valor: unknown): this {
    if (valor !== null) {
      throw new Error(`El traductor solo entiende .is(columna, null); le pidieron .is('${columna}', ${String(valor)}).`);
    }
    this.nulas.push(columna);
    return this;
  }

  maybeSingle(): this {
    this.una = true;
    return this;
  }

  /** El SQL y sus parámetros, en el orden en que Postgres los espera. */
  private armar(): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const marcador = (valor: unknown) => `$${params.push(valor)}`;
    const tabla = `public.${this.tabla}`;

    const donde = () => {
      const partes = [
        ...this.iguales.map((f) => `${f.columna} = ${marcador(f.valor)}`),
        ...this.nulas.map((c) => `${c} is null`),
      ];
      return partes.length ? ` where ${partes.join(' and ')}` : '';
    };

    if (this.verbo === 'insert') {
      const columnas = Object.keys(this.filas[0] ?? {});
      if (columnas.length === 0) throw new Error('insert sin columnas');
      const valores = this.filas
        .map((fila) => `(${columnas.map((c) => marcador(fila[c])).join(', ')})`)
        .join(', ');
      return { sql: `insert into ${tabla} (${columnas.join(', ')}) values ${valores}`, params };
    }

    if (this.verbo === 'update') {
      const set = Object.entries(this.cambios).map(([c, v]) => `${c} = ${marcador(v)}`).join(', ');
      const returning = this.devolver ? ` returning ${this.devolver}` : '';
      return { sql: `update ${tabla} set ${set}${donde()}${returning}`, params };
    }

    if (this.verbo === 'delete') {
      return { sql: `delete from ${tabla}${donde()}`, params };
    }

    const que = this.soloLaCuenta ? 'count(*)::int as cuenta' : this.columnas;
    return { sql: `select ${que} from ${tabla}${donde()}`, params };
  }

  then<A = Resultado, B = never>(
    alResolver?: ((valor: Resultado) => A | PromiseLike<A>) | null,
    alFallar?: ((razon: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return this.correr().then(alResolver, alFallar);
  }

  private async correr(): Promise<Resultado> {
    const { sql, params } = this.armar();
    let filas: Record<string, unknown>[];
    try {
      filas = await this.ejecutar(sql, params);
    } catch (e) {
      /* Así es como llega un error de Postgres a la API de verdad: no tirando,
         sino en el campo `error` del resultado. Que el `code` viaje es el punto
         entero de este archivo — `42703` y `42501` son los dos que se vieron. */
      const error = e as { code?: string; message?: string };
      return { data: null, error: { code: error.code, message: error.message ?? String(e) }, count: null };
    }

    if (this.soloLaCuenta) return { data: null, error: null, count: Number(filas[0]?.cuenta ?? 0) };

    if (this.una) {
      if (filas.length > 1) {
        return { data: null, error: { code: 'PGRST116', message: 'más de una fila' }, count: null };
      }
      return { data: filas[0] ?? null, error: null, count: null };
    }

    return { data: filas, error: null, count: filas.length };
  }
}

/**
 * Un objeto con la forma que la API le pide a `supabase-js`, respaldado por el
 * banco.
 *
 * El `as unknown as SupabaseClient` es el borde: `SupabaseClient` es un tipo
 * enorme del que esta API usa `.from(…)` y —en `cerrarOtrasSesiones`, que acá no
 * se ejercita— `.auth.admin`. Tipar el resto sería copiar la biblioteca. El
 * cast está acá, en un solo lugar y en un archivo de test, y no en el código que
 * se despliega.
 */
function clienteSobreElBanco(ejecutar: Ejecutar): SupabaseClient {
  return {
    from: (tabla: string) => new Consulta(ejecutar, tabla),
    rpc: (funcion: string, argumentos?: Record<string, unknown>) => new Llamada(ejecutar, funcion, argumentos ?? {}),
    storage: { from: (bucket: string) => almacenSobreElBanco(ejecutar, bucket) },
  } as unknown as SupabaseClient;
}

/**
 * `.storage.from(bucket)` → filas de `storage.objects`, con la RLS de la 006 —
 * orden #27 C. Entiende las dos cosas que la API le pide y nada más:
 *
 *   · `remove([ruta])` → un `delete … returning`: lo que la policy deja borrar
 *     (hoy, nada: la 006 no tiene policy de borrado).
 *   · `createSignedUrl(ruta, s)` → si quien pide **puede leer** la fila, una URL
 *     de mentira (`https://firmada.invalid/…`); si no, el error que da Storage.
 *
 * No firma nada ni sube bytes: lo que se prueba es la pregunta que Storage le
 * hace a la base —«¿esta sesión ve esta fila?»—, que es donde vive la regla.
 */
function almacenSobreElBanco(ejecutar: Ejecutar, bucket: string) {
  const comoError = (e: unknown) => {
    const error = e as { code?: string; message?: string };
    return { code: error.code, message: error.message ?? String(e) };
  };
  return {
    async remove(rutas: string[]) {
      try {
        const filas = await ejecutar(
          `delete from storage.objects where bucket_id = $1 and name = any($2::text[]) returning name`, [bucket, rutas]);
        return { data: filas, error: null };
      } catch (e) {
        return { data: null, error: comoError(e) };
      }
    },
    async createSignedUrl(ruta: string, segundos: number) {
      try {
        const filas = await ejecutar(`select name from storage.objects where bucket_id = $1 and name = $2`, [bucket, ruta]);
        return filas.length === 1
          ? { data: { signedUrl: `https://firmada.invalid/${ruta}?expira=${segundos}` }, error: null }
          : { data: null, error: { message: 'Object not found' } };
      } catch (e) {
        return { data: null, error: comoError(e) };
      }
    },
  };
}

/**
 * `.rpc(nombre, { arg: valor })` → `select * from public.nombre(arg => $1)`.
 *
 * Como PostgREST: una función que devuelve una tabla da sus filas, y una que
 * devuelve un escalar (`panel_cursos()`, un `jsonb`) da el valor pelado. Los
 * argumentos van **por nombre**, igual que los manda `supabase-js`: si la API
 * escribe `{ edicion_id }` y la función se llama con `edicion`, acá cae con el
 * mismo `42883` que caería en producción. Entró con la orden #24 A.
 */
class Llamada implements PromiseLike<Resultado> {
  constructor(
    private readonly ejecutar: Ejecutar,
    private readonly funcion: string,
    private readonly argumentos: Record<string, unknown>,
  ) {}

  then<A = Resultado, B = never>(
    alResolver?: ((valor: Resultado) => A | PromiseLike<A>) | null,
    alFallar?: ((razon: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return this.correr().then(alResolver, alFallar);
  }

  private async correr(): Promise<Resultado> {
    if (!/^[a-z_]+$/.test(this.funcion)) throw new Error(`nombre de función raro: ${this.funcion}`);
    const nombres = Object.keys(this.argumentos);
    const params = nombres.map((n) => this.argumentos[n]);
    const lista = nombres.map((n, i) => `${n} => $${i + 1}`).join(', ');
    let filas: Record<string, unknown>[];
    try {
      filas = await this.ejecutar(`select * from public.${this.funcion}(${lista})`, params);
    } catch (e) {
      const error = e as { code?: string; message?: string };
      return { data: null, error: { code: error.code, message: error.message ?? String(e) }, count: null };
    }
    const columnas = Object.keys(filas[0] ?? {});
    if (filas.length === 1 && columnas.length === 1 && columnas[0] === this.funcion) {
      return { data: filas[0][this.funcion], error: null, count: null };
    }
    return { data: filas, error: null, count: filas.length };
  }
}

/**
 * El `SupabaseService` de verdad, con dos métodos cambiados: de dónde saca el
 * cliente. Todo lo demás —`rolDe`, `personaDe`, y los controladores que los
 * usan— es el código que se despliega, sin una línea de diferencia.
 *
 * El token acá **es** el id de la persona. No se valida nada: de eso se ocupa
 * el otro archivo.
 */
class ServicioContraElBanco extends SupabaseService {
  constructor(private readonly banco: Banco, private readonly aal: Aal) {
    super();
  }

  override async getUserFromToken(token: string | undefined): Promise<{ id: string }> {
    if (!token || token.trim() === '') throw new UnauthorizedException('Falta el token de acceso.');
    return { id: token };
  }

  override comoElUsuario(token: string): SupabaseClient {
    /* Cada consulta abre y cierra su propia sesión, igual que PostgREST: una
       llamada, un rol. Por eso `usar()` puede leer como la persona y quemar
       como el servicio sin que una sesión le pise el rol a la otra. */
    return clienteSobreElBanco((sql, params) =>
      this.banco.como(token, this.aal, () => this.banco.sql(sql, params)));
  }

  override comoElServicio(): SupabaseClient {
    return clienteSobreElBanco((sql, params) =>
      this.banco.comoServicio(() => this.banco.sql(sql, params)));
  }
}

/** Un pedido con lo único que estos métodos le leen: el header. */
const pedidoDe = (token: string) => ({ headers: { authorization: `Bearer ${token}` } });

/* ── Los tests ─────────────────────────────────────────────────────────── */

let banco: Banco;
let s: Semilla;

beforeAll(async () => {
  banco = await levantarBanco();
  s = await sembrar(banco);
});

afterAll(async () => {
  await banco?.cierre();
});

const servicio = (aal: Aal = 'aal1') => new ServicioContraElBanco(banco, aal);

describe('el piso: el banco es el de verdad', () => {
  it('las migraciones están puestas y las tablas que la API consulta existen', async () => {
    /* EL PISO, Y VA PRIMERO: todo lo de abajo afirma que una consulta anduvo.
       Sobre un banco vacío, «anduvo» y «no había nada que romper» se parecen
       demasiado. Acá se cuenta lo que el banco sí tiene. */
    const tablas = await banco.sql<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
        order by table_name`);
    expect(tablas.map((t) => t.table_name)).toContain('miembros');
    expect(tablas.map((t) => t.table_name)).toContain('personas');
    expect(tablas.map((t) => t.table_name)).toContain('totp_backup_codes');
    expect(tablas.length, 'las diez tablas de la #13').toBeGreaterThanOrEqual(10);

    /* Y que los permisos de la 007 estén puestos: sin ellos todo lo de abajo
       fallaría con 42501 y el rojo hablaría de la tabla equivocada. */
    const [permiso] = await banco.sql<{ tiene: boolean }>(
      `select has_table_privilege('authenticated', 'public.miembros', 'select') as tiene`);
    expect(permiso.tiene, 'la 007 no corrió en este banco').toBe(true);
  });
});

describe('SupabaseService, contra el esquema', () => {
  it('rolDe: quien no tiene fila en `miembros` es `cliente`, y la consulta no falla', async () => {
    /* Es EL caso del defecto: Laura es una clienta sin membresía. Con
       `persona_id` esto no devolvía `cliente`, tiraba 42703 y terminaba en un
       403 pidiéndole un autenticador. */
    await expect(servicio().rolDe(s.laura, s.laura)).resolves.toBe('cliente');
  });

  it('rolDe: el dueño es `dueno` y una integrante del equipo es `equipo`', async () => {
    expect(await servicio('aal2').rolDe(s.armando, s.armando)).toBe('dueno');
    expect(await servicio('aal2').rolDe(s.gabi, s.gabi)).toBe('equipo');
  });

  it('personaDe: devuelve la fila propia con las seis columnas que la pantalla usa', async () => {
    const persona = await servicio().personaDe(s.laura, s.laura);
    expect(persona).toMatchObject({ id: s.laura, nombre: 'Laura', pais: 'MX' });
    /* Que las seis columnas existan es la mitad del punto: un `zona_horaria`
       mal escrito sería otro 42703 en la misma ruta. */
    expect(Object.keys(persona as object).sort()).toEqual(
      ['apellido', 'id', 'nombre', 'pais', 'whatsapp', 'zona_horaria']);
  });
});

describe('RespaldoController, contra el esquema', () => {
  const controlador = (aal: Aal = 'aal2') => new RespaldoController(servicio(aal));

  it('generar: deja diez códigos hasheados en `totp_backup_codes`', async () => {
    const { codigos } = await controlador().generar(pedidoDe(s.armando));
    expect(codigos).toHaveLength(BACKUP_CODE_COUNT);

    const filas = await banco.sql<{ user_id: string; code_hash: string; used_at: string | null }>(
      `select user_id, code_hash, used_at from public.totp_backup_codes where user_id = $1`,
      [s.armando]);
    expect(filas).toHaveLength(BACKUP_CODE_COUNT);
    /* Ni uno en claro: lo guardado es el scrypt, y ninguno de los diez que
       salieron por la respuesta aparece tal cual en la tabla. */
    expect(filas.filter((f) => codigos.includes(f.code_hash))).toEqual([]);
    expect(filas.every((f) => f.used_at === null)).toBe(true);
  });

  it('cuantos: cuenta los que quedan sin usar, con el token de la persona', async () => {
    const { quedan, de } = await controlador().cuantos(pedidoDe(s.armando));
    expect({ quedan, de }).toEqual({ quedan: BACKUP_CODE_COUNT, de: BACKUP_CODE_COUNT });
  });

  it('usar: quema un código válido y el contador baja', async () => {
    const { codigos } = await controlador().generar(pedidoDe(s.gabi));
    /* `usar` se llama desde la pantalla de entrada, con la sesión en aal1: es
       el caso que el `@SinSegundoPaso` de esa ruta declara. */
    const resultado = await controlador('aal1').usar(pedidoDe(s.gabi), { codigo: codigos[0] });
    expect(resultado).toEqual({ ok: true, quedan: BACKUP_CODE_COUNT - 1 });

    const { quedan } = await controlador().cuantos(pedidoDe(s.gabi));
    expect(quedan).toBe(BACKUP_CODE_COUNT - 1);

    /* Y el mismo código no vale dos veces. */
    await expect(controlador('aal1').usar(pedidoDe(s.gabi), { codigo: codigos[0] }))
      .rejects.toThrow('Ese código no es válido o ya se usó.');
  });

  it('usar: un código que no es de nadie no entra', async () => {
    await expect(controlador('aal1').usar(pedidoDe(s.gabi), { codigo: 'ZZZZZZZZZZ' }))
      .rejects.toThrow('Ese código no es válido o ya se usó.');
  });

  it('los códigos de una persona no los ve otra', async () => {
    /* La RLS de la `005`, probada donde importa: con el token de Laura, la
       misma consulta de `cuantos` no ve los de Armando. */
    const { quedan } = await controlador().cuantos(pedidoDe(s.laura));
    expect(quedan).toBe(0);
  });
});

describe('EquipoController (/api/equipo), contra el esquema — orden #24 A', () => {
  const panel = (aal: Aal = 'aal2') => {
    const servicioDelPanel = servicio(aal);
    return new EquipoController(servicioDelPanel, new EquipoRepositorio(servicioDelPanel));
  };
  /** El código que viaja en el cuerpo del error, que es lo que la pantalla lee. */
  const codigoDe = async (promesa: Promise<unknown>) => {
    try {
      await promesa;
      return null;
    } catch (e) {
      const cuerpo = (e as { getResponse?: () => unknown }).getResponse?.() as { code?: string } | undefined;
      return cuerpo?.code ?? (e as Error).message;
    }
  };

  beforeAll(async () => {
    for (const quien of [s.laura, s.pilar]) {
      await banco.como(quien, 'aal1', () => banco.sql(
        `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2)`, [s.edicionAbierta, quien]));
    }
  });

  it('cursos: el dueño ve los dos cursos, con la cuenta de anotados', async () => {
    const { cursos } = await panel().cursos(pedidoDe(s.armando)) as { cursos: { id: string; ediciones: { inscriptos: number }[] }[] };
    expect(cursos).toHaveLength(2);
    expect(cursos.find((c) => c.id === s.cursoPublicado)?.ediciones[0].inscriptos).toBe(2);
  });

  it('inscriptos: Gabi ve a Laura y no a Pilar; el dueño ve a las dos', async () => {
    const deGabi = await panel().inscriptos(pedidoDe(s.gabi), s.edicionAbierta) as { inscriptos: { nombre: string }[] };
    expect(deGabi.inscriptos.map((f) => f.nombre)).toEqual(['Laura']);
    const deArmando = await panel().inscriptos(pedidoDe(s.armando), s.edicionAbierta) as { inscriptos: { nombre: string }[] };
    expect(deArmando.inscriptos.map((f) => f.nombre).sort()).toEqual(['Laura', 'Pilar']);
  });

  it('clientes: Diana ve a Pilar y no a Laura', async () => {
    const { clientes } = await panel().clientes(pedidoDe(s.diana)) as { clientes: { nombre: string }[] };
    expect(clientes.map((c) => c.nombre)).toContain('Pilar');
    expect(clientes.map((c) => c.nombre)).not.toContain('Laura');
  });

  it('un cliente no entra al panel: 403 SOLO_EQUIPO en todas las lecturas', async () => {
    expect(await codigoDe(panel('aal1').cursos(pedidoDe(s.laura)))).toBe('SOLO_EQUIPO');
    expect(await codigoDe(panel('aal1').clientes(pedidoDe(s.laura)))).toBe('SOLO_EQUIPO');
    expect(await codigoDe(panel('aal1').inscriptos(pedidoDe(s.laura), s.edicionAbierta))).toBe('SOLO_EQUIPO');
  });

  it('crear y editar un curso; un slug repetido es 409 SLUG_REPETIDO', async () => {
    const curso: CursoDto = {
      titulo: 'Taller de otoño', bajada: null, descripcion: null,
      modalidad: 'en_linea', slug: 'taller-de-otono', estado: 'borrador',
    };
    await panel().crearCurso(pedidoDe(s.gabi), curso);
    const [fila] = await banco.sql<{ id: string }>(`select id from public.cursos where slug = 'taller-de-otono'`);
    await panel().editarCurso(pedidoDe(s.gabi), fila.id, { ...curso, titulo: 'Taller de otoño 2026' });
    const [editado] = await banco.sql<{ titulo: string }>(`select titulo from public.cursos where id = $1`, [fila.id]);
    expect(editado.titulo).toBe('Taller de otoño 2026');
    expect(await codigoDe(panel().crearCurso(pedidoDe(s.gabi), curso))).toBe('SLUG_REPETIDO');
  });

  it('crear una edición con zona IANA; con una zona inventada la base dice NO_VALIDO', async () => {
    const edicion: EdicionNuevaDto = {
      curso_id: s.cursoBorrador,
      inicio: '2026-12-01T15:00:00.000Z', fin: '2026-12-01T18:00:00.000Z', zona: 'America/Merida',
      sede: 'En línea', ciudad: null, pais: null, cupo: 30, precio_monto: 500, precio_moneda: 'MXN',
      inscripciones_hasta: null, estado: 'abierta',
    };
    await panel().crearEdicion(pedidoDe(s.armando), edicion);
    expect(await codigoDe(panel().crearEdicion(pedidoDe(s.armando), { ...edicion, zona: 'Marte/Olimpo' }))).toBe('NO_VALIDO');
  });

  it('sumar al equipo: Gabi no puede (SOLO_DUENO); el dueño suma a Laura y después la quita', async () => {
    expect(await codigoDe(panel().sumar(pedidoDe(s.gabi), { persona_id: s.laura, territorio: 'mexico' }))).toBe('SOLO_DUENO');
    await panel().sumar(pedidoDe(s.armando), { persona_id: s.laura, territorio: 'mexico' });
    expect(await servicio('aal2').rolDe(s.laura, s.laura)).toBe('equipo');
    await panel().quitar(pedidoDe(s.armando), s.laura);
    expect(await servicio('aal2').rolDe(s.laura, s.laura)).toBe('cliente');
    /* Y se la puede volver a sumar: la fila desactivada se reactiva. */
    await panel().sumar(pedidoDe(s.armando), { persona_id: s.laura, territorio: 'internacional' });
    const [fila] = await banco.sql<{ activo: boolean; territorio: string }>(
      `select activo, territorio from public.miembros where user_id = $1`, [s.laura]);
    expect(fila).toEqual({ activo: true, territorio: 'internacional' });
  });

  it('el dueño no se quita ni se cambia a sí mismo', async () => {
    expect(await codigoDe(panel().quitar(pedidoDe(s.armando), s.armando))).toBe('NO_VALIDO');
    expect(await codigoDe(panel().sumar(pedidoDe(s.armando), { persona_id: s.armando, territorio: 'mexico' }))).toBe('NO_VALIDO');
  });
});

describe('TalleresController (/api/talleres), contra el esquema — orden #24 B', () => {
  const talleres = () => {
    const servicioDelCliente = servicio('aal1');
    return new TalleresController(servicioDelCliente, new TalleresRepositorio(servicioDelCliente));
  };
  const codigoDe = async (promesa: Promise<unknown>) => {
    try {
      await promesa;
      return null;
    } catch (e) {
      const cuerpo = (e as { getResponse?: () => unknown }).getResponse?.() as { code?: string } | undefined;
      return cuerpo?.code ?? (e as Error).message;
    }
  };
  /* Dos personas nuevas, recién entradas: solo el correo y el país. Las de la
     semilla ya las usaron los bloques de arriba (Laura terminó en el equipo). */
  let rosa: string;
  let sofia: string;
  let llena: string;
  let cerrada: string;

  beforeAll(async () => {
    const nueva = async (email: string) => {
      const [u] = await banco.sql<{ id: string }>(`insert into auth.users (email) values ($1) returning id`, [email]);
      await banco.sql(`update public.personas set pais = 'MX' where id = $1`, [u.id]);
      return u.id;
    };
    rosa = await nueva('rosa@ejemplo.mx');
    sofia = await nueva('sofia@ejemplo.mx');
    const edicion = async (cupo: number, estado: string) => {
      const [e] = await banco.sql<{ id: string }>(
        `insert into public.ediciones (curso_id, inicio, fin, zona, cupo, inscripciones_hasta, estado)
         values ($1, now() + interval '60 days', now() + interval '60 days 3 hours', 'America/Merida', $2,
                 now() + interval '30 days', $3) returning id`, [s.cursoPublicado, cupo, estado]);
      return e.id;
    };
    llena = await edicion(1, 'abierta');
    cerrada = await edicion(10, 'cerrada');
  });

  it('sin los datos que faltan no se anota: 400 FALTAN_DATOS, y no queda inscripción', async () => {
    expect(await codigoDe(talleres().inscribirme(pedidoDe(rosa), { edicion_id: s.edicionAbierta }))).toBe('FALTAN_DATOS');
    const [{ n }] = await banco.sql<{ n: number }>(`select count(*)::int as n from public.inscripciones where persona_id = $1`, [rosa]);
    expect(n).toBe(0);
  });

  it('con los datos, se anota: completa la ficha, devuelve AD- y, sin cuenta cargada, cobro nulo', async () => {
    const r = await talleres().inscribirme(pedidoDe(rosa), {
      edicion_id: s.edicionAbierta, nombre: 'Rosa', apellido: 'Prueba', whatsapp: '+52 999 123 4567',
    });
    expect(r.referencia).toMatch(/^AD-\d{4,}$/);
    expect(r.ya_estaba).toBe(false);
    expect(r.cobro, 'datos_de_cobro está vacía: la pantalla ofrece WhatsApp').toBeNull();
    const [ficha] = await banco.sql(`select nombre, apellido, whatsapp from public.personas where id = $1`, [rosa]);
    expect(ficha).toEqual({ nombre: 'Rosa', apellido: 'Prueba', whatsapp: '+52 999 123 4567' });
  });

  it('la segunda vez devuelve la misma referencia con ya_estaba; con la cuenta cargada, la trae', async () => {
    /* Una cuenta de PRUEBA, sembrada como superusuario: ninguna CLABE real entra al repo. */
    await banco.sql(`insert into public.datos_de_cobro (banco, titular, clabe, concepto_sugerido)
                     values ('Banco de prueba', 'Titular de prueba', '000000000000000000', 'Tu referencia')`);
    const primera = await banco.sql<{ referencia: string }>(
      `select referencia from public.inscripciones where persona_id = $1`, [rosa]);
    const r = await talleres().inscribirme(pedidoDe(rosa), { edicion_id: s.edicionAbierta });
    expect(r).toMatchObject({ referencia: primera[0].referencia, ya_estaba: true });
    expect(r.cobro).toEqual({ banco: 'Banco de prueba', titular: 'Titular de prueba', clabe: '000000000000000000', concepto_sugerido: 'Tu referencia' });
  });

  it('cupo lleno: 409 SIN_LUGARES; edición cerrada: 409 EDICION_CERRADA', async () => {
    await talleres().inscribirme(pedidoDe(rosa), { edicion_id: llena });
    const conDatos = { nombre: 'Sofía', apellido: 'Prueba', whatsapp: '+52 999 765 4321' };
    expect(await codigoDe(talleres().inscribirme(pedidoDe(sofia), { edicion_id: llena, ...conDatos }))).toBe('SIN_LUGARES');
    expect(await codigoDe(talleres().inscribirme(pedidoDe(sofia), { edicion_id: cerrada, ...conDatos }))).toBe('EDICION_CERRADA');
  });

  it('GET: Rosa ve sus talleres y su referencia; Sofía no ve nada de Rosa', async () => {
    const deRosa = await talleres().talleres(pedidoDe(rosa)) as { abiertos: { edicion_id: string; mi_referencia: string | null }[]; mios: unknown[] };
    expect(deRosa.mios).toHaveLength(2);
    expect(deRosa.abiertos.find((t) => t.edicion_id === s.edicionAbierta)?.mi_referencia).toMatch(/^AD-/);
    const deSofia = await talleres().talleres(pedidoDe(sofia)) as typeof deRosa;
    expect(deSofia.mios).toEqual([]);
    expect(deSofia.abiertos.every((t) => t.mi_referencia === null)).toBe(true);
  });
});

describe('PagosController (/api/pagos), contra el esquema — orden #27 C', () => {
  /* Dos clientas nuevas: Clara en México y Eva en España. Las de la semilla
     ya las usaron los bloques de arriba. */
  let clara: string;
  let eva: string;
  let deClara: string;
  let deEva: string;
  const correos: Correo[] = [];
  const correoDeMentira = { enviar: async (c: Correo) => { correos.push(c); return true; } } as unknown as CorreoService;

  const pagos = (aal: Aal) => {
    const servicioDePagos = servicio(aal);
    return new PagosController(servicioDePagos, new PagosRepositorio(servicioDePagos), correoDeMentira);
  };
  const codigoDe = async (promesa: Promise<unknown>) => {
    try {
      await promesa;
      return null;
    } catch (e) {
      const cuerpo = (e as { getResponse?: () => unknown }).getResponse?.() as { code?: string } | undefined;
      return cuerpo?.code ?? (e as Error).message;
    }
  };
  /** Lo que hace la pantalla antes de llamar a la API: subir con la sesión del cliente (policy de la 006). */
  const subir = async (quien: string, inscripcion: string) => {
    const ruta = `${inscripcion}/${crypto.randomUUID()}.pdf`;
    await banco.como(quien, 'aal1', () => banco.sql(
      `insert into storage.objects (bucket_id, name, owner) values ('comprobantes', $1, $2)`, [ruta, quien]));
    return ruta;
  };
  const declaracion = (inscripcion: string, ruta: string, monto = 1500) => ({
    inscripcion_id: inscripcion, comprobante_path: ruta, fecha_transferencia: '2026-10-01',
    monto, moneda: 'MXN', banco: 'Banco de prueba', ultimos4_o_folio: '0000',
  });
  const estado = async (inscripcion: string) =>
    (await banco.sql<{ e: string }>(`select public.estado_inscripcion($1) as e`, [inscripcion]))[0].e;

  beforeAll(async () => {
    const nueva = async (email: string, nombre: string, pais: string) => {
      const [u] = await banco.sql<{ id: string }>(`insert into auth.users (email) values ($1) returning id`, [email]);
      await banco.sql(`update public.personas set nombre = $2, pais = $3 where id = $1`, [u.id, nombre, pais]);
      const [i] = await banco.sql<{ id: string }>(
        `insert into public.inscripciones (edicion_id, persona_id) values ($1, $2) returning id`, [s.edicionAbierta, u.id]);
      return [u.id, i.id];
    };
    [clara, deClara] = await nueva('clara@ejemplo.mx', 'Clara', 'MX');
    [eva, deEva] = await nueva('eva@ejemplo.es', 'Eva', 'ES');
  });

  it('EL PISO, PRIMERO: las dos inscripciones están y su libro está vacío', async () => {
    expect(await estado(deClara)).toBe('pendiente_de_pago');
    expect(await estado(deEva)).toBe('pendiente_de_pago');
  });

  it('declarar con el archivo de la carpeta de otra inscripción: 403 RUTA_AJENA', async () => {
    const deOtra = await subir(eva, deEva);
    expect(await codigoDe(pagos('aal1').declarar(pedidoDe(clara), declaracion(deClara, deOtra)))).toBe('RUTA_AJENA');
  });

  it('declarar sobre la inscripción de otra persona: 403 SIN_PERMISO (la base no se la deja ver)', async () => {
    const ruta = `${deEva}/${crypto.randomUUID()}.pdf`;
    expect(await codigoDe(pagos('aal1').declarar(pedidoDe(clara), declaracion(deEva, ruta)))).toBe('SIN_PERMISO');
    expect(await estado(deEva)).toBe('pendiente_de_pago');
  });

  it('si el insert falla (un monto que la base no acepta), se intenta borrar el archivo; HOY queda, porque la 006 no deja borrar', async () => {
    const ruta = await subir(clara, deClara);
    expect(await codigoDe(pagos('aal1').declarar(pedidoDe(clara), declaracion(deClara, ruta, -1)))).toBe('NO_VALIDO');
    expect(await estado(deClara)).toBe('pendiente_de_pago');
    const quedo = await banco.sql(`select 1 from storage.objects where name = $1`, [ruta]);
    expect(quedo, 'si esto cambia, alguien agregó una policy de borrado: actualizar el informe y este test').toHaveLength(1);
  });

  it('Clara sube y declara → en revisión; una segunda declaración: 409 NO_ESPERA_COMPROBANTE', async () => {
    const ruta = await subir(clara, deClara);
    await expect(pagos('aal1').declarar(pedidoDe(clara), declaracion(deClara, ruta))).resolves.toEqual({ ok: true, estado: 'en_revision' });
    expect(await estado(deClara)).toBe('en_revision');
    const otra = await subir(clara, deClara);
    expect(await codigoDe(pagos('aal1').declarar(pedidoDe(clara), declaracion(deClara, otra)))).toBe('NO_ESPERA_COMPROBANTE');
  });

  it('ver el comprobante: Clara el suyo; Gabi (México, aal2) también; Diana (internacional) no', async () => {
    expect((await pagos('aal1').comprobante(pedidoDe(clara), deClara)).url).toMatch(new RegExp(`^https://firmada\\.invalid/${deClara}/`));
    expect((await pagos('aal2').comprobante(pedidoDe(s.gabi), deClara)).url).toMatch(/^https:\/\/firmada\.invalid\//);
    expect(await codigoDe(pagos('aal2').comprobante(pedidoDe(s.diana), deClara))).toBe('SIN_COMPROBANTE');
  });

  it('resolver: una clienta 403 SOLO_EQUIPO; Diana no la ve (404 NO_EXISTE); sin motivo, 400 FALTA_MOTIVO', async () => {
    expect(await codigoDe(pagos('aal1').resolver(pedidoDe(eva), { inscripcion_id: deClara, tipo: 'confirmado' }))).toBe('SOLO_EQUIPO');
    expect(await codigoDe(pagos('aal2').resolver(pedidoDe(s.diana), { inscripcion_id: deClara, tipo: 'confirmado' }))).toBe('NO_EXISTE');
    expect(await codigoDe(pagos('aal2').resolver(pedidoDe(s.gabi), { inscripcion_id: deClara, tipo: 'rechazado' }))).toBe('FALTA_MOTIVO');
    expect(await estado(deClara)).toBe('en_revision');
  });

  it('Gabi rechaza con motivo → pendiente; Clara lo ve en «Mis talleres» con el motivo, su id y el precio', async () => {
    await expect(pagos('aal2').resolver(pedidoDe(s.gabi), { inscripcion_id: deClara, tipo: 'rechazado', nota: 'El monto no coincide' }))
      .resolves.toEqual({ ok: true, correo: 'enviado' });
    expect(await estado(deClara)).toBe('pendiente_de_pago');
    const servicioDeClara = servicio('aal1');
    const { mios } = await new TalleresController(servicioDeClara, new TalleresRepositorio(servicioDeClara)).talleres(pedidoDe(clara)) as unknown as {
      mios: { inscripcion_id: string; motivo_rechazo: string | null; tiene_comprobante: boolean; precio_monto: unknown; estado: string }[];
    };
    expect(mios).toHaveLength(1);
    expect(mios[0]).toMatchObject({ inscripcion_id: deClara, motivo_rechazo: 'El monto no coincide', tiene_comprobante: true, estado: 'pendiente_de_pago' });
    expect(Number(mios[0].precio_monto)).toBe(1500);
    expect(correos.at(-1)).toMatchObject({ para: 'clara@ejemplo.mx' });
    expect(correos.at(-1)?.texto).toContain('El monto no coincide');
  });

  it('Clara declara otra vez y Gabi confirma → confirmada, con el monto declarado y el correo con la fecha en Mérida', async () => {
    const ruta = await subir(clara, deClara);
    await pagos('aal1').declarar(pedidoDe(clara), declaracion(deClara, ruta));
    await expect(pagos('aal2').resolver(pedidoDe(s.gabi), { inscripcion_id: deClara, tipo: 'confirmado' }))
      .resolves.toEqual({ ok: true, correo: 'enviado' });
    expect(await estado(deClara)).toBe('confirmada');
    const [r] = await banco.sql<{ monto: string; hecho_por: string }>(
      `select monto, hecho_por from public.pagos_libro where inscripcion_id = $1 and tipo = 'confirmado'`, [deClara]);
    expect(Number(r.monto)).toBe(1500);
    expect(r.hecho_por).toBe(s.gabi);
    expect(correos.at(-1)?.asunto).toMatch(/^Tu lugar en El arte de amar a tu hijo adolescente está confirmado · AD-/);
  });

  it('anular: Gabi no (403 SOLO_DUENO); Armando sí → anulada', async () => {
    expect(await codigoDe(pagos('aal2').resolver(pedidoDe(s.gabi), { inscripcion_id: deClara, tipo: 'anulado', nota: 'Pidió la devolución' }))).toBe('SOLO_DUENO');
    await pagos('aal2').resolver(pedidoDe(s.armando), { inscripcion_id: deClara, tipo: 'anulado', nota: 'Pidió la devolución' });
    expect(await estado(deClara)).toBe('anulada');
  });

  it('Inscriptos trae el libro junto a cada fila: Gabi ve a Clara anulada, con la firma y el comprobante', async () => {
    const servicioDelPanel = servicio('aal2');
    const { inscriptos } = await new EquipoController(servicioDelPanel, new EquipoRepositorio(servicioDelPanel))
      .inscriptos(pedidoDe(s.gabi), s.edicionAbierta) as { inscriptos: Record<string, unknown>[] };
    const fila = inscriptos.find((f) => f.inscripcion_id === deClara)!;
    expect(fila).toMatchObject({ nombre: 'Clara', estado: 'anulada', ultimo_tipo: 'anulado', ultimo_por: 'Armando', ultima_nota: 'Pidió la devolución' });
    expect(fila.comprobante_path).toMatch(new RegExp(`^${deClara}/`));
    expect(inscriptos.find((f) => f.inscripcion_id === deEva), 'Eva es de España: Gabi no la ve').toBeUndefined();
  });
});
