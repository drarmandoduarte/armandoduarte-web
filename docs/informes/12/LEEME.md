# Orden Códice #12 — El taller con fecha

Rama `web/12-taller-con-fecha` sobre `main`. Es contenido: la fecha, la sede y el
horario que Armando dio el 28/9, los cinco núcleos de su modelo, y una tanda de
pedidos de Lucía sobre `/merida` y la home.

**Lo que hay que saber en una línea:** entró todo lo pedido; los dos pedidos que
chocaban con decisiones nuestras se hicieron y su contraste está medido; el
recorte de la foto de pie **no** entró porque el borde no quedó limpio, y hay un
archivo que pedirle a Lucía.

---

## Lo que se hizo, sección por sección

### A · Los datos del taller

Jueves **5 de noviembre de 2026** · **Fiesta Inn Mérida** · **8:30 a 13:00**.
Entraron en los seis lugares donde faltaban:

| dónde | antes | ahora |
|---|---|---|
| Home · franja «Ahora» | Mérida · 9:00 a 13:30 · Cupo limitado | Fiesta Inn Mérida · Jueves 5 de noviembre · 8:30 a 13:00 |
| Home · ficha «El taller» | — | **fila nueva `Fecha`**, delante de Horario |
| Home · ficha, Horario y Lugar | 9:00 a 13:30 · Mérida | 8:30 a 13:00 · 4 horas y media · Fiesta Inn Mérida |
| `/merida` · hero | 4 h y media · 9:00 a 13:30 · Cupo limitado | 4 h y media · 8:30 a 13:00 · Jueves 5 de noviembre |
| `/merida` · franja de hechos | 3 celdas | **4 celdas**, con `Fecha` primero y su ícono |
| `<head>` de `/merida` | descripción sin fecha | descripción con día, sede y horario |
| `sitemap.xml` | `lastmod` 2026-09-17 | `lastmod` 2026-09-28 |

**El barrido de i18n quedó limpio**: cero apariciones de «9:00», «13:30» o
«Mérida» sin sede. «Cupo limitado» sobrevive en cuatro lugares y los cuatro
corresponden —es la modalidad, no el relleno de una fecha que faltaba—.

**El ícono de «Fecha»** es el único que esta orden dibujó, y está al lado de los
otros tres en `iconos-franja.jpg`: mismo círculo de `--teal-medio`, mismo glifo
blanco de trazo 5, mismo lienzo de 96. Un calendario simple con dos celdas de
día.

**El `Event` de schema.org volvió**, con lo que la #02 no tenía: fecha, sede y
precio reales. Validado dos veces —capturas pegadas:

- `validator.schema.org` → **0 errores, 0 advertencias**.
- Rich Results Test de Google → **«Se ha detectado 1 elemento válido»**, tipo
  Eventos, con **1 problema no crítico**.

El problema no crítico es `offers.validFrom`, la fecha desde la que se venden los
lugares. **Ese dato no existe**: no hay venta, hay una conversación por WhatsApp.
Rellenarlo sería inventar un campo para apagar un aviso amarillo, que es
exactamente lo que la #02 se negó a hacer cuando quitó este bloque entero. Queda
el aviso.

La primera corrida dio **dos** avisos; el otro era `image`, y ése sí se resolvió:
entran las dos piezas que hizo Lucía para este taller —la apaisada y la
cuadrada—, con lo cual la ficha del evento puede llevar miniatura en el buscador.

**El huso es `-06:00` y no contradice a D15.** D15 manda zona IANA en la
*aplicación*, porque un desplazamiento no sabe de horario de verano. Esto es un
dato estático y lo que schema.org define es una marca ISO 8601, que lleva
desplazamiento. Comprobado contra `America/Merida`: el 5/11/2026 esa zona está en
**CST, −06:00, sin verano**. Y no se comprobó una vez: **hay un test que se lo
pregunta a la zona** en cada corrida, en vez de volver a escribir el número.

### B · «ADOLESCENTE» en mayúsculas y naranja (Lucía)

Hecho. **Rompe la regla del acento de la #07** y entra por D23; queda anotado en
`docs/tareas.md` como excepción declarada.

Lo medido, que es lo que había que declarar: el titular es de 80 px, así que le
rige el umbral de **3:1**. Sobre el crema, `--naranja` da **3,86** y
`--naranja-texto` da **5,00** — las dos pasan. Se usó `--naranja-texto` por
consistencia: es el único naranja que este sitio usa para texto. El barrido sobre
la página dibujada lo confirma en los dos tamaños del `clamp()`:

```
#BF3F06 sobre #FAF7F1   80px/300   5.00 ≥ 3   span.hero-taller__palabra
#BF3F06 sobre #FAF7F1   42px/300   5.00 ≥ 3   span.hero-taller__palabra
```

**Y la mutación, que es donde esto se puso interesante.** `check/acento.mjs`
permite ahora el selector `#inicio h1 .hero-taller__palabra`. Con eso puesto, la
mutación que la orden pedía —pintar de naranja **otra** palabra del mismo `<h1>`,
con la misma clase— salió **verde**: un selector de clase excusa al elemento que
dirección aprobó y también a cualquiera que se ponga esa clase. Una excepción sin
número no es una excepción, es una puerta.

Así que el guardián aprendió a contar: cada regla puede llevar un **tope** de
cuántos elementos distintos excusa, y el de esta vale **1**. Con el tope:

| mutación | resultado |
|---|---|
| otra palabra del mismo `<h1>`, **con** la misma clase | ✗ «la regla excusó 2 elementos y solo puede excusar 1» |
| otra palabra en naranja **sin** esa clase | ✗ «color --naranja-texto en p.hero-sub.mutacion-naranja» |
| sin mutación | ✓ 798 elementos mirados en las cuatro páginas, ninguno de más |

El tope se afirma en **las dos puertas** —la consola y `e2e/acento.spec.ts`—
importando la misma función. Si viviera solo en la consola, la primera mutación
pasaría la gate.

### C · «¿Te suena?» con la foto de fondo entera (Lucía)

Hecho, y sin velo uniforme. El velo ya se había medido dos veces y las dos había
perdido: al 88 % dejaba 14 pares bajo AA y al 94 % la foto deja de ser una imagen.
Acá el contraste lo resuelve **darle al texto su propio suelo**: panel de crema al
**92 %** con `backdrop-filter: blur(12px)` en la columna izquierda, y la foto
entera a la derecha y por debajo, a sangre de lado a lado.

**El 92 % pasó a la primera** — no hizo falta subirlo. Medido con
`check/contraste.mjs` sobre el píxel realmente dibujado, con la foto cargada:

```
137 pares distintos · 0 por debajo del umbral
— los más justos del panel, de los 15 pares sobre fotografía —
  #BF3F06 sobre #F7F5EF  12px  medio 4.90 · peor rincón 4.90  ≥ 4.5   span.eyebrow
  #716A60 sobre #F7F5EF  12px  medio 4.90 · peor rincón 4.90  ≥ 4.5   span.n
  #716A60 sobre #F7F5EF  16px  medio 4.90 · peor rincón 4.90  ≥ 4.5   p
```

Vale mirar la columna «peor rincón»: es el percentil 5 de luminancia del
rectángulo, o sea el trozo más oscuro de lo que hay detrás de cada palabra. **Da
lo mismo que el promedio**, y eso es justamente lo que un panel opaco con
desenfoque compra: detrás de una palabra no hay foto, hay panel.

**A 375 la foto queda arriba del panel, apilada, no detrás** — está en
`suena-375.jpg`. Detrás no funcionaría: a ese ancho el texto ocupa toda la
columna y el panel taparía la foto entera.

La tarjeta de la cita volvió a ser cálida sin foto, como antes de la #07.

**Una decisión que tomé y que dirección puede querer revisar.** La orden dice «el
fondo de toda la sección». La sección `#suena` incluye, además de «¿Te suena?»,
la **franja de hechos** —rótulos de 11 px en gris y valores de 17–21 px, sin
panel—. Puse la foto **desde debajo de la franja** hasta el final de la sección.
El motivo es el defecto que la #05 ya pagó: texto chico suelto sobre una
fotografía fue exactamente lo que dio 14 pares bajo AA. La propia orden #12 los
nombra como dos cosas distintas (su sección A habla de «la franja de tres
hechos»; la C, de «la sección "¿Te suena?"»). Si dirección o Lucía quieren la
foto también detrás de la franja, hace falta decidir qué hacer con esos ocho
textos.

### D · Fotos nuevas (Lucía)

- **«Lo que te llevas»**: la 1ª y la 3ª reemplazadas; la 2ª se queda. Donde había
  madre e hijos ahora hay **padre e hijo**, que es de lo que trata el taller. Los
  `alt` dicen lo que se ve.
  Los insumos venían a 1600 y 800 px **sin recortar a 4:5**, así que se les aplicó
  la receta que ya está escrita en `public/img/fotos/LEEME.md` —recorte centrado a
  4:5, 800 px, calidad 74/76— para que las tres tarjetas sigan siendo el mismo
  objeto. El recorte centrado deja a las dos figuras enteras: `llevas-1440.jpg`.

- **Armando, busto**: reemplazado por el corregido de Lucía. **Ojo con esto**, que
  es lo que casi cuesta tres puntos de Lighthouse: los WebP preparados pesaban
  **139 KB** (900) y **414 KB** (1400), contra los 71 y 147 del anterior — y el de
  900 es la imagen del hero, la que se baja con prioridad. Se regeneraron desde el
  PNG original de Lucía (`Mesa de trabajo 14_2.png`) con `cwebp -q 74 -alpha_q
  100`, que es la calidad que la #05 dejó escrita: **67 KB** y **176 KB**, con una
  diferencia media de **2,49/255** en color y **0,05/255** en alfa contra los
  preparados. Al 100 % sobre la cara son indistinguibles.
  Además cambió de forma —1400×1690 donde el anterior era 1400×1769—, así que se
  corrigieron el `width`/`height` de `Retrato.tsx`: dejarlos viejos con el archivo
  nuevo es un salto de maquetación.

- **Armando, de pie**: **NO entró.** Ver abajo.

### E · Armando apoyado en el borde (Lucía)

Hecho, y medido: `bottom` de la imagen **=** `bottom` de la sección, diferencia
**0 px** a 1440, a 900 y a 375.

El aire que perdió la columna de la foto se le devolvió a la de texto, no a la
sección: si se le quitara el padding a la sección entera, el texto también
quedaría pegado al borde. Y apilado (≤ 900 px) el recorte pasa **debajo** del
texto, porque arriba no hay orilla que tocar —esa la ocupa el rótulo—.

### F · La imagen al compartir el enlace (Armando y Lucía)

`/merida` declara ahora **dos** `og:image`, cada una con su `width` y su `height`:
la apaisada de 1200×630 primero (Facebook, LinkedIn, Twitter) y la cuadrada de
1200×1200 después (WhatsApp). El `og:image:alt` es «El arte de amar a tu hijo
adolescente · taller en Mérida». **La home no cambia.**

Dos cosas que aparecieron al hacerlo:

1. **`useCabeza` pisaba la segunda imagen.** El actualizador del `<head>` en
   cliente buscaba cada etiqueta por selector y siempre encontraba la primera, así
   que la segunda tanda de `width`/`height` le sobreescribía los valores a la
   primera y al navegar de `/` a `/merida` quedaba una sola imagen mal medida.
   Ahora lleva la cuenta de las repetidas.
2. **Un `og:image` que nombra un archivo que no está no rompe nada visible.** La
   página carga, Lighthouse no lo mira, ninguna captura lo nota; lo único que pasa
   es que el enlace se comparte sin miniatura, que es justo lo que esta sección
   venía a arreglar. Hay tres tests nuevos que comprueban que el archivo exista y
   que mida lo que declara, leído de los píxeles del JPEG.

**Lo que falta y es de dirección:** el depurador de Facebook y la vista previa
real de WhatsApp necesitan una URL pública, y este cambio todavía no está
desplegado. Van en la verificación sobre `armandoduarte.com` después del merge,
que es el paso de cierre que la orden ya prevé.

### G · El programa: cinco núcleos (Armando)

«Cinco núcleos. / Modelo orientado a la madurez.» Los cinco, con el texto literal
que mandó Armando y **un solo párrafo cada uno**: los dos párrafos de antes eran
de la casa, y lo que Armando no escribió no se pone.

Íconos 1–5: cerebro, emociones, comunicación, victorias y `cambios.svg`. La grilla
va a 5 columnas ≥ 1100, 3 entre 700 y 1100, y 1 debajo de 700. La línea de tiempo
sigue uniendo los cinco. El receso se queda: Armando no lo quitó.

**Una cosa que apareció al pasar de cuatro a cinco.** Con cuatro, los títulos
medían casi lo mismo y nadie lo notaba; con cinco, «Definir estrategias» entra en
una línea y los otros cuatro en dos, y su párrafo arrancaba 30 px más arriba que
el de al lado. Se arregló con `subgrid` —las tres filas son las mismas para las
cinco columnas— sin fijarle un alto a nada. Está en `programa-1440.jpg`.

El resumen del taller en la home no menciona los núcleos, así que no se tocó. Las
apariciones de «Cuatro horas y media» como **duración** se quedan: la duración no
cambió.

### H · Lo que NO entró

Ningún formulario de registro, ningún dato bancario, ningún texto fuera de A y G,
ningún testimonio. Los botones siguen yendo a WhatsApp.

---

## Lo que NO entró y necesita algo de afuera

### El recorte de la foto de pie: **no pasó**

Se intentó con `rembg` (`u2net_human_seg`), como pedía la orden. El borde **no
quedó limpio**: el gris del estudio sobrevive en la banda semitransparente y sobre
el teal se ve como un halo alrededor del pelo y del hombro.

No es una impresión, es una cuenta. Usando la misma medida que la #05 dejó escrita
para los recortes de Lucía —«ni un solo borde casi-blanco»—, contando qué
proporción de la banda semitransparente son píxeles claros:

| recorte | banda semitransparente | de ella, píxeles claros |
|---|--:|--:|
| `de-pie` actual (Lucía, #05) | 5,30 % | **0,2 %** |
| `medio-cuerpo` nuevo (Lucía, #12) | 2,55 % | **0,5 %** |
| `de-pie` con `rembg` (#12) | 2,00 % | **8,2 %** |

Dieciséis a cuarenta veces más halo que los que hace Lucía. Se ve en
`de-pie-recorte-zoom.jpg`, que pone los dos al 100 % sobre crema y sobre teal.

**Se conserva el `de-pie` de hoy**, que es el del 16/9 y está limpio. Lo que hace
falta es **un archivo, no trabajo**: el PNG con alfa de esa toma, como los dos que
Lucía ya mandó.

---

## Lo que se encontró de paso, y estaba roto

### Tres guardianes llevaban cinco órdenes sin poder correr

`check/contraste.mjs` usaba tres cosas que la CSP de la #10 prohíbe. Una tiraba
excepción; **otra fallaba en silencio**, y ésa es la que importa: el `<style>` que
vuelve el texto transparente antes de fotografiar el fondo entraba al DOM, la
política le prohibía aplicar, y la captura salía **con las letras puestas**. El
«fondo dibujado» de cada línea habría sido el promedio de sus propias letras: un
contraste inventado, en verde y plausible.

Se arreglaron los tres **sin ablandar la política**, que es la regla de la #10:
CSSOM para las hojas y `Blob` + `createImageBitmap` para la captura. Y el
silencioso lleva ahora su propio piso: si el texto no quedó transparente de
verdad, el barrido se cae diciéndolo.

Nadie se enteró en cinco órdenes porque desde la #07 no había texto sobre ninguna
fotografía, así que esa rama del código no se llamaba nunca. La sección C la
volvió a llamar.

### El servidor de QA no servía WebP como WebP

`e2e/servidor.mjs` no tenía `.webp` en su tabla de tipos, así que las servía como
`application/octet-stream`. La web sirve en WebP **casi todas** sus imágenes, o
sea que el servidor contra el que se miden fidelidad, CSP y Lighthouse no estaba
sirviendo lo mismo que Vercel — que es su única razón de ser. Lo destapó la
medición de Lighthouse: el informe no reconocía ninguna imagen de la página.

### El `<head>` que vigila fidelidad estaba ciego a los datos estructurados

Se podía borrar el `Event` entero y las doce comprobaciones seguían en verde. Es
la ceguera de la #09 otra vez —un guardián que existe pero no mira lo que la orden
movió— y se cerró igual: la lista de `cabeza()` incluye ahora los bloques
`ld+json`, parseados.

---

## Verificación de cierre

| # | qué | resultado |
|---|---|---|
| 1 | `grep` en i18n de horarios y lugar | cero apariciones viejas; «Cupo limitado» solo donde corresponde |
| 2 | JSON-LD validado | schema.org **0 errores / 0 advertencias**; Rich Results **1 elemento válido**, 1 aviso no crítico declarado |
| 3 | `check/contraste.mjs`, cuatro rutas | **137 pares · 0 bajo AA**, incluidos los 15 sobre la foto de la sección C |
| 4 | `check/acento.mjs` | **798 elementos · 0 de más**; las dos mutaciones caen |
| 5 | Capturas a 1440 y 375 | en esta carpeta |
| 6 | Guardián de fidelidad | **capturas actualizadas por la orden #12** — lista abajo |
| 7 | Lighthouse móvil | tabla abajo |

### Capturas actualizadas por la orden #12

Se corrió `--update-snapshots` y se movieron **trece** archivos. Los seis en rojo
antes de actualizar fueron los esperados: `inicio` y `taller` a los tres anchos.
`privacidad` y `terminos` **no se movieron**, que es la noticia de que esta orden
no los tocó.

| archivo | qué cambió |
|---|---|
| `inicio-{1440,900,390}.png` y `-texto.txt` | la franja «Ahora» y la fila `Fecha` de la ficha |
| `taller-{1440,900,390}.png` y `-texto.txt` | hero, franja de hechos, «¿Te suena?», los cinco núcleos, las dos fotos y el facilitador |
| `taller-cabeza.json` | descripción con la fecha, `og:image` nuevo |
| `{inicio,privacidad,terminos}-cabeza.json` | solo el campo `datos: []` que la lista nueva agrega |

Los `*-enlaces.json` **no se movieron**: esta orden no agregó ni quitó ningún
enlace, que es lo que se esperaba de una orden sin formulario.

### Lighthouse móvil

**El método, al lado del número, como manda la casa.** Los dos lados se sirven
con `e2e/servidor.mjs` —el mismo archivo, las mismas cabeceras leídas del
`vercel.json` de la raíz— desde dos `dist/` compilados: el de `main` en el 4181 y
el de esta rama en el 4180. Lighthouse 13.5.0, perfil **móvil**, `simulate`,
**tres corridas por página y por lado**, y se toma la **mediana**. Las doce
corridas de cada lado están en la máquina; las tres de cada celda coincidieron
salvo una del inicio (96/95/96).

| página | perf antes | perf después | accesibilidad | LCP antes | LCP después | CLS antes | CLS después |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/` | 96 | **96** | 100 → **100** | 2,6 s | 2,6 s | 0,001 | 0,001 |
| `/merida` | 95 | **95** | 100 → **100** | 2,7 s | **2,6 s** | 0,000 | 0,000 |
| `/privacidad` | 98 | **98** | 100 → **100** | 2,0 s | 2,0 s | 0,053 | 0,053 |
| `/terminos` | 98 | **98** | 100 → **100** | 2,0 s | **1,8 s** | 0,007 | 0,007 |

**Accesibilidad 100 en las cuatro. Performance no bajó en ninguna.** Prácticas
recomendadas y SEO tampoco se movieron (el 66 de SEO de las dos legales es el
`noindex` que llevan a propósito desde la #01, y está igual de los dos lados).

**El LCP de `/merida` es el número que la orden pedía vigilar, y bajó** — 2,7 →
2,6 s — con una foto de fondo más en la página. El motivo es el busto: el WebP de
900, que es el elemento con prioridad del hero, pasó de 139 KB (el preparado) a
67 KB (regenerado a calidad 74).

### Los dos sustos, contados

Ninguno quedó, pero los dos se midieron y valen más escritos que callados.

**Con los WebP preparados tal cual venían, `/merida` daba 92 y LCP 3,2 s** —tres
puntos menos y medio segundo más que `main`—, y toda la diferencia era el peso de
la imagen del hero. Es el tipo de regresión que entra por la puerta de «son los
archivos que mandó la clienta».

**Y apareció un CLS de 0,060 en `/merida`, donde antes era 0,0002.** No era la
foto: era el titular. Medido con la tipografía cortada y con la tipografía
puesta, a doce anchos, «a tu ADOLESCENTE.» ocupa **dos líneas con la fuente de
reserva y tres con Montserrat** a 1440, 1100, 430 y 412 px — y cuando la buena
entra, el titular crece 43 px y empuja la foto del hero.

El salto de tipografía es el pendiente viejo § 5c, que dirección cerró sin abrir
porque el arreglo (`size-adjust`) vive en `packages/ui`. **Pero esto no era aquel
salto: lo trajo esta orden**, al alargar el titular. Se apagó sin tocar el design
system, poniendo la palabra en su propio renglón (`display:block`): con eso el
titular mide tres líneas con las dos tipografías, **a todos los anchos**, y es
además la forma que Montserrat ya le daba sola en escritorio. CLS de `/merida`:
**0,000**.

---

## Qué necesita dirección

1. **El PNG con alfa de la foto de pie**, a Lucía. Es lo único que impide entrar
   la corrección de esa toma. Es un archivo, no trabajo.
2. **Confirmar la lectura de la sección C**: la foto arranca debajo de la franja
   de hechos, no detrás de ella. Está explicado arriba con su motivo.
3. **Saber que la foto de fondo se agranda un 50 %.** `porque-fondo` es una foto
   2:3 puesta de fondo de un bloque apaisado: para que el chico caiga en la banda
   que el panel no tapa hay que agrandarla, y a 1440 eso es mostrar 1200 px de
   ancho en 2160. Se ve bien, pero es un reescalado. **Si Lucía manda esa foto a
   1800 px de ancho, desaparece** — y es la misma foto, no una nueva.
