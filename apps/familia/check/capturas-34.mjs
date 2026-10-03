#!/usr/bin/env node
/**
 * Las capturas y las mediciones de la barra y los ajustes — orden Códice #34.
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/capturas-34.mjs http://127.0.0.1:4190
 *
 * En el navegador de verdad, con Supabase y la API simulados (la forma de la
 * #32), afirma lo que pide la orden (D):
 *   · la barra sin «Volver a la web» (tampoco en el cajón del teléfono);
 *   · el bloque del usuario con iniciales y rol, para cliente, equipo y dueño;
 *   · el engranaje lleva a `/ajustes` y de ahí a Perfil;
 *   · el sub-nav activo según la ruta, en las seis secciones;
 *   · el interruptor de Notificaciones **persiste**: se apaga, se recarga la
 *     página y sigue apagado (la API simulada guarda lo que le mandan);
 *   · `/mis-datos` responde 308 a `/ajustes/perfil` (lo sirve `servidor.mjs`
 *     desde el `vercel.json`);
 *   · las tarjetas de Inicio miden lo que mide su contenido (alturas distintas);
 * y en cada captura lo de siempre: un naranja como mucho por ruta, 0 pares bajo
 * AA, sin scroll horizontal, sin violaciones de CSP.
 *
 * Además arma el **lado a lado con Bitácora** a la misma escala: las capturas
 * de «Tus preferencias» de Bitácora son las de su auditoría
 * (`Bitacora/.audit-shots/f3-configuracion-{1024,390}-after.png`, 31/7/2026:
 * 1024×900 y 390×844, escala 1), y las nuestras se toman al mismo viewport.
 * Sale con código 1 si algo no se cumple.
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { get } from 'node:http';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as ACENTO } from '../../web/check/acento.mjs';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '34');
const BITACORA = join(homedir(), 'Development', 'Bitacora', '.audit-shots');
mkdirSync(SALIDA, { recursive: true });

const PERMITIDO = [
  ['.btn--naranja', 'el botón que hace avanzar: uno por pantalla'],
  ['.error', 'el texto de error de la casa (#15): una alerta, no un acento'],
];

/* ── Las sesiones simuladas ──────────────────────────────────────────────── */
const REF = 'jrscpjdscgycetyvenco';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const ahora = Math.floor(Date.now() / 1000);
const FACTOR = [{ id: 'f-1', factor_type: 'totp', status: 'verified', friendly_name: 'x', created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z' }];
const sesion = (id, email, aal, factores, proveedores) => ({
  access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: id, aal, amr: [{ method: aal === 'aal2' ? 'totp' : 'otp', timestamp: ahora }], exp: 4102444800, role: 'authenticated',
  })}.c2lnbmF0dXJh`,
  refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
  user: { id, aud: 'authenticated', role: 'authenticated', email, app_metadata: { providers: proveedores }, user_metadata: {}, created_at: '2026-09-29T00:00:00Z', factors: factores },
});
const persona = (id, nombre, apellido, extra = {}) => ({
  id, nombre, apellido, whatsapp: '+529990000000', pais: 'MX', ciudad: 'Mérida', zona_horaria: 'America/Merida',
  anio_nacimiento: 1984, nivel_educativo: 'licenciatura', avisos_por_correo: true, ...extra,
});
const CLIENTA = {
  sesion: sesion('u-clienta', 'laura@ejemplo.com', 'aal1', [], ['email']),
  yo: { rol: 'cliente', tipo: 'cliente', territorio: null, persona: persona('u-clienta', 'Laura', 'Prueba', { ciudad: null }) },
  iniciales: 'LP', rol: 'Cliente',
};
const EQUIPO = {
  sesion: sesion('u-gaby', 'gaby@ejemplo.com', 'aal2', FACTOR, ['email', 'google']),
  yo: { rol: 'equipo', tipo: 'equipo', territorio: 'mexico', persona: persona('u-gaby', 'Gabriela', 'Prueba') },
  iniciales: 'GP', rol: 'Equipo · México',
};
const DUENO = {
  sesion: sesion('u-dueno', 'armando@ejemplo.com', 'aal2', FACTOR, ['google']),
  yo: { rol: 'dueno', tipo: 'equipo', territorio: 'todos', persona: persona('u-dueno', 'Armando', 'Prueba') },
  iniciales: 'AP', rol: 'Dueño',
};

const id = (n) => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const TALLER = {
  referencia: 'AD-0041', inscripcion_id: id(1), estado: 'en_revision', inscripto_el: '2026-10-01T16:00:00Z',
  curso_titulo: 'El arte de amar a tu hijo adolescente', curso_slug: 'el-arte-de-amar-a-tu-hijo-adolescente',
  inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Fiesta Inn Mérida', ciudad: 'Mérida',
  precio_monto: 1170, precio_moneda: 'MXN', motivo_rechazo: null, tiene_comprobante: true,
};
const TALLERES = { abiertos: [], mios: [TALLER], cobro: null };

/* ── Las pantallas ───────────────────────────────────────────────────────── */
const abrirCajon = async (p) => {
  await p.getByRole('button', { name: 'Menú' }).click();
  await p.locator('.cajon .lateral__pie').waitFor();
};
const ANCHOS = [[1440, 900], [390, 844]];
const PANTALLAS = [
  { nombre: '01-barra-cliente', quien: CLIENTA, ruta: '/mi-espacio', espera: '.tarjeta', movil: abrirCajon },
  { nombre: '02-barra-dueno', quien: DUENO, ruta: '/mi-espacio', espera: '.tarjeta', movil: abrirCajon },
  { nombre: '03-barra-plegada', quien: CLIENTA, ruta: '/mi-espacio', espera: '.tarjeta', plegada: true, anchos: [[1440, 900]] },
  { nombre: '04-inicio-equipo', quien: EQUIPO, ruta: '/mi-espacio', espera: '.tarjeta' },
  { nombre: '05-ajustes-perfil', quien: CLIENTA, ruta: '/ajustes/perfil', espera: '#nivel_educativo' },
  { nombre: '06-ajustes-cuenta', quien: CLIENTA, ruta: '/ajustes/cuenta', espera: '[data-correo]' },
  { nombre: '07-ajustes-notificaciones', quien: CLIENTA, ruta: '/ajustes/notificaciones', espera: '[data-interruptor]' },
  { nombre: '08-ajustes-seguridad', quien: DUENO, ruta: '/ajustes/seguridad', espera: '.ajustes__seccion .btn' },
  { nombre: '09-ajustes-sesiones', quien: CLIENTA, ruta: '/ajustes/sesiones', espera: '[data-este-dispositivo]' },
  { nombre: '10-ajustes-privacidad', quien: CLIENTA, ruta: '/ajustes/privacidad', espera: '[data-arco]' },
];

const navegador = await chromium.launch();
const fallas = [];
const tabla = [];

/** Un contexto con la sesión y la API simuladas. La ficha es un objeto vivo: lo que se guarda, queda. */
async function contexto({ quien, ancho, alto, plegada = false }) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(({ clave, valor, plegada }) => {
    window.localStorage.setItem(clave, valor);
    window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
    window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
    window.localStorage.setItem('codice.barra-plegada', plegada ? '1' : '0');
  }, { clave: `sb-${REF}-auth-token`, valor: JSON.stringify(quien.sesion), plegada });
  const yo = structuredClone(quien.yo);
  const json = (route, cuerpo, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });
  await ctx.route(`https://${REF}.supabase.co/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/user')) return json(route, quien.sesion.user);
    if (url.includes('/auth/v1/factors')) return json(route, quien.sesion.user.factors);
    return json(route, {});
  });
  await ctx.route('**/api/**', (route) => {
    const ruta = new URL(route.request().url()).pathname;
    if (ruta === '/api/yo' && route.request().method() === 'POST') {
      Object.assign(yo.persona, route.request().postDataJSON());
      return json(route, { ok: true });
    }
    if (ruta === '/api/yo') return json(route, yo);
    if (ruta === '/api/talleres') return json(route, TALLERES);
    if (ruta === '/api/equipo/cursos') return json(route, { cursos: [] });
    if (ruta === '/api/respaldo/cuantos') return json(route, { quedan: 10, de: 10 });
    return json(route, { ok: true });
  });
  return { ctx, yo };
}

async function listo(p, espera, nombre) {
  try {
    await p.locator(espera).first().waitFor({ timeout: 10000 });
  } catch (e) {
    const texto = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
    throw new Error(`${nombre}: no llegó (${e.message.split('\n')[0]}). En pantalla: «${texto}»`);
  }
  await p.evaluate(() => document.fonts.ready);
  await p.mouse.move(0, 0);
  await p.waitForTimeout(200);
}

/** Lo de siempre, sobre lo pintado. */
async function medir(p, archivo, csp) {
  const acento = await p.evaluate(ACENTO, { permitido: PERMITIDO });
  const pares = await p.evaluate(CONTRASTE);
  const apagados = await p.evaluate(() => [...document.querySelectorAll('button:disabled')].map((b) => b.textContent.trim()));
  const bajoAA = pares.filter((x) => x.ratio < x.umbral && !(x.donde.startsWith('button') && apagados.includes(x.texto)));
  const naranjas = await p.evaluate(() => document.querySelectorAll('.btn--naranja').length);
  const scrollHorizontal = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  const volver = await p.evaluate(() => /volver a la web/i.test(document.querySelector('.lateral')?.innerText ?? ''));
  for (const h of acento.hallazgos) fallas.push(`${archivo}: naranja fuera del botón · ${h.donde} ${h.prop} «${h.texto}»`);
  if (naranjas > 1) fallas.push(`${archivo}: ${naranjas} botones naranja (D26: uno por ruta)`);
  for (const x of bajoAA) fallas.push(`${archivo}: ${x.fg} sobre ${x.bg} ${x.ratio} < ${x.umbral} · ${x.donde} «${x.texto}»`);
  if (scrollHorizontal) fallas.push(`${archivo}: hay scroll horizontal de página`);
  if (volver) fallas.push(`${archivo}: la barra todavía dice «Volver a la web»`);
  for (const c of csp) fallas.push(`${archivo}: CSP · ${c.slice(0, 120)}`);
  return { mirados: acento.mirados, naranjaFuera: acento.hallazgos.length, botonesNaranja: naranjas, pares: pares.length, bajoAA: bajoAA.length, scrollHorizontal, volverALaWeb: volver, csp: csp.length };
}

for (const pantalla of PANTALLAS) {
  for (const [ancho, alto] of pantalla.anchos ?? ANCHOS) {
    const { ctx } = await contexto({ quien: pantalla.quien, ancho, alto, plegada: pantalla.plegada });
    const p = await ctx.newPage();
    const csp = [];
    p.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) csp.push(m.text()); });
    await p.goto(`${BASE}${pantalla.ruta}`, { waitUntil: 'networkidle' });
    await listo(p, pantalla.espera, pantalla.nombre);
    if (ancho < 900 && pantalla.movil) await pantalla.movil(p);

    const archivo = `${pantalla.nombre}-${ancho}.jpg`;
    await p.screenshot({ path: join(SALIDA, archivo), type: 'jpeg', quality: 86, fullPage: !pantalla.movil || ancho >= 900 });
    const fila = { archivo, ...(await medir(p, archivo, csp)) };

    /* El bloque del usuario: iniciales y rol de quien entró (desplegada). */
    const bloque = await p.evaluate(() => ({
      avatar: document.querySelector('.lateral .avatar')?.textContent ?? null,
      rol: document.querySelector('.lateral__rol')?.textContent ?? null,
      engranaje: document.querySelector('[data-engranaje]')?.getAttribute('href') ?? null,
    }));
    if (bloque.avatar !== null) {
      if (bloque.avatar !== pantalla.quien.iniciales) fallas.push(`${archivo}: el avatar dice «${bloque.avatar}» y no «${pantalla.quien.iniciales}»`);
      if (!pantalla.plegada && bloque.rol !== pantalla.quien.rol) fallas.push(`${archivo}: el rol dice «${bloque.rol}» y no «${pantalla.quien.rol}»`);
      if (bloque.engranaje !== '/ajustes') fallas.push(`${archivo}: el engranaje no lleva a /ajustes`);
      fila.avatar = bloque.avatar;
      fila.rol = bloque.rol ?? '(plegada)';
    }
    /* El sub-nav: activo el de la ruta, y uno solo. */
    if (pantalla.ruta.startsWith('/ajustes/')) {
      const activos = await p.evaluate(() => [...document.querySelectorAll('.ajustes__nav [aria-current="page"]')].map((a) => a.getAttribute('href')));
      if (activos.join() !== pantalla.ruta) fallas.push(`${archivo}: el sub-nav marca ${activos.join() || 'nada'} y no ${pantalla.ruta}`);
      fila.subnav = activos.join();
    }
    /* C · Inicio: las tarjetas al alto de su contenido, no estiradas a la más alta. */
    if (pantalla.ruta === '/mi-espacio' && ancho >= 1100 && !pantalla.movil) {
      const altos = await p.evaluate(() => [...document.querySelectorAll('.tarjetas .tarjeta')].map((t) => Math.round(t.getBoundingClientRect().height)));
      fila.altos = altos.join('/');
      if (new Set(altos).size < 2) fallas.push(`${archivo}: las tarjetas miden todas lo mismo (${altos.join('/')}): siguen estiradas`);
    }
    tabla.push(fila);
    await ctx.close();
  }
}

/* ── D · los recorridos ──────────────────────────────────────────────────── */
{
  /* El engranaje → /ajustes → Perfil. */
  const { ctx } = await contexto({ quien: CLIENTA, ancho: 1440, alto: 900 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/mi-espacio`, { waitUntil: 'networkidle' });
  await listo(p, '.tarjeta', 'engranaje');
  await p.locator('[data-engranaje]').click();
  await p.locator('#nivel_educativo').waitFor();
  if (new URL(p.url()).pathname !== '/ajustes/perfil') fallas.push(`engranaje: llevó a ${new URL(p.url()).pathname} y no a /ajustes/perfil`);
  tabla.push({ archivo: 'recorrido · engranaje', resultado: new URL(p.url()).pathname });

  /* El interruptor persiste: apagar, recargar, sigue apagado. */
  await p.goto(`${BASE}/ajustes/notificaciones`, { waitUntil: 'networkidle' });
  await listo(p, '[data-interruptor]', 'interruptor');
  const antes = await p.locator('[data-interruptor]').getAttribute('aria-checked');
  await p.locator('[data-interruptor]').click();
  await p.getByText('Guardado.').waitFor();
  await p.reload({ waitUntil: 'networkidle' });
  await listo(p, '[data-interruptor]', 'interruptor tras recargar');
  const despues = await p.locator('[data-interruptor]').getAttribute('aria-checked');
  if (antes !== 'true' || despues !== 'false') fallas.push(`interruptor: antes ${antes}, después de recargar ${despues} (se esperaba true → false)`);
  tabla.push({ archivo: 'recorrido · interruptor', resultado: `${antes} → recarga → ${despues}` });

  /* Un cliente en /ajustes/seguridad: a Inicio. */
  await p.goto(`${BASE}/ajustes/seguridad`, { waitUntil: 'networkidle' });
  await listo(p, '.tarjeta', 'seguridad del cliente');
  if (new URL(p.url()).pathname !== '/mi-espacio') fallas.push(`seguridad: un cliente quedó en ${new URL(p.url()).pathname}`);
  tabla.push({ archivo: 'recorrido · cliente en /ajustes/seguridad', resultado: new URL(p.url()).pathname });
  await ctx.close();

  /* /mis-datos: 308 a /ajustes/perfil. */
  /* `http.get` y no `fetch`: el `fetch` de Node rechaza el 4190 como «bad port». */
  const r = await new Promise((listo, fallo) => get(`${BASE}/mis-datos`, (res) => { res.resume(); listo(res); }).on('error', fallo));
  if (r.statusCode !== 308 || r.headers.location !== '/ajustes/perfil') fallas.push(`/mis-datos: ${r.statusCode} → ${r.headers.location}`);
  tabla.push({ archivo: 'recorrido · /mis-datos', resultado: `${r.statusCode} → ${r.headers.location}` });
}

/* ── Lado a lado con Bitácora, a la misma escala ─────────────────────────── */
for (const [ancho, alto] of [[1024, 900], [390, 844]]) {
  const suya = join(BITACORA, `f3-configuracion-${ancho}-after.png`);
  if (!existsSync(suya)) {
    fallas.push(`lado a lado: no está ${suya}`);
    continue;
  }
  const { ctx } = await contexto({ quien: CLIENTA, ancho, alto });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/ajustes/perfil`, { waitUntil: 'networkidle' });
  await listo(p, '#nivel_educativo', `lado a lado ${ancho}`);
  const nuestra = await p.screenshot({ type: 'png' });
  await ctx.close();
  const hueco = 24;
  const ctxLado = await navegador.newContext({ viewport: { width: ancho * 2 + hueco, height: alto + 32 }, deviceScaleFactor: 1 });
  const lado = await ctxLado.newPage();
  const img = (b) => `data:image/png;base64,${b.toString('base64')}`;
  await lado.setContent(`<body style="margin:0;background:gray;display:flex;gap:${hueco}px;font:12px sans-serif;color:white">
    <figure style="margin:0"><figcaption style="height:32px;line-height:32px">Bitácora · «Tus preferencias» · ${ancho}×${alto}</figcaption><img src="${img(readFileSync(suya))}" width="${ancho}" height="${alto}"></figure>
    <figure style="margin:0"><figcaption style="height:32px;line-height:32px">Mi espacio · «Tus preferencias.» · ${ancho}×${alto}</figcaption><img src="${img(nuestra)}" width="${ancho}" height="${alto}"></figure>
  </body>`);
  await lado.screenshot({ path: join(SALIDA, `11-lado-a-lado-bitacora-${ancho}.jpg`), type: 'jpeg', quality: 86 });
  tabla.push({ archivo: `11-lado-a-lado-bitacora-${ancho}.jpg`, resultado: 'misma escala (1:1)' });
  await ctxLado.close();
}

await navegador.close();
console.table(tabla);
if (fallas.length) {
  console.error(`\n✗ ${fallas.length}:\n  ${fallas.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} filas en docs/informes/34/: sin «Volver a la web», bloque del usuario, engranaje, sub-nav, interruptor que persiste, 308, tarjetas a su alto, un naranja como mucho, 0 pares bajo AA, sin scroll horizontal, sin CSP.`);
