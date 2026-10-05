# Mi espacio · Orden Códice #37, PR 1 (`molde/01-base`): la base del molde

Rama `molde/01-base`, desde `main` (`a2e2b5f`). **No trae migraciones.** No hay claves en el repo ni se tocó ningún `.env`.

## Qué se hizo

1. **§1 · El molde, copiado e instalado.**
   - `packages/` de `moldes-apps` va entero a `packages/moldes/`, y también `HUELLAS.txt`, `VERSION` y `guardian/{check,huellas,revisar}.mjs`. El molde copiado es idéntico a su `main` (`858b2f1`).
   - Los paquetes entran al workspace de pnpm (`packages/moldes/*`). Mi espacio depende de `@moldes/design`, `@moldes/idiomas` y `@moldes/ui`.
   - `moldes/instalacion.json` queda con `{ "paquetes": "packages/moldes" }`.
   - El `test` de la raíz empieza con la línea de fase-2 §1, tal cual, y después sigue el guardián de la casa: `pnpm test` dice primero «Guardián de los moldes · v1.1.2 · 358 archivos idénticos a sus huellas.».
   - `main.tsx` importa `@moldes/ui/styles.css` antes que la hoja de la casa y llama a `arrancarElMolde()` (que es `aplicarDesign(design)`) antes de montar React.
   - `src/molde/arranque.ts` arma `t` con `crearT({ idioma, espanol: design.app.espanol, extras, comunes: { app } })` y `elegirIdioma`. Los `extras` son los textos de Mi espacio en es/en/pt, aplanados de los mismos JSON que ya usa i18next.
2. **§4 · `design.json` de Mi espacio**, generado desde el canon (`packages/ui/codice-tokens.json`) por el mismo script de la #35, que ahora escribe en el esquema del molde.
   - Paleta CFF: fondo crema, papel cálido, tinta, gris, acento teal oscuro, línea hairline, y error/ok/aviso de `color.semantic`.
   - Montserrat, radios 2/2/12, «Armando Duarte», `neutro`, y la frase en los tres idiomas.
   - `validar()` da `[]` y `avisos()` no dice nada.
   - `public/design.css` (con `generar-css.mjs`) y `public/fuentes/` (con `bajar-fuentes.mjs`: Montserrat, 4 archivos, 149 KB) están commiteados.
   - El test byte a byte de la #35 sigue vigilando que nada se haya escrito a mano, y ahora también vigila `design.css` y las fuentes.
3. **Modo oscuro (canon v1.3.0, `color.oscuro.*`)**: la propuesta que aprobaste.
   - Por referencia al canon: grafito de fondo, crema de texto, teal claro del manual de acento y el ámbar de la casa de aviso.
   - Mezclas medidas para papel, texto2, línea, error y ok.
   - Todo da AA sobre fondo y papel: texto 16,6:1, texto2 8,6:1, acento 5,5:1, error 5,2:1, ok 5,2:1, aviso 5,6:1. Se veta en las capturas del PR 3.
   - Entra además `--ok` (`color.semantic.success`), que no tenía forma ejecutable.
4. **§2 · textos de las piezas heredadas.** Hoy Mi espacio **no usa ninguna pieza del molde**: el `grep` por `Dialog`, `PanelLateral`, `HojaInferior`, `Toast`, `ConfirmDialog`, `Tag`, `BarraInferior`, `SelectorConAlta` y `Panel` importados de `@moldes/ui` da 0 (el `Panel` que aparece es el del equipo, que es propio). La regla queda armada en `el-molde-esta-instalado.test.ts` para el PR 2 y el PR 3, y lo vi fallar con un `<Dialog>` del molde sin `closeLabel` (`mutacion-seccion-2.png`).

## Verificación

- **Gate verde:** 828 tests, 65 en Chromium, 0 saltados. También pasa con `TZ=UTC pnpm test`.
- **Prueba de fuego del guardián** (capturas en esta carpeta):
  - Una coma en `ui/components/acceso/Antetitulo.jsx` → rojo, con el archivo exacto (`prueba-de-fuego-coma.png`).
  - `process.exit(1)` → `process.exit(0)` en `guardian/check.mjs` → `guardian/check.mjs: FAILED`, y el `test` no llega a correr (`prueba-de-fuego-guardian.png`).
  - Las dos se revirtieron y vuelve el verde (`guardian-verde.png`).
- **CSP y fuentes, en un navegador** (`apps/familia/check/molde-37-pr1.mjs`):
  - Mi espacio compilado, servido con las cabeceras de su `vercel.json` (`style-src 'self'`), con `fonts.googleapis.com` y `fonts.gstatic.com` bloqueados y Supabase simulado.
  - A 390 y a 1440, en claro y en oscuro: **0 violaciones de CSP, 0 `<style>`**, las dos hojas del molde enlazadas, las `--c-*` del `design.json` aplicadas (acento `#005761` en claro y `#3D9CA4` en oscuro), Montserrat cargada desde `/fuentes/` y **0 pedidos a Google**.
  - Capturas: `entrada-390-google-bloqueado.png` y `entrada-1440-google-bloqueado.png`. Solo están en claro, porque las pantallas de hoy todavía no usan las variables del molde y en oscuro se verían igual; el oscuro se afirma por los valores.
- **Las pantallas de hoy, comparadas píxel a píxel con las capturas aprobadas de la #35** (las mismas 33): solo cambian dos cosas.
  - La palabra acentuada («*espacio*.»): antes el navegador inventaba la cursiva, porque la casa no autoaloja Montserrat itálica. Ahora usa la **itálica real** que bajó el molde.
  - El idioma activo del selector sale un pelo más grueso: Montserrat queda declarada dos veces, la de la casa y la del molde (una versión más nueva del mismo archivo).
  - Nada más se movió.

## Qué quedó distinto de la orden, y por qué

1. **Molde 1.1.2 y no 1.1.0.** `fase-2.md` (§0: «cada orden instala la versión vigente, 1.1.2 o superior») dice que va la vigente, y la 1.1.0 no funcionaría con la CSP de Mi espacio: su `aplicarDesign` escribe un `<style>`, y `style-src 'self'` no lo aplica. La 1.1.2 trae los estilos como archivos y la línea del guardián que no se apaga editándolo. Te lo consulté antes de empezar; la respuesta repitió la orden, así que seguí con la vigente.
2. **`moldes/instalacion.json` todavía sin `acceso`.** Si la declaro ahora, el guardián exige `acceso.config.ts` y el núcleo en `apps/api/src/acceso` y `apps/familia/src/acceso`, y eso llega en el PR 2. Ahí se suma, junto con el `instalaciones.json` del kit viejo (§7, paso 4).
3. **Los tests propios del molde no corren en la gate de la casa.** La copia la cuida el guardián, archivo por archivo, y sus tests corren en `moldes-apps`. Además, acá uno se rompe por algo que no es nuestro (punto 1 de abajo).
4. **Dos excepciones declaradas en los guardianes de la casa:**
   - `check:estilo` deja pasar `packages/moldes/idiomas/es-UY.json`, la capa de voseo del molde. No se usa, porque Mi espacio es `neutro` y lo afirma un test, y no se puede quitar, porque el guardián la exige.
   - `check:tokens` no tuvo que cambiar: cada hex del `design.json` tiene su token en el canon.
5. **Mi espacio no tiene CI propio** (no hay `.github/`): la línea del guardián corre en `pnpm test`, que es la gate. La de §1 para GitHub Actions entra el día que haya CI.
6. **La web de vuelta del acceso** (`design.web` en la #35) pasó a `WEB_PUBLICA` de `@codice/core`. El esquema del molde no admite claves fuera de las suyas.
7. **Archivos fuera de las carpetas de la orden:** `scripts/guardian-de-guardianes.mjs` y `scripts/check-estilo.mjs` (lo de los puntos 3 y 4), `pnpm-workspace.yaml`, `pnpm-lock.yaml` (+31 paquetes: las dependencias de desarrollo del molde) y `qa/piso-de-tests.md`.

## Propuestas para el molde (fase-2 §12; no se tocó la copia)

1. **`design/generar-css.test.js` se rompe si la carpeta tiene espacios.** Arma la ruta con `new URL(…).pathname` sin `decodeURIComponent`, y en `…/App Dr. Armando/…` busca `App%20Dr.%20Armando` y da `ENOENT`. El arreglo es `fileURLToPath`.
2. **Que `bajar-fuentes.mjs` admita el peso 300 y una familia de lectura.** Hoy baja la sans en 400–700 y la serif en itálica 400. Los títulos de Mi espacio usan Montserrat **300** y el texto corrido usa **Open Sans**, así que las fuentes de la casa tienen que seguir cargadas al lado de las del molde. Para reemplazarlas, como pide §4, el molde tendría que poder bajar las dos cosas.

## Decisión para dirección

- **Ninguna para mergear este PR.** Lo único para mirar es el modo oscuro, cuando lo veas dibujado en las capturas del PR 3.
