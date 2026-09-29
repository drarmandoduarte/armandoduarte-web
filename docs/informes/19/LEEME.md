# Orden Códice #19 — Lo que pidieron Lucía y Armando, terminado de verdad

Rama `web/19-lo-pedido`. Este informe está reescrito después del **NO PASA** del
CEO sobre `da3f45b`: lo que sigue describe lo que quedó, no lo que se intentó.

## Qué se hizo

- **A · «¿Te suena?» según la maqueta de Lucía.** Dos columnas **sin cajas**, la
  foto original detrás con el chico **centrado y la cara visible**, velo uniforme
  medido, texto secundario en tinta, la cita abajo a lo ancho en tarjeta cálida
  translúcida, y la sección entera **dentro de la ventana** a escritorio.
- **B · Armando apoyado en la orilla**, con la **v2** del insumo (1400×2526).
- **C · «ADOLESCENTE» sin punto.**
- **D · Test contra el insumo**, ahora con guardia para el repo público.

## Lo medido

| | número |
|---|---|
| `check:contraste` (4 rutas × 4 anchos, con la foto cargada) | 205 pares · **0 bajo AA** |
| `check:acento` | 815 elementos · tope 1 |
| `check:renglones` | 264 títulos · **0 huérfanos** |
| `check:tokens` · `check:tuteo` · `check:estilo` · `check:i18n` · `check:secretos` | verdes |
| Lighthouse móvil `/merida` | perf **96** · a11y **100** · CLS **0** · LCP 2,6 s |
| `#suena` a 1440×900 | **863 px · entra**, 37 px de aire |
| `#suena` a 1920×1080 | **856 px · entra**, 224 px de aire |
| Gate | 232 declarados · 0 saltados · ninguna suite bajo su piso |

**Performance vuelve a 96, así que la deuda de la vuelta anterior se cierra sola.**
En el PR #28 la sección medía 1317 px a 1440 y pintar esa foto costaba un punto;
con la maqueta de Lucía mide 863 px y el costo desaparece. No hizo falta usar el
permiso de «≥ 95» que dirección había concedido.

### A · el velo, la escalera completa

La orden decía «desde 82 %, de a 2, hasta 0 pares». Se corrió entera:

| velo | pares bajo AA | | velo | pares bajo AA |
|---|--:|---|---|--:|
| 82 % | 4 | | 88 % | 2 |
| 84 % | 4 | | 90 % | 2 |
| 86 % | 3 | | 92 % | 1 |
| | | | **94 %** | **0** |

O sea: el 0 llegaba **recién al 94 %**, que es exactamente donde la #05 midió que
«la foto deja de ser una imagen» y donde el CEO ya la rechazó dos veces. Cumplir
la letra de la orden habría roto su motivo.

El culpable de los últimos cuatro escalones era **un solo elemento**: el
`.eyebrow` naranja de 12 px (4,33 y 4,38 contra los 4,5 de AA). Se midieron las
dos opciones que la orden ofrecía y **ninguna pasa sobre la fotografía**:

| color | sobre crema plano | sobre el velo al 86 % |
|---|--:|--:|
| `--ambar` (DA8100) | **2,76** | — |
| `--naranja-texto` (BF3F06) | 5,00 | **4,33–4,38** |

Con el eyebrow en **tinta**, la escalera se volvió a correr desde abajo:

| velo | pares bajo AA |
|---|--:|
| 82 % | 1 |
| 84 % | 1 |
| **86 %** | **0** |

**Queda el 86 %** — ocho puntos por debajo del 94 %, y la cara del chico se ve.

### A · lo demás de la maqueta

- **Fuera los suelos.** Eran lo que tapaba la cara en el PR #28: crema al 90 %
  con desenfoque justo encima del rostro. Vuelven las hairlines del `ol`.
- **La foto, centrada.** `object-position: 50% 34%`. El chico está en el 47 % de
  su propia foto y a 1440 `cover` no deja moverlo en X (sobra 0 px) — que acá es
  lo que se quiere: centrado entre las dos columnas, como en la captura de Lucía.
  **El recorte `2026-09-29-porque-fondo-derecha` NO entró**, como ordena el CEO.
- **Texto secundario a tinta** (`.n` y los `p` de la lista): el gris da 4,99
  sobre crema plano y se cae en cuanto hay una foto debajo; la tinta da 13,19.
- **La cita**, `--calido` al 80 % con `blur(6px)`, tinta, sin barra lateral, a lo
  ancho. Se ve la remera del chico detrás, como en su captura.
- **Dentro de la ventana**: paddings a `clamp(40px,5vh,64px)`, `gap` a `--s5`,
  cita con 28 px, y la franja de hechos **compacta** —ícono a la izquierda, las
  dos líneas a su derecha— que es lo que la baja de tres renglones a dos.

### B · la v2, y el número que pasó por dos manos

| | archivo original | v1 (publicada en `da3f45b`) | **v2 (queda)** |
|---|---|---|---|
| alto | 2614 | 2321 | **2526** |
| última fila del PNG de 560 | **0 opacos**, alfa máx **0** | 319/560 | **321/560**, alfa máx 255 |
| tramo contiguo mayor | 0 | 163 | **164** |

La v1 cortaba en la fila 2320 porque se midió mal el degradado del original —era
opaco hasta la **2532**— y tiró 212 px de pierna sin necesidad. La v2 sale del
PNG con alfa de Lucía. **Los tests de B no cambiaron de idea, solo de número.**

Y la foto **termina en los muslos en todas las fuentes que existen**: no hay
zapatos que recuperar. Por eso la regla es que el corte del archivo coincida con
el borde de la sección — así no se lee como corte.

### D · el guardia

`existsSync` sobre el insumo; si no está, `describe.skip` con el motivo escrito.
Antes era un `readFileSync` a nivel de módulo sobre un archivo que vive **fuera
del repo**, y el repo es público: en cualquier clon ajeno a esta carpeta el
archivo entero reventaba al importar. Mutación: se le cambia la ruta al insumo →
**4 saltados**, no un `ENOENT`.

### Mutaciones de esta vuelta

| test | mutación | qué dijo |
|---|---|---|
| `armando-no-flota` | volver al archivo de antes de la #19 | «alfa máxima 0 ≠ 255» y «no salieron del mismo recorte» |
| `lo-que-mando-armando` | apuntar a un insumo que no existe | `Tests 4 skipped`, sin reventar |

### Capturas de fidelidad

`--update-snapshots` declarado, **segunda vuelta**: cambian las **6 imágenes**
(`inicio-*` por el retrato v2, `taller-*` por la sección y el retrato). Los tres
`-texto` **no cambian** en esta vuelta: la maqueta se rehizo sin tocar una
palabra.

## Lo que quedó pendiente

- **`lucia-te-suena.png` sigue sin estar** en
  `03 Producto/web/insumos/2026-09-28-taller-merida/`. La sección se rehízo con
  la descripción del CEO, que es detallada, pero la comparación lado a lado que
  pide la orden **no se pudo armar**. Las nuestras están a 1440, 900 y 375, más
  las dos de pantalla completa.

## Lo que necesita dirección

1. **El eyebrow perdió el color.** En la captura de Lucía es ámbar; acá es tinta,
   porque ni el ámbar ni el naranja pasan AA a 12 px sobre la foto (tabla
   arriba). Para recuperarlo hay tres caminos y los tres son decisión de
   dirección: subir el velo al 94 % (y perder la foto), agrandar el eyebrow a
   ≥ 18,7 px en negrita (ahí el umbral baja a 3:1), o **agregar al design system
   un naranja más oscuro** con su token.
2. **La cara entra entera pero justa.** Con la sección dentro de la ventana, la
   cabeza del chico ocupa ~460 px de los 863 de alto: se ven pelo, frente, ojos y
   nariz, y la boca queda contra el borde de la tarjeta de la cita. Si dirección
   la quiere más suelta, el camino es la tarjeta más baja o la sección un poco
   más alta — y entonces deja de entrar en 900.
