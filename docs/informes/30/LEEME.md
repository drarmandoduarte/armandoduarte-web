# Orden Códice #30 — `/entrar` y `/empezar` dentro de los márgenes

Capturas antes/después de `/entrar` a 1440, 1920 y 390, más `/empezar` después (1440 y 390).

## Qué se hizo

- **El panel cálido deja de sangrar.** La pantalla, a ≥ 1100 px, es una grilla sobre el mismo contenedor que la cabecera y el pie (`min(90%, 1400px, 100% − 40px)`): `| margen | panel 45 % | 80 | formulario 55 % | margen |`.
  - El borde izquierdo del panel es el de la línea de la cabecera.
  - El panel tiene esquinas de 12 px y deja 24 px de aire bajo la cabecera.
  - El formulario arranca 80 px después del panel.
- **Ajuste de la auditoría del PR #49: el panel llega siempre hasta 24 px sobre la línea del pie y Armando se escala por alto.** La figura va de 48 px bajo la firma al borde del panel. La foto mide `100% / (1 − 55/2791)` de ese alto, anclada abajo: la fila 55 (el pelo) cae 48 px bajo la firma y la última fila (el corte del archivo) en el borde del panel. El ancho sale del alto, centrado, con tope en el 70 % de la columna. La firma no se movió.
- **Apilado (< 1100): firma arriba del formulario, sin foto.** La foto al 40 % no entra: con ella y la firma, a 390×844 «Enviarme el código» bajaba de y = 627 a ≈ 890, por debajo del pliegue. Sin foto queda en y = 570. Se fue el retrato redondo de 64 px.

| | panel x | panel y | línea pie | formulario x | Armando | corte | pelo bajo la firma |
|---|---|---|---|---|---|---|---|
| 1440×900 | 72 (= cabecera) – 619 | 96–814 | 838 | 699 | 304×606 (55,6 %) | 814,3 = borde | 48,0 |
| 1920×1080 | 260 (= cabecera) – 854 | 96–994 | 1018 | 934 | 391×779 (65,8 %) | 994,3 = borde | 48,0 |
| 2560×1440 | — | — | — | — | 416 (**70,0 %, tope**) | = borde | **352** |

## Test

`apps/familia/e2e/entrar-armando.spec.ts`, a 1440 y 1920. Comprueba:
- `panel.left = cabecera.left` (±0,5) y `panel.right + 80 = formulario.left` (±1);
- **`panel.bottom = pie.top − 24` (±1)**, al menos 24 px bajo la cabecera, y radio de 12 px;
- con el rectángulo **pintado** (con `contain` la caja no es lo que se ve): **el corte apoyado en el borde del panel (±1), o el ancho en el tope del 70 %**, y nunca más que el tope;
- Armando centrado, y el pelo a 48 ±1 bajo la firma mientras el tope no mande;
- que nada se cruza.

**Mutaciones:**
- con el panel a todo el ancho cae en «el panel sangra fuera del contenedor: arranca en x=0.0 y la línea de la cabecera en x=72.0»;
- **volviendo a «el panel mide lo que mide Armando»** (la versión anterior del PR) cae en «el panel termina 30.0 px arriba de la línea del pie (tiene que llegar a 24)» a 1440, y 148,9 a 1920.

En los dos casos, al devolver el archivo volvió a verde.

`la-entrada-a-la-altura.test.tsx` cambió: apilado ya no hay ninguna imagen de Armando, sí la firma.

## Lo que decide dirección

1. *(aceptada)* El corte a dos mitades sigue en 1100 px.
2. *(aceptada)* El formulario va alineado a la izquierda de su columna.
3. **Cuando manda el tope del 70 %.** Pasa cuando el alto disponible supera ~1,37 veces el ancho del panel; en las pantallas medidas, solo a 2560×1440 (`entrar-2560-despues.jpg`). No se pueden cumplir las dos cosas: con el pelo a 48 px de la firma, Armando más angosto es más bajo y el corte quedaría flotando. Elegí que el corte siga apoyado en el borde (es lo que la auditoría pidió evitar) y lo que crece es el aire entre la firma y el pelo: **352 px a 2560×1440**. Si molesta, la salida es subir el tope (al 80 %, calculado, el aire baja a ≈ 236) o bajar la firma en pantallas altas: es decisión de dirección.
4. `retrato-128.webp` quedó sin uso en `apps/familia/public`. No lo borré.
