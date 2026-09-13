# Códice

El monorepo de la plataforma del **Dr. Armando Duarte**: consultorio, academia y
asistente. Su primer contenido es **la web pública** (`armandoduarte.com`),
portada a React componente por componente.

La web nace acá, y no al costado, por una razón de dirección: **raíces.** El día
que exista la academia, la página del taller tiene que ser la plantilla de
«página de curso» y no una página suelta que haya que tirar.

## Cómo se corre

```sh
nvm use            # Node 22 (.nvmrc)
pnpm install
pnpm dev           # la web en vivo
pnpm build         # dist/ con un .html por ruta (prerender)
```

La gate, antes de cada commit:

```sh
pnpm check:tuteo && pnpm check:i18n && pnpm check:estilo && pnpm check:tokens \
  && pnpm typecheck && pnpm test && pnpm --filter @codice/web build
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
| `qa` | El piso de tests y los saltos permitidos, que los guardianes leen. |

## La regla de arriba de todo

> **Ninguna regla de negocio fuera de `packages/core`, y con test. Las pantallas
> solo muestran.**

Existe porque Armando quiere app en iPhone y Android, y la app nativa va a reusar
`core` entero: **lo que hoy se escriba dentro de un `.tsx` es lógica que mañana
hay que escribir dos veces.** No es una preferencia de arquitectura, es la
diferencia entre tener una app móvil y volver a empezar.

## La otra, de terminología

Nunca se dice **«voz»** del doctor: se dice **estilo de escritura**. «Voz» se lee
como audio y el asistente jamás genera audio ni clona la voz real de nadie (D5).
La única excepción es cuando se está prohibiendo el audio explícitamente. Aplica
a archivos, variables, colas y scripts.
