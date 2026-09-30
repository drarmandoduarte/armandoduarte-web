# #22 · nunca un «Un momento…» eterno

Orden Códice #22. Rama `mi-espacio/05-sin-espera-eterna`, desde `main` (`d1bb0a9`, con el #32 adentro).

## Qué se hizo

- **`recargar()` ya no puede quedar colgada.** Las tres preguntas (sesión, niveles y `/api/yo`) van dentro de un `try/finally` que **siempre** baja `cargando`. Cualquier falla, incluida la de `leerNiveles`, se anota como «no contestó» y lleva a la pantalla de error que ya existía: «No pudimos confirmar tu cuenta», con «Volver a intentar» y «Cerrar sesión».
- **Un solo tope: `TOPE_DE_ESPERA_MS = 12_000`**, para las tres juntas, declarado en `sesion.ts` con su porqué. Si la respuesta llega después del tope, igual se aplica: la pantalla pasa del error a donde corresponde.
- **El caso borde que eso abre:** si lo que no contesta es `getSession`, no se sabe si hay sesión. Eso va a la misma pantalla de error y no a pedir el correo (`sesion.ts` y un renglón en `App.tsx`).
- **Tests:** 3 tests nuevos. `@codice/familia` pasa de 80 a 83.
  - sin el `finally` caen (a) y (b);
  - sin el tope cae solo (b).
- **Gate:** verde.

## Qué quedó

Nada de la orden.

## Qué decide dirección

Nada.
