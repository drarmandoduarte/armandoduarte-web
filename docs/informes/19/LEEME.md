# Orden Códice #19 — Lo que pidieron Lucía y Armando, terminado de verdad

Rama `web/19-lo-pedido`, desde `main`. Informe corto arriba, lo medido abajo.

## Qué se hizo

- **A · «¿Te suena?»** vuelve a la maqueta de antes de la #12, recuperada de
  `4b592d2^`: dos columnas (título + párrafo | los tres puntos) y la cita abajo
  en tarjeta cálida **a lo ancho**. La foto del chico es otra vez el fondo de
  **toda** la sección —la franja de hechos incluida— y **ya no se estira**: se
  fue el `width:150%` que a 1440 dejaba solo el pelo y la frente.
- **B · Armando ya no flota.** Entraron los tres archivos de
  `2026-09-29-de-pie-al-borde`, `Retrato.tsx` pasó a 1400×2321, y el recorte se
  apoya en la orilla en **los dos lugares** donde vive.
- **C · «ADOLESCENTE» sin punto**, como la captura de Lucía.
- **D · Un test nuevo** compara los cinco núcleos, la sede y el horario contra
  el `LEEME.md` de los insumos, carácter por carácter.

## Lo medido

| | número |
|---|---|
| `check:contraste` (4 rutas, **1440/900/390/375**, con la foto cargada) | 181 pares · **0 bajo AA** |
| `check:acento` | 815 elementos · tope 1, la excepción declarada |
| `check:renglones` | 264 títulos · **0 huérfanos** |
| Lighthouse móvil `/merida` · accesibilidad | **100** |
| Lighthouse móvil `/merida` · CLS | **0** |
| Lighthouse móvil `/merida` · performance | **95** — ver *Lo que necesita dirección* |
| Gate | 232 declarados · 0 saltados · ninguna suite bajo su piso |

`check/contraste.mjs` pasó de medir dos anchos a **cuatro**: la orden pide
1440/900/375 y la casa venía midiendo 390. Se sumaron en vez de cambiarse —390
es el ancho con el que se midieron todas las órdenes anteriores.

### A · el velo, medido en el orden que fija la orden

| paso | qué se probó | resultado |
|---|---|---|
| (i) | velo en degradado `--crema` 94 % → 78 % | **4 pares bajo AA**: `span.eyebrow` 4,18 · `span.n` 4,34 · dos `p` en 4,45 y 4,49 |
| (ii) | + suelo local por bloque: `--crema` 90 %, `blur(10px)`, 24 px de aire, esquinas de 2 px | **0 pares bajo AA** |
| (iii) | subir el degradado de a 2 puntos | **no hizo falta** |

Lo que sí se movió del (i) es **dónde** se abre el degradado. La orden decía
«78 % sobre el tercio de la cara» suponiendo que la cara está a la derecha;
medido, está en el 47 % de su propia foto, así que abrir en el borde derecho era
abrir donde no hay nada. El degradado abre entre el 30 % y el 55 %, que es donde
está el chico.

### A · el «tercio derecho» no se puede, y la aritmética lo dice

La orden pide la cara «entera y visible **en el tercio derecho**». Lo primero se
cumple; lo segundo **es geométricamente imposible** con `cover` y sin estirar.
Medido sobre la página dibujada:

| ancho | sección | fuente | cover | pintada | sobra en X |
|---|---|---|---|--:|---|
| 1440 | 1440×1317 | 1800×2700 | ×0,800 | 1440×2160 | **0 px** |
| 900 | 900×1655 | 1200×1800 | ×0,919 | 1103×1655 | 203 px → el rostro llega al 58 % |
| 375 | 375×2242 | 1200×1800 | ×1,246 | 1495×2242 | 1120 px → **acá sí** entra en el tercio derecho |

A 1440 la foto es 2:3 y la sección es apaisada: `cover` llena el ancho exacto y
`object-position` horizontal **no mueve nada**. Correrlo exigiría estirarla, que
es justo lo que hizo la #12 (×1,5) y lo que esta orden prohíbe — y fue lo que
dejó el rostro fuera de cuadro. Lo que sí se cumple es el criterio duro: **a
1440 se ve el rostro completo**, no el pelo.

A 375 la foto queda **detrás**, como pide A.4. No hizo falta apilar.

### B · los píxeles, que es lo que la #12 no miró

| | archivo publicado | recorte nuevo |
|---|---|---|
| tamaño | 1400×2614 | **1400×2321** |
| última fila del PNG de 560 | **0 opacos**, alfa máxima **0** | **319/560 opacos** (57 %), alfa máxima 255 |
| tramo contiguo mayor | 0 | 163 px (son los dos zapatos, con aire en medio) |
| `bottom` imagen vs sección | 0 px | 0 px |

La #12 midió la segunda fila de esta tabla y le dio 0 px a tres anchos: cierto,
y aun así Armando flotaba, porque lo que tocaba el borde era el degradado. **Se
midió la caja, no lo que se ve.**

Y al entrar el archivo nuevo apareció lo que la orden mandaba mirar: en
`/#quien` la portada quedaba **peor que antes** —el mismo hueco cortaba a
Armando a media pierna con un borde duro y 149 px de crema debajo—. No se notaba
porque el degradado se desvanecía justo ahí: tapaba dos problemas, no uno. La
portada pasa a apoyarse igual que el taller (`align-items:end`, el `padding`
inferior a la columna de texto).

El recorte corta a la altura de los muslos porque **ahí termina el cuerpo opaco
del original**: la fila 2320 es la última antes del degradado. Lucía dijo
«recortar si hace falta».

### Los tests nuevos, con la mutación que puso a cada uno en rojo

`@codice/web` 51 → **58** · `@codice/navegador` 33 → **35**.

| test | mutación | qué dijo |
|---|---|---|
| `armando-no-flota` · última fila opaca | volver al PNG viejo | «alfa máxima 0 ≠ 255» |
| `armando-no-flota` · alto declarado | `Retrato.tsx` a 2614 | «relación 0.5359 vs 0.6032: no salieron del mismo recorte» |
| `armando-al-borde` (e2e, 2 lugares × 2 anchos) | — | cazó los 149 px de la portada antes del arreglo |
| `lo-que-mando-armando` · núcleos | quitarle «de la vida» al núcleo 1 | imprime lo que mandó y lo que publica, uno debajo del otro |
| `lo-que-mando-armando` · horario | volver a «9:00 a 13:30» | «la web publica «9:00 a 13:30» y el insumo no lo dice» |

Las dos mitades de B van en **archivos separados** a propósito: un archivo opaco
colgado a 40 px del borde flota igual, y una caja al borde con el archivo viejo
adentro también. Un piso que sobrevive porque la otra mitad lo sostiene no está
sosteniendo nada.

### Y un guardián que se puso rojo solo

Al quitar el punto de «ADOLESCENTE», `check:renglones` denunció su propia
excepción: nombraba «ADOLESCENTE.» y dejó de excusar ningún renglón, así que la
marcó como permiso que sobra. Nadie tuvo que acordarse de ir a tocarla.

### Capturas de fidelidad actualizadas

`--update-snapshots` declarado. Cambiaron **9**: `inicio-{1440,900,390}.png` (el
retrato apoyado), `taller-{1440,900,390}.png` (la sección A y el retrato) y
`taller-{1440,900,390}-texto.txt`. El diff de texto es **una sola diferencia**:
`ADOLESCENTE.` → `ADOLESCENTE`. Nada más del texto de la página cambió, que es
la comprobación de que A y B son cambios visuales y D no tocó ningún contenido.

## Lo que quedó pendiente

- **La captura de Lucía no está en el proyecto.** La orden pide poner la nuestra
  «al lado de la captura de Lucía» en `docs/informes/19/`; esa imagen no está en
  `01 Documentos/Recursos/Lucia Duarte/` ni en `03 Producto/web/insumos/` —la
  tiene dirección en WhatsApp—. Van las nuestras a 1440, 900 y 375
  (`A-te-suena-*.png`) para que se pueda armar la comparación.
- El `.docx` original de Armando no está en el repo, así que el test de D cierra
  la cadena **del insumo a la pantalla**, no del `.docx` al insumo. Ese eslabón
  es de dirección.

## Lo que necesita dirección

1. **Performance móvil de `/merida`: 95, y la orden pide ≥ 96.** Medido y
   aislado: apagando la foto de fondo de «¿Te suena?», **96 y LCP 2,5 s**; con
   ella, **95 y 2,7 s**. El costo es de **pintado**, no de descarga —el peso de
   red es idéntico: a 375 el bloque mide 375×2242 y la foto se dibuja a
   1495×2242—. Se probó bajarle la prioridad (`fetchPriority="low"`,
   `decoding="async"`) y sigue en 95; se probó sacar el desenfoque de los suelos
   en móvil y también sigue en 95 (ese cambio se revirtió para no dejar escrita
   una causa refutada). **Es el precio de lo que pidió Lucía**, y por D23 se hizo
   sin consultar. Dirección decide: se acepta el 95, o se cambia lo que se pidió.
2. **El «tercio derecho» de A.2** — ver la tabla de arriba: o llega la captura de
   Lucía para igualarla, o hace falta un recorte nuevo de la fuente con el chico
   en su tercio derecho. Rodolfo no produce material de cliente.
