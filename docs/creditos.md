# Créditos de las imágenes

Todo lo que se publica en `apps/web/public/img/`, con de dónde salió y bajo qué
licencia. Lo que no está acá, no se publica.

## Fotografías de Armando

`img/armando/de-pie-*` y `img/armando/medio-cuerpo-*` — recortes con
transparencia que mandó **Lucía Duarte**. Son del cliente; los originales, sin
comprimir, están en `01 Documentos/Recursos/Lucia Duarte/`.

- `de-pie-*` es el del 16/9/2026 y **sigue siendo ése**. La #12 intentó recortar
  la foto nueva (`IMG_9463.jpg`, sobre fondo gris de estudio) con `rembg` y el
  borde no quedó limpio: el gris del estudio sobrevive en la banda
  semitransparente —**8,2 %** de esa banda son píxeles claros, contra **0,2 %**
  del recorte de Lucía— y sobre el teal se ve como un halo alrededor del pelo y
  del hombro. Está medido y fotografiado en `docs/informes/12/`. Se le pidió a
  Lucía el PNG con alfa.
- `medio-cuerpo-*` es el **corregido por Lucía el 28/9/2026**
  (`Mesa de trabajo 14_2.png`, 1660×2004 útiles). Los dos WebP se generaron acá
  desde ese PNG con `cwebp -q 74 -alpha_q 100`, y no son los que venían
  preparados en los insumos: aquéllos pesaban 139 y 414 KB —el de 900 es la
  imagen del hero, que se baja con prioridad— y a calidad 74 dan 67 y 176 KB con
  una diferencia media de 2,5/255 en color y 0,05/255 en alfa. El `-560.png` sí
  es el del insumo, tal cual.

## Fotografías de banco

**Licencia Pexels**: uso libre, comercial incluido, sin atribución obligatoria.
Se anotan igual, porque el día que haya que reemplazar una, saber de quién es
acorta el camino.

| archivo | original | autor | dónde se ve |
|---|---|---|---|
| `fotos/suena-tarjeta.*` | `pexels-pavel-danilyuk-8057317` | Pavel Danilyuk | `/merida` · «Las estrategias del pasado» |
| `fotos/llevas-claridad.*` | `pexels-alena-32936525` | Alena | `/merida` · «Lo que te llevas» → Claridad (reemplazó a la de Artem Podrez en la #12) |
| `fotos/llevas-palabras.*` | `pexels-astreyas-photo-10358308` | Astreyas Photo | `/merida` · «Lo que te llevas» → Palabras precisas |
| `fotos/llevas-serenidad.*` | `pexels-julia-m-cameron-8841302` | Julia M. Cameron | `/merida` · «Lo que te llevas» → Serenidad con firmeza (reemplazó a la de Karola G en la #12) |
| `fotos/tres-maneras-fondo.*` | **Pexels #301987** | — | **en el repo, sin usar** (ver abajo) |
| `fotos/suena-lucia-*` | `pexels-karola-g-6345445` | Karola G | `/merida` · fondo de «¿Te suena?», con el encuadre de Lucía desde la #21 (antes `porque-fondo.*`, borrado) |

`tres-maneras-fondo` entró con la orden #07 (H.2) para ser el fondo de «Tres
maneras» y **no se publicó en ninguna pantalla**: medido, no hay velo que la deje
visible y al mismo tiempo mantenga a AA el texto gris de 16 px que va encima. El
archivo queda porque la decisión de dónde ponerla —o si va— es de dirección; está
en el informe de la #07 con los números.

## Portadas e imágenes de marca

| archivo | origen |
|---|---|
| `fotos/portada-familias-*.webp` | Portada de *Construyendo Familias Fuertes*, recortada y enderezada del mockup público de la ficha del libro en `sanpablo.com.mx`. Es la obra del propio Armando. |
| `cff-*.webp` | El logo de Construyendo Familias Fuertes, recortado al contenido desde `01 Documentos/Marca/CFFsinsombra.png`. |
| `iconos/*.png` (4) | Los cuatro íconos naranja de los núcleos, de **Lucía Duarte** (16/9/2026). |
| `iconos/*.svg` (13) | Redibujados por dirección el 17/9 en el estilo de los de Lucía: los siete que faltaban y los cuatro que no llegaban a 2×. Más los dos de la #12: `cambios.svg` —el quinto núcleo, que vino con los insumos del 28/9— y `fecha.svg`, el calendario de la franja de hechos, dibujado acá en el estilo de los otros tres (círculo de teal claro, glifo blanco de trazo 5, lienzo de 96). |
| `og-merida-1200x630.jpg` y `og-merida-1200x1200.jpg` | La miniatura del taller, de **Lucía Duarte** (28/9/2026), en las dos relaciones que usan Facebook y WhatsApp. Son el `og:image` de `/merida` y el `image` de su `Event`. |
| `og.jpg` | La imagen de compartir que generaba `check/og-taller.html`. **Desde la #12 no la enlaza ninguna página**: `/merida` pasó a las de Lucía. Queda en el repo porque la plantilla que la produce sigue ahí y borrarla es decisión de dirección, no de una orden de contenido. |

*De* Padres digitalmente responsables *no existe portada publicada en ningún
lado; su lomo dibujado en navy es nuestro, no una reproducción.*

## Banderas del campo WhatsApp (Mi espacio)

`apps/familia/public/banderas/<iso>.svg` — **flag-icons 7.5.0**
(<https://github.com/lipis/flag-icons>), de Panayiotis Lipiridis, bajo licencia
**MIT** («Copyright (c) 2013 Panayiotis Lipiridis»; el texto completo viaja con
el paquete). Orden #32. Son las de 4:3, sin tocar, y **solo** las de los 242
países con prefijo telefónico de la lista de `@codice/core` (`PAISES_ISO` menos
los 7 territorios sin prefijo: AQ, BV, GS, HM, PN, TF, UM). Se sirven desde el
mismo origen: la CSP `img-src 'self'` no cambia. Las vigila `check:tokens`
(nombre `<iso>.svg`, exactamente 242, y esta línea).

Las más pesadas son las que llevan escudo: Serbia 181 KB, Bolivia 103 KB y
**México 85 KB**, que es la que se ve con el campo cerrado. Las demás se bajan
recién al abrir la lista (`loading="lazy"`).
