# Orden Códice #05 — La devolución de Lucía y de Armando

Rama `web/05-devolucion` sobre `main`. La primera orden que cambia la web **a
pedido del cliente**, bajo D23.

Ocho capturas comentadas por Lucía Duarte (16/9, 20:41–22:29) y un mensaje de
Armando, traducidos a paleta, íconos, fotografías, teléfonos y URL.

---

## Lo que hay que mirar primero, porque son decisiones y no ejecución

Tres cosas salieron distintas de lo que la orden decía. Ninguna cambia lo que se
pidió; las tres cambian **cómo** se hizo, y las tres se miden.

### 1 · El naranja de texto es `#BF3F06`, no el `#C44006` que la orden esperaba

La orden pedía «el naranja más claro que dé ≥ 4,5 sobre crema, cálido y blanco»
y estimaba que iba a caer cerca de `#C44006`. Medido, **`#C44006` da 4,34 sobre
el cálido**: no llega.

Se oscureció el naranja del manual en pasos de 0,1 %, conservando la relación
entre canales, hasta el primero que pasa en los tres fondos:

| candidato | crema | cálido | blanco | |
|---|--:|--:|--:|---|
| `#DF4907` (el del manual) | 3,86 | 3,48 | 4,12 | no llega |
| `#C44006` (el que la orden esperaba) | 4,81 | **4,34** | 5,14 | no llega |
| `#C03F06` | 5,02 | **4,49** | 5,36 | no llega por 0,01 |
| **`#BF3F06`** | **5,00** | **4,51** | **5,34** | **éste** |

El fondo que manda vuelve a ser el cálido y no el crema — la misma lección de la
#03, otra vez. Y 4,51 sobre el cálido es, casualmente, el mismo margen exacto con
el que pasaba el ocre que reemplaza.

### 2 · La tabla de fotografías de la orden tenía cruzados dos rótulos

La orden asigna la foto de fondo a «¿El niño dulce que criaste…?» **(Porque)** y
la tarjeta a «Las estrategias del pasado ya no funcionan» **(Suena)**. Los
títulos entrecomillados y los nombres de componente dicen cosas opuestas:
«¿El niño dulce…?» es `Suena` y «Las estrategias del pasado…» es `Porque`.

**Mandó el título**, que es lo que Lucía tenía delante cuando comentó la captura.
Así que el fondo velado quedó en la sección del chico en el sillón y la tarjeta
en la de la madre agobiada, que además es la lectura que tiene sentido.

### 3 · La negrita del hero no era gris: era teal

La orden dice que «se construyen» es `span.suave` (gris, peso 300). Es
`span.acento`: **teal**, peso 300. El cambio se hizo como la orden lo pide —peso
600 y color de la tinta— pero conviene saber que además **le saca el acento teal
al titular principal de la portada**, que puede no ser lo que Lucía imaginaba al
escribir «probar poner en negritas».

Van tres capturas para que elija, y las tres difieren **sólo** en esa línea:

| | 1440 | 390 |
|---|---|---|
| antes (teal, 300) | `B-antes-1440.jpg` | `B-antes-390.jpg` |
| después, como pide la orden (tinta, 600) | `B-despues-1440.jpg` | `B-despues-390.jpg` |
| variante: negrita pero sigue teal | `B-variante-teal-1440.jpg` | `B-variante-teal-390.jpg` |

Volver atrás o pasar a la variante es **una línea** en `index.css` (`.fuerte`).

---

## A · La paleta de la web es la del manual CFF

`packages/ui/codice-tokens.css` y su JSON pasan a **1.2.0**, changelog «paleta
CFF, orden #05».

| token de la web | antes (D6) | ahora (CFF) |
|---|---|---|
| `--teal` | `#33585C` | teal oscuro `#005761` |
| `--teal-medio` | `#527E82` | teal claro `#3D9CA4` |
| `--ocre` → `--naranja-texto` | `#866539` | **`#BF3F06`** (derivado, ver arriba) |
| *(nuevo)* `--naranja` | — | naranja `#DF4907` |
| `--ocre-medio` → `--ambar` | `#B18C54` | ámbar `#DA8100` |
| `--navy` | `#2F3A4E` | navy `#001B4A` |

**Los cinco valores salen de los PNG de Lucía, no de la foto del manual.** La
orden transcribía `#3E9CA4` y `#DE4907`, leídos del JPEG del archivo de marca;
medidos píxel a píxel, los ocho íconos son de **un solo color plano cada uno** y
ese color es exactamente `#3D9CA4` y `#DF4907`. Es un punto de 255 en un canal
—invisible— pero de eso depende que una línea del CSS sea el mismo naranja que el
ícono que tiene al lado, que era la intención de la orden.

`--ocre` deja de existir en la web. Sigue en el JSON bajo `color.brand.ochre` con
la nota «app: citas de libro (D6); la web usa CFF desde la #05», para que el
consultorio decida por su cuenta. Verificado: `grep -c 'var(--ocre' index.css` → **0**.

### Lo que el cambio de paleta mejora, y lo que no

| par | antes | ahora | |
|---|--:|--:|---|
| crema sobre teal (las secciones oscuras) | 7,30 | **7,74** | mejor |
| ámbar sobre tinta (botón y píldora) | 4,53 | **4,78** | mejor |
| ámbar sobre el velo del menú (`a.pr`) | 4,05 | **4,27** | mejor, sigue sin llegar |
| la tapa del libro (`small` al 80 %) | 3,54 | **3,72** | mejor, sigue sin llegar |
| **ámbar sobre teal** | 2,51 | **2,81** | mejor, sigue sin llegar — **pendiente 4c** |
| el rótulo del menú, al 50 % de opacidad | 1,62 | **1,46** | **peor** |

El último es el único que empeoró y es honesto decirlo. El rótulo del overlay
hereda el color de acento, que pasó de ocre a naranja de texto. Los dos valores
están igual de lejos del umbral —1,6 y 1,5 sobre 4,5— porque el problema de ese
rótulo **no es el color sino el `opacity:.5` escrito en línea** en
`MenuMovil.tsx`. Se arregla sacando esa opacidad, que es una decisión de diseño
que la orden no pide.

### El guardián de tokens mide los pares nuevos

`packages/ui/tokens.test.mjs` sube de 21 a **35 tests**. Los ocho pares del ocre
y el teal de D6 **no se borraron**: siguen siendo ciertos y son los de la app.
Tres de los nuevos son al revés —afirmaciones de lo que **no** llega, escritas
como igualdad para que nadie las arregle en silencio—:

- el teal claro sobre el teal oscuro: **2,56**. La orden lo daba por bueno
  («acento sobre teal oscuro») y medido no sirve ni para un ícono. Hoy no se usa
  así en ningún lado; queda afirmado para que no se empiece.
- el teal claro sobre el cálido: **2,73**. Los íconos teal van sobre crema (3,03)
  y sobre blanco (3,24), que son las dos secciones donde la #05 los puso.
- el ámbar sobre el teal: **2,81**, el pendiente 4c.

---

## B · La negrita del hero

Hecho. Ver el punto 3 de arriba: van las tres capturas para que Lucía elija.

## C · Los ocho íconos

Copiados a `public/img/iconos/` con nombre y no «Recurso N», servidos con
`width`/`height` escritos y `alt="" aria-hidden="true"`.

| dónde | ícono | se muestra a |
|---|---|---|
| Taller · rótulo del hero | `taller.png` | 22 px |
| Franja de hechos · Horario / Dónde / Modalidad | `horario` · `lugar` · `sesion` | 40 px |
| Cuatro núcleos 1–4 | `cerebro` · `emociones` · `victorias` · `comunicacion` | 48 px |

Los conectores entre núcleos pasan a `var(--naranja)`, como pidió Lucía. Los
íconos **no se recolorean**: ya vienen en ese naranja.

**Un pendiente chico**: los tres de la franja (67–76 px) se muestran a 40 px, o
sea entre 1,68× y 1,90×, no a 2×. No se escalaron —agrandar un PNG agrega peso y
no información—. En una pantalla de densidad doble la diferencia en un ícono
plano de dos colores es difícil de ver; es un pedido para la próxima tanda.

## D · Las cinco fotografías

WebP con respaldo JPG, licencia y autor anotados en
`public/img/fotos/LEEME.md`. Ninguna pasa de 180 KB: la más pesada es
`porque-fondo.jpg` con 160 KB, y su WebP —lo que baja casi todo el mundo— 72 KB.

### El velo va al 94 %, no al 88 %

El barrido de contraste, extendido para medir **el píxel realmente dibujado**
detrás de cada línea de texto, dio a 88 %:

```
✗ #BF3F06 sobre #E4E3E2   12px   4.17 < 4.5   span.n   [rincón más oscuro 4.12]
✗ #BF3F06 sobre #E7E5E4   12px   4.26 < 4.5   span.n   [rincón más oscuro 4.13]
```

La orden es explícita: «se sube el velo, no se baja la exigencia». A **94 %**
pasa incluso si el píxel de atrás fuera negro puro (255 × 0,94 = 240, y el
naranja de texto sobre 240 da 4,68), así que el número no depende de qué foto
haya detrás. Medido después del cambio, los 30 pares sobre fotografía pasan, el
peor rincón incluido:

```
  #BF3F06 sobre #F2F1F1   12px   medio 4.74 ≥ 4.5 · peor rincón 4.70   span.n
  #716A60 sobre #F8F9F9   16px   medio 5.06 ≥ 4.5 · peor rincón 4.94   p
```

**El costo, dicho:** al 94 % la foto es una **textura**, no una imagen. Se intuye
el chico, no se lo mira (`hechos-y-suena-1440.jpg`). Es lo que cuesta poner texto
encima de una fotografía y que se pueda leer. Si Lucía la quiere más presente, el
camino no es bajar el velo: es sacar el texto de encima de la foto.

**El velo es del color de la sección, no crema.** La orden decía crema; esa
sección es la blanca, entre el hero crema y el cálido de «Por qué», y un velo
crema la habría vuelto crema dejando tres secciones seguidas del mismo color —y
la orden también dice que no se toca el ritmo de fondos. El velo tiñe la foto,
no la sección.

**«Por qué» pasó a foto-izquierda / texto-derecha.** Con la estructura vieja
—titular a la izquierda, cuerpo a la derecha— la foto quedaba encima del titular
y dejaba la columna izquierda 750 px más alta que la derecha. Ahora usa el mismo
molde que «Quién soy» y «Sobre el facilitador», que es la única lectura en la que
«a la izquierda del texto» quiere decir algo.

**`llevas-claridad`** es la única cuyo original es apaisado (6049×3372): el
recorte a 4:5 se queda con la madre y deja fuera a los dos niños. Es la mejor
lectura de esa foto en ese hueco; si Lucía quiere ver la familia entera, esa
tarjeta pide otra fotografía.

## D2 · Los recortes con transparencia

`de-pie` y `medio-cuerpo` en WebP con alfa real, dos tamaños cada uno, más un PNG
de respaldo. Los seis JPG con el fondo horneado se borraron.

**Los tamaños no son los 900/1800 que la orden pedía, son 900/1400.** Ningún
hueco de esta web pasa de 520 px —el arco del hero, «Quién soy» (520), «Sobre el
facilitador» (480)—, o sea 1040 a 2×. Los 1800 sólo servían para pasarse del
presupuesto: el recorte de cuerpo entero a 1800 pesaba **486 KB** y bajarlo a los
220 KB que la orden fija exigía calidad 45, o sea publicar al cliente borroso en
su propia portada. A 1400 entra en **217 KB** con calidad 74.

**Verificado que no hay borde blanco ni gris** en ninguna de las tres secciones,
a 1440 y 390 (`hero-home-*`, `hero-taller-*`, `facilitador-*`). Medido además en
el archivo: 30 % de píxeles completamente transparentes y **cero** píxeles de
borde casi-blanco. Los dos recortes traen una sombra negra suave horneada en el
alfa; sobre crema y cálido lee como profundidad, y sobre el teal es
prácticamente invisible.

Las dos imágenes de compartir se regeneraron desde el recorte nuevo.

## E · Los dos teléfonos

`CONTACTO_DE_PAGINA` en `@codice/core`: la portada y **las dos legales** llaman a
Gaby `+52 462 199 3143`; el taller entero, a Mérida `+52 55 5501 5641`. El aviso
ARCO pasa al de Gaby, que es quien atiende.

Comprobado sobre el HTML publicado, no sobre la tabla:

```
portada     6 × wa.me/524621993143   ·   0 × wa.me/525555015641
/merida     7 × wa.me/525555015641   ·   0 × wa.me/524621993143
privacidad  5 × wa.me/524621993143   (incluye ARCO)
```

`enlaceWhatsApp(telefono, mensaje)` ya no tiene número por omisión: un valor por
omisión sería el número que se cuela en la página equivocada el día que alguien
agregue un botón. Si falta, no compila.

## F · La URL dice `/merida`

`/taller` → `/merida` en rutas, prerender, canónica, `og:url`, sitemap, menú y
todos los `href` internos. `vercel.json` de la raíz redirige `/taller` y
`/taller.html` a `/merida`, permanente.

**Se interpretó como ruta y no como subdominio** (ver el informe a dirección).

## G · El guardián de fidelidad cambia de referencia, no de rigor (D24)

- Texto, `href` y `<head>` ya no se comparan contra `qa/referencia/`: se comparan
  contra las capturas versionadas en `apps/web/e2e/__snapshots__/`, que salieron
  del `.gitignore`.
- **Cero píxeles** sigue siendo el umbral.
- `e2e/cambios-visibles.ts` se borró: su trabajo terminó.
- `qa/referencia/` queda como historia y su LEEME lo dice.

**Esta orden genera las capturas nuevas — es la primera que las produce.**
Son 32 archivos, 12 MB: 12 capturas de página completa, 12 de texto (el texto sí
cambia con el ancho) y 4 + 4 de `href` y `<head>` (que no dependen del ancho).

---

## Verificación de cierre

### Tokens y contraste

```
grep -c 'var(--ocre' apps/web/src/index.css        → 0
grep -c '#866539|#B18C54|#33585C' index.css        → 0
check:tokens: 57 archivos, ningún hex fuera de codice-tokens.css
```

`--naranja-texto` ≥ 4,5 sobre los tres claros: crema **5,00** · cálido **4,51** ·
blanco **5,34**.

Barrido completo: **151 pares distintos, 4 por debajo del umbral**, los cuatro
preexistentes y tres de ellos mejores que antes (tabla en A).

### Lighthouse

**Método**: Lighthouse **13.4.1**, móvil, local sobre `dist/` servido por
`e2e/servidor.mjs`, **tres corridas por página, se cita la peor**. Las dos series
—`main` y la rama— salen de la misma versión y la misma máquina, que es la única
comparación que dice algo: los umbrales 86/92/99/99 que venían de la #02 se
midieron con otra versión mayor de Lighthouse, y `main` medido hoy con 13.4.1 ya
no los reproduce.

| página | performance | accesibilidad | buenas prácticas | SEO |
|---|---|---|---|---|
| inicio | 86 → **95** ↑ | 100 → **100** | 100 → 100 | 100 → 100 |
| taller → /merida | 92 → **95** ↑ | 100 → **100** | 100 → 100 | 100 → 100 |
| privacidad | 98 → **98** = | 100 → **100** | 100 → 100 | 66 → 66 |
| terminos | 99 → **98** ↓ | 100 → **100** | 100 → 100 | 66 → 66 |

Las doce corridas de cada lado, para que se vea que no es ruido:

```
inicio        main [86, 86, 86]   rama [95, 95, 95]
merida        main [92, 92, 92]   rama [95, 95, 95]
privacidad    main [99, 99, 98]   rama [98, 98, 98]
terminos      main [99, 99, 99]   rama [98, 98, 98]
```

**Accesibilidad 100 en las cuatro**, que es lo que la orden exige.

**La portada sube nueve puntos** y la causa está medida: los recortes con
transparencia pesan menos que los JPG con el fondo horneado. Baja **172 KB** de
fotos de Armando donde antes bajaba **389 KB** (`medio-cuerpo-900.webp` 69 KB +
`de-pie-900.webp` 103 KB, contra `armando-sentado-calido.jpg` 204 KB +
`armando-parado-crema.jpg` 185 KB). Las seis fotografías nuevas del taller no lo
compensan porque todas son `loading="lazy"` y ninguna está en el primer pliegue.

**`terminos` baja un punto, y también está medido.** Es reproducible —tres
corridas de cada lado sin una sola excepción— así que se buscó la causa en vez de
llamarlo ruido. `terminos.html` pesa **exactamente lo mismo** en las dos ramas:
6.299 bytes, byte por byte, porque lo único que cambió en esa página es el
teléfono del pie y los dos números tienen la misma cantidad de dígitos. O sea que
la única variable es la hoja de estilos:

```
main   dist/assets/style-Cd6CNY_p.css   28.237 bytes
rama   dist/assets/style-nOvl2tiF.css   29.601 bytes   (+1.364, +4,8 %)
```

Son las reglas nuevas de los íconos, las fotos de fondo y las tarjetas. `terminos`
no usa ninguna, pero las baja igual porque la web sirve **una** hoja para las
cuatro páginas, y en una página cuyo único recurso bloqueante es esa hoja, 1,3 KB
de más en el enlace estrangulado de Lighthouse (1,6 Mbit/s) cuestan el punto.

Es el mismo mecanismo del **pendiente 5b** y tiene el mismo arreglo —partir el
CSS— que sigue siendo una decisión sobre el contrato de `@codice/ui` y no de una
orden de la web. Queda anotado: un punto en una página legal, con su causa
identificada, a cambio de nueve en la portada.

El SEO 66 de las dos legales es el `noindex, follow` de un aviso legal, correcto
y sin cambios.

### Enlaces y rutas

```
/merida        200
/privacidad    200        sh check/enlaces.sh → GUARDIÁN: PASA
/terminos      200          · ningún href a .html
/              200          · 5 × href="/merida" en index.html
                            · 0 × href="/taller"
                            · el redirect existe en vercel.json de la raíz
```

`/taller` → 308 → `/merida` **no se puede comprobar en local**: el servidor de
pruebas sirve archivos y no lee `vercel.json`. Está declarado en el `vercel.json`
de la raíz —que es el que Vercel lee desde la #04— y el guardián de enlaces
verifica que la declaración esté. Se comprueba en la previsualización.

### La gate

```
check:tuteo     sin voseo en 53 archivos de la interfaz
check:i18n      1 namespace, 288 claves
check:estilo    70 archivos, el voseo sólo en packages/prompts
check:tokens    57 archivos, ningún hex fuera de codice-tokens.css
check:secretos  110 archivos, 9 formas buscadas, ninguna encontrada
typecheck       Done
lint            limpio
pnpm test       88 tests declarados, 0 saltados, ninguna suite bajo su piso
```

Piso de tests: `@codice/ui` 21 → **35**, `@codice/core` 12 → **23**.
`@codice/web` y `@codice/navegador` no se mueven: el guardián de fidelidad sigue
siendo doce comprobaciones, lo que cambió es contra qué compara.

### Las mutaciones — ningún test está terminado hasta que se lo vio fallar

| se rompió a propósito | quién se puso rojo |
|---|---|
| `CONTACTO_DE_PAGINA.taller` apuntando a Gaby | `el taller llama a Mérida` · `ningún wa.me del taller lleva el número de Gaby` |
| `--naranja-texto` subido a `#DF4907` | los 4 pares de `orangeText` en `tokens.test.mjs` |
| `.eyebrow` pintado de teal | fidelidad: **921 píxeles** distintos, 6 comprobaciones rojas |
| un `href="/taller"` de vuelta en el pie | `check/enlaces.sh`, punto 3 |

Los cuatro archivos se devolvieron y las cuatro comprobaciones volvieron a verde.

**Dos defectos que las mutaciones encontraron en los propios guardianes**, los
dos arreglados acá:

- el barrido de contraste usaba `addStyleTag({id})`, y `addStyleTag` **ignora el
  `id`**: la hoja que volvía el texto transparente nunca se quitaba, así que la
  segunda pasada medía la página entera sin letras e informaba 1,04:1 en 67
  pares. Un barrido que se rompe a sí mismo a mitad de camino.
- `el-css-esta-entero` filtraba comentarios por línea, y una línea de prosa
  envuelta dentro de un `/* */` empieza con una palabra cualquiera: informó **31
  «reglas que el sitio estático no tiene»**, todas renglones de comentario. Se
  arregló con el `soloCodigo()` que `CLAUDE.md` prescribe, que saca el bloque
  entero sobre el texto y no sobre las líneas.

---

## Capturas

A 1440 y 390 cada una, en esta carpeta.

| archivo | qué muestra |
|---|---|
| `B-antes` · `B-despues` · `B-variante-teal` | la negrita del hero, tres opciones |
| `hero-home` | el recorte nuevo en el arco, botón y rótulo en naranja |
| `hero-taller` | el ícono del rótulo y el medio cuerpo |
| `facilitador` | el cuerpo entero sobre el teal nuevo, sin borde |
| `hechos-y-suena` | la franja con sus tres íconos y la foto de fondo al 94 % |
| `nucleos-y-llevas` | los cuatro íconos, los conectores naranjas y las tres fotos |
| `porque` | la tarjeta a la izquierda del texto |
| `contacto` | la portada con el número de Gaby |
