#!/usr/bin/env node
/**
 * Las pantallas de acceso del Kit de Acceso 1.3.0 en un navegador — orden #37,
 * PR 2 (fase-2 §7 y §8; las capturas de acceso de §10).
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/molde-37-pr2.mjs http://127.0.0.1:4190
 *
 * La app compilada, servida con las cabeceras de su `vercel.json` (la CSP de
 * producción, `style-src 'self'`), con Supabase y la API simulados: nada real,
 * ni una clave ni una sesión. Para cada pantalla (P1–P9, P6b con su espera y
 * `/rescate`), a 390 y a 1440, en claro y en oscuro (`data-theme="dark"`):
 *   · cero violaciones de la CSP y cero `<style>` en el documento;
 *   · ningún par de texto bajo AA (el barrido de contraste de la web);
 *   · sin scroll horizontal, y la columna del molde de 560 como mucho.
 * Saca la captura de cada caso en `docs/informes/37-pr2/`, y la entrada en los
 * tres idiomas. Sale con código 1 si algo no se cumple.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const SALIDA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'informes', '37-pr2');
mkdirSync(SALIDA, { recursive: true });

/* ── Las sesiones simuladas (como en la #35) ─────────────────────────────── */
const REF = 'jrscpjdscgycetyvenco';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const ahora = Math.floor(Date.now() / 1000);
const FACTOR = [{ id: 'f-1', factor_type: 'totp', status: 'verified', friendly_name: 'x', created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z' }];
const sesion = (id, email, aal, factores) => ({
  access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: id, aal, amr: [{ method: 'otp', timestamp: ahora }], exp: 4102444800, role: 'authenticated' })}.c2lnbmF0dXJh`,
  refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
  user: { id, aud: 'authenticated', role: 'authenticated', email, app_metadata: { providers: ['email'] }, user_metadata: {}, created_at: '2026-09-29T00:00:00Z', factors: factores },
});
const persona = { id: 'u-gaby', nombre: 'Gabriela', apellido: 'Prueba', whatsapp: '+529990000000', pais: 'MX', ciudad: 'Mérida', avisos_por_correo: true };
const SIN_SESION = { sesion: null };
const RETO = { sesion: sesion('u-gaby', 'gaby@ejemplo.com', 'aal1', FACTOR), yo: [403, { code: 'AAL2_REQUIRED' }] };
const ENROLAR = { sesion: sesion('u-gaby', 'gaby@ejemplo.com', 'aal1', []), yo: [200, { rol: 'equipo', tipo: 'equipo', territorio: 'mexico', persona }] };
const EQUIPO = { sesion: sesion('u-gaby', 'gaby@ejemplo.com', 'aal2', FACTOR), yo: [200, { rol: 'equipo', tipo: 'equipo', territorio: 'mexico', persona }], verificado: true };

/* Un QR de mentira para P4: cuadros en una grilla, sin ningún secreto adentro. */
const QR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges"><rect width="21" height="21" fill="white"/>${
  Array.from({ length: 21 * 21 }, (_, i) => ((i * 7919) % 5 < 2 ? `<rect x="${i % 21}" y="${Math.floor(i / 21)}" width="1" height="1"/>` : '')).join('')
}</svg>`;
const CODIGOS = ['K7QM-2X4PA', 'B9RT-6WZ3N', 'H2LC-8YD5F', 'P4VJ-1SQ7E', 'T6NG-3KB9M', 'W8XE-5HF2R', 'C3ZU-7PL4D', 'M5AY-9TG6J', 'R1FK-4NC8S', 'Y7DH-2VM5Q'];
const ENLACE = '?r=6f1f2d64-6f1a-4a3e-9f6b-2b0f9a1c4d21&t=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

/* ── Cómo se llega a cada pantalla ───────────────────────────────────────── */
const boton = (p, texto) => p.getByRole('button', { name: texto }).first();
const PANTALLAS = [
  { nombre: 'p1-entrada', quien: SIN_SESION, ruta: '/login', espera: '#correo', idiomas: true },
  {
    nombre: 'p2-codigo-por-mail', quien: SIN_SESION, ruta: '/login', espera: '#correo',
    llegar: async (p) => { await p.locator('#correo').fill('ana@ejemplo.com'); await boton(p, /Enviar código/i).click(); await p.locator('[data-casilla]').first().waitFor(); },
  },
  { nombre: 'p3-verificacion', quien: RETO, ruta: '/auth/2fa', espera: '[data-casilla]' },
  { nombre: 'p4-activar', quien: ENROLAR, ruta: '/auth/2fa/activar', espera: '.acceso__qr img' },
  {
    nombre: 'p5-respaldo', quien: EQUIPO, ruta: '/ajustes/seguridad', espera: '.ajustes__seccion .btn',
    llegar: async (p) => { await p.locator('.ajustes__seccion .btn').first().click(); await p.locator('ol li').first().waitFor(); },
  },
  { nombre: 'p6-recuperacion', quien: RETO, ruta: '/auth/2fa/recuperar', espera: '#respaldo' },
  { nombre: 'p6b-reseteo', quien: RETO, ruta: '/auth/2fa/reseteo', espera: 'form button' },
  {
    nombre: 'p6b-espera', quien: RETO, ruta: '/auth/2fa/reseteo', espera: 'form button',
    llegar: async (p) => { await p.locator('form button').click(); await p.getByText(/en camino/).waitFor(); },
  },
  { nombre: 'p7-sesion-cerrada', quien: SIN_SESION, ruta: '/login', espera: 'main button', inactividad: true },
  {
    nombre: 'p8-confirmacion', quien: { ...EQUIPO, pasoReciente: true }, ruta: '/ajustes/seguridad', espera: '.ajustes__seccion .btn',
    llegar: async (p) => { await p.locator('.ajustes__seccion .btn').first().click(); await p.locator('[data-casilla]').first().waitFor(); },
  },
  { nombre: 'rescate-confirmar', quien: SIN_SESION, ruta: `/rescate${ENLACE}&a=confirmar`, espera: 'main button' },
  {
    nombre: 'rescate-confirmado', quien: SIN_SESION, ruta: `/rescate${ENLACE}&a=confirmar`, espera: 'main button',
    llegar: async (p) => { await p.locator('main button').click(); await p.getByText(/confirmado/i).first().waitFor(); },
  },
  { nombre: 'rescate-cancelar', quien: SIN_SESION, ruta: `/rescate${ENLACE}&a=cancelar`, espera: 'main button' },
];

const navegador = await chromium.launch();
const fallas = [];
/* Lo que el barrido encuentra DENTRO de una pieza del molde no se arregla acá
   (fase-2 §12: el molde no se edita en la app, se propone). Se anota aparte,
   con la pieza, y no se esconde: va al informe como propuesta. Hoy, una sola:
   `Idioma`, que dibuja los idiomas no activos al 70 % de opacidad. Los «·»
   entre idiomas son `aria-hidden` (decoración): no cuentan. */
const alMolde = new Set();
const esDelSelectorDelMolde = (x) => x.donde === 'button' && /^(es|en|pt)$/.test(x.texto);
const esDecoracion = (x) => x.texto === '·';
const tabla = [];

async function contexto({ quien, ancho, alto, idioma = 'es', tema, pantalla }) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', colorScheme: tema === 'oscuro' ? 'dark' : 'light' });
  await ctx.addInitScript(({ clave, valor, idioma, verificado, inactividad, oscuro }) => {
    if (valor) window.localStorage.setItem(clave, valor);
    window.localStorage.setItem('codice.idioma', idioma);
    if (verificado) window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
    window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
    if (inactividad && !window.sessionStorage.getItem('ya')) {
      window.sessionStorage.setItem('armando-duarte.inactivity_logout', '1');
      window.sessionStorage.setItem('ya', '1');
    }
    if (oscuro) document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('data-theme', 'dark'));
    window.__violaciones = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__violaciones.push(`${e.violatedDirective} · ${e.blockedURI}`));
  }, { clave: `sb-${REF}-auth-token`, valor: quien.sesion ? JSON.stringify(quien.sesion) : null, idioma, verificado: !!quien.verificado, inactividad: !!pantalla.inactividad, oscuro: tema === 'oscuro' });
  const json = (route, cuerpo, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });
  let pasoReciente = !!quien.pasoReciente;
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.route(`https://${REF}.supabase.co/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/otp')) return json(route, {});
    if (url.includes('/auth/v1/verify')) return json(route, { code: 'otp_expired', msg: 'x' }, 403);
    if (url.includes('/auth/v1/factors') && route.request().method() === 'POST' && !url.includes('/challenge') && !url.includes('/verify')) {
      return json(route, { id: 'f-2', type: 'totp', friendly_name: 'x', totp: { qr_code: QR, secret: 'ESTONOESUNACLAVEREAL', uri: 'otpauth://totp/Armando%20Duarte:prueba?secret=ESTONOESUNACLAVEREAL' } });
    }
    if (url.includes('/challenge')) return json(route, { id: 'ch-1', type: 'totp', expires_at: 4102444800 });
    if (url.includes('/auth/v1/user')) return json(route, quien.sesion?.user ?? {});
    return json(route, {});
  });
  await ctx.route('**/api/**', (route) => {
    const ruta = new URL(route.request().url()).pathname;
    if (ruta === '/api/yo') return json(route, quien.yo?.[1] ?? {}, quien.yo?.[0] ?? 401);
    if (ruta === '/api/respaldo/cuantos') return json(route, { quedan: 10 });
    if (ruta === '/api/respaldo/generar') {
      if (pasoReciente) return json(route, { code: 'PASO_RECIENTE_REQUERIDO', minutos: 5 }, 403);
      return json(route, { codigos: CODIGOS });
    }
    if (ruta === '/api/rescate/pedir') return json(route, { vence: '2026-10-08T17:30:00Z' });
    if (ruta === '/api/rescate/confirmar') return json(route, { vence: '2026-10-08T17:30:00Z' });
    if (ruta === '/api/rescate/aplicar') return json(route, { aplicado: false });
    return json(route, { ok: true });
  });
  return ctx;
}

for (const pantalla of PANTALLAS) {
  for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
    for (const tema of ['claro', 'oscuro']) {
      for (const idioma of pantalla.idiomas && tema === 'claro' ? ['es', 'en', 'pt'] : ['es']) {
        const ctx = await contexto({ quien: pantalla.quien, ancho, alto, idioma, tema, pantalla });
        const p = await ctx.newPage();
        const consola = [];
        p.on('console', (m) => { if (/Content Security Policy|Refused to apply/i.test(m.text())) consola.push(m.text()); });
        const archivo = `${pantalla.nombre}-${ancho}-${tema}${idioma === 'es' ? '' : `-${idioma}`}.png`;
        try {
          await p.goto(`${BASE}${pantalla.ruta}`, { waitUntil: 'networkidle' });
          await p.locator(pantalla.espera).first().waitFor({ timeout: 10000 });
          if (pantalla.llegar) await pantalla.llegar(p);
        } catch (e) {
          const texto = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
          fallas.push(`${archivo}: no llegó (${e.message.split('\n')[0]}). En pantalla: «${texto}»`);
          await ctx.close();
          continue;
        }
        await p.evaluate(() => document.fonts.ready);
        await p.mouse.move(0, 0);
        await p.waitForTimeout(250);
        await p.screenshot({ path: join(SALIDA, archivo), fullPage: true });
        const pares = await p.evaluate(CONTRASTE);
        const apagados = await p.evaluate(() => [...document.querySelectorAll('button:disabled, button:disabled *')].map((b) => b.textContent.trim()));
        const bajoAA = pares.filter((x) => x.ratio < x.umbral && !apagados.includes(x.texto));
        const m = await p.evaluate(() => ({
          violaciones: window.__violaciones,
          estilos: document.querySelectorAll('style').length,
          columna: Math.round(document.querySelector('.molde-columna')?.getBoundingClientRect().width ?? 0),
          scroll: document.documentElement.scrollWidth > window.innerWidth,
          titulo: document.querySelector('h1')?.textContent ?? '',
          tema: document.documentElement.getAttribute('data-theme'),
        }));
        tabla.push({ archivo, titulo: m.titulo, csp: m.violaciones.length + consola.length, style: m.estilos, pares: pares.length, bajoAA: bajoAA.length, columna: m.columna });
        for (const v of [...m.violaciones, ...consola]) fallas.push(`${archivo}: CSP · ${v.slice(0, 140)}`);
        if (m.estilos) fallas.push(`${archivo}: ${m.estilos} <style> en el documento`);
        for (const x of bajoAA.filter((y) => !esDecoracion(y))) {
          if (esDelSelectorDelMolde(x)) alMolde.add(`Idioma (@moldes/ui): «${x.texto}» no activo, ${x.fg} sobre ${x.bg} = ${x.ratio}:1 (< ${x.umbral})`);
          else fallas.push(`${archivo}: ${x.fg} sobre ${x.bg} ${x.ratio} < ${x.umbral} · ${x.donde} «${x.texto}»`);
        }
        if (m.scroll) fallas.push(`${archivo}: scroll horizontal`);
        if (m.columna > 560) fallas.push(`${archivo}: la columna mide ${m.columna} (> 560)`);
        if (tema === 'oscuro' && m.tema !== 'dark') fallas.push(`${archivo}: el tema oscuro no se aplicó`);
        await ctx.close();
      }
    }
  }
}
await navegador.close();

const lineas = tabla.map((f) => `${f.archivo.padEnd(44)} CSP ${f.csp} · <style> ${f.style} · ${f.pares} pares, ${f.bajoAA} bajo AA · columna ${f.columna} · «${f.titulo}»`);
const propuestas = [...alMolde];
writeFileSync(join(SALIDA, 'mediciones.txt'), `${lineas.join('\n')}\n\n${fallas.length ? fallas.join('\n') : 'Sin fallas.'}\n\nPropuestas al molde (fase-2 §12):\n${propuestas.join('\n') || '—'}\n`);
console.log(lineas.join('\n'));
if (propuestas.length) console.log(`\nPropuestas al molde (no se arreglan en la copia):\n${propuestas.join('\n')}`);
if (fallas.length) {
  console.error(`\n${fallas.length} falla(s):\n${fallas.join('\n')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} capturas: CSP sin violaciones, sin <style>, ningún par bajo AA fuera de las piezas del molde (ésas, arriba, como propuesta).`);
