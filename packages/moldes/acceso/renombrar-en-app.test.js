/** El renombre en una app: lo de la app sí, el núcleo y node_modules no. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { renombrarEnApp } from './renombrar-en-app.mjs';

let app;
const escribir = (rel, texto) => { const p = join(app, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, texto); };
const leer = (rel) => readFileSync(join(app, rel), 'utf8');

beforeEach(() => {
  app = mkdtempSync(join(tmpdir(), 'app-'));
  escribir('src/app.module.ts', "import { Aal2Guard } from './seguridad-512/nucleo/aal2.guard';\nimport { SEGURIDAD_512 } from './seguridad-512/seguridad-512.config';\n");
  escribir('src/seguridad-512/seguridad-512.config.ts', 'export const SEGURIDAD_512: ConfigSeguridad512 = {};\n');
  escribir('src/seguridad-512/nucleo/roles.ts', "import { SEGURIDAD_512 } from '../seguridad-512.config';\n");
  escribir('src/node_modules/x/index.js', "'seguridad-512'\n");
  escribir('src/LEEME.md', 'Kit de Seguridad 512\n');
});
afterEach(() => rmSync(app, { recursive: true, force: true }));

describe('renombrar en una app', () => {
  it('cambia los imports y la config de la app', () => {
    renombrarEnApp([join(app, 'src')]);
    expect(leer('src/app.module.ts')).toBe("import { Aal2Guard } from './acceso/nucleo/aal2.guard';\nimport { ACCESO } from './acceso/acceso.config';\n");
    expect(leer('src/seguridad-512/seguridad-512.config.ts')).toBe('export const ACCESO: ConfigAcceso = {};\n');
  });
  it('no toca el núcleo (se reemplaza entero), ni node_modules, ni lo que no es código', () => {
    renombrarEnApp([join(app, 'src')]);
    expect(leer('src/seguridad-512/nucleo/roles.ts')).toContain('SEGURIDAD_512');
    expect(leer('src/node_modules/x/index.js')).toContain('seguridad-512');
    expect(leer('src/LEEME.md')).toContain('Seguridad 512');
  });
  it('con --probar dice qué cambiaría y no escribe', () => {
    const cambiaria = renombrarEnApp([join(app, 'src')], { probar: true });
    expect(cambiaria).toHaveLength(2);
    expect(leer('src/app.module.ts')).toContain('seguridad-512');
  });
});
