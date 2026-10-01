# Orden Códice #30 — `/entrar` y `/empezar` dentro de los márgenes

Capturas antes/después de `/entrar` a 1440, 1920 y 390, más `/empezar` después (1440 y 390).

## Qué se hizo

- **El panel cálido deja de sangrar.** La pantalla, a ≥ 1100 px, es una grilla sobre el mismo contenedor que la cabecera y el pie (`min(90%, 1400px, 100% − 40px)`): `| margen | panel 45 % | 80 | formulario 55 % | margen |`.
  - El borde izquierdo del panel es el de la línea de la cabecera.
  - El panel tiene esquinas de 12 px y deja 24 px de aire bajo la cabecera.
  - El formulario arranca 80 px después del panel.
- **Armando** (la silueta `de-pie`) va al **55 %** del ancho del panel, centrado, con el pelo (fila 55) a **48 px** de la firma. La firma no se movió.
- **Panel a la medida, no estirado.** A 1440 y a 1920 Armando entra entero. Si el panel se estirara hasta el pie, el corte recto del archivo (a los muslos) quedaría flotando 30 y 125 px por encima del borde. Por eso el panel mide lo que mide su contenido y su borde inferior es el corte. Tiene un techo (24 px sobre la línea del pie) que lo corta solo en pantallas más bajas.
- **Apilado (< 1100): firma arriba del formulario, sin foto.** La foto al 40 % no entra: con ella y la firma, a 390×844 «Enviarme el código» bajaba de y = 627 a ≈ 890, por debajo del pliegue. Sin foto queda en y = 570. Se fue el retrato redondo de 64 px.

| | panel x | panel y | línea cabecera | línea pie | formulario x | Armando | pelo bajo la firma |
|---|---|---|---|---|---|---|---|
| 1440×900 | 72–619 | 96–808 | 72 / 72 | 838 | 699 | 301 (55,0 %) | 48,0 |
| 1920×1080 | 260–854 | 96–869 | 260 / 72 | 1018 | 934 | 327 (55,0 %) | 48,0 |

## Test

`apps/familia/e2e/entrar-armando.spec.ts`, reescrito para la #30, a 1440 y 1920. Comprueba:
- `panel.left = cabecera.left` (±0,5) y `panel.right + 80 = formulario.left` (±1);
- 24 px como mínimo contra las dos líneas, y radio de 12 px;
- Armando al 55 % ±1 y centrado, y el pelo a 48 ±1 bajo la firma;
- que la foto llega al borde del panel y que nada se cruza.

**Mutación:** con el panel a todo el ancho (`grid-column: 1 / 3`) cae en «el panel sangra fuera del contenedor: arranca en x=0.0 y la línea de la cabecera en x=72.0» (y x=260.0 a 1920). Al devolverlo, verde.

`la-entrada-a-la-altura.test.tsx` cambió: apilado ya no hay ninguna imagen de Armando, sí la firma.

## Lo que decide dirección

1. **El corte a dos mitades sigue en 1100 px, no en 900.** Es el de la #18; la orden nombra «< 900» como apilado. Entre 900 y 1099 la pantalla también queda apilada (firma, sin foto). Bajarlo a 900 deja el formulario en una columna de ≈ 410 px al lado del panel: se puede, pero es otra decisión.
2. **El formulario va alineado a la izquierda de su columna**, porque las 80 px se miden hasta él. A 1920 queda aire a la derecha.
3. **A 1920 queda crema entre el borde del panel y el pie** (de 869 a 1018), porque el panel termina donde termina Armando. La alternativa es estirar el panel, y entonces el corte del archivo se ve flotando.
4. `retrato-128.webp` quedó sin uso en `apps/familia/public`. No lo borré.
