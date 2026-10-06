import { defineConfig } from 'vitest/config';

/**
 * ── Desde el Kit de Acceso 1.3.0 (orden #37, PR 2), el núcleo corre entero ──
 *
 * Con el kit 1.1.0, `nucleo/usuario-del-pedido.spec.ts` importaba tres
 * archivos de Cenit y no se podía correr acá: se excluía, y lo declaraba este
 * archivo. El del 1.3.0 (el 1.2.1 renombrado) solo importa su vecino, así que
 * la exclusión se fue y los nueve archivos del núcleo del backend corren en
 * esta app, como dice el `LEEME.md` del kit.
 */
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
