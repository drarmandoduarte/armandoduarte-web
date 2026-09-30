#!/usr/bin/env node
/**
 * Las capturas del panel del equipo — orden Códice #24 A.
 *
 *     pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/capturas-24.mjs http://127.0.0.1:4190
 *
 * Las tres pestañas (Cursos, Inscriptos, Clientes) a 1440×900 y a 390×844,
 * más un formulario abierto y Mi espacio del dueño con la entrada al panel.
 * La sesión es la de un dueño con segundo paso y la API contesta **datos de
 * prueba escritos acá**: ningún nombre, correo ni teléfono real entra al repo.
 *
 * Cada captura se mide igual que las de la #18: naranja solo en el botón que
 * hace avanzar, 0 pares bajo AA, sin scroll horizontal de página (las tablas se
 * desplazan dentro de su marco, a propósito) y sin violaciones de CSP.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as ACENTO } from '../../web/check/acento.mjs';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '24');
mkdirSync(SALIDA, { recursive: true });

const PERMITIDO = [['.btn--naranja', 'el botón que hace avanzar: uno por pantalla']];
const ANCHOS = [[1440, 900], [390, 844]];

/* ── La sesión simulada (la misma forma que la #18) ──────────────────────── */
const REF = 'jrscpjdscgycetyvenco';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
  sub: 'u-armando', aal: 'aal2', amr: [{ method: 'totp', timestamp: Math.floor(Date.now() / 1000) }], exp: 4102444800, role: 'authenticated',
})}.c2lnbmF0dXJh`;
const SESION = {
  access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
  user: {
    id: 'u-armando', aud: 'authenticated', role: 'authenticated', email: 'dueno@ejemplo.com',
    app_metadata: {}, user_metadata: {}, created_at: '2026-09-29T00:00:00Z',
    factors: [{ id: 'f-1', factor_type: 'totp', status: 'verified', friendly_name: 'x', created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z' }],
  },
};
const YO = { rol: 'dueno', tipo: 'equipo', persona: { id: 'u-armando', nombre: 'Armando', apellido: 'Prueba', whatsapp: '+52 999 000 0000', pais: 'MX' } };

/* ── Los datos de prueba ─────────────────────────────────────────────────── */
const EDICION = {
  id: '11111111-1111-4111-8111-111111111111', inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z',
  zona: 'America/Merida', sede: 'Fiesta Inn Mérida', ciudad: 'Mérida', pais: 'MX', cupo: 60,
  precio_monto: 1170, precio_moneda: 'MXN', inscripciones_hasta: '2026-11-05T14:30:00Z', estado: 'abierta', inscriptos: 23,
};
const CURSOS = [
  {
    id: '22222222-2222-4222-8222-222222222222', slug: 'el-arte-de-amar-a-tu-adolescente', titulo: 'El arte de amar a tu adolescente',
    bajada: 'Taller presencial en Mérida', descripcion: null, modalidad: 'presencial', estado: 'publicado', ediciones: [EDICION],
  },
  {
    id: '33333333-3333-4333-8333-333333333333', slug: 'limites-con-amor', titulo: 'Límites con amor',
    bajada: null, descripcion: null, modalidad: 'en_linea', estado: 'borrador', ediciones: [],
  },
];
const personas = [
  ['Ana', 'López Prueba', 'ana@ejemplo.com', '+52 999 111 2233', 'MX'],
  ['Beatriz', 'Canul Prueba', 'bea@ejemplo.com', '+52 999 222 3344', 'MX'],
  ['Carmen', 'Pérez Prueba', 'carmen@ejemplo.com', '+52 55 3333 4455', 'MX'],
  ['Daniela', 'Ruiz Prueba', 'dani@ejemplo.com', null, 'MX'],
  ['Elena', 'Vidal Prueba', 'elena@ejemplo.es', '+34 600 111 222', 'ES'],
];
const ESTADOS = ['pendiente_de_pago', 'pendiente_de_pago', 'en_revision', 'confirmada', 'pendiente_de_pago'];
const INSCRIPTOS = personas.map(([nombre, apellido, email, whatsapp, pais], i) => ({
  inscripcion_id: `44444444-4444-4444-8444-44444444444${i}`, referencia: `AD-000${i + 1}`,
  nombre, apellido, email, whatsapp, pais, inscripto_el: `2026-10-0${i + 1}T16:0${i}:00Z`, estado: ESTADOS[i],
}));
const CLIENTES = [
  { persona_id: 'u-armando', nombre: 'Armando', apellido: 'Prueba', email: 'dueno@ejemplo.com', whatsapp: '+52 999 000 0000', pais: 'MX', alta: '2026-09-29T10:00:00Z', cursos: 0, ultimo_curso: null, ultima_inscripcion: null, rol: 'dueno', territorio: 'todos', activo: true },
  { persona_id: 'u-gabi', nombre: 'Gabriela', apellido: 'Prueba', email: 'equipo-mx@ejemplo.com', whatsapp: '+52 462 000 0000', pais: 'MX', alta: '2026-09-29T11:00:00Z', cursos: 0, ultimo_curso: null, ultima_inscripcion: null, rol: 'equipo', territorio: 'mexico', activo: true },
  ...personas.map(([nombre, apellido, email, whatsapp, pais], i) => ({
    persona_id: `u-${i}`, nombre, apellido, email, whatsapp, pais, alta: `2026-09-3${i % 2}T1${i}:00:00Z`,
    cursos: 1, ultimo_curso: 'El arte de amar a tu adolescente', ultima_inscripcion: `2026-10-0${i + 1}T16:00:00Z`,
    rol: null, territorio: null, activo: null,
  })),
];

const PANTALLAS = [
  { nombre: 'A1-cursos', ruta: '/equipo#cursos', espera: '.curso' },
  {
    nombre: 'A1-cursos-editando-edicion', ruta: '/equipo#cursos', espera: '.curso',
    llegar: async (p) => { await p.getByRole('button', { name: 'Editar' }).nth(1).click(); await p.locator('#edicion-inicio').waitFor(); },
  },
  { nombre: 'A2-inscriptos', ruta: '/equipo#inscriptos', espera: '.tabla' },
  { nombre: 'A3-clientes', ruta: '/equipo#clientes', espera: '.tabla' },
  {
    nombre: 'A3-clientes-sumando', ruta: '/equipo#clientes', espera: '.tabla',
    llegar: async (p) => { await p.getByRole('button', { name: 'Sumar al equipo' }).first().click(); await p.locator('.confirmar').waitFor(); },
  },
  { nombre: 'A0-mi-espacio-del-dueno', ruta: '/mi-espacio', espera: '#nombre' },
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
      if (ruta === '/api/yo') return json(route, YO);
      if (ruta === '/api/equipo/cursos') return json(route, { cursos: CURSOS });
      if (ruta.startsWith('/api/equipo/inscriptos/')) return json(route, { inscriptos: INSCRIPTOS });
      if (ruta === '/api/equipo/clientes') return json(route, { clientes: CLIENTES });
      if (ruta === '/api/respaldo/cuantos') return json(route, { quedan: 10, de: 10 });
      return json(route, { ok: true });
    });

    const p = await ctx.newPage();
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
console.log(`\n✓ ${tabla.length} capturas en docs/informes/24/: un naranja como mucho, 0 pares bajo AA, sin scroll horizontal, sin violaciones de CSP.`);
