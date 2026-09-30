# #23-bis · el núcleo se pinta al pasar el mouse

Orden Códice #23-bis. Rama `web/23-bis-nucleo-se-pinta`, desde `main`.

## Qué se hizo

Se pinta pasando el mouse por **cualquier parte de la columna** de un núcleo, como en «Cuatro etapas» de 512, o con `:focus-within`:
- el círculo se rellena de `--naranja` y el borde pasa a naranja;
- el glifo pasa a `--crema`;
- la línea al núcleo siguiente también se pinta de naranja.

En reposo todo sigue en teal.

- **Transición:** 420 ms, `cubic-bezier(.16,1,.3,1)`, sobre `background-color`, `border-color` y `color`. Con `prefers-reduced-motion: reduce` no hay transición.
- **Solo con mouse:** el `:hover` va dentro de `@media (hover: hover)`, así que en una pantalla táctil no se simula nada.
- **Nada se mueve:** 512 probó un `translateY` y lo sacó.
- **Cómo cambia de color el ícono:** no hizo falta tocarlo. Desde la #23 es una **máscara SVG en línea sobre `currentColor`** (`Glifo.tsx`), así que alcanza con cambiar `color`. No rompe la CSP y la URL conserva su `?v=`.
- **Contraste medido:** crema sobre naranja **3,86** (es un gráfico, pide 3) y teal sobre crema en reposo **7,74**.

**Test nuevo:** `e2e/nucleo-se-pinta.spec.ts`. Pasa el mouse por el texto del núcleo 3 y afirma:
- círculo y borde en `--naranja`, glifo en `--crema` y línea en `--naranja`;
- que el núcleo 1 no se pintó;
- en reposo, borde y glifo en `--teal`.

Los colores se leen de las variables, sin hex. Mutación: sin la regla de hover → cae con «con el mouse encima, el círculo no se rellena de --naranja».

**Capturas:** `antes-reposo-1440.jpg` y `despues-mouse-en-nucleo-3-1440.jpg`.

## Verificación

Gate verde. `check:acento` verde: mide en reposo, donde el único naranja sigue siendo el botón. Fidelidad sin cambios, porque las capturas son en reposo.

## Qué quedó / qué decide dirección

Nada pendiente. Una nota: la sección «Verificación» de la orden todavía dice «teal» y «crema sobre teal». Se siguió la decisión del punto 1 (naranja), que es la más reciente.
