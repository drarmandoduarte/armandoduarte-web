#!/usr/bin/env node
/**
 * Las capturas de «Me anoto» — orden Códice #24 B.
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/capturas-24-b.mjs http://127.0.0.1:4190
 *
 * Mi espacio de una **clienta** (aal1) a 1440×900 y 390×844: la lista de
 * talleres, el paso de «Me anoto» abierto por `/me-anoto/<slug>`, la
 * confirmación sin datos de cobro (enlace a Gaby) y con datos de cobro, y la
 * lista con un taller lleno, uno ya anotado y «Mis talleres». La API contesta
 * **datos de prueba escritos acá**: ningún nombre, teléfono ni CLABE real.
 *
 * Cada captura se mide igual que las de la #24 A: un naranja como mucho, 0 pares
 * bajo AA, sin scroll horizontal y sin violaciones de CSP.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as ACENTO } from '../../web/check/acento.mjs';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '24-b');
mkdirSync(SALIDA, { recursive: true });

const PERMITIDO = [['.btn--naranja', 'el botón que hace avanzar: uno por pantalla']];
const ANCHOS = [[1440, 900], [390, 844]];

/* ── La sesión simulada (la misma forma que la #18) ──────────────────────── */
const REF = 'jrscpjdscgycetyvenco';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
  sub: 'u-laura', aal: 'aal1', amr: [{ method: 'otp', timestamp: Math.floor(Date.now() / 1000) }], exp: 4102444800, role: 'authenticated',
})}.c2lnbmF0dXJh`;
const SESION = {
  access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
  user: {
    id: 'u-laura', aud: 'authenticated', role: 'authenticated', email: 'clienta@ejemplo.com',
    app_metadata: {}, user_metadata: {}, created_at: '2026-09-29T00:00:00Z', factors: [],
  },
};
const PERSONA_INCOMPLETA = { id: 'u-laura', nombre: 'Laura', apellido: null, whatsapp: null, pais: 'MX', zona_horaria: 'America/Merida' };
const PERSONA_COMPLETA = { ...PERSONA_INCOMPLETA, apellido: 'Prueba', whatsapp: '+52 999 000 0000' };

/* ── Los datos de prueba ─────────────────────────────────────────────────── */
const SLUG = 'el-arte-de-amar-a-tu-adolescente';
const MERIDA = {
  edicion_id: '11111111-1111-4111-8111-111111111111', curso_slug: SLUG, curso_titulo: 'El arte de amar a tu adolescente',
  curso_bajada: 'Taller presencial en Mérida', modalidad: 'presencial', inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z',
  zona: 'America/Merida', sede: 'Fiesta Inn Mérida', ciudad: 'Mérida', pais: 'MX', precio_monto: 1170, precio_moneda: 'MXN',
  lugares: 12, mi_referencia: null,
};
const EN_LINEA = {
  ...MERIDA, edicion_id: '22222222-2222-4222-8222-222222222222', curso_slug: 'limites-con-amor', curso_titulo: 'Límites con amor',
  curso_bajada: null, modalidad: 'en_linea', inicio: '2026-11-20T01:00:00Z', fin: '2026-11-20T03:00:00Z', sede: 'En línea', ciudad: null,
  precio_monto: 450, lugares: null,
};
const LLENO = { ...EN_LINEA, edicion_id: '33333333-3333-4333-8333-333333333333', curso_slug: 'taller-lleno', curso_titulo: 'Taller de prueba lleno', lugares: 0 };
const MIO = {
  referencia: 'AD-0042', inscripto_el: '2026-10-01T16:00:00Z', curso_titulo: MERIDA.curso_titulo, curso_slug: SLUG,
  inicio: MERIDA.inicio, fin: MERIDA.fin, zona: MERIDA.zona, sede: MERIDA.sede, ciudad: MERIDA.ciudad, estado: 'pendiente_de_pago',
};
const COBRO = { banco: 'Banco de prueba', titular: 'Titular de prueba', clabe: '000000000000000000', concepto_sugerido: null };

const confirmar = async (p) => { await p.getByRole('button', { name: 'Confirmar mi lugar' }).click(); await p.locator('.referencia').waitFor(); };
const PANTALLAS = [
  { nombre: 'B1-talleres-abiertos', ruta: '/mi-espacio', espera: '.taller', persona: PERSONA_COMPLETA, abiertos: [MERIDA, EN_LINEA], mios: [] },
  {
    nombre: 'B2-me-anoto-pide-datos', ruta: `/me-anoto/${SLUG}`, espera: '#anotarse-whatsapp', persona: PERSONA_INCOMPLETA,
    abiertos: [MERIDA, EN_LINEA], mios: [],
  },
  {
    nombre: 'B3-confirmacion-sin-cobro', ruta: `/me-anoto/${SLUG}`, espera: '.paso', persona: PERSONA_COMPLETA,
    abiertos: [MERIDA], mios: [], inscribirme: { referencia: 'AD-0042', ya_estaba: false, cobro: null }, llegar: confirmar,
  },
  {
    nombre: 'B4-confirmacion-con-cobro', ruta: `/me-anoto/${SLUG}`, espera: '.paso', persona: PERSONA_COMPLETA,
    abiertos: [MERIDA], mios: [], inscribirme: { referencia: 'AD-0042', ya_estaba: false, cobro: COBRO }, llegar: confirmar,
  },
  {
    nombre: 'B5-anotada-lleno-y-mis-talleres', ruta: '/mi-espacio', espera: '#mis-talleres', persona: PERSONA_COMPLETA,
    abiertos: [{ ...MERIDA, mi_referencia: 'AD-0042', lugares: 11 }, LLENO, EN_LINEA], mios: [MIO],
  },
];

const navegador = await chromium.launch();
const fallas = [];
const tabla = [];

for (const pantalla of PANTALLAS) {
  for (const [ancho, alto] of ANCHOS) {
    const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await ctx.addInitScript(({ clave, valor }) => {
      window.localStorage.setItem(clave, valor);
      window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
      window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
    }, { clave: `sb-${REF}-auth-token`, valor: JSON.stringify(SESION) });
    const json = (route, cuerpo, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });
    await ctx.route(`https://${REF}.supabase.co/**`, (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/user')) return json(route, SESION.user);
      return json(route, {});
    });
    await ctx.route('**/api/**', (route) => {
      const ruta = new URL(route.request().url()).pathname;
      if (ruta === '/api/yo') return json(route, { rol: 'cliente', tipo: 'cliente', persona: pantalla.persona });
      if (ruta === '/api/talleres') return json(route, { abiertos: pantalla.abiertos, mios: pantalla.mios });
      if (ruta === '/api/talleres/inscribirme') return json(route, pantalla.inscribirme);
      return json(route, { ok: true });
    });

    const p = await ctx.newPage();
    if (process.env.DEPURAR) p.on('console', (m) => console.log('consola:', m.type(), m.text().slice(0, 300)));
    if (process.env.DEPURAR) p.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 300)));
    const csp = [];
    p.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) csp.push(m.text()); });
    await p.goto(`${BASE}${pantalla.ruta}`, { waitUntil: 'networkidle' });
    try {
      await p.locator(pantalla.espera).first().waitFor({ timeout: 10000 });
      if (pantalla.llegar) await pantalla.llegar(p);
    } catch (e) {
      const texto = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
      throw new Error(`${pantalla.nombre} a ${ancho}: no llegó (${e.message.split('\n')[0]}). En pantalla: «${texto}»`);
    }
    await p.evaluate(() => document.fonts.ready);
    await p.mouse.move(0, 0);
    await p.waitForTimeout(200);

    const archivo = `${pantalla.nombre}-${ancho}.jpg`;
    await p.screenshot({ path: join(SALIDA, archivo), type: 'jpeg', quality: 86, fullPage: true });

    const acento = await p.evaluate(ACENTO, { permitido: PERMITIDO });
    const pares = await p.evaluate(CONTRASTE);
    const apagados = await p.evaluate(() => [...document.querySelectorAll('button:disabled')].map((b) => b.textContent.trim()));
    const bajoAA = pares.filter((x) => x.ratio < x.umbral && !(x.donde.startsWith('button') && apagados.includes(x.texto)));
    const naranjas = await p.evaluate(() => document.querySelectorAll('.btn--naranja').length);
    const scrollHorizontal = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

    tabla.push({ archivo, mirados: acento.mirados, naranjaFuera: acento.hallazgos.length, botonesNaranja: naranjas, pares: pares.length, bajoAA: bajoAA.length, scrollHorizontal, csp: csp.length });
    for (const h of acento.hallazgos) fallas.push(`${archivo}: naranja fuera del botón · ${h.donde} ${h.prop} «${h.texto}»`);
    if (naranjas > 1) fallas.push(`${archivo}: ${naranjas} botones naranja (D26: uno por pantalla)`);
    for (const x of bajoAA) fallas.push(`${archivo}: ${x.fg} sobre ${x.bg} ${x.ratio} < ${x.umbral} · ${x.donde} «${x.texto}»`);
    if (scrollHorizontal) {
      /* Y quién se pasa: sin el nombre, un «hay scroll» obliga a abrir el navegador a buscarlo. */
      const culpables = await p.evaluate(() => [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest('.tabla-marco'))
        .slice(0, 4).map((e) => `${e.tagName.toLowerCase()}.${e.className} (${Math.round(e.getBoundingClientRect().right)} px)`));
      fallas.push(`${archivo}: hay scroll horizontal de página · ${culpables.join(', ')}`);
    }
    for (const c of csp) fallas.push(`${archivo}: CSP · ${c.slice(0, 120)}`);
    await ctx.close();
  }
}

await navegador.close();
console.table(tabla);
if (fallas.length) {
  console.error(`\n✗ ${fallas.length}:\n  ${fallas.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} capturas en docs/informes/24-b/: un naranja como mucho, 0 pares bajo AA, sin scroll horizontal, sin violaciones de CSP.`);
