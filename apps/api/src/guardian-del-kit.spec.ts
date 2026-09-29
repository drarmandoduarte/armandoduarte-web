import { describe, it, expect } from 'vitest';
/**
 * ── Adaptado del kit para esta app (orden Códice #15, C) ─────────────────
 * Viene de `Kit de Seguridad 512 v1.1.0 · tests-por-app/`. Lo que cambió son
 * **las rutas y los nombres de esta app**; la lógica que afirma es la del kit y
 * se dejó como estaba. El `LEEME.md` del kit pide exactamente eso: estos tests
 * «se copian pero se adaptan».
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * El guardián del kit corre como script suelto (`node
 * scripts/check-seguridad-512.mjs`, enganchado en el `npm run test` de la raíz).
 * Pero CI corre los tests por workspace, no el de la raíz — así que sin esto el
 * guardián no bloquearía un PR, que es justo cuando más falta hace.
 *
 * Este test lo invoca de verdad: mismo script, mismo código de salida. Si
 * alguien toca el núcleo, el PR queda en rojo.
 */
/**
 * Raíz del repo. `import.meta.dirname` no compila con el `module` de NestJS
 * (CommonJS), así que se sube desde el directorio del runner hasta encontrar el
 * package.json de la raíz (el que declara los workspaces).
 */
function raizDelRepo(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('No se encontró la raíz del repo desde ' + process.cwd());
}

describe('Kit de Seguridad 512 — el guardián corre en CI', () => {
  it('check-seguridad-512 da verde sobre el árbol actual', () => {
    const raiz = raizDelRepo();
    let salida = '';
    expect(() => {
      salida = execFileSync('node', [join('scripts', 'check-seguridad-512.mjs')], {
        cwd: raiz,
        encoding: 'utf8',
      });
    }).not.toThrow();
    expect(salida).toMatch(/archivos de núcleo intactos/);
  });
});
