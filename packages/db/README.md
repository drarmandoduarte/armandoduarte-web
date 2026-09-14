# `packages/db` — migraciones y esquema

**Vacío hasta la orden del consultorio.** No hay tabla, no hay migración, no hay
tipo generado. La orden #01 es la web pública: no toca base.

No es un paquete del workspace todavía —no tiene `package.json`— y eso es
deliberado: una carpeta con un `package.json` vacío entra a `pnpm -r`, pide un
script `test` que no existe y le enseña al guardián de guardianes a tolerar una
suite fantasma. Cuando haya esquema, nace con su `package.json` y con su piso.

## La regla que llega antes que la primera tabla

> **Ninguna política de RLS se copia de Bitácora ni de Omnia. Todas se
> reescriben.**

Armando es un **tercer modelo de inquilino** (`01 Documentos/docs/inventario-armando.md`):

| App | Dueño del dato | Cómo se expresa |
|---|---|---|
| Bitácora | el profesional | `professional_id`, RLS `auth.uid() = professional_id` |
| Omnia | la clínica | `clinica_id` + rol en `miembros` |
| **Códice** | **la organización, con dos poblaciones** | miembros con rol **y territorio**, más **alumnos**, que no son miembros |

Dos cosas lo hacen distinto de Omnia: el **territorio** —Diana ve lo
internacional, Gabi ve México, y eso decide qué filas existen para esa sesión,
no solo qué botones se dibujan— y los **alumnos**, una población entera que no
es miembro de nada y que jamás debe ver una fila de pacientes.

Una policy copiada funciona con una persona y filtra datos en silencio cuando
entra la segunda. Con fichas clínicas de por medio, eso no es un bug: es un
incidente.
