import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/**
 * Los tests de navegador de Mi espacio.
 *
 * `f4-en-vivo.spec.ts` no usa este servidor —corre contra el preview de
 * Vercel— pero los que vengan después sí, así que queda levantado igual: es
 * barato y evita que el primero que lo necesite tenga que inventarlo.
 *
 * El servidor es **el de esta app** y no el de `apps/web`: la diferencia es qué
 * `vercel.json` lee, y ahí está toda la gracia. Está explicado en
 * `e2e/servidor.mjs`.
 */
const RAIZ = fileURLToPath(new URL('.', import.meta.url));

export const PUERTO = 4190;

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: { reducedMotion: 'reduce', deviceScaleFactor: 1 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: `node e2e/servidor.mjs ${JSON.stringify(`${RAIZ}dist`)} ${PUERTO}`,
      url: `http://127.0.0.1:${PUERTO}/`,
      reuseExistingServer: !process.env.CI,
      cwd: RAIZ,
    },
  ],
});
