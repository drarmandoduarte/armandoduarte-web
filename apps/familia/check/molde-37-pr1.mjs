#!/usr/bin/env node
/**
 * El molde 1.1.2 en Mi espacio, en un navegador — orden #37, PR 1 (fase-2 §1 y §4).
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/molde-37-pr1.mjs http://127.0.0.1:4190
 *
 * La app compilada, servida con las cabeceras de su `vercel.json` (la CSP de
 * producción, `style-src 'self'`), con **Google bloqueado** (`fonts.googleapis.com`
 * y `fonts.gstatic.com` abortados) y Supabase simulado sin sesión: la entrada.
 * Afirma, a 390 y a 1440, en claro y en oscuro (`data-theme="dark"`):
 *   · cero violaciones de CSP y cero `<style>` en el documento;
 *   · `/design.css` y `/fuentes/fuentes.css` enlazados y aplicados (las
 *     variables `--c-*` del design.json existen en `:root`);
 *   · Montserrat cargada desde `/fuentes/` y ningún pedido a Google.
 * Saca la captura de los casos en claro (ver abajo por qué no en oscuro). Sale con código 1 si algo no se cumple. Nada
 * real: ni una clave, ni una sesión.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const SALIDA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'informes', '37-pr1');
mkdirSync(SALIDA, { recursive: true });
const REF = 'jrscpjdscgycetyvenco';
const DESIGN = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'design.json'), 'utf8'));

const navegador = await chromium.launch();
const fallas = [];
for (const ancho of [390, 1440]) {
  for (const tema of ['claro', 'oscuro']) {
    const p = await navegador.newPage({ viewport: { width: ancho, height: ancho > 900 ? 900 : 844 }, colorScheme: tema === 'oscuro' ? 'dark' : 'light' });
    const aGoogle = [];
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => { aGoogle.push(r.request().url()); return r.abort(); });
    await p.route(`https://${REF}.supabase.co/**`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await p.addInitScript(() => {
      window.__violaciones = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__violaciones.push(`${e.violatedDirective} · ${e.blockedURI}`));
    });
    const consola = [];
    p.on('console', (m) => { if (/Content Security Policy|Refused to apply/i.test(m.text())) consola.push(m.text()); });
    await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    if (tema === 'oscuro') await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await p.evaluate(() => document.fonts.ready);
    const m = await p.evaluate(async () => {
      await document.fonts.load('400 16px Montserrat');
      const raiz = getComputedStyle(document.documentElement);
      return {
        violaciones: window.__violaciones,
        estilos: document.querySelectorAll('style').length,
        hojas: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href')),
        acento: raiz.getPropertyValue('--c-acento').trim(),
        fondo: raiz.getPropertyValue('--c-fondo').trim(),
        montserrat: document.fonts.check('400 16px Montserrat'),
        deFuentes: performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes('/fuentes/')),
      };
    });
    const caso = `${ancho} · ${tema}`;
    if (m.violaciones.length || consola.length) fallas.push(`${caso}: violaciones de CSP: ${[...m.violaciones, ...consola].join(' | ')}`);
    if (m.estilos) fallas.push(`${caso}: ${m.estilos} <style> en el documento`);
    if (!m.hojas.includes('/design.css') || !m.hojas.includes('/fuentes/fuentes.css')) fallas.push(`${caso}: no están enlazadas las dos hojas del molde (${m.hojas.join(', ')})`);
    /* Lo esperado sale del design.json, no escrito acá: `check:tokens` no deja
       un hex fuera del canon (y una copia sería una segunda verdad). */
    const paleta = tema === 'oscuro' ? DESIGN.colorOscuro : DESIGN.color;
    const esperado = [paleta.acento, paleta.fondo];
    if (m.acento.toUpperCase() !== esperado[0] || m.fondo.toUpperCase() !== esperado[1]) fallas.push(`${caso}: --c-acento ${m.acento} / --c-fondo ${m.fondo}, y el design.json dice ${esperado.join(' / ')}`);
    if (!m.montserrat || !m.deFuentes.some((n) => n.endsWith('.woff2'))) fallas.push(`${caso}: Montserrat no cargó desde /fuentes/`);
    if (aGoogle.length) fallas.push(`${caso}: ${aGoogle.length} pedidos a Google`);
    console.log(`${caso}: CSP ${m.violaciones.length + consola.length} violaciones · ${m.estilos} <style> · --c-acento ${m.acento} · Montserrat ${m.montserrat ? 'sí' : 'NO'} (${m.deFuentes.length} de /fuentes/) · Google ${aGoogle.length}`);
    /* La captura, solo en claro: las pantallas de hoy (#35) no usan todavía las
       variables del molde, así que en oscuro se verían igual y la imagen diría
       algo que no es. El oscuro se afirma arriba, por los valores. */
    if (tema === 'claro') await p.screenshot({ path: join(SALIDA, `entrada-${ancho}-google-bloqueado.png`) });
    await p.close();
  }
}
await navegador.close();
if (fallas.length) { console.error(`\n✗ ${fallas.length}:\n  ${fallas.join('\n  ')}`); process.exit(1); }
console.log('\n✓ CSP de producción sin violaciones, cero <style>, el design.json aplicado y las fuentes propias con Google bloqueado.');
