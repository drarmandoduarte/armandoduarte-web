# Orden Códice #31 — `/entrar` y `/empezar` como «Quién soy»

Capturas en esta carpeta:
- `entrar-{1440,1920}-antes.jpg` y `-despues.jpg`;
- `entrar-390-despues.jpg` y `empezar-{1440,390}-despues.jpg`;
- **`al-lado-de-quien-1440.jpg`**: `#quien` de la portada y `/entrar`, a la misma escala.

## Qué se hizo

- **Sin panel, sin fondo cálido**: crema de borde a borde. Se fue lo de la #30.
- **Rejilla al ancho de la cabecera**: dos columnas iguales con 80 px entre ellas, sobre el mismo contenedor que la cabecera y el pie. A 1440 son 608 + 80 + 608; a 1920, 660 + 80 + 660.
- **Columna derecha:** arranca **96 px** bajo la línea de la cabecera. Lleva la firma (script, `--tinta`, a la izquierda, en el lugar del rótulo), 24 px, y después el título, la bajada, Google, el correo, el botón y el aviso, **al ancho de la columna** (sin el tope de 420).
- **Columna izquierda:** la silueta `de-pie` sin fondo, contra el borde izquierdo del contenedor. Usa la técnica de la #28 A:
  - la imagen al 102,01 % del alto de la figura, anclada abajo;
  - el pelo (fila 55) a la altura de las letras de la firma;
  - el corte del archivo apoyado en la línea del pie;
  - el ancho sale del alto, con tope del 100 % de la columna.
- **`--aire-rotulo` = −2 px**, medido en píxeles a 1440, 1920 y 1100. El remate de la «C» de la Great Vibes sale 2 px *por encima* de la caja de la firma, y da igual a 42 y a 33 px.
- **El filo es la línea del pie**: el pie perdió su aire de arriba (lo lleva el formulario como `padding-bottom`), así Armando apoya en la línea.
- **Móvil (< 1100)**: como en la #30, firma arriba del formulario y sin foto. La firma ahora es un solo elemento en todos los anchos.

| | columnas | Armando | firma bajo la cabecera | corte / línea del pie | pelo / letras (fila) |
|---|---|---|---|---|---|
| 1440×900 | 608 + 80 + 608 | 344×686 | 96 | 838,3 / 838,3 | 166 / 166 |
| 1920×1080 | 660 + 80 + 660 | 436×869 | 96 | 1018,3 / 1018,3 | 166 / 166 |

## Test

`apps/familia/e2e/entrar-como-quien.spec.ts` (reemplaza a `entrar-armando.spec.ts`), a 1440 y 1920. Comprueba:
- **ningún fondo cálido**: ningún elemento pinta `--calido`, y ninguno que no sea crema cubre más del 15 % de la pantalla;
- la rejilla al ancho de la cabecera (Armando en su borde izquierdo, el formulario en el derecho), columnas iguales y 80 px entre ellas;
- la firma a 96 px de la cabecera, y el corte del archivo sobre la línea del pie ±1;
- **por píxeles**, la primera fila del pelo = la primera fila de las letras ±1.

**Mutaciones:**

| qué se rompió | cayó en |
|---|---|
| devolver el panel (fondo `--calido` y esquinas en la figura) | «hay fondo cálido en la pantalla» |
| la imagen a `height:100%` (sin el 102,01 %) | «el pelo está 12 px por debajo de las letras» (16 a 1920) |

En los dos casos, al devolver el archivo volvió a verde.

También pasan las mediciones de la #29 en el navegador (un naranja como mucho, 0 pares bajo AA). `la-entrada-a-la-altura.test.tsx` ahora busca la figura y la firma, no el panel.

## Lo que decide dirección

1. **Armando es más chico que en `#quien`**, porque la pantalla es más baja que la sección (a 1440: 900 contra 1160 px de alto). Es la misma composición; el alto lo pone la pantalla. En `/empezar`, que es más largo, Armando crece con el formulario.
2. **El tope del 100 % de la columna no manda en ninguna pantalla razonable**: a 1440 mandaría recién con una figura de más de ~1190 px de alto. Si mandara, Armando queda apoyado abajo y crece el aire sobre el pelo.
3. El formulario a 608 px de ancho deja la bajada de `/entrar` en un solo renglón.
