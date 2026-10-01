/**
 * Los permisos de tabla, uno por uno — migración 007.
 *
 * ── Por qué este archivo existe, y por qué no existía ───────────────────
 * Porque **el banco los regalaba**. `supabase-base.sql` reproducía lo que
 * Supabase da cuando se le deja exponer las tablas nuevas automáticamente
 * (`grant all on tables` por default privilege), y el proyecto real se creó con
 * esa opción en **no**. Las diez tablas nacían sin un solo permiso allá y con
 * los cuatro verbos acá.
 *
 * El síntoma, medido contra el proyecto real: un cliente con token válido pedía
 * `/api/yo`, `RolMiddleware.rolDe` hacía un `select` sobre `miembros`, Postgres
 * contestaba `42501 permission denied`, el middleware lo atrapaba en silencio
 * —por diseño: no autentica—, el pedido seguía sin `profile`, el `Aal2Guard`
 * fallaba cerrado y le exigía `aal2`, y la pantalla lo mandaba a enrolar un
 * autenticador. **Un cliente no podía entrar de ninguna forma**, y los 83 tests
 * de la #13 estaban en verde.
 *
 * `42501 no es RLS`: la RLS devuelve cero filas, no un error. Ésa es la
 * distinción que ninguna comprobación de esta casa sabía hacer hasta hoy.
 *
 * ── Qué afirma, y por qué «ni un verbo más ni uno menos» ────────────────
 * La tabla de abajo es, literalmente, la lista del punto 0 de la corrección de
 * la #15. Se compara **exacta**: si falta un verbo la API se cae, y si sobra
 * uno la base quedó más abierta de lo que dirección aprobó. Las dos cosas son
 * rojas y las dos se leen en el mismo lugar.
 *
 * ── Lo que NO comprueba, dicho para que el verde no se lea de más ───────
 * Que la RLS decida bien: eso lo hacen los otros 83 tests, y la RLS corre
 * **después** de esto. Un `grant` correcto sobre una policy rota abre la tabla
 * igual. Acá solo se mira la puerta de afuera.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levantarBanco, type Banco } from './banco';

/** Las diez tablas de `public`, y qué puede cada rol en cada una. */
const ESPERADO: Record<string, { anon: string[]; authenticated: string[]; service_role: string[] }> = {
  /* La fila nace del trigger `persona_nace`, que es `security definer`: sin insert. */
  personas: { anon: [], authenticated: ['select', 'update'], service_role: ['select', 'insert', 'update', 'delete'] },
  miembros: { anon: [], authenticated: ['select', 'insert', 'update'], service_role: ['select', 'insert', 'update', 'delete'] },
  /* El catálogo es lo único que se ve sin entrar. */
  cursos: { anon: ['select'], authenticated: ['select', 'insert', 'update'], service_role: ['select', 'insert', 'update', 'delete'] },
  ediciones: { anon: ['select'], authenticated: ['select', 'insert', 'update'], service_role: ['select', 'insert', 'update', 'delete'] },
  inscripciones: { anon: [], authenticated: ['select', 'insert', 'update'], service_role: ['select', 'insert', 'update', 'delete'] },
  /* El libro y la auditoría son insert-only: sin `update` para nadie salvo service_role. */
  pagos_libro: { anon: [], authenticated: ['select', 'insert'], service_role: ['select', 'insert', 'update', 'delete'] },
  auditoria: { anon: [], authenticated: ['select', 'insert'], service_role: ['select', 'insert', 'update', 'delete'] },
  datos_de_cobro: { anon: [], authenticated: ['select', 'insert', 'update'], service_role: ['select', 'insert', 'update', 'delete'] },
  /* Las dos del kit: solo lectura. La 005 revocó el resto y la 007 no se lo devuelve. */
  totp_backup_codes: { anon: [], authenticated: ['select'], service_role: ['select', 'insert', 'update', 'delete'] },
  security_devices: { anon: [], authenticated: ['select'], service_role: ['select', 'insert', 'update', 'delete'] },
};

const VERBOS = ['select', 'insert', 'update', 'delete'] as const;
const ROLES = ['anon', 'authenticated', 'service_role'] as const;

/** Las funciones que una policy invoca (o un `check`), y que por lo tanto se ejecutan con la sesión. */
const FUNCIONES = [
  'soy_dueno()', 'soy_miembro_activo()', 'con_segundo_paso()', 'veo_pais(text)',
  'curso_publicado(uuid)', 'edicion_abierta(uuid)', 'inscripcion_es_mia(uuid)',
  'veo_la_inscripcion(uuid)', 'inscripcion_de_ruta(text)', 'es_zona_iana(text)',
];

describe('la 007 pone los permisos que el proyecto no da solo', () => {
  let banco: Banco;
  /* 120 s, como los otros archivos del banco. Con el tope por defecto (10 s),
     en la gate —todos los paquetes a la vez y, desde la #24, un archivo de
     tests más en éste— levantar el banco se pasó y los cuatro tests quedaron
     «saltados»: el rojo hablaba del reloj, no de los permisos. */
  beforeAll(async () => { banco = await levantarBanco(); }, 120_000);
  afterAll(async () => { await banco?.cierre(); });

  it('EL PISO, PRIMERO: las diez tablas existen y el banco NO regala permisos', async () => {
    /* Sin la primera mitad, «los permisos son exactos» sobre un esquema vacío
       es cierto por no haber mirado ninguna tabla. Sin la segunda, todo lo de
       abajo saldría verde sobre un banco que da `grant all` por default — que
       es precisamente el estado en que esta casa vivió hasta hoy. */
    const tablas = await banco.sql<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`);
    expect(
      tablas.map((t) => t.table_name),
      'las tablas de `public` no son las diez de la #13',
    ).toEqual(Object.keys(ESPERADO).sort());

    /* La prueba de que el banco no regala: `anon` no puede leer `personas`. Si
       esto diera `true`, el default privilege seguiría abierto y la tabla de
       abajo no estaría midiendo la 007 sino la generosidad de PGlite. */
    const [regala] = await banco.sql<{ puede: boolean }>(
      `select has_table_privilege('anon', 'public.personas', 'select') as puede`);
    expect(
      regala.puede,
      'el banco le está dando `select` sobre `personas` a `anon` sin que ninguna migración lo '
      + 'pida: los default privileges no se revocaron y estos tests no prueban nada.',
    ).toBe(false);
  });

  it('cada tabla da exactamente los verbos de la orden, ni uno más ni uno menos', async () => {
    const diferencias: string[] = [];
    for (const [tabla, permitido] of Object.entries(ESPERADO)) {
      for (const rol of ROLES) {
        const tiene: string[] = [];
        for (const verbo of VERBOS) {
          const [r] = await banco.sql<{ puede: boolean }>(
            `select has_table_privilege($1, $2, $3) as puede`, [rol, `public.${tabla}`, verbo]);
          if (r.puede) tiene.push(verbo);
        }
        const esperado = permitido[rol];
        if (tiene.join(',') !== esperado.join(',')) {
          diferencias.push(
            `${tabla} · ${rol}\n    esperado: [${esperado.join(', ') || '—'}]\n    tiene:    [${tiene.join(', ') || '—'}]`,
          );
        }
      }
    }
    expect(
      diferencias,
      'La lista viene del punto 0 de la corrección de la #15. Si FALTA un verbo, la API se cae con '
      + '42501 y el síntoma no habla de permisos (habla del segundo paso). Si SOBRA uno, la base '
      + 'quedó más abierta de lo que dirección aprobó.',
    ).toEqual([]);
  });

  it('`delete` a `authenticated`: en ninguna de las diez', async () => {
    /* Sale de la tabla de arriba, pero va escrito aparte porque es la regla que
       más barato se rompe: un `grant all` de más y se borra desde la app. */
    const conDelete: string[] = [];
    for (const tabla of Object.keys(ESPERADO)) {
      const [r] = await banco.sql<{ puede: boolean }>(
        `select has_table_privilege('authenticated', $1, 'delete') as puede`, [`public.${tabla}`]);
      if (r.puede) conDelete.push(tabla);
    }
    expect(conDelete, 'desde la app no se borra nada: se desactiva o se anula').toEqual([]);
  });

  it('las secuencias y las funciones de las policies, también', async () => {
    /* Un `insert` permitido falla igual sin `usage` sobre la secuencia, y el
       error habla de la secuencia y no de la tabla: media hora buscando en el
       lugar equivocado. */
    const secuencias = await banco.sql<{ sequence_name: string }>(
      `select sequence_name from information_schema.sequences where sequence_schema = 'public' order by 1`);
    expect(secuencias.length, 'no hay secuencias en `public`: el barrido mira el vacío').toBeGreaterThan(0);

    const problemas: string[] = [];
    for (const { sequence_name: sec } of secuencias) {
      for (const rol of ['authenticated', 'service_role']) {
        const [r] = await banco.sql<{ puede: boolean }>(
          `select has_sequence_privilege($1, $2, 'usage') as puede`, [rol, `public.${sec}`]);
        if (!r.puede) problemas.push(`secuencia ${sec}: ${rol} no tiene usage`);
      }
    }

    /* Y las funciones: si el default privilege de funciones también quedó
       revocado en el proyecto, sin `execute` la RLS misma tira 42501 — el freno
       se cae por donde nadie mira. */
    for (const firma of FUNCIONES) {
      for (const rol of ['anon', 'authenticated']) {
        const [r] = await banco.sql<{ puede: boolean }>(
          `select has_function_privilege($1, $2, 'execute') as puede`, [rol, `public.${firma}`]);
        if (!r.puede) problemas.push(`función ${firma}: ${rol} no puede ejecutarla`);
      }
    }
    expect(problemas, 'la 007 da `usage` de secuencias y `execute` de las funciones que usan las policies').toEqual([]);
  });
});
