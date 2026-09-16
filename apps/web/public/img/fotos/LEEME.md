# Las cinco fotografías de la web · licencia y origen

Las mandó **Lucía Duarte** el 16/9/2026 junto con los ocho íconos, para la orden
Códice #05. Todas son de **Pexels**.

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
| `porque-fondo` | Taller · «¿El niño dulce que criaste…?», de fondo bajo un velo | `pexels-karola-g-6345445` (4405×6608) | Karola G |
| `suena-tarjeta` | Taller · «Las estrategias del pasado ya no funcionan», en tarjeta | `pexels-pavel-danilyuk-8057317` (4016×6016) | Pavel Danilyuk |
| `llevas-claridad` | Taller · «Lo que te llevas» → Claridad | `pexels-artempodrez-6951484` (6049×3372) | Artem Podrez |
| `llevas-palabras` | Taller · «Lo que te llevas» → Palabras precisas | `pexels-astreyas-photo-10358308` (2337×3505) | Astreyas Photo |
| `llevas-serenidad` | Taller · «Lo que te llevas» → Serenidad con firmeza | `pexels-karola-g-6274966` (4151×6226) | Karola G |

Los originales **no entran al repo**: pesan entre 0,6 y 2,4 MB cada uno y viven
en `01 Documentos/Recursos/Lucia Duarte/`, que es donde llegaron. Acá está solo
lo que el navegador baja.

## Cómo se generaron, por si hay que rehacerlas

Cada una sale en dos formatos —WebP y JPG— desde el original, con `sips` para el
recorte y el tamaño y `cwebp` para el WebP. Ninguna herramienta nueva: las dos
vienen con macOS y con Homebrew, y una dependencia de más en el repo se justifica
o no entra.

- **Fondos**: 1200 px de ancho, sin recortar. Van debajo de un velo del color de
  la sección, así que la calidad del JPG es invisible y se baja a 45 para entrar
  en el presupuesto.
- **Tarjetas**: recorte centrado a **4:5** y 800 px de ancho, calidad 74/76.

El presupuesto es **180 KB por archivo** y ninguna lo pasa: la más pesada es
`porque-fondo.jpg` con 160 KB, y su WebP —que es lo que baja casi todo el
mundo— pesa 72 KB.

`llevas-claridad` es la única cuyo original es apaisado (6049×3372): el recorte a
4:5 se queda con la madre en el centro y deja fuera a los dos niños de los
extremos. Es la mejor lectura posible de esa foto en ese hueco, pero si Lucía
prefiere que se vea la familia entera, esa tarjeta pide otra fotografía —o la
misma en horizontal, en otra maqueta—. Está anotado en el informe de la #05.
