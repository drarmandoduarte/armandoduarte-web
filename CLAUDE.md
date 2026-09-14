# Códice — reglas para humanos e IAs

La plataforma del **Dr. Armando Duarte**: consultorio, academia y asistente, con
la web pública adentro. Dirección: Germán Falcioni. El producto es de Armando; la
arquitectura es multi-inquilino desde el primer archivo aunque el piloto sea él.

Este archivo manda sobre cualquier prompt puntual. Lo que no está escrito acá ni
en la orden en curso, **se pregunta**.

## Las que no se negocian

1. **Ninguna regla de negocio fuera de `packages/core`, y con test. Las pantallas
   solo muestran.** Armando quiere app en iPhone y Android, y la nativa va a
   reusar `core` entero: lo que hoy se escriba dentro de un `.tsx` es lógica que
   mañana hay que escribir dos veces.
2. **El asistente no diagnostica, no prescribe y no interpreta el caso de nadie.**
   Responde desde los pasajes recuperados del contenido del doctor, citando; si no
   hay material, lo dice. Ante una señal de crisis no sigue respondiendo: deriva.
3. **Multi-inquilino por diseño.** RLS desde la primera migración de cada tabla.
   Y ninguna policy se copia de Bitácora ni de Omnia: Armando es un tercer modelo
   —miembros con rol **y territorio**, más **alumnos**, que no son miembros— y una
   policy copiada funciona con una persona y filtra datos con la segunda.
4. **Nunca «voz» del doctor: estilo de escritura.** «Voz» se lee como audio, y el
   asistente jamás genera audio ni clona la voz real de nadie (D5). Única
   excepción: cuando se está prohibiendo el audio explícitamente. Aplica a
   archivos, variables, colas y scripts.
5. **Nunca PII identificable a la API de IA**, y nunca el contenido de una
   conversación en un log.
6. **Nada secreto entra al repo.** Este repo es **público** por decisión de
   dirección (14/9/2026), y es lo que hace que Vercel Hobby despliegue los
   commits de cualquier autor sin pagar nada. Ni claves, ni tokens, ni URLs de
   base de datos, ni el código de acceso de una cortina, ni un `.env` con algo
   adentro: lo secreto vive en las variables de entorno de Vercel y se lee con
   `process.env`; el repo solo conoce el **nombre** de la variable. Lo vigila
   `check:secretos`, que está en la gate. Sin excepciones, y **si una orden
   parece pedir lo contrario, está mal escrita: se frena y se pregunta.** El
   caso: un secreto commiteado a un repo público no se arregla borrándolo
   —queda en la historia, en los forks y en los espejos—, se arregla rotando la
   credencial. El día que entre el consultorio el repo pasa a privado y eso
   cuesta Vercel Pro; está anotado en `docs/tareas.md`.

## La regla de dos registros (D6)

La **interfaz habla español neutro, tuteo**: «puedes», «tienes», «escríbenos».
El **voseo es del doctor** y vive en un solo lugar: `packages/prompts`.

Dos guardianes, uno por lado: `check:tuteo` mira que el voseo no esté en la
interfaz; `check:estilo` mira que solo pueda estar en `packages/prompts`. El
segundo barre todo el repo, así que ve las carpetas que el primero todavía no
conoce.

**«acá» no es voseo.** El sitio es `es-MX` y en México es corriente. La lista de
Omnia lo prohibía como regionalismo rioplatense; acá no, y está escrito en
`scripts/check-tuteo.mjs` con el caso que lo obligó.

## Design system

La fuente de verdad es `packages/ui`: `codice-tokens.json` es el documento y
`codice-tokens.css` su forma ejecutable. **Ningún hex vive fuera de ese `.css`**
—lo vigila `check:tokens`— y si un color no tiene token, no existe la clase.

Los nombres de las variables son los que la web pública ya usaba (`--crema`,
`--tinta`, `--ocre`, `--teal`…) y no los de Omnia: así el port de la web fue
sustituir y no traducir.

## Nombres

- Paquetes: `@codice/<pieza>` — `web`, `core`, `ui`, `config`, `prompts`, `db`.
- Carpetas de producto dentro de `apps/web/src`: por **dominio** (`web/`,
  y más adelante `consultorio/`, `academia/`, `asistente/`), nunca por tipo.
- Archivos y símbolos en **español**, como el resto de la casa. Un archivo por
  cosa. Sin `_v2`: lo viejo va a `_historico/` o se borra.

## Rodolfo: contrato de autonomía

Rodolfo (Claude en VS Code) trabaja con permisos plenos. Por eso estos límites
son LEY — valen más que cualquier prompt puntual, y **ante conflicto entre una
orden y este contrato, gana el contrato y se pregunta**.

**Jamás, ni pedido explícitamente en una orden:**

- Tocar `main` directo: todo entra por rama corta → PR.
- Editar una migración ya aplicada: las migraciones son inmutables; lo nuevo va
  en la siguiente.
- Crear tablas o columnas por cuenta propia: el esquema se define con Germán. Si
  un arreglo «necesita» esquema, se frena y se reporta.
- Tocar `.env*`, claves, secretos, ni la configuración de Vercel, Railway o
  Supabase. Eso es de dirección (D17).
- Borrar datos de ninguna base, ni «de prueba»: el SQL destructivo se propone, no
  se ejecuta.
- Agregar dependencias que la orden no pida. Una dependencia nueva se justifica
  en el PR o no entra.
- `git push --force` a secas, reescribir la historia de `main`, borrar ramas
  ajenas. `--force-with-lease` sí, y solo sobre una rama propia abierta por una
  orden, después de un rebase: falla si alguien más la tocó, que es justamente la
  garantía que lo hace seguro.
- **Tocar el sitio estático, que desde la orden #04 vive en `qa/referencia/` de
  este mismo repo**, el scaffold viejo `Development/Codice` o el repo de Omnia.
  Son referencias de solo lectura. La de `qa/referencia/` lo es por una razón
  que se paga sola: es contra lo que el guardián de fidelidad mide el port, y
  editarla es mover la vara en vez de saltarla. Si la web tiene que cambiar, se
  cambia en `apps/web` y la diferencia se declara en `e2e/cambios-visibles.ts`.
  (Antes esta línea decía «el repo `armandoduarte-web`». Ese repo ahora es éste:
  la regla no cambió de sentido, cambió de dirección postal.)

**Antes de cada commit, sin excepción:**

```sh
pnpm check:tuteo && pnpm check:i18n && pnpm check:estilo && pnpm check:tokens \
  && pnpm check:secretos && pnpm typecheck && pnpm test \
  && pnpm --filter @codice/web build
```

Rojo = no se commitea.

`pnpm test` está en la gate porque **un test que nadie corre es un test que no
existe**. No llama a Vitest directo: llama a `scripts/guardian-de-guardianes.mjs`,
que borra los reportes, corre las suites, y después comprueba que cada una haya
dejado el suyo. Un guardián que deja de correr no grita: se calla, y un silencio
se parece muchísimo a un «todo bien».

## Un test no está terminado hasta que se lo vio fallar

Es método, no anécdota, y **se declara en el PR**: se rompe a propósito lo que el
test dice cuidar, se muestra el test en rojo **y en qué comprobación**, se
devuelve el archivo y se muestra verde otra vez. Vale igual cuando se arregla un
test que mentía: se lo muestra fallando antes de arreglarlo.

Los modos de falso verde que esta casa ya pagó, y que hay que mirar antes de
creerle a un guardián:

- **Un test que lee un archivo vacío pasa en verde.** Vitest no procesa `.css`
  sin `css: { include }`: el test compara contra la nada y no se queja.
- **Un arnés que filtra la salida puede no reconocer un rojo.** Doce mutaciones
  en verde son una noticia sobre la herramienta antes que sobre el código: se
  comprueba a mano que el archivo cambió y que ese test falla de verdad.
- **Un test que exige CERO de algo tiene que contar además lo que sí encontró.**
  Un censo que solo afirma «no hay piezas ajenas» no distingue una casa limpia de
  un glob roto. Al lado de cada cero va un **piso** sobre lo que el barrido sí
  vio, y si el piso no se cumple el test falla aunque el cero se cumpla.
- **Y el piso va ANTES de la afirmación que sostiene.** Si corre segundo, deja
  hablar primero al rojo equivocado, y un rojo que miente sobre la causa cuesta
  más que ninguno: el que lo lea sale a arreglar lo que no está roto.
- **El cero solo vale sobre lo que el barrido sabe mirar.** Cuando se escribe una
  aserción de cero se declara al lado qué forma busca, qué forma no busca y sobre
  qué archivos. Lo que queda afuera se nombra: un alcance que no está escrito se
  lee como «todo».
- **Un guardián que lee la prosa como si fuera código aprueba el arreglo
  borrado.** Mientras quede escrito el porqué en un comentario, el guardián da por
  presente el qué. Se limpia antes de mirar (`soloCodigo()`) y se declara.
- **Se prueba rompiendo cada mitad por separado, no el conjunto:** un piso que
  sobrevive porque la otra mitad lo sostiene no está sosteniendo nada.

## Código

- TypeScript estricto. Nunca `any` (excepción: bordes externos, con la
  justificación escrita al lado).
- Componentes funcionales con hooks. Todos los hooks arriba e incondicionales —lo
  vigila eslint dentro de `pnpm test`, con una sola regla y su caso al lado.
- Sin imports relativos profundos: se usan los paquetes del workspace.
- Las migraciones van en su propio PR, separadas del código.
- **La forma de escribir reglas: con su caso pegado.** Cada regla de este archivo
  dice cuándo y por qué se aprendió. Una regla sin caso es una opinión, y las
  opiniones se discuten en cada PR.
