# Orden Códice #28 · PR A — portada, programa y el pelo a la altura del rótulo

Capturas: `apps/web/check/capturas-28.mjs`.

## Qué se hizo

1. **La tarjeta del taller de la portada** (`#taller`): el botón principal ahora dice «Reservar mi lugar →», es crema sobre teal y lleva a `enlaceReservarMiLugar()`, el mismo enlace que el hero de `/merida`. Debajo, «Ver el programa →» en contorno a `/merida#programa`. WhatsApp sale de la tarjeta. El test `la-web-no-nombra-vercel.test.ts` cuenta esta entrada. → `taller-portada-1440.jpg`
2. **`#programa` se mueve como 512.** Cada núcleo entra 120 ms después del anterior (0/120/240/360/480 ms), en 700 ms, con `cubic-bezier(.16,1,.3,1)`: opacidad 0→1 y 16 px→0. La línea al núcleo siguiente se dibuja con `scaleX` desde la izquierda, con el mismo retraso que su núcleo. Al pasar el mouse o con `:focus-within`, el núcleo se levanta 4 px en 420 ms (solo a ≥ 1101 px). En vertical, la línea usa `scaleY` desde arriba y el núcleo no se levanta. Con `reduced-motion` todo es instantáneo y nada se desplaza. La entrada usa `translate` y el levantarse usa `transform`, así el retraso de la entrada no demora el hover. → `programa-entrada-1..6.jpg`, `programa-hover-1440.jpg`
3. **El pelo a la altura de las letras** (`#quien`, `#facilitador`, ≥ 901 px). → `{quien,facilitador}-{1440,1920}-borde.png` (zoom ×3)

## Lo que difiere de la orden, medido (decide dirección)

- **Fila 55, no 38.** En `de-pie-1400.webp`, las filas 30–54 son un halo de alfa ≤ 30 que no se ve. El pelo arranca en la **fila 55** (alfa 216). Por eso la altura es `100% / (1 − 55/2791)` = **102,01 %** y no 101,38 %. Con 38 el pelo queda unos 6 px por debajo de las letras.
- **`--aire-rotulo` = 2,5 px, no 1,5.** `Range.getClientRects()` da caja 18 y texto 15, o sea (18 − 15)/2 = 1,5 px. Pero eso mide la caja de la fuente, no la tinta. En píxeles, la primera fila de letras está a +2 px de la caja en «QUIÉN SOY» (por la tilde de la É) y a +4 px en «SOBRE EL FACILITADOR». Con 1,5 px, `#facilitador` quedaba 2 px por encima; con 2,5 px las dos quedan a ±1. Es un solo valor para las dos secciones, como pide la orden.
- **El título de `#programa` no se tocó:** sigue con su `data-d` de siempre (rótulo 0, título 100 ms). Entra antes que los núcleos porque está más arriba.
- `armando-a-la-altura.spec.ts` (#26) afirmaba que las **cajas** de la foto y del rótulo arrancaban juntas. Desde esta orden ya no es así, a propósito. Ahora afirma que la figura baja `--aire-rotulo` y que la imagen sube 55/2791 de su alto. Lo que se ve lo mide `pelo-a-la-altura-del-rotulo.spec.ts`.

## Medido (página)

| | rótulo y | borde de la figura (fila 55) y |
|---|---|---|
| `#quien` 1440 | 1149,0 | 1151,5 |
| `#quien` 1920 | 1350,6 | 1353,1 |
| `#facilitador` 1440 | 4570,3 | 4572,8 |
| `#facilitador` 1920 | 4941,0 | 4943,5 |

Test por píxeles (primera fila que no es fondo): pelo y letras a ±1 px en los cuatro casos.

## Mutaciones

| qué se rompió | cayó en |
|---|---|
| la tarjeta vuelve a WhatsApp | «“Reservar mi lugar” de la tarjeta del taller no lleva a la app» |
| sin el `:hover` que levanta | «al pasar el mouse el núcleo 3 no se levanta 4 px» |
| sin el 102,01 % (`height:100%`) | «el pelo está 21 px por debajo de las letras» (portada) / 17 (taller), a 1440 y 1920 |
| `--aire-rotulo: 0` (la otra mitad) | «el pelo está 2–4 px por encima de las letras», en los cuatro |

## Hallazgos de paso

- La regla de `reduced-motion` tenía que ir **después** del bloque vertical. Si iba antes, el `scaleY(0)` le ganaba por orden y, a 900 px, quien pide menos movimiento se quedaba sin línea. Lo cazó la captura de fidelidad.
- El estado «antes de entrar» también se alcanza con una transición, porque la clase `js` llega después del primer cálculo de estilo. Pasa fuera de pantalla y no se ve; el test espera a que asiente.

Capturas actualizadas por la orden #28: `inicio-{1440,900,390}` (png y texto), `inicio-enlaces` y `taller-1440`. Las de `taller-900` y `taller-390` no cambian.
