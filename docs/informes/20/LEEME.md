# Orden Códice #20 — Lo que vio Germán en producción

Rama `web/20-lo-que-vio-german`, desde `main`. Las cinco cosas que dirección
marcó el 29/9 a las 13:00, más la regla nueva que nace acá.

## Qué se hizo

- **A · Ninguna sección más alta que la pantalla**, con guardián nuevo
  (`check:altura`) y su segunda puerta en la gate. Tres secciones no entran con
  los resortes que la orden autoriza: van declaradas, con números y opciones.
- **B · Armando no flota en los dos héroes**: el arco apoya en el borde de la
  sección. Medido: **0 px** a 1440×900 y a 1920×1080, en las dos páginas.
- **C · La línea del hover del contacto, naranja.**
- **D · «Talleres» en el pie: un solo enlace.**
- **E · «Fiesta Inn Mérida» abre Google Maps**, y el `Event` de schema.org
  publica el mismo mapa.

---

## A · La regla nueva, y lo que la medición encontró

### La tabla, ANTES de tocar nada

Es lo que pide el punto A.5 —primero se mide— y es lo que decidió qué resorte
usar. `sobra` es altura de la sección menos `innerHeight`.

| sección | 1440×900 | 1920×1080 |
|---|---|---|
| `/` `#inicio` (hero) | 880 · −20 | 909 · **−171** |
| `/` `#quien` | 1160 · **+260** | 1203 · **+123** |
| `/` `#hago` | 874 · −26 | 917 · −163 |
| `/` resto (`ahora`, `taller`, `libros`, `programa`, `contacto`, pie) | entran | entran |
| `/merida` `#inicio` (hero) | 880 · −20 | 880 · −200 |
| `/merida` `#suena` | 863 · −37 | 856 · −224 |
| `/merida` `#porque` | 816 · −84 | 859 · −221 |
| `/merida` `#programa` | 1864 · **+964** | 1951 · **+871** |
| `/merida` `#facilitador` | 1032 · **+132** | 1076 · −4 |
| `/merida` `#inversion` | 945 · **+45** | 988 · −92 |
| `/merida` resto (`testimonios`, `preguntas`, `reservar`, pie) | entran | entran |

Los dos héroes son los **−171 y −200** de la segunda columna: ahí estaba el
defecto que dirección describió como «en el hero hay dos colores por la sección
que le sigue». El hero terminaba a los 909 px sobre una pantalla de 1080 y por
debajo asomaba una franja del color siguiente antes del pliegue.

### Lo que se hizo con eso

**1 · Los héroes miden la pantalla (A.3).** `min-height: min(100svh,880px)` —ese
tope de 880 era el defecto— pasa a `min-height` **y** `max-height` de `100dvh`,
con `100vh` de respaldo escrito antes para el navegador que no lea `dvh`.
`max-height` además de `min-height` porque la regla es «exactamente», no «al
menos»: sin el tope, un texto más largo estira el hero y el defecto vuelve.
Medido después: **900 px exactos a 1440×900 y 1080 exactos a 1920×1080**, en las
dos páginas.

**2 · El padding de sección (A.5, primer resorte).**
`clamp(88px,12vh,140px)` → `clamp(40px,5vh,64px)`, que es el valor que escribió
la orden. A 1440×900 eso son **126 px menos por sección**, y es un cambio de
ritmo de **todo el sitio**, no solo de las que sobraban — la regla es de todas, y
dos aires distintos en la misma página se ven peor que uno más ajustado. Es lo
que hace que las capturas de fidelidad de las cuatro rutas cambien, incluidas las
legales.

**3 · Los otros dos resortes no se aplicaron, y el motivo es la medición.**
`gap` un paso menor y título un paso menor mueven el **texto**. Lo que manda en
las tres que quedaron es otra cosa, y está medido abajo. Aplicarlos habría
cambiado la tipografía de dos secciones sin llegar a verde: churn sin resultado.

### La tabla DESPUÉS, y lo que quedó

| sección | 1440×900 | 1920×1080 | estado |
|---|---|---|---|
| `/` `#inicio` | **900 · 0** | **1080 · 0** | exacto, A.3 |
| `/` `#quien` | 1034 · **+134** | 1052 · −28 | **decide dirección** |
| `/merida` `#inicio` | **900 · 0** | **1080 · 0** | exacto, A.3 |
| `/merida` `#programa` | 1738 · **+838** | 1800 · **+720** | **decide dirección** |
| `/merida` `#facilitador` | 911 · **+11** | 924 · −156 | **decide dirección** |
| `/merida` `#inversion` | 819 · −81 | 837 · −243 | entra |
| todo lo demás | entra | entra | |

## Lo que necesita dirección (A.5)

Tres filas, todas en `PENDIENTES` de `check/altura.mjs` con su tope en píxeles.
Ninguna bloquea el merge: la gate está verde y el guardián **dice en voz alta**
que las excusó.

**1 · `/` `#quien` — sobran 134 px a 1440×900.** No es el padding: es la foto. El
recorte `de-pie` es 1400×2526 y a su `max-width` de 520 px mide **938 px de
alto**, o sea que **no entra en una pantalla de 900 ni con padding cero**. El
único resorte que queda es achicar a Armando, y cuánto se achica al cliente en su
propia portada no lo decide Rodolfo. Opción medida: `max-width` **520 → 470 px**
(−9,6 %), que deja la sección en **893**. A 1920×1080 ya entra.

**2 · `/merida` `#facilitador` — sobran 11 px a 1440×900.** Lo mismo y por poco:
la foto a 480 px mide 866 y con los 45 del padding la sección queda en 911.
Opción medida: `max-width` **480 → 472 px** (−1,7 %), que la deja en **897**. A
1920×1080 ya entra.

**3 · `/merida` `#programa` — sobran 838 px a 1440×900.** Son los cinco núcleos
con su descripción más «Lo que te llevas»: 1738 px contra 900. Ningún padding los
devuelve. La orden ya lo nombraba como candidato y deja las tres salidas: dos
columnas, acordeón, o aceptar el desborde en esta sola sección.

## B · Armando no flota, en los dos héroes

La sección cede su `padding-bottom` a la columna de texto —la misma maniobra que
la #19 B hizo en `#facilitador` y `#quien`, y por el mismo motivo: quitárselo a
la sección entera arrastraría también al texto— y el arco baja con
`align-self:end`.

**Medido, con el script de capturas:**

| | separación arco ↔ borde de la sección |
|---|---|
| portada 1440×900 | **0,0 px** |
| portada 1920×1080 | **0,0 px** |
| `/merida` 1440×900 | **0,0 px** |
| `/merida` 1920×1080 | **0,0 px** |

**Y el archivo no tiene degradado**, que es la otra mitad —la que la #12 no miró y
la #19 pagó—: `medio-cuerpo-560.png` es 560×676 y su **última fila tiene 558 de
560 píxeles opacos**, con un tramo contiguo de 557. No hay nada que recortar: el
`de-pie` necesitó el recorte de la #19 porque se desvanecía en las últimas ~300
filas; éste llega entero al borde. Queda declarado para que no se busque un
problema que no está.

`max-height:100%` en el arco es el freno que hacía falta: sin él, una columna
ancha con `aspect-ratio:4/5` pide más alto del que hay y el arco se sale por
arriba — peor que el defecto que vino a arreglar.

### El riesgo que `max-height` introduce, medido y descartado

Un `max-height` no recorta —no hay `overflow:hidden`— pero si el contenido no
entrara, se saldría por abajo y se montaría sobre la sección siguiente. Es la
pregunta obvia de cualquiera que lea este diff, así que va contestada con
números y no con una opinión. **Siete tamaños de escritorio, las dos páginas,
catorce mediciones: desborde 0 px en las catorce.**

| viewport | alto de la sección | alto del contenido | desborde |
|---|---|---|---|
| 901×600 | 600 | 496 | 0 |
| 1000×700 | 700 | 596 | 0 |
| 1100×768 | 768 | 661 | 0 |
| 1280×720 | 720 | 615 | 0 |
| 1366×768 | 768 | 661 | 0 |
| 1440×700 | 700 | 596 | 0 |
| 1920×900 | 900 | 788 | 0 |

El margen más chico es de **104 px**, a 901×600 — que es más angosto y más bajo
que cualquier escritorio real. Debajo de 900 px de ancho el tope se levanta
explícitamente (`max-height:none`), porque apilado el hero es texto arriba y foto
abajo y encerrarlo en una pantalla lo recortaría.

### Y un defecto propio, encontrado por la primera captura

La primera versión de esto le puso `width:100%` a `.hero__grid` para estirarlo.
Eso **pisa el ancho del `.container`** (misma especificidad, y la regla va
después) y el hero quedó **pegado al filo izquierdo de la ventana**, sin un píxel
de aire lateral. No lo vio ninguna medición: la regla A mira el alto y esto era
el ancho. Lo vio la captura del informe, que es para lo que la orden la pide.
Está arreglado —el `align-items:stretch` del `.hero` ya estira el eje transversal
y el `width` no hacía falta— y queda escrito en `index.css` al lado de la regla.

## C · La línea del hover, naranja

`.contacto .grande a:hover{border-color:var(--naranja)}`, en su propia regla
después de la que nombra `hover` y `focus-visible` juntos: misma especificidad,
gana la última. **Solo `hover`** — el `:focus-visible` sigue con la regla global
de D26 (2 px de `currentColor`), que es la que hace que el foco se vea igual en
todo el sitio.

Medido en la captura: el borde en hover es `rgb(223, 73, 7)`, que es `--naranja`.
Contraste: la línea no es texto y no tiene umbral; el número se anota igual —
**3,42** sobre el fondo del bloque. `check:acento` sigue con tope 1 y verde.

## D · «Talleres», un solo enlace

Se fueron la fecha y «Reservar por WhatsApp», y con ellos sus dos claves de
`web.json`. `enlaceReservaDelTaller` **sigue existiendo**: la usan el hero y
`Taller.tsx`; lo que se fue es este enlace, no la función.

**El guardián se puso rojo solo**, que es lo que se espera de él: al quitar las
dos claves, `check:i18n` cayó con «es/ declara 299 claves y el piso es 300». Se
bajó el piso a 299 —un renglón en el diff, que es exactamente para lo que ese
número existe— con el motivo escrito. Y las capturas de enlaces de fidelidad
(`*-enlaces-*.json`) cambiaron en las cuatro rutas, porque el censo de enlaces
vio los dos que se fueron.

La #14 había escrito que la fecha valía su renglón porque «lo que la gente busca
en un pie es la fecha». Dirección miró el pie hecho y decidió lo contrario (D23).
Queda anotado en `Pie.tsx` porque el argumento de la #14 no era malo: era una
hipótesis, y la decide quien mira la página.

## E · El lugar abre el mapa

La URL vive en `CANALES.mapaSede` y de ahí salen **los dos** lugares que la usan:
la franja de hechos y el `location.hasMap` del `Event` de schema.org. El test del
evento compara contra `CANALES`, no contra una copia escrita en el test — vigilar
la copia y no el hecho es la lección del token duplicado de la #06.

El texto **no cambia** (`taller.hechos.dondeValor`), que es lo que mantiene en pie
la afirmación del test del evento contra `location.name`. Lo que se agrega es el
`<a>` y un `aria-label` que dice a dónde lleva: «Fiesta Inn Mérida» leído por un
lector de pantalla es el nombre de un hotel, no «esto abre un mapa».

La **CSP no cambia**, y se verificó haciéndolo en vez de razonándolo: consola
**sin una sola violación en las cuatro rutas**, con la cabecera servida tal cual
—`default-src 'self'` y nada más, sin `frame-src` ni `connect-src` nuevos—. Un
`href` externo es navegación, no carga de recurso, y la CSP no gobierna la
navegación del usuario. El enlace sale con `target="_blank"` y `rel="noopener"`,
medidos en el navegador junto con su `aria-label`.

## El guardián nuevo, y sus dos mutaciones

`check/altura.mjs` + `e2e/altura.spec.ts`, la misma forma de dos puertas que
`acento` y `renglones`: **la lógica y las listas de excepciones se importan, no
se copian.**

| mutación | qué cae |
|---|---|
| `#quien{padding-bottom:400px}` | «#quien mide 1434px y la pantalla 900px: sobran 534px», y el de 1920 también |
| una fila de `PENDIENTES` para una sección que ya entra | «estas secciones ya entran… se borra su fila» |

Las dos mitades van en tests separados a propósito: **sobra tan rojo como
falta**, y un piso que sobrevive porque la otra mitad lo sostiene no está
sosteniendo nada.

**Y el verde dice lo que excusó.** «Ninguna sección más alta que la pantalla»
sobre tres que sí lo son sería una mentira con cara de verde; el mensaje las
nombra.

### El guardián se cayó por timeout antes de funcionar, y el motivo vale el renglón

La primera versión esperaba el evento `load` de las imágenes con
`complete === false`. Dos cosas salieron mal, las dos medidas:

1. **El sello CFF de `#programa` es `loading="lazy"` y nunca se carga** en este
   barrido: `naturalWidth: 0` tres segundos después de haber pasado por
   pantalla. Esperarlo costaba el tope entero por viewport.
2. Escuchar un evento puede **perdérselo**; preguntar no.

Resultado: 6,7 s por archivo en aislamiento y **más de 30 s en la gate completa**,
donde el guardián moría por timeout de Playwright — la peor forma de fallar,
porque no habla del sitio, habla del reloj. Ahora se espera solo a la imagen que
**no declara `width`/`height`**, que es la única que puede mover el alto: una con
su caja reservada mide lo mismo cargada que pendiente. **714 ms**, un margen de
40× contra el timeout.

## Lo medido

| | número |
|---|---|
| Gate | **239 declarados** · 0 saltados · ninguna suite bajo su piso |
| `@codice/navegador` | 35 → **38** |
| `check:altura` | 38 secciones × 2 rutas × 2 viewports · 3 excusadas declaradas |
| `check:contraste` | 204 pares · **0 bajo AA** |
| `check:acento` | 808 elementos · tope 1, respetado |
| `check:renglones` | 264 títulos · 0 huérfanos |
| `check:tuteo` / `estilo` / `tokens` / `secretos` / `i18n` | verdes (299 claves) |
| `typecheck`, `lint`, `build` | verdes |
| Fidelidad | capturas regeneradas con `--update-snapshots` **declarado**: cambian las cuatro rutas por el padding, y los dos héroes y el pie por A, B y D |

## Capturas

Las genera `apps/web/check/capturas-20.mjs`, reproducible:

    node check/capturas-20.mjs http://127.0.0.1:4180

| archivo | qué muestra |
|---|---|
| `AB-hero-{portada,merida}-{1440x900,1920x1080}.jpg` | el hero llenando la ventana exacta, sin franja debajo |
| `B-borde-*.jpg` | zoom de 160 px al cambio de color, con el arco apoyado |
| `C-contacto-hover.jpg` | la línea naranja del hover |
| `D-pie.jpg` | «Talleres» con un solo enlace |
| `E-hechos-mapa.jpg` | «Fiesta Inn Mérida» con su hairline de hover |
| `F-lo-que-te-llevas-1440.jpg` | fresco: las tres fotos publicadas son `llevas-claridad`, `llevas-palabras` y `llevas-serenidad`, las de Lucía del 28/9. **La captura de dirección con la mujer meditando es vieja o de caché; no se tocó nada.** |

## Lighthouse — el número **con su método**, que es la regla de la casa

**Lighthouse 13.5.0, móvil, `dist/` servido en local, `--throttling-method=simulate`.**
El método va pegado al número porque el de la casa lo exige desde la #04: *un
número sin su método vuelve a hacer perder media hora al que lo lea en tres
meses*.

Y **la base se midió en esta misma sesión**, no se copió del informe de la #19.
Aquel decía `/merida` en 96, con Lighthouse 13.4.1 y otra máquina en otro
momento: comparar contra esa copia habría sido exactamente el error que la regla
persigue. Se corrió `main` con el mismo binario, el mismo método y la misma
máquina, minutos antes.

*(Y hubo que corregirlo: la primera base se midió sobre el `main` **local**, que
estaba tres merges atrás — sin la #16, la #19 ni la 007. Se descartó entera y se
rehizo sobre `origin/main`, que es de donde sale esta rama. Queda escrito porque
un número medido contra el árbol equivocado es peor que ninguno: parece una
comparación.)*

**Performance, ocho corridas por rama en `/` y tres en `/merida`:**

| ruta | `main` | esta rama | peor de cada una |
|---|---|---|---|
| `/` | 95 96 96 96 96 96 96 96 | 95 96 96 95 95 96 96 96 | **95 = 95** |
| `/merida` | 96 96 95 | 95 95 95 | **95 = 95** |

**No baja.** Por el método de la casa —tres corridas, la peor— las dos rutas dan
el mismo número que `main`. La dispersión es real y está a la vista: `main` mismo
da 95 en una de sus ocho corridas de `/`, así que el 95 no es una propiedad de
esta rama.

Lo que sí se mueve es la **mediana de `/merida`**, de 96 a 95 sobre tres
corridas. Se dice en vez de taparlo, y también se dice por qué no hay mecanismo
para que sea real: **ninguno de los cambios del hero llega al móvil.** Todo lo de
A.3 y B vive arriba de 900 px de ancho; a los 412 px que mide el Lighthouse móvil
rige el bloque `@media (max-width:900px)`, que pone `min-height:0` y
`max-height:none`. Lo único de esta rama que sí llega al móvil es el padding de
sección —que hace las páginas **más cortas**— y dos enlaces menos en el pie. Los
dos van en la dirección contraria a una regresión.

**Accesibilidad: 100 en las cuatro rutas**, que es lo que la orden pide.
Prácticas recomendadas 100 en las cuatro; SEO 100 en `/` y `/merida`, y 66 en las
legales, que es el `noindex` de siempre y no cambió.

| ruta | performance (peor de 3) | accesibilidad | b. prácticas | SEO |
|---|---|---|---|---|
| `/` | 95 | **100** | 100 | 100 |
| `/merida` | 95 | **100** | 100 | 100 |
| `/privacidad` | 97 | **100** | 100 | 66 |
| `/terminos` | 98 | **100** | 100 | 66 |

## Lo que quedó pendiente

- Las **tres decisiones de A.5** de arriba. Ninguna bloquea el merge: la gate está
  verde y el guardián dice en voz alta que las excusó.

---

# #20-bis — Las tres decisiones de A.5, aplicadas y medidas

Rama `web/20-bis-alturas`. Las tres decisiones de dirección de la auditoría del
PR #30: `#quien` 520 → 470, `#facilitador` 480 → 472, y `#programa` partido en
dos secciones (núcleos en 3 + 2, y «Lo que te llevas» como `#llevas`).

## Primero, una corrección a este mismo informe

**Lo que el #30 dijo de `#quien` y `#facilitador` estaba mal.** Decía que mandaba
la foto y proyectaba 893 y 897. Medido ahora, en las dos secciones manda la
**columna de texto**:

| sección | columna de texto | foto | sección |
|---|---|---|---|
| `/` `#quien`, foto a 520 | 944 + 45 de padding | 938 | **1034** |
| `/` `#quien`, foto a 470 | 944 + 45 | 848 | **1034** |
| `/merida` `#facilitador`, foto a 472 | 816 + 45 | 852 | **906** |

La proyección del #30 sumó la foto y el padding sin medir el texto de al lado.
En `#quien` el texto ya era más alto que la foto: achicar a Armando **no compra
ni un píxel**. Se aplicó igual porque es lo decidido; volver a 520 es una línea.

## La tabla, a 1440×900 y 1920×1080

| sección | 1440×900 | 1920×1080 | estado |
|---|---|---|---|
| `/merida` `#programa` (núcleos 3 + 2) | **844 · −56** | 862 · −218 | **entra**, fuera de `PENDIENTES` |
| `/merida` `#llevas` (nueva) | 1023 · **+123** | 1085 · **+5** | `PENDIENTES` |
| `/` `#quien` | 1034 · **+134** | 1052 · −28 | `PENDIENTES` (igual que antes) |
| `/merida` `#facilitador` | 906 · **+6** | 924 · −156 | `PENDIENTES` (era +11) |

`check:altura` verde con **tres** filas en `PENDIENTES`, no con cero ni con una:
la verificación de la orden **no se cumple**, y por eso este PR sube como borrador.

### Sobre «dos columnas (3 + 2)»

Se leyó como **una fila de tres y otra de dos**, que es lo que dibuja «3 + 2».
Medidas las dos lecturas:

| grilla de los núcleos | `#programa` a 1440×900 |
|---|---|
| cinco en fila (como estaba) | 693 |
| **3 + 2 (fila de 3, fila de 2)** — aplicada | **844** |
| dos columnas, 3 a la izquierda y 2 a la derecha | 1076 (no entra) |

La línea entre núcleos se apaga en todos los anchos: en una fila de tres, el
tercero apuntaría a nada. De paso, los títulos de los núcleos 1 y 5 dejaron de
tener un renglón huérfano, y sus dos filas salieron de `check/renglones.mjs`.

La orden decía «el sello CFF arriba con el título»: el `#programa` de `/merida`
**no tiene sello** (el sello está en el `#programa` de la portada). No se agregó
nada; arriba quedan el eyebrow y el título, como estaban.

## Lo que necesita dirección, con opciones medidas

1. **`#llevas` +123.** La manda la foto 4:5 de cada columna (405×507). Medido
   recortando las tres fotos: **5:4 → 841, entra**; 1:1 → 922, no entra.
2. **`#quien` +134.** Manda el texto: eyebrow, título, párrafo, ficha de cuatro
   filas y la cita. Achicar los márgenes entre bloques (40 → 28, 28 → 20) la deja
   en 994, que tampoco entra. Ficha en 2×2: 1184, peor. Lo que queda es menos
   texto o un texto más chico, y ninguna de las dos las decide Rodolfo. También:
   ¿Armando vuelve a 520, ya que 470 no compra nada?
3. **`#facilitador` +6.** `margin-top` de la ficha 40 → 32 la deja en **898**.

## Verificación

| qué | resultado |
|---|---|
| gate de la casa | verde |
| `check:altura` | verde · 40 secciones · 3 excusadas: `inicio#quien`, `merida#llevas`, `merida#facilitador` |
| visto fallar | tope de `#llevas` 123 → 100: rojo en `#llevas mide 1023`. Piso de `/merida` 10 → 12: rojo en `PISO: miró 11` (10 secciones + el pie; el piso cuenta secciones, como en el #30) |
| `check:renglones` | verde; dos filas menos |
| fidelidad | regeneradas con `--update-snapshots`, **declarado**: portada 1440 y 900 (la foto a 470 también rige a 900 de ancho, como regía 520), taller 1440, 900 y 390 (la sección nueva) |
| una fluctuación | `taller-1440` dio 4200 px (0,01 %) distintos una vez en la gate; 0 de 5 corridas más |

## Capturas

`apps/web/check/capturas-20-bis.mjs` — cada sección **entera**, recortada por su
propia caja: si sobra, la imagen mide más de 900.

| archivo | alto |
|---|---|
| `bis-quien-1440x900.jpg` | 1034 |
| `bis-programa-1440x900.jpg` | 844 |
| `bis-llevas-1440x900.jpg` | 1023 |
| `bis-facilitador-1440x900.jpg` | 906 |

## #20-bis · Las decisiones del CEO, aplicadas

1. **`#llevas`: fotos en 5:4** con `aspect-ratio` y `object-fit: cover`, sin
   tocar los archivos. Mirada foto por foto: `llevas-palabras` y
   `llevas-serenidad` conservan las caras enteras con el recorte centrado;
   `llevas-claridad`, centrada, le cortaba la cabeza al padre, y lleva
   `object-position: center top` (clase `encuadre--arriba`, declarada en
   `Llevas.tsx`). Se ve en `bis-llevas-1440x900.jpg`.
2. **`#facilitador`: ficha 40 → 32.**
3. **`#quien`: se acepta el desborde**, la única excepción del sitio, con el
   motivo «texto del cliente». **Armando vuelve a 520.**

| sección (1440×900) | alto | |
|---|---|---|
| `/merida` `#programa` | 844 | entra |
| `/merida` `#llevas` | **841** | entra |
| `/merida` `#facilitador` | **898** | entra |
| `/` `#quien` | 1034 · +134 | la única fila en `PENDIENTES` |

`check:altura`: verde, **una** sección excusada (`inicio#quien`). La vi fallar
volviendo la ficha de `#facilitador` a 40: rojo en `#facilitador mide 906px`.
Gate de la casa verde. Fidelidad: las capturas de la portada vuelven a ser
**exactamente** las del #30 (la foto está otra vez en 520); cambian las del
taller a 1440, 900 y 390, por la sección nueva, el 3 + 2 y el 5:4.
