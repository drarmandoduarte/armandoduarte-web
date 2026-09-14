# armandoduarte-web

Este repo es hoy **el monorepo de Códice**: la plataforma del Dr. Armando
Duarte —web pública, y más adelante consultorio, academia y asistente—.

**Se llama así por historia.** Nació como el sitio estático de
`armandoduarte.com`, escrito a mano en HTML y CSS; ese sitio no se tiró: vive en
[`qa/referencia/`](qa/referencia/LEEME.md) y es la referencia contra la que se
mide el port a React. El día que convenga, el monorepo se extrae a su propio
repo; hasta entonces, un solo lugar, porque es el que ya tiene `main` protegido,
Vercel conectado y producción andando.

La web nace acá, y no al costado, por una razón de dirección: **raíces.** El día
que exista la academia, la página del taller tiene que ser la plantilla de
«página de curso» y no una página suelta que haya que tirar.

## Cómo se corre

```sh
nvm use            # Node 22 (.nvmrc)
pnpm install
pnpm dev           # la web en vivo
pnpm build         # dist/ con un .html por ruta (prerender)
pnpm test          # todas las suites + el guardián de fidelidad, en Chromium
```

La primera vez en una máquina hace falta el navegador: `pnpm qa:instalar`.

La gate, antes de cada commit:

```sh
pnpm check:tuteo && pnpm check:i18n && pnpm check:estilo && pnpm check:tokens \
  && pnpm check:secretos && pnpm typecheck && pnpm test \
  && pnpm --filter @codice/web build
```

## El mapa

| Carpeta | Qué es |
|---|---|
| `apps/web` | La web pública y, más adelante, las pantallas de la plataforma. Vite + React 19 + TypeScript estricto. |
| `packages/config` | El `tsconfig` base, estricto. Lo extienden todos. |
| `packages/ui` | El design system: `codice-tokens.json` (el documento), `codice-tokens.css` (su forma ejecutable), las fuentes locales y los componentes que **más de una** página comparte. |
| `packages/core` | Tipos, contratos e i18n. Es lo que la app nativa va a reusar entero. |
| `packages/db` | Migraciones y esquema. Vacío hasta la orden del consultorio. |
| `packages/prompts` | Los prompts del asistente y el perfil de estilo de escritura del doctor. **El único lugar del monorepo donde se vosea.** |
| `scripts` | Los guardianes. |
| `qa` | El piso de tests, los saltos permitidos —que los guardianes leen— y `referencia/`, el sitio estático contra el que se mide la fidelidad. |
| `docs` | `tareas.md` (la cola de órdenes y los pendientes) e `informes/` (lo que dejó cada orden). |

## Cómo se despliega

Vercel, desde `main`, con los tres comandos escritos en el `vercel.json` de la
raíz —instalar, construir, y servir `apps/web/dist`— y no en el dashboard. Es a
propósito: así el commit que cambia el repo es el mismo que cambia cómo se
construye, y no hay una ventana entre las dos cosas en la que producción sirva
cualquier cosa.

`qa/` y `docs/` no se publican: están en el `.vercelignore`.

## La regla de arriba de todo

> **Ninguna regla de negocio fuera de `packages/core`, y con test. Las pantallas
> solo muestran.**

Existe porque Armando quiere app en iPhone y Android, y la app nativa va a reusar
`core` entero: **lo que hoy se escriba dentro de un `.tsx` es lógica que mañana
hay que escribir dos veces.** No es una preferencia de arquitectura, es la
diferencia entre tener una app móvil y volver a empezar.

## La segunda: este repo es público

Y mientras lo único que contenga sea la web pública, está bien: es lo que hace
que Vercel Hobby despliegue los commits de cualquier autor sin pagar nada.

> **Nada secreto entra al repo.** Ni claves, ni tokens, ni URLs de base de
> datos, ni el código de acceso de una cortina, ni un `.env` con algo adentro.
> Lo secreto vive en las variables de entorno de Vercel y se lee con
> `process.env`; el repo solo conoce el **nombre** de la variable.

Sin excepciones. Si una orden parece pedir lo contrario, está mal escrita: se
frena y se pregunta. Lo vigila `pnpm check:secretos`, que está en la gate.

El día que entre el consultorio —fichas de pacientes, claves de Supabase— el
repo pasa a privado y eso cuesta plata: ver `docs/tareas.md`.

## La tercera, de terminología

Nunca se dice **«voz»** del doctor: se dice **estilo de escritura**. «Voz» se lee
como audio y el asistente jamás genera audio ni clona la voz real de nadie (D5).
La única excepción es cuando se está prohibiendo el audio explícitamente. Aplica
a archivos, variables, colas y scripts.
