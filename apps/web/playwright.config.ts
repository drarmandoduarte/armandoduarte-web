import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * El guardián de fidelidad: dos sitios, el mismo servidor, el mismo navegador.
 *
 * ── El sitio estático vive acá adentro, en `qa/referencia/` ───────────────
 * Desde la orden #04 la referencia no es un repo de al lado: es una carpeta de
 * **este** repo, versionada, y el valor por omisión apunta ahí. Ya no hay una
 * ruta externa que alguien pueda mover sin enterarse, ni una variable de
 * entorno que haya que acordarse de pasar.
 *
 * `ESTATICO_DIR` sigue existiendo por si alguna vez hay que apuntar a otro
 * lado, pero nadie tiene que usarla para que esto corra.
 *
 * ── Y no se saltea si falta ───────────────────────────────────────────────
 * Si no está el sitio estático, esta suite **no puede comprobar nada**, y un
 * guardián que se salta cuando le falta el insumo es un guardián que se apaga
 * solo el día que más falta hace. Falla acá, al levantar, con la ruta que buscó.
 */
const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const ESTATICO = process.env.ESTATICO_DIR
  ?? fileURLToPath(new URL('../../qa/referencia', import.meta.url));

if (!existsSync(`${ESTATICO}/estilo.css`)) {
  throw new Error(
    `No está el sitio estático en ${ESTATICO}.\n`
    + 'Es la especificación del port: sin él, la fidelidad no se mide, se supone.\n'
    + 'Vive en `qa/referencia/` de este repo y se versiona con él (orden #04): si no\n'
    + 'está, no es que falte configurar algo, es que alguien lo borró. No se sigue.',
  );
}

export const PUERTO_PORT = 4180;
export const PUERTO_ESTATICO = 4181;

export default defineConfig({
  testDir: './e2e',
  /* Uno a la vez: las dos páginas se miden con el mismo navegador y la misma
     máquina. Dos comparaciones de píxeles en paralelo compiten por CPU y las
     fuentes pueden llegar tarde a una de las dos. */
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    /* Sin animaciones, de los dos lados. La hoja tiene
       `@media (prefers-reduced-motion:reduce){ .reveal{opacity:1!important} }`,
       así que esto revela todos los bloques sin esperar al observer y hace la
       captura determinista. Es simétrico: el estático recibe exactamente lo
       mismo. */
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
    {
      command: `node e2e/servidor.mjs ${JSON.stringify(ESTATICO)} ${PUERTO_ESTATICO}`,
      url: `http://127.0.0.1:${PUERTO_ESTATICO}/`,
      reuseExistingServer: !process.env.CI,
      cwd: RAIZ,
    },
  ],
});
