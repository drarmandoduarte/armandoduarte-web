# Orden Códice #28 · PR B — `/entrar`: Armando de pie, debajo de la firma

Capturas: `entrar-1440-antes.jpg`, `entrar-1440-despues.jpg` y `entrar-1920-despues.jpg`.

## Qué se hizo (con la corrección de la auditoría del PR #46)

- **La foto es `de-pie-1400.webp`**, la silueta con alfa de `#quien` (el mismo archivo que la web, copiado a `apps/familia/public`), en lugar del busto recortado en rectángulo. Se fue `medio-cuerpo-900.webp`, que ya no usaba nadie. Con `de-pie` no hay cortes rectos en los brazos ni restos de silla.
- **El encuadre:**
  - la figura arranca en **y = 192**: la línea de la cabecera (72) más 120 px, debajo de la firma;
  - llega al borde de abajo del panel, y la foto ocupa **el 78 % del ancho del panel, centrada** (segundo ajuste del CEO: así los brazos terminan solos, con su alfa, dentro del cálido);
  - **la fila 55 del archivo** (donde arranca el pelo) cae justo en el 192;
  - el panel corta la foto abajo.
- La clase pasó de `panel__busto` a `panel__armando`, con el test de Vitest al día.

| | foto | pelo (fila 55) | cara hasta (fila 755) | firma | panel |
|---|---|---|---|---|---|
| 1440×900 | 505 de ancho (78,0 %), desde x = 71 | 192 | 445 | 126–172 | 0–814 |
| 1920×1080 | 674 de ancho (78,0 %), desde x = 95 | 192 | 529 | 137–183 | 0–994 |

## Dos cosas distintas de lo que decía la corrección, dichas

1. **No se usa `object-fit: cover; object-position: top center`.** Con eso arriba quedaría la fila 0 (el halo) y el pelo caería ~25 px más abajo del 192. Por eso la foto va a su tamaño (ancho del panel, alto según la proporción) y sube 55/1400 de su ancho con `margin-top` negativo. El resultado visual es el que pedía la corrección: ancho del panel, corte abajo, cabeza arriba.
2. **El halo no se recorta.** El primer intento recortaba la figura con `overflow:hidden` y dibujaba una línea recta sobre la cabeza: las filas 30–54 (alfa ≤ 30) son una sombra suave que sobre el cálido sí se nota. Ahora el halo queda por encima del 192 (hasta ~180 a 1440 y ~177 a 1920) como en `#quien`. A 1920 la sombra toca el rango vertical de la firma (137–183), pero el pelo arranca debajo.

## Test

`apps/familia/e2e/entrar-armando.spec.ts`, a 1440 y 1920. Comprueba:
- que la foto es `de-pie` (1400×2791, sin deformar);
- que la fila 55 cae en el borde de la figura (±1) y que la foto mide el 78 % del ancho del panel (±1) y está centrada (±1);
- que la figura llega al borde del panel y que la foto sigue de largo (el corte es del panel, que recorta);
- que la cara entera (filas 55 a 755) queda dentro del panel;
- que la firma termina antes del pelo.

| mutación | cae en |
|---|---|
| volver al busto | «la foto del panel tiene que ser `de-pie`, no el busto» |
| sin el `margin-top` de la fila 55 | «la fila 55 (el pelo) cae en 217,5 (1440) / 225,9 (1920), el borde de la figura en 192» |
| la foto al 100 % del panel | «la foto mide 648 de ancho y el 78 % del panel es 505,4» (1920: 864 contra 673,9) |
| al 78 % pero sin centrar (`left:0`) | «la foto no está centrada en el panel» |
| el panel sin `overflow:hidden` | «el panel tiene que recortar: el corte de abajo es su borde» (lo caza el estilo computado, no lo pintado) |

En todos los casos, al devolver el archivo volvió a verde.

## Visto en la captura, dicho

- Los codos tocan casi el borde del archivo: a la derecha la silueta llega a la columna 1399 cerca de la fila 1600 (y ≈ 750 a 1440). Ahí el borde de la foto es recto en unos pocos píxeles. Es del archivo (igual en `#quien`); al 78 % queda dentro del cálido y apenas se nota.

## Pendiente

- Este test no corre en la gate. Dirección lo aceptó por hoy y queda en `docs/tareas.md` (n.º 16) como orden propia.
