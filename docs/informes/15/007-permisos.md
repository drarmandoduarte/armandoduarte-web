# Migración 007 · los permisos que el proyecto no da solo

Rama `mi-espacio/03-permisos`, desde `main`. PR chico y aparte, como pide la
corrección de la #15 (punto 0). **Se mergea y la corre dirección antes de que el
CEO repita F.4.**

## Qué se hizo

- `packages/db/migrations/007_permisos.sql` — los `grant` de tabla, secuencia y
  función, explícitos, tabla por tabla y verbo por verbo. Cabecera con
  `-- APLICADA: —` porque todavía no se corrió.
- `packages/db/src/banco.ts` — el banco **revoca los default privileges** antes
  de las migraciones, igual que el proyecto real.
- `packages/db/src/los-permisos-estan-puestos.test.ts` — 4 tests nuevos.
- Cuatro de los 83 cambiaron de afirmación (se endurecieron).
- `toda-tabla-lleva-rls.test.ts` aprende qué es una migración **pendiente**.

## La causa, medida

El banco regalaba permisos. `supabase-base.sql` reproducía lo que Supabase da
**cuando se le deja exponer las tablas nuevas automáticamente**:
`grant all on tables` por default privilege. El proyecto `armandoduarte-familia`
se creó con esa opción en **no** —la decisión correcta— y Supabase lo implementa
quitando `select, insert, update, delete` de esos defaults.

Las diez tablas nacían **sin un solo permiso** en producción y con los cuatro
verbos en el banco. La cadena completa del síntoma:

```
RolMiddleware.rolDe → select sobre `miembros` → 42501 permission denied
  → el middleware lo atrapa en silencio (por diseño: no autentica)
  → el pedido sigue SIN `profile`
  → Aal2Guard, que falla cerrado, exige aal2 a todo el mundo
  → 403 AAL2_REQUIRED
  → la pantalla manda a enrolar un autenticador
```

**Un cliente no podía entrar de ninguna forma, y los 83 tests estaban en verde.**
La distinción que ninguna comprobación de esta casa sabía hacer: **42501 no es
RLS**. La RLS devuelve cero filas; la falta de `grant` levanta un error.

## Lo que la 007 da, y nada más

| tabla | `anon` | `authenticated` | `service_role` |
|---|---|---|---|
| `personas` | — | select, update | los cuatro |
| `miembros` | — | select, insert, update | los cuatro |
| `cursos`, `ediciones` | **select** | select, insert, update | los cuatro |
| `inscripciones` | — | select, insert, update | los cuatro |
| `pagos_libro`, `auditoria` | — | select, **insert** (insert-only) | los cuatro |
| `datos_de_cobro` | — | select, insert, update | los cuatro |
| `totp_backup_codes`, `security_devices` | — | **select** | los cuatro |

Más `usage` de todas las secuencias de `public` a `authenticated` y
`service_role`, y `execute` sobre las **diez** funciones que una policy invoca (o
un `check`). Las otras nueve no entran: son cuerpos de trigger, o las llama otra
función `security definer` desde adentro, o no las usa nadie todavía. La lista y
el porqué de cada exclusión están en el archivo.

`delete` a `authenticated`: **en ninguna tabla**. `insert` en `personas`:
tampoco — la fila nace del trigger `persona_nace`, que es `security definer`.

**Esto es más cerrado que el default de Supabase**, que da los cuatro verbos
sobre todas las tablas presentes y futuras y deja que la RLS sea el único freno.
Acá cada verbo está escrito, y la tabla que nazca mañana no hereda nada: hay que
venir a este archivo, y eso es un renglón en un diff que alguien lee.

## Lo medido

| | |
|---|---|
| `@codice/db` | **87 tests** (83 + 4), todos en verde con los permisos reales |
| Gate | 227 declarados · 0 saltados · ninguna suite bajo su piso |
| `typecheck`, `lint`, `check:secretos/estilo/tokens/tuteo/i18n` | verdes |

### Las mutaciones

| mutación | qué cae |
|---|---|
| quitar `grant select` de `miembros` | «esperado: [select, insert, update] · tiene: [insert, update]» |
| dar `delete` a `authenticated` en `inscripciones` | el de los verbos **y** el que dice «delete en ninguna de las diez» |
| quitar el revoke del banco (volver a regalar) | el PISO: «el banco le está dando `select` sobre `personas` a `anon` sin que ninguna migración lo pida» |

La tercera sostiene a las otras dos y por eso va primero en el archivo: sin ella,
los otros miden la generosidad de PGlite.

### Cuatro de los 83 cambiaron de afirmación

No se aflojaron, **se endurecieron**: con los permisos reales el freno que corta
es el de más afuera.

| test | antes | ahora |
|---|---|---|
| `anon` no lee `datos_de_cobro` | cero filas (RLS) | `permission denied` |
| `anon` no ve las ocho tablas | ocho ceros (RLS) | ocho `permission denied` |
| nadie borra cursos | la fila sigue ahí | `permission denied` **y** la fila sigue ahí |
| un miembro se desactiva, no se borra | la fila sigue ahí | `permission denied` **y** la fila sigue ahí |

Los dos últimos afirman las **dos** mitades: el permiso porque es el que decide
hoy, y la fila porque el día que alguien devuelva el `grant` el segundo freno
tiene que seguir ahí.

### Y el inventario de migraciones aprendió qué es «pendiente»

`toda-tabla-lleva-rls.test.ts` exigía que **ninguna** dijera `APLICADA: —`. Con
la 007 sin correr, eso es falso y tenía que serlo. Ahora hay una lista
`PENDIENTES` con su motivo escrito, y **sobra tan rojo como falta**: si la 007
ya dice su fecha y la fila sigue ahí, el test se pone rojo pidiendo que se borre.
Es la misma forma que `qa/skips-permitidos.md`.

## Lo que quedó pendiente

- **Que dirección corra la 007** en `armandoduarte-familia` y complete la
  cabecera (`-- APLICADA: fecha (UY), en \`armandoduarte-familia\`, desde <commit>`)
  y borre su fila de `PENDIENTES`. Hasta entonces, un cliente no entra.

## Lo que necesita dirección

Nada. La lista de permisos es la del punto 0, verbo por verbo.
