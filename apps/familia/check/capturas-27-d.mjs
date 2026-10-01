#!/usr/bin/env node
/**
 * Las capturas del perfil — orden Códice #27, PR D.
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build && pnpm --filter @codice/web build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/web/e2e/servidor.mjs "$PWD/apps/web/dist" 4180 &
 *     node apps/familia/check/capturas-27-d.mjs http://127.0.0.1:4190 http://127.0.0.1:4180
 *
 * A 1440×900 y 390×844: «Tus datos» con los campos nuevos (y un año escrito,
 * para que se vea la edad), la tarjeta «Completa tu perfil» después de «Me
 * anoto», Clientes con las columnas nuevas y la ficha con notas abierta. Y
 * `/privacidad#perfil` de la web a 1440. Datos de prueba escritos acá.
 *
 * Mismas mediciones que la #24 y la #27 C: un naranja como mucho, 0 pares bajo
 * AA, sin scroll horizontal de página, sin violaciones de CSP.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as ACENTO } from '../../web/check/acento.mjs';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const WEB = process.argv[3] || 'http://127.0.0.1:4180';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '27-d');
mkdirSync(SALIDA, { recursive: true });

/* `.error` entra a la lista por primera vez en esta captura, que es la primera
   que muestra un error a la vista (C2: el archivo de otro tipo, dicho antes de
   subir). Es el texto de error de la casa desde la #15 —`--naranja-texto`,
   medido a 4,5—, no un acento: el tope de un naranja (D26) es de botones. */
const PERMITIDO = [
  ['.btn--naranja', 'el botón que hace avanzar: uno por pantalla'],
  ['.error', 'el texto de error de la casa (#15): una alerta, no un acento'],
];
const ANCHOS = [[1440, 900], [390, 844]];

/* ── Las dos sesiones simuladas (la forma de la #18 y la #24) ─────────────── */
const REF = 'jrscpjdscgycetyvenco';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const ahora = Math.floor(Date.now() / 1000);
const sesion = (id, email, aal, factores) => ({
  access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: id, aal, amr: [{ method: aal === 'aal2' ? 'totp' : 'otp', timestamp: ahora }], exp: 4102444800, role: 'authenticated',
  })}.c2lnbmF0dXJh`,
  refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
  user: { id, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: '2026-09-29T00:00:00Z', factors: factores },
});
const CLIENTA = {
  sesion: sesion('u-clienta', 'clienta@ejemplo.com', 'aal1', []),
  yo: { rol: 'cliente', tipo: 'cliente', persona: { id: 'u-clienta', nombre: 'Laura', apellido: 'Prueba', whatsapp: '+52 999 000 0000', pais: 'MX', zona_horaria: 'America/Merida' } },
};
const DUENO = {
  sesion: sesion('u-dueno', 'dueno@ejemplo.com', 'aal2', [{ id: 'f-1', factor_type: 'totp', status: 'verified', friendly_name: 'x', created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z' }]),
  yo: { rol: 'dueno', tipo: 'equipo', persona: { id: 'u-dueno', nombre: 'Armando', apellido: 'Prueba', whatsapp: '+52 999 000 0001', pais: 'MX' } },
};

/* ── Los datos de prueba ─────────────────────────────────────────────────── */
const id = (n) => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const COBRO = { banco: 'Banco de prueba', titular: 'Titular de prueba', clabe: '000000000000000000', concepto_sugerido: null };

const EDICION = {
  id: id(9), inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Fiesta Inn Mérida', ciudad: 'Mérida',
  pais: 'MX', cupo: 60, precio_monto: 1170, precio_moneda: 'MXN', inscripciones_hasta: '2026-11-05T14:30:00Z', estado: 'abierta', inscriptos: 4,
};
const CURSOS = [{ id: id(8), slug: 'el-arte-de-amar-a-tu-adolescente', titulo: 'El arte de amar a tu adolescente', bajada: null, descripcion: null, modalidad: 'presencial', estado: 'publicado', ediciones: [EDICION] }];
const CLIENTES = [
  { persona_id: id(1), nombre: 'Ana', apellido: 'Prueba', email: 'cliente1@ejemplo.com', whatsapp: '+52 999 000 0010', pais: 'MX', ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'licenciatura', cuantas_notas: 2, alta: '2026-09-30T12:00:00Z', cursos: 1, ultimo_curso: 'El arte de amar a tu adolescente', ultima_inscripcion: '2026-09-30T13:00:00Z', rol: null, territorio: null, activo: null },
  { persona_id: id(2), nombre: 'Bea', apellido: 'Prueba', email: 'cliente2@ejemplo.com', whatsapp: null, pais: 'CO', ciudad: 'Bogotá', anio_nacimiento: 1979, nivel_educativo: 'posgrado', cuantas_notas: 0, alta: '2026-09-30T14:00:00Z', cursos: 0, ultimo_curso: null, ultima_inscripcion: null, rol: null, territorio: null, activo: null },
  { persona_id: id(3), nombre: 'Cata', apellido: 'Prueba', email: 'cliente3@ejemplo.com', whatsapp: null, pais: 'MX', ciudad: null, anio_nacimiento: null, nivel_educativo: null, cuantas_notas: 0, alta: '2026-10-01T09:00:00Z', cursos: 1, ultimo_curso: 'El arte de amar a tu adolescente', ultima_inscripcion: '2026-10-01T09:10:00Z', rol: null, territorio: null, activo: null },
];
const FICHA = {
  inscripciones: [{ inscripcion_id: id(5), referencia: 'AD-0051', curso: 'El arte de amar a tu adolescente', inicio: '2026-11-05T14:30:00Z', zona: 'America/Merida', estado: 'confirmada' }],
  notas: [
    { id: id(6), texto: 'Pidió factura a nombre de su empresa.', created_at: '2026-10-02T17:00:00Z', autor: 'Diana' },
    { id: id(7), texto: 'Pagó en efectivo en el taller.', created_at: '2026-10-01T16:00:00Z', autor: 'Gabriela' },
  ],
};
const ABIERTO = {
  edicion_id: id(4), curso_slug: 'el-arte-de-amar-a-tu-adolescente', curso_titulo: 'El arte de amar a tu adolescente', curso_bajada: null,
  modalidad: 'presencial', inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Fiesta Inn Mérida',
  ciudad: 'Mérida', pais: 'MX', precio_monto: 1170, precio_moneda: 'MXN', lugares: null, mi_referencia: null,
};
const CON_PERFIL = { ...CLIENTA, yo: { ...CLIENTA.yo, persona: { ...CLIENTA.yo.persona, ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'licenciatura' } } };

const irATusDatos = async (p) => { await p.locator('#tus-datos').scrollIntoViewIfNeeded(); };
const confirmar = async (p) => { await p.getByRole('button', { name: 'Confirmar mi lugar' }).click(); await p.locator('.tarjeta-suave').waitFor(); };
const abrirFicha = async (p) => {
  await p.locator('tr', { hasText: 'Ana Prueba' }).getByRole('button', { name: /Abrir/ }).click();
  await p.locator('.ficha').waitFor();
};

const PANTALLAS = [
  { nombre: 'D1-tus-datos', quien: CON_PERFIL, ruta: '/mi-espacio', espera: '#tus-datos', llegar: irATusDatos },
  { nombre: 'D2-completa-tu-perfil', quien: CLIENTA, ruta: '/me-anoto/el-arte-de-amar-a-tu-adolescente', espera: '.paso', talleres: { abiertos: [ABIERTO], mios: [], cobro: COBRO }, llegar: confirmar },
  { nombre: 'D3-clientes', quien: DUENO, ruta: '/equipo#clientes', espera: '.tabla' },
  { nombre: 'D4-clientes-ficha-y-notas', quien: DUENO, ruta: '/equipo#clientes', espera: '.tabla', llegar: abrirFicha },
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
    }, { clave: `sb-${REF}-auth-token`, valor: JSON.stringify(pantalla.quien.sesion) });
    const json = (route, cuerpo, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });
    await ctx.route(`https://${REF}.supabase.co/**`, (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/user')) return json(route, pantalla.quien.sesion.user);
      if (url.includes('/auth/v1/factors')) return json(route, pantalla.quien.sesion.user.factors);
      return json(route, {});
    });
    await ctx.route('**/api/**', (route) => {
      const ruta = new URL(route.request().url()).pathname;
      if (ruta === '/api/yo') return json(route, pantalla.quien.yo);
      if (ruta === '/api/talleres') return json(route, pantalla.talleres ?? { abiertos: [], mios: [], cobro: null });
      if (ruta === '/api/equipo/cursos') return json(route, { cursos: CURSOS });
      if (ruta === '/api/equipo/clientes') return json(route, { clientes: CLIENTES });
      if (ruta.startsWith('/api/equipo/clientes/')) return json(route, FICHA);
      if (ruta === '/api/talleres/inscribirme') return json(route, { referencia: 'AD-0042', ya_estaba: false, cobro: COBRO });
      if (ruta === '/api/respaldo/cuantos') return json(route, { quedan: 10, de: 10 });
      return json(route, { ok: true });
    });

    const p = await ctx.newPage();
    if (process.env.DEPURAR) p.on('console', (m) => console.log('consola:', m.type(), m.text().slice(0, 300)));
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
      const culpables = await p.evaluate(() => [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest('.tabla-marco'))
        .slice(0, 4).map((e) => `${e.tagName.toLowerCase()}.${e.className} (${Math.round(e.getBoundingClientRect().right)} px)`));
      fallas.push(`${archivo}: hay scroll horizontal de página · ${culpables.join(', ')}`);
    }
    for (const c of csp) fallas.push(`${archivo}: CSP · ${c.slice(0, 120)}`);
    await ctx.close();
  }
}

/* Y `/privacidad#perfil` de la web, a 1440: el bloque nuevo arriba de todo. */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(`${WEB}/privacidad#perfil`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const bloque = p.locator('#perfil');
  if (!(await bloque.count())) fallas.push('privacidad: no hay #perfil');
  await bloque.scrollIntoViewIfNeeded();
  await p.screenshot({ path: join(SALIDA, 'D5-privacidad-perfil-1440.jpg'), type: 'jpeg', quality: 86 });
  tabla.push({ archivo: 'D5-privacidad-perfil-1440.jpg', mirados: 0, naranjaFuera: 0, botonesNaranja: 0, pares: 0, bajoAA: 0, scrollHorizontal: false, csp: 0 });
  await ctx.close();
}

await navegador.close();
console.table(tabla);
if (fallas.length) {
  console.error(`\n✗ ${fallas.length}:\n  ${fallas.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} capturas en docs/informes/27-d/: un naranja como mucho, 0 pares bajo AA, sin scroll horizontal, sin violaciones de CSP.`);
