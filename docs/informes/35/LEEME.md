# Orden Códice #35: pantallas de acceso según el guion v1 del Kit de Seguridad 512

Rama `mi-espacio/16-acceso-guion-v1`, desde `main` (`9e81b0b`, con la #34 adentro). Es un solo PR con dos commits: el canon (`0c29a51`) y las pantallas. Todas las capturas salen de `apps/familia/check/capturas-35.mjs`, con Supabase y la API simulados: no hay ninguna clave ni ningún dato real.

## Qué se hizo

1. **`design.json`, generado.** Lo genera `packages/ui/scripts/design-json.mjs` desde `codice-tokens.json`, con el mapa de la orden rol por rol:
   - fondo cream, campos surfaceWarm, texto ink.primary, secundario ink.muted;
   - acento cff.tealDark, borde border.hairline, error semantic.danger;
   - la sans es Montserrat; no hay serif, así que la palabra acentuada va en cursiva y en el color de acento;
   - radio `radius.casa`, nombre «Armando Duarte», frase «Entra a tu *espacio*.» y `espanol: 'neutro'`.

   El mismo script genera `src/acceso/design.css`, con las variables `--acceso-*` puestas por referencia a las del canon. Es lo único que usan las pantallas para vestirse. `tokens.test.mjs` regenera los dos archivos, los compara byte a byte y exige que cada hex sea el de su token. `check:tokens` acepta los hex del `design.json` solo si están en el canon.
   - **Commit propio del canon (v1.2.4):** `--error` (`color.semantic.danger` ya existía en el JSON, pero no tenía variable CSS) y `--radio` = `radius.casa`.
2. **`OtpInput`**, copiado del kit a `src/comun/OtpInput.tsx`:
   - seis casillas de 80×72 con 12 px entre ellas, y de 48×56 con 8 px a 390;
   - una sola entrada real, y pegar reparte los dígitos;
   - verifica solo al llenar la sexta casilla;
   - si el código es incorrecto: tiembla, se vacía, el foco vuelve a la primera y aparece «Código incorrecto. Te quedan N intentos.».

   Va en P2, P3, P4 y P8. Los tests del kit están copiados, más los del guion.
3. **Tres idiomas en el acceso.** Las 57 claves `auth.*` de la tabla §5 se **leyeron del propio .md** y se copiaron a `es`, `en` y `pt` (`packages/core/src/i18n/`). El selector va arriba a la derecha, cambia la pantalla al momento y queda guardado en `codice.idioma`. El resto de la app cae a español. `check:i18n` compara solo `auth.*` en `en` y `pt`, tiene un piso de 61 claves y ahora también controla las variables de una llave (`{n}`).
4. **La anatomía del guion** en todas las pantallas: `acceso/Marco.tsx` y `acceso.css`. Las rutas nuevas:

   | Pantalla | Ruta |
   |---|---|
   | P1 · Entrada | `/login` |
   | P2 · Código por correo | `/login/codigo` |
   | P3 · Verificación | `/auth/2fa` |
   | P4 · Activar el autenticador | `/auth/2fa/activar` |
   | P5 · Códigos de respaldo | `/auth/2fa/respaldo` |
   | P6 · Recuperación | `/auth/2fa/recuperar` |
   | P6b · Reseteo | `/auth/2fa/reseteo` |

   `/entrar` responde 308 a `/login` y conserva el `?ir=`. La URL sigue a la decisión del núcleo: escribir una de estas rutas a mano no saltea ningún paso. Se borraron las pantallas viejas (`src/entrar/*`) y sus textos (`entrar.*`, `reto.*`, `enrolar.*`, `pasoReciente.*`, y lo que el guion reemplaza de `respaldo.*`).
5. **P6b**: el enlace «Tampoco tengo los códigos», la pantalla de reseteo y la de espera con fecha y hora. Ver el primer punto de «Distinto del guion».
6. **P8** aparece cuando regenerar los códigos devuelve `PASO_RECIENTE_REQUERIDO`. Con el código bien puesto, reintenta y muestra P5. **P9 no aplica:** Mi espacio no es una PWA.

## Verificación

- **Gate verde:** core 119, ui 36, db 171, api 119, web 72, familia 211.
- **`capturas-35.mjs`, en verde.** Revisa en cada captura:
  - columna de 560 como máximo, con 24 px de margen a 390;
  - campos de 56 px de alto;
  - casillas de 80×72 y 48×56, seis, con una sola entrada;
  - «← Armando Duarte» arriba a la izquierda;
  - **0 naranja, 0 fotos, 0 pares bajo AA**, sin scroll horizontal y 0 violaciones de CSP.
- **Mutaciones, cada una con su test en rojo:**
  - `design.json` editado a mano;
  - un hex que no está en el canon;
  - un `{n}` perdido en `pt`;
  - el error que no vacía la casilla;
  - P2 que no verifica sola;
  - P6 sin el enlace a P6b;
  - enrolar sin su dirección.

## Capturas

- P1–P8, P6b y la espera de P6b, a 1440 y 390: `p*-1440.png` y `p*-390.png`.
- P1, P2 y P3 en EN y PT: `*-en.png` y `*-pt.png`.
- **Al lado de la referencia del kit:** `lado-a-lado-*.jpg`. P1 va contra `01-entrada.png`, y el resto contra `03-verificacion-autenticador.png`. Están a la misma escala: las del kit son retina, así que las nuestras se tomaron al mismo viewport (985×838 y 1518×885) a ×2.

## Prueba en teléfono real: NO la hice

No tengo un teléfono. Lo que sí hay es `pegar-en-telefono-emulado-390.png`: un iPhone 13 **emulado** por Playwright. Pegar «Tu código: 123 456» repartió los seis dígitos y verificó **una vez**, con `123456`. **Falta la prueba real** (pegar desde el correo en iPhone o Android y ver que entra sola). La tiene que hacer dirección o el CEO, y anotar con qué teléfono.

## Distinto del guion, y por qué

1. **P6b no tiene backend.** La lógica del reseteo (§3.3, auto-rescate) **no está en el kit v1.1.0**: no hay nada de rescate en `nucleo/` ni en la referencia de Cenit. La pantalla llama a `POST /api/rescate/pedir`, que hoy no existe, y muestra el error genérico. Si esa ruta devuelve `{ vence }`, muestra la espera; eso está probado con la API simulada. **Se resuelve en el kit**, no con un parche acá.
2. **Español neutro** (§5 lo permite): «pierdes», «Pide un *reseteo*.», «Confirma que eres *tú*.» y «Entra de nuevo». «sos *vos*» → «eres *tú*» también es voseo, así que lo cambié con el mismo criterio.
3. **Claves que agregué** porque la tabla no las trae:
   - `auth.login.title` (la frase de marca en los tres idiomas);
   - `auth.lang.label`;
   - `auth.reset.waitTitle` y `auth.reset.waitSubtitle` (la espera de P6b);
   - `acceso.respaldoInvalido` y `acceso.sesionPerdida`, solo en español.

   El error genérico («no se pudo») sigue en español en los tres idiomas.
4. **Reenviar a los 60 s, no a los 30.** Supabase rechaza un segundo envío antes de su intervalo mínimo, que es configuración de dirección (D17). Con 30 s el botón fallaría. Si se baja el intervalo en Supabase, se cambia `SEGUNDOS_PARA_REENVIAR` y nada más.
5. **«Te quedan N intentos» lleva un tope de la pantalla: 5.** Supabase no informa cuántos intentos quedan. Al llegar a 0 la casilla se apaga y hay que pedir otro código (P2) o salir (P3, P4, P8). El límite real sigue siendo el de Supabase.
6. **Los botones no se apagan con el campo vacío**, como en la referencia («el botón queda igual»): si falta el dato, el foco vuelve al campo. Solo P5 apaga «Listo, los guardé», porque el guion lo pide.
7. **El radio es de 2 px, no 0.** La orden decía «hoy 0», pero el canon no tenía 0 y la casa dibuja 2 px desde la #07, en la web y en Mi espacio. Lo escribí en el canon como `radius.casa`.
8. **Dos contradicciones del guion con el canon.** El canon prohíbe «italic en títulos» y «monospace visible»; el guion exige la palabra en cursiva y los códigos de respaldo en monoespaciada. Manda el guion. Montserrat no tiene archivo cursivo, así que la cursiva la arma el navegador.
9. **P6 no tiene etiqueta visible** (el guion no la pone): el campo tiene `aria-label`.
10. **P3 lleva «← Armando Duarte» y el selector de idioma arriba, aunque la captura `03` no los muestra.** El texto del guion (§2) los pide en todas las pantallas.

## Ajustes de la auditoría del CEO (PR #56, 3/10)

1. **El borde de campos y casillas pasa a `color.ink.muted`** (4,99:1 sobre crema), 1 px; la casilla activa sigue en el acento.
   - Se cambió el **mapa** del script y el `design.json` se regeneró. Al cambiar el mapa, el guardián quedó en rojo hasta regenerar.
   - `tokens.test.mjs` ahora afirma el mapa y que el borde llegue a 3:1 sobre el fondo. Si se vuelve al hairline, cae.
   - El separador de P1 y el recuadro de los códigos de P5 no son borde de un control. Para que sigan en hairline agregué el rol `linea` (`color.border.hairline`), porque la decisión dice «en campos y casillas».
   - Recapturé todas las pantallas, no solo P1–P3, porque el borde cambia también P4, P6 y P8.
2. **`e2e/entrar-como-quien.spec.ts` volvió y ahora mide `/empezar`**, con una sesión simulada de una clienta nueva.
   - A 1440 y 1920: pelo 166 = letras 166 y corte 1085,4 = línea del pie 1085,4.
   - Mutación, cada mitad por separado:
     - `--aire-rotulo` a 8 px: «el pelo está 10 px por debajo de las letras» (2 rojos).
     - El corte 12 px arriba: «el corte no apoya en la línea del pie (1073,4 contra 1085,4)» (2 rojos).

     Con el CSS devuelto, 2/2 en verde.

**Prueba en teléfono real:** la hace Germán en el smoke, pegando el código del correo en el iPhone. Modelo: _(lo anota Germán)_.
