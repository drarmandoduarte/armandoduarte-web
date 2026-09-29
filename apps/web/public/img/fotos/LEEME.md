# Las fotografías de la web · licencia y origen

Las primeras cinco las mandó **Lucía Duarte** el 16/9/2026 junto con los ocho
íconos, para la orden Códice #05; dos de ellas las reemplazó el 28/9 con la #12.
Todas son de **Pexels**.

## La licencia, escrita acá para no tener que volver a averiguarla

**Licencia Pexels**: uso libre, comercial incluido, **sin atribución
obligatoria**. No hace falta pedir permiso ni nombrar al autor, y por eso ninguna
aparece acreditada en la página.

Que no sea obligatorio no quiere decir que dé lo mismo saber de quién son: si
algún día una foto hay que reemplazarla, buscar más del mismo autor es el camino
corto. Por eso la tabla de abajo tiene la columna.

Lo que la licencia **no** permite, y conviene tener presente el día que alguien
quiera reusarlas para otra cosa: vender las fotos tal cual, ni usar a las
personas que aparecen para dar a entender que respaldan un producto o una idea.
En esta web ilustran secciones; no se las presenta como pacientes de Armando ni
como asistentes al taller, y ninguna lleva un pie que lo sugiera.

## Qué es cada archivo

| archivo | dónde se ve | original de Pexels | autor |
|---|---|---|---|
| `porque-fondo` | Taller · «¿El niño dulce que criaste…?», **de fondo otra vez desde la #12**, sin velo y con el texto sobre un panel | `pexels-karola-g-6345445` (4405×6608) | Karola G |
| `porque-fondo-1800` | **la misma foto**, en 1800×2700, que se sirve solo por encima de 1100 px de ancho de ventana (#14 D). **Solo en WebP desde la #16**: el JPG no lo pedía nadie | el mismo | Karola G |
| `suena-tarjeta` | Taller · «Las estrategias del pasado ya no funcionan», en tarjeta | `pexels-pavel-danilyuk-8057317` (4016×6016) | Pavel Danilyuk |
| `llevas-claridad` | Taller · «Lo que te llevas» → Claridad | `pexels-alena-32936525` (1600×2522 en el insumo) | Alena |
| `llevas-palabras` | Taller · «Lo que te llevas» → Palabras precisas | `pexels-astreyas-photo-10358308` (2337×3505) | Astreyas Photo |
| `llevas-serenidad` | Taller · «Lo que te llevas» → Serenidad con firmeza | `pexels-julia-m-cameron-8841302` (1600×2400 en el insumo) | Julia M. Cameron |

Los originales **no entran al repo**: pesan entre 0,6 y 2,4 MB cada uno y viven
en `01 Documentos/Recursos/Lucia Duarte/`, que es donde llegaron. Acá está solo
lo que el navegador baja.

## Cómo se generaron, por si hay que rehacerlas

Cada una sale en dos formatos —WebP y JPG— desde el original, con `sips` para el
recorte y el tamaño y `cwebp` para el WebP. La única que no tiene su JPG es
`porque-fondo-1800`, y el porqué está más abajo: ningún `<source>` ni `<img>` lo
nombraba. Ninguna herramienta nueva: las dos
vienen con macOS y con Homebrew, y una dependencia de más en el repo se justifica
o no entra.

- **Fondos**: 1200 px de ancho, sin recortar. Van debajo de un velo del color de
  la sección, así que la calidad del JPG es invisible y se baja a 45 para entrar
  en el presupuesto.
- **Tarjetas**: recorte centrado a **4:5** y 800 px de ancho, calidad 74/76.

El presupuesto es **180 KB por archivo** y ninguna lo pasa: la más pesada es
`porque-fondo.jpg` con 160 KB, y su WebP —que es lo que baja casi todo el
mundo— pesa 72 KB.

### La excepción que había, y que se cerró sola en la #16

Hasta la #16 acá había una excepción declarada: `porque-fondo-1800.jpg` pesaba
**367 KB** y pasaba el presupuesto al doble. **La #16 borró ese archivo**, y con
él la excepción: `porque-fondo-1800.webp` pesa **163 KB**, que está bajo los 180,
así que ya no hay nada que excusar. **El presupuesto de 180 KB se cumple en todos
los archivos de esta carpeta, sin excepciones.**

El motivo del borrado es que **nadie lo pedía**: el `<picture>` de `Suena.tsx`
tiene un `<source type="image/webp">` que nombra el WebP de 1800 y un `<img>` de
respaldo que apunta a `porque-fondo.jpg`, el de 1200. Ningún `<source>` ni `<img>`
nombra el JPG de 1800. Estaba en el repo como «par del WebP, para no dejar un
formato huérfano», que es un motivo razonable de escribir y malo de pagar: 367 KB
versionados para un archivo que ningún navegador va a pedir. Si algún día hay que
regenerarlo, sale del original en `01 Documentos/Recursos/Lucia Duarte/` con la
receta de arriba.

Lo que **sí** queda, porque sigue siendo cierto y explica por qué existe la
versión de 1800: se sirve **solo por encima de 1100 px de ancho de ventana**, por
`media="(min-width: 1101px)"` y no por `sizes` —que multiplicaría por el DPR y le
daría la foto grande a un teléfono 3×—. Medido a 375 px con DPR 3: bajan los
mismos **73.380 B**, ni un byte más. Y lo que se compra con ella en escritorio es
bajar el reescalado de ×1,8 a ×1,2: a 1440 el contenedor pide la foto a 2160 px
(`width:150%`) y la de 1200 se estiraba hasta ahí. El antes y el después están en
`docs/informes/14/`.

## Lo que cambió en la #12 (28/9/2026)

Lucía reemplazó la **1ª** y la **3ª** tarjeta de «Lo que te llevas»: donde había
madre e hijos ahora hay **padre e hijo**, que es lo que el taller trata. La 2ª se
queda. Los `alt` se reescribieron a lo que se ve.

Los insumos venían a 1600 y 800 px de ancho y **sin recortar a 4:5**, así que acá
se aplicó la misma receta de arriba —recorte centrado a 4:5, 800 px, calidad
74/76— para que las tres tarjetas sigan siendo el mismo objeto: `<img>` de
800×1000 con `aspect-ratio:4/5`. El recorte centrado deja a las dos figuras
enteras en las dos fotos; está en las capturas del informe de la #12.

Las dos pesan más que sus antecesoras —157 KB el JPG, 49 KB el WebP— porque son
fotos con más grano (arena y textura de madera). Siguen bajo el presupuesto de
180 KB.

## La nota de la #05 sobre `llevas-claridad`, ya sin objeto

Decía que su original era el único apaisado (6049×3372) y que el recorte a 4:5
dejaba fuera a dos niños, y proponía pedirle otra foto a Lucía. **La #12 la
reemplazó**, así que el caso se cerró solo. Queda escrito porque la lección
sirve: cuando un recorte pelea con su foto, lo que hay que cambiar suele ser la
foto.
