/**
 * Los `design.json` contra los que se mide el kit, y un resolvedor para cada uno.
 *
 * Los tests de tokens no miden UNA paleta: miden la regla contra todas las que
 * hay en `packages/design/disenos/` más el ejemplo del esquema. Sumar un
 * `design.json` ahí es sumarlo a todas las suites, sin tocar ninguna.
 *
 * Es un módulo y no una suite: importar desde un archivo de test vuelve a
 * registrar sus tests.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aCss } from '../../design/resolver.js';
import { resolvedor } from './resolver.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESIGN = join(AQUI, '..', '..', 'design');
export const SEMANTICA = readFileSync(join(AQUI, 'semantic.css'), 'utf8');

export const DISENOS = [
  ['ejemplo', JSON.parse(readFileSync(join(DESIGN, 'design.ejemplo.json'), 'utf8'))],
  ...readdirSync(join(DESIGN, 'disenos'))
    .filter((n) => n.endsWith('.design.json'))
    .sort()
    .map((n) => [n.replace('.design.json', ''), JSON.parse(readFileSync(join(DESIGN, 'disenos', n), 'utf8'))]),
];

export const TEMAS = ['claro', 'oscuro'];

export function resolvedorDe(design) {
  return resolvedor(aCss(design), SEMANTICA);
}
