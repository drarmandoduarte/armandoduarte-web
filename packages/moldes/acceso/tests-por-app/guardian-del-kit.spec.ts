/**
 * Va en: cualquier carpeta de tests de la app que corra en CI. No tiene nada que
 * adaptar: sube hasta la raíz y corre la línea del guardián.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * El guardián de los moldes corre como script suelto (`node guardian/check.mjs`,
 * enganchado al principio del `test` de la raíz). Pero CI puede correr los
 * tests por workspace y no el de la raíz — y sin esto el guardián no bloquearía
 * un PR, que es justo cuando más falta hace.
 *
 * Este test lo invoca de verdad: la MISMA línea del `test` de la raíz, mismo
 * código de salida. Primero `sha256sum` verifica desde afuera los tres archivos
 * del guardián contra `HUELLAS.txt` (un `check.mjs` editado para salir con 0 no
 * se acusaría solo), y recién ahí corre el guardián. Si alguien toca el núcleo
 * del Kit de Acceso, cualquier paquete del molde o el guardián mismo, el PR
 * queda en rojo.
 *
 * Desde el Kit de Acceso 1.3.0 hay UN solo guardián: el de los moldes. El viejo
 * del kit se apaga al instalar 1.3.0 (ver `docs/fase-2.md`).
 */
/**
 * Raíz del repo. `import.meta.dirname` no compila con el `module` de NestJS
 * (CommonJS), así que se sube desde el directorio del runner hasta encontrar el
 * lockfile de la raíz.
 */
function raizDelRepo(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, 'package-lock.json')) || existsSync(join(dir, 'pnpm-lock.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('No se encontró la raíz del repo desde ' + process.cwd());
}

/** La línea del `test` de la raíz de la app (`docs/fase-2.md` §1). Igual, letra por letra: el molde lo exige. */
const LINEA_DEL_GUARDIAN = "grep -E '  guardian/(check|huellas|revisar)\\.mjs$' HUELLAS.txt | sha256sum -c - && node guardian/check.mjs";

describe('Kit de Acceso — el guardián de los moldes corre en CI', () => {
  it('el guardián, verificado desde afuera, da verde sobre el árbol actual', () => {
    const raiz = raizDelRepo();
    let salida = '';
    expect(() => {
      salida = execFileSync('sh', ['-c', LINEA_DEL_GUARDIAN], { cwd: raiz, encoding: 'utf8' });
    }).not.toThrow();
    expect(salida).toMatch(/guardian\/check\.mjs: OK/);
    expect(salida).toMatch(/idénticos a sus huellas/);
  });
});
