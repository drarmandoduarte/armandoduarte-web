# Orden Códice #07 — Pasada premium del contenido

Rama `web/07-contenido` sobre `main` (con la #06 adentro). Segunda mitad de la
pasada premium: el contenido. El cromo fue la #06.

**El diagnóstico era que la web tenía demasiado naranja.** Al terminar, el
barrido cuenta el acento en **cero elementos fuera de su lugar** y el de
contraste da **cero pares por debajo de AA en las cuatro páginas — por primera
vez desde que existe.**

---

## Lo que hay que decidir

### 1 · La foto de público NO quedó de fondo de «Tres maneras»

La orden (H.2) la pedía ahí con el mismo velo del 88 % de «¿Te suena?». Medido
con `check/contraste.mjs`, que promedia el píxel realmente dibujado detrás de
cada línea:

| velo | pares bajo AA | el peor |
|---|--:|--:|
| 88 % | 14 | 3,47 |
| 94 % | 12 | 3,98 |
| 96 % | 10 | 4,15 |
| 98 % | 7 | 4,31 |

**No converge, y no es por poco.** El cuerpo de esa sección es `--gris` a 16 px
sobre cálido, que **ya está en 4,51 sin ninguna foto detrás**: no hay margen para
que se cuele ni un 2 % de imagen. Y a 98 % la foto ya no se ve — o sea que el
único velo que podría llegar a AA es el que la vuelve invisible.

Es exactamente lo que la **decisión 5 de esta misma orden** dictaminó para «¿Te
suena?»: una foto detrás de texto chico no es una foto, es una mancha. Así que se
sacó. El archivo queda en el repo (`fotos/tres-maneras-fondo.*`) y está anotado
en `docs/creditos.md` como «en el repo, sin usar».

**Lo que decide dirección:** dejarla afuera, o dónde ponerla. Si va, el camino
que sí funciona es el de la decisión 5 — dentro de una tarjeta, con velo fuerte y
solo texto grande en crema encima—; ahí la foto se ve y el contraste sobra.

### 2 · `familia.svg` quedó sin usar

La orden pedía los cuatro —`familia, practica, formacion, obra`— «delante de cada
fila de la ficha de "Quién soy"». Pero las filas de «Quién soy» son **Formación ·
Práctica · Obra · Base**: no hay fila «Familia». Los cuatro nombres son los de la
ficha de **«Sobre el facilitador»**, en `/merida`, que la orden no nombra.

Se pusieron los tres que coinciden —formación, práctica, obra— y **lugar** para
«Base · Mérida, Yucatán», que es lo que esa fila dice. `familia.svg` quedó sin
usar: agregarle íconos a una sección que la orden no menciona habría sido
resolverlo abajo.

**Lo que decide dirección:** si la ficha de «Sobre el facilitador» también lleva
íconos. Si sí, los cuatro están listos y es un renglón.

### 3 · Dos contradicciones internas de la orden, resueltas por la decisión 4

- **Los lomos.** La sección E dice «los dos lomos falsos en `--teal`»; la
  decisión 4 dice que *Construyendo Familias Fuertes* pasa a su **portada real**
  y que *Padres digitalmente responsables* se queda con lomo **navy**. Mandó la
  decisión 4: es la lista que dirección aprueba al aprobar la orden, y la frase
  de E es de antes de que existiera la portada. Resultado: una portada real y un
  solo lomo, navy.
- **El piso del barrido del acento.** G.1 pide «más de 400 elementos por página».
  Medido: 268 · 328 · 98 · 91. Ninguna llega, y las legales nunca van a llegar —
  son documentos de texto. Un piso imposible es un rojo permanente, y un rojo
  permanente se apaga (la casa ya lo aprendió con `check-tokens`). El piso pasó a
  ser **por página y medido**, con margen: 220 · 270 · 80 · 75.

---

## A · El naranja se retira de lo estructural

| elemento | antes | ahora |
|---|---|---|
| números de lista (`.lista`, `.tres`, `.preguntas`, `.paso__num`) | naranja | `--gris`, tabulares |
| flechas `→` y `.link` | naranja | color del texto; naranja solo en hover |
| filete de las tarjetas de «Lo que te llevas» | naranja | `--hair` |
| línea de tiempo de «Cuatro núcleos» | naranja, número en círculo naranja | `--hair`, número en gris **sin círculo** |
| barra de `.cita` y de `.garantia` | naranja / ámbar | `--hair` / `--hair-oscura` |
| firma de la cita, nombres de testimonios | naranja | `--gris` / crema 70 % |
| guiones de «Todo incluido» | naranja | **se fueron**: la lista se sostiene con sus hairlines |
| eyebrows sobre oscuro | ámbar (2,81 sobre teal) | **crema al 70 %** |
| pill «AHORA» y su enlace | ámbar | crema 70 % con texto teal / crema |
| subrayado de los legales | naranja | `currentColor` |

**El 70 % no es un número elegido**: es el primero que pasa 4,5 sobre las dos
tintas oscuras. Medido: 60 % → 3,85 · 65 % → 4,24 · **70 % → 4,66 (teal) y 7,27
(tinta)**.

Lo que sigue siendo naranja: el CTA primario, el hover, el `.script` del pie, los
eyebrows sobre claro y `.dato`. Nada más — lo afirma `check/acento.mjs`.

## B · Los botones, con la anatomía de 512

Píldora de 999 px, 13 px/500 sin versalitas, 56 de alto → rectángulo de hairline,
**11 px / 600 / `.18em` en versalitas, 52 de alto**, radio 2 px.

Peso 600 y no el 700 del motor, tracking `.18em` y no `.22em`: Montserrat es más
ancha y a 700/.22 se lee negra. Radio 2 y no 0: a cero el borde de 1 px se ve
astillado en las esquinas a densidad 1×.

**El primario sobre tinta dejó de ser ámbar.** «Asegurar mi lugar» en el cierre
de `/merida` era un botón amarillo con texto marrón que se leía como una
advertencia; ahora es crema con texto teal, igual que sobre teal.

A ≤ 600 px los botones toman el ancho de la columna en vez de partirse en dos
líneas.

## C · El contacto, sin subrayados

En reposo no hay línea: la jerarquía ya la da el tamaño (36 px contra 17), y no
hace falta marcar que son enlaces porque **todo el bloque es de contacto**. En
hover aparece una línea de crema al 45 %; el borde queda declarado en
transparente para que el renglón no salte.

**El barrido de subrayados** sobre toda la hoja: los únicos `border-bottom` en
enlaces eran `.contacto .grande a` (resuelto) y `.legal a`, que **se queda** —es
texto corrido y ahí un enlace sin marcar no se distingue— pero deja de ser
naranja y sigue el color del texto.

## D · El primer viewport se pinta entero

Ningún elemento del hero lleva `.reveal`, en las dos páginas. Antes entraban
escalonados con `data-d` y el `<h1>` —que es el LCP— esperaba al
`IntersectionObserver`.

Afirmado en `e2e/comportamiento.spec.ts`, y la afirmación se hace **después de
que el script corrió**: la regla que apaga los bloques es `.js .reveal`, así que
sin JavaScript todo vale 1 y el test pasaría solo.

- contra el hero de `main`: **rojo**, «6 elementos con `.reveal`»
- contra el de ahora: **verde**

**LCP medido**: inicio 2703 → **2559 ms**; `/merida` 2630 → 2628. Mejoró donde la
orden esperaba que mejorara.

## E y F · Sección por sección

- **Libros**: portada real de *Construyendo Familias Fuertes*; el otro libro se
  queda con lomo navy (decisión 4). No se inventó una portada que no existe.
- **El programa**: el logo CFF pasó del raster con sombra a 150 px al recorte sin
  sombra a 200 px.
- **«¿Te suena?»** (decisión 5): la foto salió del fondo de la sección y entró en
  la tarjeta de la cita, con velo teal al 78 % y texto crema. Ahí **se ve el
  rostro**, que era el punto.
- **«Siete preguntas»**: a ≥ 900 px va en dos columnas (cuatro y tres). A 1440 la
  mitad derecha de la pantalla estaba vacía.
- **«Quién soy» y «Tres maneras»**: un ícono por fila (ver decisión 2).

## H · Los insumos de dirección, ubicados

- **11 SVG** en `public/img/iconos/`. Los cuatro redibujados reemplazan a los PNG
  del mismo nombre, que se borraron: **con eso se cierra el pendiente 12**. Los
  cuatro naranja de «Cuatro núcleos» siguen siendo los PNG de Lucía.
- **Instagram** `@dr.armandoduarte` en `canales.ts`, en el pie y en el contacto.
- **Créditos** en `docs/creditos.md`, nuevo: todas las imágenes publicadas con su
  origen y su licencia.

---

## Verificación de cierre

### El barrido del acento (G.1)

```
✓ inicio      · 268 elementos mirados · el naranja solo donde se decidió
✓ merida      · 328 elementos mirados · el naranja solo donde se decidió
✓ privacidad  ·  98 elementos mirados · el naranja solo donde se decidió
✓ terminos    ·  91 elementos mirados · el naranja solo donde se decidió

785 elementos. Permitido: .btn--naranja, .eyebrow, .script, .dato.
```

`check/acento.mjs` **no tiene ningún hex escrito**: lee `--naranja` y
`--naranja-texto` del `:root` de la página que está midiendo. Es la primera
lección de la #06 vuelta código — un guardián que compara contra otra copia del
valor vigila la copia, no el valor.

### Contraste (G.3)

```
123 pares distintos · 0 por debajo del umbral
```

Los más justos que pasan: eyebrow y números en **4,51** sobre cálido, el pill de
«Ahora» en 4,66. **Cero fallos** incluye la tarjeta con foto de «¿Te suena?»,
medida contra el píxel dibujado.

Antes de esta orden quedaban dos pares abiertos —el ámbar sobre teal (2,81, el
pendiente 4c) y la tapa del libro (3,72)—. El primero se cerró con el crema al
70 %; el segundo, con la portada real. **4c queda cerrado.**

### Lighthouse (G.5)

Método: 13.4.1, móvil, local sobre `dist/`, tres corridas, la peor.

| página | performance | accesibilidad | b. prácticas | SEO |
|---|---|---|---|---|
| inicio | 95 → **95** = | **100** | 100 | 100 |
| /merida | 95 → **95** = | **100** | 100 | 100 |
| privacidad | 98 → **98** = | **100** | 100 | 66 |
| terminos | 98 → **98** = | **100** | 100 | 66 |

Accesibilidad 100 en las cuatro y performance sin mover un punto, con seis
imágenes nuevas adentro.

### La gate

```
pnpm test       95 tests declarados, 0 saltados, ninguna suite bajo su piso
check:acento    785 elementos, cero acentos fuera de lugar
check:tokens    59 archivos, ningún hex fuera de codice-tokens.css
check:secretos  137 archivos, ninguna forma encontrada
typecheck · lint · build   limpios
```

Piso: `@codice/navegador` 20 → **22** (los dos tests del hero).

### Las mutaciones (F-bis 2)

Antes de declararlas válidas, **qué comprobación concreta las caza**:

| se rompió | quién se puso rojo |
|---|---|
| un número de lista de vuelta a `--naranja-texto` | `check/acento.mjs`, salida **1**: «3 acento(s) fuera de lugar» en `/merida`, con el selector y el texto de cada uno |
| el hero de `main` (con sus seis `.reveal`) | el test de D: «ningún elemento del hero puede llevar `.reveal`», esperaba 0 y recibió 6 |

Las dos caen sobre algo que existe y se está mirando, que es lo que F-bis exige.

## Capturas

Antes | después, a 1440 y 390, en esta carpeta: `hero-home`, `quien`, `hago`,
`libros`, `programa`, `contacto`, `hero-merida`, `suena`, `nucleos`,
`inversion`, `preguntas`, `reservar`.

## Lo que sigue esperando a otros

La **fecha y la sede** del taller (Armando) y la confirmación de que los dos
testimonios son reales y autorizados (se le preguntó el 12/9). No se inventa
ninguna de las dos.
