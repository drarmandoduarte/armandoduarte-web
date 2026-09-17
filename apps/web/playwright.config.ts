import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/**
 * Los dos guardianes de navegador: un sitio, un servidor, un navegador.
 *
 * ── Hasta la #04 se levantaban dos sitios ─────────────────────────────────
 * El port y el sitio estático de `qa/referencia/`, cada uno en su puerto, para
 * poder compararlos. **Retirados por D24: la referencia del port cumplió su
 * propósito en la #04.**
 *
 * Desde la #05 la web cambia a pedido del cliente y el estático es historia, así
 * que no hay contra qué compararlo: el guardián de fidelidad mira las capturas
 * versionadas en `e2e/__snapshots__/` y el de comportamiento afirma cada estado
 * contra su valor literal. Se fue el segundo servidor, se fue `ESTATICO_DIR` y
 * se fue el `existsSync` que frenaba la corrida si faltaba una carpeta que ya
 * nadie lee.
 */
const RAIZ = fileURLToPath(new URL('.', import.meta.url));

export const PUERTO_PORT = 4180;

export default defineConfig({
  testDir: './e2e',
  /*
   * Dónde viven las capturas del guardián de fidelidad — orden #05, G (D24).
   *
   * En `e2e/__snapshots__/`, versionadas, y no en la carpeta por defecto
   * `e2e/<archivo>.spec.ts-snapshots/`: la referencia es de la web, no del
   * archivo de test que la mira, y el día que se parta en dos specs no tiene que
   * mudarse de carpeta.
   *
   * `{projectName}` y `{platform}` se conservan **a propósito**, aunque hoy haya
   * un solo proyecto y una sola máquina. Una captura de página completa depende
   * del dibujado de fuentes del sistema: el día que esto corra en CI sobre Linux,
   * con el sufijo la corrida falla diciendo «falta la captura de linux» —que es
   * cierto y accionable— y sin el sufijo fallaría con un diff de píxeles de
   * antialias, que se lee como una regresión que no existe.
   */
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}-{projectName}-{platform}{ext}',
  /* Uno a la vez: dos comparaciones de píxeles en paralelo compiten por CPU y
     las fuentes pueden llegar tarde a una de las dos. */
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    /* Sin animaciones, de los dos lados. La hoja tiene
       `@media (prefers-reduced-motion:reduce){ .reveal{opacity:1!important} }`,
       así que esto revela todos los bloques sin esperar al observer y hace la
       captura determinista. */
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: `node e2e/servidor.mjs ${JSON.stringify(`${RAIZ}dist`)} ${PUERTO_PORT}`,
      url: `http://127.0.0.1:${PUERTO_PORT}/`,
      reuseExistingServer: !process.env.CI,
      cwd: RAIZ,
    },
  ],
});
