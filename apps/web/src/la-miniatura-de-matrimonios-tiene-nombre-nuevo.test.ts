/**
 * La miniatura de `/matrimonios` con nombre de archivo nuevo — orden Códice #40.
 *
 * ── El caso (Germán, 6/10/2026) ─────────────────────────────────────────
 * WhatsApp seguía mostrando la miniatura v1 de `armandoduarte.com/matrimonios`
 * aunque la web ya servía la de Diana: cambiar la `?v=` no alcanzó, porque
 * algunos lectores de vista previa guardan la imagen por su **ruta**, sin mirar
 * la query. La imagen pasó a llamarse `og-taller-matrimonio-herido-*`, una
 * dirección que nadie vio nunca. Si el nombre viejo vuelve a cualquier HTML
 * publicado, vuelve la miniatura vieja, y nada en pantalla lo delata.
 *
 * Qué busca: el texto `og-matrimonios-` en cada HTML de `dist/` (lo que Vercel
 * sirve). Qué no busca: el código fuente (lo cubre
 * `la-imagen-al-compartir-existe.test.ts`) ni las imágenes de `dist/img/`.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const htmls = existsSync(DIST) ? readdirSync(DIST).filter((f) => f.endsWith('.html')) : [];
const leer = (f: string) => readFileSync(join(DIST, f), 'utf8');

describe('la miniatura de /matrimonios no vuelve a su nombre viejo (#40)', () => {
  it('EL PISO, PRIMERO: las páginas están en dist, y la de matrimonios nombra la miniatura nueva', () => {
    expect(htmls.length, 'no hay HTML en dist: corre el build antes').toBeGreaterThanOrEqual(5);
    expect(leer('matrimonios.html')).toContain('/img/og-taller-matrimonio-herido-1200x630.jpg');
    expect(leer('matrimonios.html')).toContain('/img/og-taller-matrimonio-herido-1200x1200.jpg');
  });

  it('EL CASO: ningún HTML publicado nombra og-matrimonios-', () => {
    expect(htmls.filter((f) => leer(f).includes('og-matrimonios-'))).toEqual([]);
  });
});
