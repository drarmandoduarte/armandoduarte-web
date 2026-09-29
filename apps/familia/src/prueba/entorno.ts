/**
 * Lo que necesita jsdom para que los tests de Mi espacio midan algo.
 *
 * Es un archivo de andamio, no de producto: acá van los pocos huecos del
 * navegador simulado que las pantallas usan de verdad. Cada uno con su motivo,
 * porque un `setup` que crece sin explicación termina tapando defectos.
 */
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/* `matchMedia` no existe en jsdom y `modo-instalado.ts` del núcleo del kit lo
   consulta para saber si la app está instalada. Sin esto, importar el núcleo
   revienta con un TypeError que no dice nada del test que lo trajo. */
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

/* Cada test arranca sin restos del anterior: el kit guarda la marca de la
   ventana de treinta minutos y la huella del aparato en `localStorage`, y un
   test que hereda la marca de otro mide una sesión que él no creó. */
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

/* Y se desmonta lo que el test haya montado.
   `@testing-library/react` limpia solo **cuando Vitest corre con `globals`**, y
   acá no corre así: los imports son explícitos. Sin esto, el segundo `render()`
   de un archivo deja dos árboles vivos en el `document` y `getByText` revienta
   con «Found multiple elements» — que fue exactamente lo que pasó la primera
   vez que corrió el test de `useAalWindow` del núcleo del kit. El defecto no
   era del kit: era de este andamio, que todavía no existía. */
afterEach(() => {
  cleanup();
});
