# Informe de la orden Códice #16 — títulos sin renglones huérfanos

Rama `web/16-titulos`, sobre `main` en `cee17d7`. Gate en verde: **223 tests
declarados** (eran 219), **33 en Chromium** (eran 29), ninguna suite por debajo de
su piso.

---

## 1. El primer commit: se va el JPG que nadie pedía

`apps/web/public/img/fotos/porque-fondo-1800.jpg`, **375.229 B**. Ningún
`<source>` ni `<img>` lo nombraba: el `<picture>` de `Suena.tsx` pide el WebP de
1800 por `media="(min-width: 1101px)"` y el `<img>` de respaldo apunta a
`porque-fondo.jpg`, el de 1200.

**Y al irse se cerró la excepción del presupuesto de fotos, entera.** Era el JPG
el que pasaba los 180 KB —al doble—; el WebP de 1800 pesa 163 KB y está bajo el
presupuesto. Así que `public/img/fotos/LEEME.md` no perdió «su renglón»: perdió la
sección, y en su lugar quedó escrito que la excepción se cerró sola y por qué.
**La carpeta ya no tiene ninguna excepción declarada.**

---

## 2. El hero de `/merida`: dos renglones y dos colores

Capturas en esta carpeta: `hero-{1440,1100,900,390,375}-{antes,despues}.jpg`.

| | antes | después |
|---|---|---|
| renglones a ≥ 900 | 3 | **2** |
| colores | 3 (tinta, teal, naranja) | **2** (tinta, naranja) |
| a 1440 | «El arte de amar» / «a tu» / «ADOLESCENTE.» | «El arte de amar a tu» / «ADOLESCENTE.» |
| a 375 | «El arte de amar» / «a tu» / «ADOLESCENTE.» | «El arte de» / «amar a tu» / «ADOLESCENTE.» |

**El teal se fue** (decisión de dirección, anotada en `docs/tareas.md` junto a la
excepción de la #12). La excepción de la #12 **no cambia**: sigue siendo un
elemento con tope 1, y `check/acento.mjs` sigue permitiendo exactamente
`#inicio h1 .hero-taller__palabra` — verificado, 816 elementos mirados, cero
acentos de más.

### Lo que hizo falta para que «El arte de amar a tu» entre en un renglón

Medido a nueve anchos entre 901 y 1440: **al `h1` le faltaban entre 46 y 72 px**.

| ancho | letra | ancho del `h1` | el renglón pide | faltaba |
|--:|--:|--:|--:|--:|
| 1440 | 80,0 px | 695,5 | 762,5 | −67,0 |
| 1280 | 71,7 px | 618,2 | 683,2 | −65,0 |
| 1100 | 61,6 px | 531,3 | 587,2 | −55,9 |
| 1024 | 57,3 px | 494,6 | 546,5 | −52,0 |
| 901 | 50,5 px | 435,2 | 480,9 | −45,7 |

La orden pide **ensanchar la columna antes que tocar el tamaño de letra**, y con
la columna alcanzó: **el `clamp()` de `.display-xl` no se tocó** (que además es el
de la portada, y esto no tenía por qué llegar allá). Se repartió entre dos
ajustes, en una clase nueva `.hero__grid--taller` para no mover el hero de la
portada:

- `grid-template-columns` de `1.15fr .85fr` a **`1.32fr .68fr`**
- `gap` de `clamp(40px,6vw,96px)` a **`clamp(32px,3.5vw,64px)`**

**Lo que cuesta, medido a 1440:** el `h1` pasa de 695 a **822 px** (pide 762, así
que sobran 60) y la foto del arco de 514 a **424 px de ancho, un 17 % menos**. Se
repartió entre la columna y la canaleta justamente para que la foto pagara menos:
solo con la columna habría que llegar a 1,45fr. Está en las capturas.

### El CLS, y el camino equivocado que se midió antes de encontrar el bueno

La orden proponía `text-wrap: balance` para el reparto de abajo de 900. **Se hizo
así primero y se midió que reabría el CLS que la #12 había cerrado.** Con el
titular en una sola cadena, la tipografía de reserva y Montserrat no se ponen de
acuerdo en cuántos renglones ocupa:

| ancho | reserva | Montserrat | ¿misma cuenta? |
|--:|--:|--:|:--:|
| 1440 | 2 | 3 | ✗ |
| 1280 | 2 | 3 | ✗ |
| 1100 | 2 | 3 | ✗ |
| 1024 | 2 | 3 | ✗ |
| 900 | 2 | 2 | ✓ |
| 820 | 2 | 2 | ✓ |
| 768 | 2 | 2 | ✓ |
| 430 | 2 | 3 | ✗ |
| 412 | 2 | 3 | ✗ |
| 390 | 2 | 3 | ✗ |
| 375 | 2 | 3 | ✗ |
| 360 | 3 | 3 | ✓ |

Ocho de doce en desacuerdo, y `/merida` llegaba a **0,1765 de CLS a 390 px**.

Así que **los dos saltos del titular son estructurales y ninguno depende de la
tipografía**: «ADOLESCENTE.» es `block` siempre (lo puso la #12) y «amar a tu» es
`inline` de 600 px para arriba y `block` para abajo. Un `display` gobernado por el
ancho de ventana no sabe qué fuente cargó, que es exactamente la propiedad que
hacía falta. **La tabla final, que es la que pedía la orden:**

| ancho | reserva | Montserrat | ¿misma cuenta? | renglones |
|--:|--:|--:|:--:|---|
| 1440 | 2 | 2 | ✓ | «El arte de amar a tu» / «ADOLESCENTE.» |
| 1280 | 2 | 2 | ✓ | «El arte de amar a tu» / «ADOLESCENTE.» |
| 1100 | 2 | 2 | ✓ | «El arte de amar a tu» / «ADOLESCENTE.» |
| 1024 | 2 | 2 | ✓ | «El arte de amar a tu» / «ADOLESCENTE.» |
| 900 | 2 | 2 | ✓ | «El arte de amar a tu» / «ADOLESCENTE.» |
| 820 | 2 | 2 | ✓ | «El arte de amar a tu» / «ADOLESCENTE.» |
| 768 | 2 | 2 | ✓ | «El arte de amar a tu» / «ADOLESCENTE.» |
| 430 | 3 | 3 | ✓ | «El arte de» / «amar a tu» / «ADOLESCENTE.» |
| 412 | 3 | 3 | ✓ | «El arte de» / «amar a tu» / «ADOLESCENTE.» |
| 390 | 3 | 3 | ✓ | «El arte de» / «amar a tu» / «ADOLESCENTE.» |
| 375 | 3 | 3 | ✓ | «El arte de» / «amar a tu» / «ADOLESCENTE.» |
| 360 | 3 | 3 | ✓ | «El arte de» / «amar a tu» / «ADOLESCENTE.» |

**Cero anchos en desacuerdo.** `balance` igual entra al design system por la
sección B: gobierna el resto de los títulos, donde no hay una forma aprobada que
defender.

### Y el corte cayó entre «de» y «amar», no donde la orden lo proponía

La orden aceptaba «El arte de amar» / «a tu» debajo de 900. Se implementó así y
**el guardián nuevo de esta misma orden lo cazó**: «a tu» tiene cuatro caracteres,
o sea es exactamente el renglón huérfano que la #16 vino a eliminar, y dejarlo
habría obligado a excusarlo con una excepción — una excepción para la forma que la
orden prohíbe. Partido entre «de» y «amar», los dos renglones tienen tres palabras
y ninguno es huérfano. **El texto que se lee es el mismo**; lo único que cambió es
en qué espacio corta, y por eso las tres claves de i18n siguen siendo tres
(`PISO_DE_CLAVES` da 300 exacto, que es lo que la orden fijó).

### El CLS que no es de esta orden, y que sí existe

`/merida` **no tiene CLS 0 a todos los anchos**, y no lo tenía antes de la #16
tampoco. Medido sobre `main`: **0,1400 a 1024 px**. No es el titular: es la bajada
del hero. `.hero-sub` tiene `max-width:40ch`, y **`ch` depende de la tipografía**,
así que cuando entra Montserrat el ancho máximo del párrafo cambia y la bajada
pasa de un renglón a dos.

La traza, sobre `main` a 1024: a los 79 ms la bajada mide 58 px de alto; a los 105
ms mide 86 px, y el grid del hero pasa de 457 a 544 px de alto.

Es el pendiente viejo § 5c —el salto de tipografía, que dirección cerró sin abrir
porque el arreglo vive en `packages/ui`— asomando por una puerta nueva. **La #16
no lo tocó** (ninguna orden lo cubre) pero de rebote lo mejoró, porque la columna
más ancha cambia dónde cae ese envolvido:

| ancho | CLS en `main` | CLS con la #16 |
|--:|--:|--:|
| 1440 | 0,0040 | 0,0041 |
| 1024 | **0,1400** | **0,0065** |
| 900 | 0,0094 | 0,0103 |
| 390 | 0,0000 | 0,0105 |
| 375 | 0,0003 | 0,0003 |

Lighthouse móvil da CLS **0** de los dos lados, que es por qué nadie lo había
visto: el informe de la #12 midió con Lighthouse, en móvil, y ahí no aparece.

---

## 3. El barrido de todo el sitio

### `text-wrap` en `packages/ui`, no en `apps/web`

Archivo nuevo `packages/ui/tipografia.css`, importado por `styles.css`, con dos
reglas: `text-wrap: balance` para `h1, h2, h3` (por elemento, para que lo herede
cualquier producto que escriba un título) y `text-wrap: pretty` para `.lead` y
`.hero-sub`. Declarado en `packages/ui/LEEME.md`, que es nuevo.

El acoplamiento queda dicho en voz alta en los dos archivos: `.lead` y
`.hero-sub` son clases de `apps/web` y acá hay una hoja del design system
nombrándolas. La alternativa era una clase propia del paquete puesta en el markup
de cada bajada de cada página.

### Qué cambió en las otras páginas — el antes/después, medido

Ninguna captura cambió de **texto** (los ocho `-texto.txt` del guardián de
fidelidad siguen idénticos): lo único que se movió es dónde corta cada renglón.

| ruta | qué | antes | después |
|---|---|---|---|
| `/` @900 | `.lead` | …«con cupo» / «limitado.» | …«con» / «cupo limitado.» ✔ |
| `/terminos` @1440 y @900 | `.lead` | …«Es corta a» / «propósito.» | …«Es corta» / «a propósito.» ✔ |
| `/merida` @1440 | `.hero-sub` | …«que tu hijo» / «necesita.» | …«que tu» / «hijo necesita.» ✔ |
| `/merida` @1440/@390/@375 | h2 «Las estrategias…» | «Las estrategias del» / «pasado» / … | «Las estrategias» / «del pasado» / … ✔ |
| `/merida` @390/@375 | h2 «¿El niño dulce…» | «¿El niño dulce que» / «criaste» / … | «¿El niño dulce» / «que criaste» / … ✔ |
| `/merida` @1440/@900 | h3 «Núcleo 2» | «Entender a mi» / «adolescente» | «Entender a» / «mi adolescente» ✔ |
| `/merida` @1440/@900/@390 | h2 del cierre | …«unos padres» / «conscientes.» | …«unos» / «padres conscientes.» ✔ |
| `/merida` @900 | h3 «Núcleo 3» | «Comprender nuestra» / «familia» | «Comprender» / «nuestra familia» ≈ |

Los ✔ son mejoras —desaparece un renglón de una palabra—. El ≈ es un empate:
`balance` cambió **cuál** de los dos renglones queda de una palabra. Está en la
lista de pendientes.

**Seis capturas de fidelidad actualizadas**: `inicio-900`, `taller-{1440,900,390}`
y `terminos-{1440,900}`. *Capturas actualizadas por la orden #16*, y son
exactamente las seis que el diff de arriba explica.

---

## 4. El guardián nuevo: `check/renglones.mjs`

Cuatro rutas × cuatro anchos (1440, 900, 390, 375) × cada `h1`, `h2` y `h3`.
**264 títulos medidos.** Cae si un renglón de un título tiene una sola palabra o
menos de seis caracteres. Dos puertas y un solo barrido: `pnpm check:renglones` y
`e2e/renglones.spec.ts`, que importa las mismas constantes y la misma función.

**Lo que no mira, escrito para que el alcance no se lea como «todo»:** los títulos
de un solo renglón (un título que entra entero no está partido: «Claridad» es un
`h3` de una palabra y está bien), los títulos invisibles, y `h4` para abajo.

### La mutación

Volver a poner «a tu» en su renglón propio —`titulo1`/`titulo2` a como estaban y
`.hero-taller__atu` en `display:block` a todo ancho—. El guardián **cae, con
salida 1, nombrando el título y el ancho, en los cuatro**:

```
✗ merida @1440px · 25 títulos · 1 renglón(es) huérfano(s)
    merida @1440px · h1.display-xl.u-mt-4 · renglón 2 de 3: «a tu» — menos de
    seis caracteres · el título entero: «El arte de amar / a tu / ADOLESCENTE.»
✗ merida @900px  · … · h1.display-xl.u-mt-4 · renglón 2 de 3: «a tu» …
✗ merida @390px  · … · h1.display-xl.u-mt-4 · renglón 2 de 3: «a tu» …
✗ merida @375px  · … · h1.display-xl.u-mt-4 · renglón 2 de 3: «a tu» …
```

Se comprobó con el diff que los dos archivos habían cambiado de verdad antes de
creerle al rojo, y que al revertirlos la salida vuelve a 0.

### Un falso positivo que el propio barrido se encontró, y vale escribirlo

La primera versión agrupaba las palabras por `Math.round(top)` y **denunció cuatro
renglones huérfanos que no existen**: las fichas de «Ahora» tienen
`h3 a{display:inline-flex;align-items:center}` con la flecha a `.8em`, así que la
flecha va **al lado** del texto pero con otro `top`. Dos `top`, dos renglones
contados, un solo renglón en la pantalla.

Se llegó a «arreglar» la página con un espacio duro antes de la flecha. **El
arreglo no cambió nada** —un ítem de flex con `flex-wrap:nowrap` no se puede ir de
renglón— y ahí quedó claro que lo roto era la medición. Se revirtió. Ahora las
palabras se agrupan por **solape vertical**, que tolera tamaños de letra
distintos, `vertical-align` y `align-items`.

### Las excepciones: **1 aprobada y 14 pendientes de dirección**

Están en dos listas separadas a propósito: una sola se leería como «quince
renglones aprobados» y no lo son.

**Aprobada (1):** «ADOLESCENTE.», la excepción declarada de la #12, tope 1.

**Pendientes de dirección (14).** El barrido las encontró y **ninguna se arregla
sin cambiar un texto, un tamaño o el ancho de una columna** — y la orden es
explícita: eso no lo decide Rodolfo. Están declaradas con motivo y tope para que
la gate quede verde sin dejar de ver el defecto, y **cada fila se borra el día que
dirección resuelve la suya**:

| # | ruta | título | renglón | por qué está | cómo se cierra |
|--:|---|---|---|---|---|
| 1 | `/` | `#programa h2` | «Construyendo» | primer renglón de un `<br>` declarado | mover dónde cae el `<br>` |
| 2 | `/` | `#contacto h2` | «Escríbeme.» | primer renglón de un `<br>` declarado | mover dónde cae el `<br>` |
| 3 | `/` | `#contacto h2` | «y yo.» | cola del envolvido, 1440 y 390 | acortar o ensanchar |
| 4 | `/` | `#libros h3` | «Construyendo» | el título del libro, 390 y 375 | acortar o ensanchar |
| 5 | `/` | `#libros h3` | «Padres» | «Padres digitalmente responsables» en tres renglones de una palabra, 375 | acortar o bajar tamaño |
| 6 | `/` | `#libros h3` | «digitalmente» | el mismo, renglón del medio | ídem |
| 7 | `/` | `#libros h3` | «responsables» | el mismo, cola, 390 y 375 | ídem |
| 8 | `/merida` | `#suena h2` | «desconocido?» | cola, 1440 / 390 / 375 | acortar o ensanchar |
| 9 | `/merida` | `#preguntas h2` | «silencio.» | cola, 390 y 375 | ídem |
| 10 | `/merida` | `#programa h3` | «adolescencia» | cola del Núcleo 1, 1440 | ídem |
| 11 | `/merida` | `#programa h3` | «Comprender» | medio del Núcleo 3, 1440 y 900 | ídem |
| 12 | `/merida` | `#programa h3` | «cambios» | cola del Núcleo 5, 1440 | ídem |
| 13 | `/merida` | `#reservar h2` | «padres» | el cierre mide **siete** renglones a 375 | menos palabras o menos tamaño |
| 14 | `/merida` | `#reservar h2` | «conscientes.» | el mismo | ídem |

El 13 y el 14 tienen una causa propia que conviene saber: **`text-wrap: balance`
de Chromium deja de trabajar arriba de seis renglones**. Ese título no se arregla
repartiendo.

Y una excepción que sobra se caza sola: `pnpm check:renglones` compara al final
lo que cada fila excusó **en todo el barrido** y se pone rojo si alguna no excusó
nada — *un permiso que sobra es una mentira con formato de tabla*. Corre por
consola y no en el spec, y está dicho por qué: cada test del spec ve una ruta, así
que ninguno puede decir «sobra».

---

## 5. Los pisos que subieron

| qué | antes | ahora | por qué |
|---|--:|--:|---|
| `PISO_DE_CLAVES` (i18n) | 284 | **300** | el 284 era de la #01 y había quedado 16 claves atrás |
| `@codice/navegador` | 29 | **33** | los cuatro tests de `e2e/renglones.spec.ts` |

Los cuatro tests nuevos cuestan **2,4 s medidos**: van agrupados por ruta —una
navegación y cuatro cambios de viewport— en vez de dieciséis tests con dieciséis
navegaciones. Un rojo igual dice ruta, ancho, título y renglón.

---

## 6. Verificación

| qué | resultado |
|---|---|
| `check:renglones` | **0 huérfanos**, 264 títulos medidos |
| `check/acento.mjs` | **0 acentos de más**, 816 elementos; la excepción de la #12 con tope 1 intacto |
| `check/contraste.mjs` | **135 pares distintos, 0 por debajo del umbral** |
| `check:tuteo` · `check:i18n` · `check:estilo` · `check:tokens` · `check:secretos` | verdes |
| `pnpm typecheck` | verde |
| `pnpm test` | **223 declarados, 33 en Chromium, 0 saltados, ninguna suite bajo su piso** |
| fidelidad | 12 verdes con las seis capturas actualizadas |

**Lighthouse móvil sobre `/merida`, antes y después:**

| métrica | antes | después |
|---|--:|--:|
| performance | 96 | 96 |
| accesibilidad | 100 | 100 |
| buenas prácticas | 100 | 100 |
| seo | 100 | 100 |
| LCP | 2,5 s | 2,6 s |
| CLS | 0 | 0 |
| TBT | 0 ms | 0 ms |

Ninguna categoría baja. Los 0,1 s de LCP están dentro de lo que se mueve entre
corridas en la misma máquina; el elemento LCP sigue siendo el retrato del hero.

---

## 7. Lo que necesita dirección

1. **Las 14 excepciones pendientes** de la tabla de arriba: por cada una, decidir
   si se acorta el texto, se baja el tamaño o se ensancha la columna. La fila se
   borra cuando se resuelve.
2. **La regla misma**, y conviene antes que lo anterior: la orden la escribió como
   «una sola palabra **o** menos de 6 caracteres», y así está implementada.
   Escrita como «menos de 6 caracteres» a secas, la lista de pendientes baja de
   **14 a 1** («y yo.») y la mutación sigue cayendo —«a tu» son cuatro
   caracteres—, pero deja de ver «Padres / digitalmente / responsables», que son
   tres renglones de una palabra y es un título de verdad mal partido. Es un
   renglón de código en `check/renglones.mjs`.
3. **Mirar las capturas del hero** a 1440 y 1100: la foto del arco es un **17 %
   más angosta** que antes. Es lo que costó que el titular entre en dos renglones
   sin tocar el tamaño de letra.
