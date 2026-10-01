# Orden Códice #26 — Armando a la altura del texto, y la cita a todo el ancho

Capturas: `apps/web/check/capturas-26.mjs`.

## Qué se hizo

- **`#quien` y `#facilitador`, desde 901 px:** manda la columna de texto. La figura se estira a la fila (`align-self:stretch`) y la imagen va en **posición absoluta** adentro (`height:100%`, `width:auto`, `max-width:100%`, `object-fit:contain`, abajo a la izquierda). Por eso la foto no le aporta un píxel de alto a la fila. Se quitó el tope de 520/472 px, porque el ancho ahora sale del alto. Debajo de 901 px no cambia nada (apilado).
- **Medido** (y de la página): `#quien` 1440: rótulo 1149 = foto 1149, pies 2201 = filo 2201; 1920: 1351 = 1351, 2424 = 2424. `#facilitador` 1440: 4570 = 4570, 5487 = 5487; 1920: 4941 = 4941, 5879 = 5879.
- **La cita de «¿Te suena?»** pasa de `max-width:84%` a todo el ancho: 1296 de 1296 a 1440. Es la única `.bloque-cita--ancha` del sitio.
- Capturas de fidelidad actualizadas por la orden #26: `inicio-1440` y `taller-1440` (las de 900 y 390 no cambian).

## Mutaciones

| qué se rompió | cayó en |
|---|---|
| sin la regla nueva (vuelve el `align-items:end` solo) | «la foto no arranca a la altura del rótulo», portada y taller, 1440 y 1920 |
| la cita otra vez al 84 % | «la cita no ocupa todo el ancho del contenedor» |
| la imagen sin `position:absolute` | «taller: la foto no arranca a la altura del rótulo». En la portada no cae: ahí el texto ya es más alto que la foto, así que la imagen estática igual cabía. |

## Lo que no es exacto, dicho

- El pintado a escala se compara a ±1 px (la caja de `width:auto` se redondea al subpíxel: 527 contra 528). Los cuatro bordes van a ±0.
- La cabeza arranca unos píxeles por debajo del rótulo: son las filas transparentes que el PNG `de-pie` tiene arriba del pelo. La figura y la imagen sí arrancan en el rótulo.
