# Orden Códice #38: la landing «Cómo sanar un matrimonio herido» en `/matrimonios`

Rama `web/38-matrimonios`, desde `main` (`2f21983`, con la #36 adentro). Toca `apps/web`, `packages/core` (textos y teléfonos) y `packages/ui` (un token). Fuera de esas tres, y declarado: `apps/familia/design.json` regenerado (solo cambia la versión del canon, 1.2.4 → 1.2.5; lo exige `tokens.test.mjs`), `qa/piso-de-tests.md`, `docs/tareas.md` (pendiente 18) y este informe.

## Qué se hizo

1. **La página `/matrimonios`**, con las nueve secciones en el orden de la orden (`apps/web/src/web/matrimonios/`):
   1. Hero: el componente de los dos héroes (#23), Armando en el arco. «Cómo sanar un» / «MATRIMONIO HERIDO» con la clase de «ADOLESCENTE». Botón principal naranja «Asegurar mi lugar en el taller» y «Ver el programa ↓» en contorno, que baja a las fortalezas. Datos: «6 MESES · JUEVES 29 DE OCTUBRE · 7:00 A 9:00 PM CDMX».
   2. Banda de hechos (la de `/merida`, sobre cálido): Inicia, Horario, Modalidad y Duración. Los íconos son los de Lucía: calendario, reloj, sesión y el birrete de «Formación» para los seis meses.
   3. «¿Hace cuánto tiempo dejaron de mirarse con ilusión?» en el molde de «¿Te suena?»: `dolor-cama` de fondo, la bajada, las cinco preguntas 01–05 y la cita en la tarjeta translúcida a todo el ancho.
   4. «El dolor de un matrimonio herido…»: dos filas alternadas, `dolor-llanto` a la izquierda y `dolor-hijo` a la derecha, y la cita «No están solos…».
   5. El giro: `giro-manos` grande, el título con «¡TODO PROBLEMA TIENE SOLUCIÓN!» en su renglón, el párrafo, la frase como cita y el botón principal.
   6. Las cinco fortalezas: los núcleos de `/merida`, con su movimiento (#28) y con **el número 1–5 en el círculo**. El título del núcleo es lo que está en negrita en el `.docx`.
   7. Las cuatro frases, como las tarjetas de «Lo que te llevas» (cuatro columnas) y con las cuatro fotos de esperanza en el orden de la orden.
   8. «Sobre el facilitador», en terracota: Armando de pie, «Armando Duarte. / Experto en familia.», **la biografía nueva literal**, la ficha de `/merida` (leída de las mismas claves, con los tres libros de la #36) y la cita para matrimonios.
   9. El cierre «¿Están listos para luchar?», en terracota sobre `esperanza-abrazo-flores`. Lleva el párrafo, la ficha (con «$1,170 MXN (6 mensualidades)» literal), «Incluye:» con las cuatro líneas, el llamado, los dos botones y la línea de los dos números.
2. **Reservas por WhatsApp.** «Asegurar mi lugar en el taller» va a `wa.me/524621993143` y «Desde otro país» (en contorno, en el cierre) a `wa.me/524622511017`. Los dos llevan el mensaje «Hola, quiero asegurar mi lugar en el taller Cómo sanar un matrimonio herido.». La cabecera, el menú y el pie de esta página llaman al de México. En `@codice/core`, `TELEFONO_MATRIMONIOS_MEXICO` y `TELEFONO_MATRIMONIOS_OTROS_PAISES` llevan nombre propio. El de México es hoy el mismo número que el de Gaby, pero va en su propia constante.
3. **Token `color.matrimonio.terracota` #B34528** en el canon (v1.2.5 → `--terracota`). Crema encima da 5,17, verificado en `tokens.test.mjs`. `Seccion tono="terracota"` dibuja `oscuro terracota`, así hereda todo lo que el teal ya resolvió y solo cambia el fondo.
4. **Textos de Armando** en `web.json` bajo `matrimonios.*`.
5. **Head**:
   - `<title>`: «Cómo sanar un matrimonio herido · Taller en línea con Armando Duarte».
   - Descripción de 159 caracteres, con la fecha y Zoom.
   - OG: `og-matrimonios-1200x630.jpg` primero y `-1200x1200.jpg` después, con `?v=`, y el alt «Taller · Cómo sanar un matrimonio herido».
   - JSON-LD `Event`: en línea, `VirtualLocation` con la URL de la página, del 29/10 de 19:00 a 21:00 −06:00, 1170 MXN con «Por pareja, 6 mensualidades».
6. **Cómo se llega:**
   - La banda AHORA de la portada pasa a dos filas en una sola rejilla. Cada título lleva a su página: Mérida con «Reservar por WhatsApp» y Matrimonios con «Asegurar mi lugar».
   - «Matrimonios» suma una línea bajo Talleres en el pie y otra en el menú. En el menú queda en ámbar cuando estás en la página.
   - `/matrimonios` también entró al `sitemap.xml`.

## Qué quedó distinto de la orden, y por qué

- **Sección 4, el reparto de párrafos.** La orden dice «los dos primeros párrafos» arriba y «el párrafo de los hijos y "Tu pareja…"» abajo, pero el `.docx` trae tres párrafos y el de los hijos es el segundo. Lo leí así: arriba van el título y el primer párrafo, abajo el segundo y el tercero.
- **La bajada del hero, sin punto final.** La orden le pone punto, pero el `.docx` no lo tiene y manda lo literal.
- **El titular del hero viene de la orden y no del `.docx`.** La orden dice «Cómo sanar un MATRIMONIO HERIDO», igual que el póster. El `.docx` dice «CÓMO SANAR **A** UN…». El test lo deja declarado.
- **Sin rótulos.** Armando no escribió rótulo para las secciones 3 a 7 ni para el cierre, así que no hay. Solo quedan el del hero (lo da la orden) y «Sobre el facilitador» (es el encabezado del `.docx`).
- **El texto secundario sobre terracota va en crema pleno.** El 70 % que se usa sobre teal da **3,33** sobre la terracota, y para llegar a 4,5 hace falta ~90 %. Lo «suave» del título es texto grande y queda al 75 % (3,60). El contorno de los botones sube al 75 % por la misma razón: con el 50 % daba 2,2 y un borde pide 3.
- **El hover de los círculos numerados se pinta con `--naranja-texto` y no con `--naranja`.** El número es texto: crema sobre `--naranja` da 3,86 y sobre `--naranja-texto`, 5,00.
- **`#facilitador` lleva 3,5 px de aire de rótulo y no 2,5.** Con la biografía la sección es más alta, y a 1920 el pelo quedaba 2 px por encima de las letras. Probé 3,5 y 4,5, pasan los dos, y elegí el menor.
- **El cierre en 1440 va en dos columnas** (título y párrafo | ficha e «Incluye»), con la acción centrada abajo. Apilado en el teléfono, el orden es el de la orden.

## Verificación

- **Gate verde:** 813 tests declarados, 65 en Chromium, 0 saltados. Los pisos están actualizados en `qa/piso-de-tests.md` (ui 38, core 123, web 83, navegador 65).
- **Textos — `lo-que-mando-armando.test.ts` contra el `.docx` de verdad.**
  - Lee el zip con `node:zlib`, sin dependencias.
  - Comprueba que cada uno de los 43 textos publicados sea un párrafo entero del `.docx`, que ningún párrafo quede sin publicar y que lo que no está en el `.docx` (titular, datos, mensaje, números, title, alt) esté en la orden entre sus comillas.
  - También mira el HTML publicado: está cada texto, no hay 👉 y el precio es literal.
  - Diferencias declaradas y aplicadas antes de comparar: el emoji 👉, las comillas «» de la casa, «(Foto)» (es una indicación) y los «:» de los dos títulos que presentan una lista.
  - **Lo vi fallar** con tres mutaciones por separado:
    - (a) «con herramientas efectivas de perdón» → «de perdón»: rojo en tres comprobaciones;
    - (b) 👉 metido en `dist/matrimonios.html`: rojo «D6: sin emojis»;
    - (c) «…251 1018» en la línea de números: rojo contra la orden.
  - Devueltos los tres cambios, 13/13 en verde.
- **Evento — `el-evento-de-matrimonios-dice-la-verdad.test.ts` (nuevo).** El huso de CDMX y el día de la semana se calculan, no se copian, y el precio sale del cierre. Mutaciones: fecha al 30 → rojo; precio 1200 → rojo.
- **Huellas:** 42 imágenes con `?v=` en `/matrimonios`. El test suma la página con un piso de 35 y las dos `og:image`.
- **`check:altura`**: el héroe mide exacto. La sección más alta es `#dolor`, con 1,48 pantallas a 1440×900; había dado 1,56, así que achiqué la foto vertical para dejar margen bajo 1,6. A 1920 da 1,30.
- **`check:acento`**: tope 1 y nada fuera de lo permitido. Se miraron 320 elementos en `/matrimonios`.
- **`check:contraste`: 0 pares bajo AA en las cinco páginas a los cuatro anchos** (311 pares).
  - Los velos se midieron sobre el píxel pintado:
    - **Cierre**: 88 % → 4,31 · 90 % → 4,44 · **92 % → 0 pares**. Lo que manda es «Desde otro país» a 900.
    - **«¿Hace cuánto…?»**: a escritorio pasa desde el 76 %. Queda en **80 %** para que se vea la pareja. En el teléfono el 80 % no alcanza (el «01» da 4,44 a 375), así que ahí va el 86 % de `/merida`.
  - **El barrido tenía un punto ciego y lo arreglé:** no esperaba las fotos `lazy`. El cierre, a 7.500 px, se medía contra la terracota lisa y daba 5,17 en verde, que era falso. Con la foto cargada apareció el 4,31. Ahora `contraste.mjs` pasa todas las imágenes a `eager`, espera a que se decodifiquen y se cae si alguna no cargó.
- **`check:renglones`**:
  - 0 sin excepción. `#dolor h2` usa `text-wrap: pretty`, porque con `balance` dejaba «matrimonio» solo.
  - **Seis renglones de una palabra quedan en `PENDIENTES`.** No se arreglan sin cambiar texto o tamaño, y eso no lo decido yo. Están en `docs/tareas.md` § 18: «MATRIMONIO» / «HERIDO» del hero (es la forma de la orden y del póster) y cuatro de los títulos de las fortalezas.
- **Fidelidad: capturas actualizadas por la orden #38.**
  - `matrimonios` es nueva, a 1440/900/390 más el head y los enlaces.
  - `inicio`, `taller`, `privacidad` y `terminos` cambian a 1440/900/390, más los enlaces y las dos del menú abierto (`overlay-1440/390`).
  - El diff de texto es exactamente este: en la portada, la segunda fila de AHORA («Cómo sanar un matrimonio herido · taller en línea 100% en línea (vía Zoom) · Jueves 29 de octubre · 7:00 a 9:00 pm (hora de CDMX) ASEGURAR MI LUGAR →»); en las cuatro páginas, «Matrimonios» en el pie.
  - En los enlaces se suman `/matrimonios` (pie y menú) y, en la portada, el `wa.me` de la segunda fila.
- **Las e2e que recorren páginas suman `/matrimonios`:**
  - héroes iguales (el arco, el rótulo y el título dan la misma caja que en la portada);
  - los tres de Armando en `#facilitador`;
  - CSP, acento, altura y renglones;
  - el hero opaco;
  - el recorrido de Tab del menú, que ahora tiene una parada más.
- **Lighthouse móvil** (13.5.0, simulate, `dist/` local, 9 corridas alternadas por ruta, la base `/merida` en la misma sesión)

  | ruta | rendimiento (9 corridas) | peor · mediana | accesibilidad | LCP | CLS máx |
  |---|---|---|---|---|---|
  | `/merida` | 95 94 94 94 95 94 94 95 94 | **94** · 94 | 100 | 2704–2782 ms | 0,0002 |
  | `/matrimonios` | 95 95 96 96 95 95 95 95 95 | **95** · 95 | 100 | 2483–2631 ms | 0,0003 |

  `/matrimonios` no es menor que `/merida` en ninguna corrida. Mejores prácticas y SEO dan 100 en las dos.

## Capturas (`apps/web/check/capturas-38.mjs`)

- `matrimonios-1440.jpg` (la página entera, una imagen larga) y `matrimonios-390.jpg`
- `ahora-portada-1440.jpg` y `ahora-portada-390.jpg`

## Qué decisión necesita dirección

1. **Los seis renglones pendientes** (§ 18 de `docs/tareas.md`): ¿se aprueban como «ADOLESCENTE» y los núcleos de la #35, o se cambia algún tamaño?
2. **«Matrimonios» a secas en el pie y en el menú**, tal como lo escribe la orden. Al lado dice «El arte de amar a tu hijo adolescente · Mérida» y «El taller · Mérida». Si se quiere el mismo formato, es un cambio de texto.
3. **El velo del cierre al 92 %**: la foto se adivina, no se mira. Es lo que cuesta poner texto crema chico encima. Para ver más la foto habría que sacar texto de encima o agrandarlo.

## Observaciones (no tocadas)

- En el teléfono la píldora «AHORA» ocupa todo el ancho de la banda. **Ya era así en `main`** (lo comparé con la captura aprobada); no es de esta orden.
- El borde del botón WhatsApp de la cabecera, cuando pasa sobre terracota, queda en crema al 50 % (≈2,2:1). El texto pasa, pero el borde no llega a 3. Esa regla es de la cabecera, `.hd.claro`, y es la misma en todo el sitio, así que no la toqué.
