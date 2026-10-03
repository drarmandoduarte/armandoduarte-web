#!/usr/bin/env node
/**
 * Las capturas y las mediciones de las pantallas de acceso — orden Códice #35
 * (guion v1 del Kit de Seguridad 512).
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/capturas-35.mjs http://127.0.0.1:4190
 *
 * Supabase y la API simulados (la forma de la #32 y la #34): nada real, ni una
 * clave. Por cada pantalla (P1–P8 y P6b con su espera), a 390 y a 1440:
 *   · la captura;
 *   · las medidas del guion: columna ≤ 560 (24 de margen a 390), campos de 56,
 *     casillas de 80×72 (48×56 a 390), seis y una sola entrada;
 *   · ningún naranja (el acento de estas pantallas es teal), ninguna foto, 0
 *     pares bajo AA, sin scroll horizontal, sin violaciones de CSP.
 * P1, P2 y P3, además, en ES, EN y PT. Y el **lado a lado** con las capturas de
 * referencia del kit (`01-entrada.png` para P1, `03-verificacion-autenticador.png`
 * para las demás), a la misma escala: las del kit son de pantalla retina (×2),
 * así que la nuestra se toma al viewport que corresponde con `deviceScaleFactor: 2`.
 *
 * Y una prueba de **pegar** el código en un teléfono **emulado** (iPhone 13 de
 * Playwright: táctil, 390×844, ×3): pegar «123 456» reparte las seis casillas y
 * verifica solo. **No es un teléfono real**, y el informe lo dice.
 * Sale con código 1 si algo no se cumple.
 */
import { chromium, devices } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as ACENTO } from '../../web/check/acento.mjs';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '35');
const KIT = join(homedir(), 'Development', 'Apps', 'Moldes', 'Acceso (Kit de Seguridad 512)', 'v1', 'guion-de-pantallas');
mkdirSync(SALIDA, { recursive: true });

/* El único color «fuera del acento» permitido: el error, que en estas pantallas es `--error` (#35). */
const PERMITIDO = [['.acceso__error', 'el texto de error del guion (§3), en el color de error del canon']];

/* ── Las sesiones simuladas ──────────────────────────────────────────────── */
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
/* Sin el `data:`: supabase-js se lo agrega a `qr_code` al recibirlo. */
const QR = `${(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges"><rect width="21" height="21" fill="white"/>${
  Array.from({ length: 21 * 21 }, (_, i) => ((i * 7919) % 5 < 2 ? `<rect x="${i % 21}" y="${Math.floor(i / 21)}" width="1" height="1"/>` : '')).join('')
}<rect x="0" y="0" width="7" height="7" fill="none" stroke="black"/><rect x="14" y="0" width="7" height="7" fill="none" stroke="black"/><rect x="0" y="14" width="7" height="7" fill="none" stroke="black"/></svg>`)}`;
const CODIGOS = ['K7QM-2X4PA', 'B9RT-6WZ3N', 'H2LC-8YD5F', 'P4VJ-1SQ7E', 'T6NG-3KB9M', 'W8XE-5HF2R', 'C3ZU-7PL4D', 'M5AY-9TG6J', 'R1FK-4NC8S', 'Y7DH-2VM5Q'];

/* ── Cómo se llega a cada pantalla ───────────────────────────────────────── */
const alCodigo = async (p) => {
  await p.locator('#correo').fill('ana@ejemplo.com');
  await p.locator('.acceso__boton').click();
  await p.locator('#codigo').waitFor();
};
const PANTALLAS = [
  { id: 'P1', nombre: 'p1-entrada', quien: SIN_SESION, ruta: '/login', espera: '#correo', ref: '01-entrada.png', idiomas: true },
  { id: 'P2', nombre: 'p2-codigo-por-mail', quien: SIN_SESION, ruta: '/login', espera: '#correo', llegar: alCodigo, ref: '03-verificacion-autenticador.png', idiomas: true },
  { id: 'P3', nombre: 'p3-verificacion', quien: RETO, ruta: '/auth/2fa', espera: '#totp', ref: '03-verificacion-autenticador.png', idiomas: true },
  { id: 'P4', nombre: 'p4-activar', quien: ENROLAR, ruta: '/auth/2fa/activar', espera: '.acceso__qr img', ref: '03-verificacion-autenticador.png' },
  {
    id: 'P5', nombre: 'p5-respaldo', quien: EQUIPO, ruta: '/ajustes/seguridad', espera: '.ajustes__seccion .btn', ref: '03-verificacion-autenticador.png',
    llegar: async (p) => { await p.locator('.ajustes__seccion .btn').first().click(); await p.locator('.acceso__codigos').waitFor(); },
  },
  { id: 'P6', nombre: 'p6-recuperacion', quien: RETO, ruta: '/auth/2fa/recuperar', espera: '#respaldo', ref: '03-verificacion-autenticador.png' },
  { id: 'P6b', nombre: 'p6b-reseteo', quien: RETO, ruta: '/auth/2fa/reseteo', espera: '.acceso__boton', ref: '03-verificacion-autenticador.png' },
  {
    id: 'P6b', nombre: 'p6b-espera', quien: RETO, ruta: '/auth/2fa/reseteo', espera: '.acceso__boton', ref: '03-verificacion-autenticador.png', rescateResponde: true,
    llegar: async (p) => { await p.locator('.acceso__boton').click(); await p.getByText(/en camino/).waitFor(); },
  },
  { id: 'P7', nombre: 'p7-sesion-cerrada', quien: SIN_SESION, ruta: '/login', espera: '.acceso__boton', inactividad: true, ref: '03-verificacion-autenticador.png' },
  {
    id: 'P8', nombre: 'p8-confirmacion', quien: { ...EQUIPO, pasoReciente: true }, ruta: '/ajustes/seguridad', espera: '.ajustes__seccion .btn', ref: '03-verificacion-autenticador.png',
    llegar: async (p) => { await p.locator('.ajustes__seccion .btn').first().click(); await p.locator('#paso-reciente').waitFor(); },
  },
];

const navegador = await chromium.launch();
const fallas = [];
const tabla = [];

async function contexto({ quien, ancho, alto, idioma = 'es', escala = 1, extra = {}, pantalla = {} }) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: escala, reducedMotion: 'reduce', ...extra });
  await ctx.addInitScript(({ clave, valor, idioma, verificado, inactividad }) => {
    if (valor) window.localStorage.setItem(clave, valor);
    window.localStorage.setItem('codice.idioma', idioma);
    if (verificado) window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
    window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
    if (inactividad && !window.sessionStorage.getItem('ya')) {
      window.sessionStorage.setItem('armando-duarte.inactivity_logout', '1');
      window.sessionStorage.setItem('ya', '1');
    }
  }, { clave: `sb-${REF}-auth-token`, valor: quien.sesion ? JSON.stringify(quien.sesion) : null, idioma, verificado: !!quien.verificado, inactividad: !!pantalla.inactividad });
  const json = (route, cuerpo, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });
  let pasoReciente = !!quien.pasoReciente;
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
    if (ruta === '/api/rescate/pedir') {
      return pantalla.rescateResponde ? json(route, { vence: '2026-10-05T17:30:00Z' }) : json(route, { code: 'NO_EXISTE' }, 404);
    }
    return json(route, { ok: true });
  });
  return { ctx, apagarPasoReciente: () => { pasoReciente = false; } };
}

async function abrir(pantalla, ctx) {
  const p = await ctx.newPage();
  const csp = [];
  p.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) csp.push(m.text()); });
  await p.goto(`${BASE}${pantalla.ruta}`, { waitUntil: 'networkidle' });
  try {
    await p.locator(pantalla.espera).first().waitFor({ timeout: 10000 });
    if (pantalla.llegar) await pantalla.llegar(p);
  } catch (e) {
    const texto = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
    throw new Error(`${pantalla.nombre}: no llegó (${e.message.split('\n')[0]}). En pantalla: «${texto}»`);
  }
  await p.evaluate(() => document.fonts.ready);
  await p.mouse.move(0, 0);
  await p.waitForTimeout(250);
  return { p, csp };
}

for (const pantalla of PANTALLAS) {
  for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
    for (const idioma of pantalla.idiomas ? ['es', 'en', 'pt'] : ['es']) {
      const { ctx } = await contexto({ quien: pantalla.quien, ancho, alto, idioma, pantalla });
      const { p, csp } = await abrir(pantalla, ctx);
      const archivo = `${pantalla.nombre}-${ancho}${idioma === 'es' ? '' : `-${idioma}`}.png`;
      await p.screenshot({ path: join(SALIDA, archivo), fullPage: true });

      const acento = await p.evaluate(ACENTO, { permitido: PERMITIDO });
      const pares = await p.evaluate(CONTRASTE);
      /* Un control deshabilitado queda fuera de la regla de contraste (WCAG
         1.4.3). Solo P5 tiene uno, y porque el guion lo pide: «Listo, los
         guardé» apagado hasta guardar. Se excusa su texto y el de adentro. */
      const apagados = await p.evaluate(() => [...document.querySelectorAll('button:disabled, button:disabled *')].map((b) => b.textContent.trim()));
      const bajoAA = pares.filter((x) => x.ratio < x.umbral && !apagados.includes(x.texto));
      const m = await p.evaluate(() => {
        const r = (s) => document.querySelector(s)?.getBoundingClientRect();
        const col = r('.acceso__columna');
        const casillas = [...document.querySelectorAll('.otp__casilla')].map((c) => c.getBoundingClientRect());
        return {
          columna: col ? Math.round(col.width) : null,
          margen: col ? Math.round(col.left) : null,
          campo: r('.acceso__campo') ? Math.round(r('.acceso__campo').height) : null,
          casillas: casillas.length,
          casilla: casillas[0] ? `${Math.round(casillas[0].width)}×${Math.round(casillas[0].height)}` : null,
          hueco: casillas[1] ? Math.round(casillas[1].left - casillas[0].right) : null,
          entradas: document.querySelectorAll('.otp input').length,
          naranja: document.querySelectorAll('.btn--naranja').length,
          fotos: document.querySelectorAll('img[src*="/img/armando/"]').length,
          scroll: document.documentElement.scrollWidth > window.innerWidth,
          titulo: document.querySelector('h1')?.textContent ?? '',
          volver: document.querySelector('.acceso__volver')?.textContent ?? '',
        };
      });
      const fila = { archivo, ...m, mirados: acento.mirados, fuera: acento.hallazgos.length, pares: pares.length, bajoAA: bajoAA.length, csp: csp.length };
      tabla.push(fila);
      for (const h of acento.hallazgos) fallas.push(`${archivo}: color fuera del acento · ${h.donde} ${h.prop} «${h.texto}»`);
      for (const x of bajoAA) fallas.push(`${archivo}: ${x.fg} sobre ${x.bg} ${x.ratio} < ${x.umbral} · ${x.donde} «${x.texto}»`);
      if (m.naranja) fallas.push(`${archivo}: hay naranja (el acento del guion es teal)`);
      if (m.fotos) fallas.push(`${archivo}: hay una foto (el guion dice «sin fotos»)`);
      if (m.scroll) fallas.push(`${archivo}: scroll horizontal`);
      if (m.columna > 560) fallas.push(`${archivo}: la columna mide ${m.columna} (> 560)`);
      if (ancho === 390 && m.margen !== 24) fallas.push(`${archivo}: el margen a 390 es ${m.margen} y no 24`);
      if (m.campo && m.campo !== 56) fallas.push(`${archivo}: el campo mide ${m.campo} de alto y no 56`);
      if (m.casillas) {
        const esperado = ancho === 390 ? '48×56' : '80×72';
        if (m.casillas !== 6 || m.entradas !== 1) fallas.push(`${archivo}: ${m.casillas} casillas y ${m.entradas} entradas`);
        if (m.casilla !== esperado) fallas.push(`${archivo}: la casilla mide ${m.casilla} y no ${esperado}`);
        if (m.hueco !== (ancho === 390 ? 8 : 12)) fallas.push(`${archivo}: el hueco entre casillas es ${m.hueco}`);
      }
      if (m.volver !== '← Armando Duarte') fallas.push(`${archivo}: el enlace de arriba dice «${m.volver}»`);
      for (const c of csp) fallas.push(`${archivo}: CSP · ${c.slice(0, 120)}`);
      await ctx.close();
    }
  }
}

/* ── Lado a lado con la referencia del kit, a la misma escala ──────────────── */
for (const pantalla of PANTALLAS) {
  const ref = join(KIT, pantalla.ref);
  if (!existsSync(ref)) { fallas.push(`lado a lado: no está ${ref}`); continue; }
  /* Las del kit son retina: 1970×1676 → 985×838 y 3036×1770 → 1518×885, a ×2. */
  const [ancho, alto] = pantalla.ref.startsWith('01') ? [985, 838] : [1518, 885];
  for (const idioma of pantalla.idiomas ? ['es', 'en', 'pt'] : ['es']) {
    const { ctx } = await contexto({ quien: pantalla.quien, ancho, alto, idioma, escala: 2, pantalla });
    const { p } = await abrir(pantalla, ctx);
    const nuestra = await p.screenshot({ type: 'png' });
    await ctx.close();
    const hueco = 48;
    const lado = await navegador.newContext({ viewport: { width: ancho * 2 + hueco, height: alto + 40 }, deviceScaleFactor: 2 });
    const pg = await lado.newPage();
    const img = (b) => `data:image/png;base64,${b.toString('base64')}`;
    await pg.setContent(`<body style="margin:0;background:gray;display:flex;gap:${hueco}px;font:14px sans-serif;color:white">
      <figure style="margin:0"><figcaption style="height:40px;line-height:40px">Kit 512 · ${pantalla.ref} (referencia)</figcaption><img src="${img(readFileSync(ref))}" style="width:${ancho}px;height:${alto}px"></figure>
      <figure style="margin:0"><figcaption style="height:40px;line-height:40px">Mi espacio · ${pantalla.id} · ${idioma.toUpperCase()} · ${ancho}×${alto} ×2</figcaption><img src="${img(nuestra)}" style="width:${ancho}px;height:${alto}px"></figure>
    </body>`);
    const archivo = `lado-a-lado-${pantalla.nombre}${idioma === 'es' ? '' : `-${idioma}`}.jpg`;
    await pg.screenshot({ path: join(SALIDA, archivo), type: 'jpeg', quality: 82 });
    await lado.close();
    tabla.push({ archivo, resultado: 'misma escala (×2, viewport de la referencia)' });
  }
}

/* ── Pegar el código en un teléfono EMULADO ──────────────────────────────── */
{
  const { ctx } = await contexto({ quien: SIN_SESION, ancho: 390, alto: 844, extra: { ...devices['iPhone 13'], reducedMotion: 'reduce' } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const p = await ctx.newPage();
  const verificados = [];
  p.on('request', (r) => { if (r.url().includes('/auth/v1/verify')) verificados.push(r.postDataJSON()?.token); });
  await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await alCodigo(p);
  await p.locator('#codigo').tap();
  /* Lo que hace el teléfono al tocar «Pegar»: un `paste` con el texto del correo. */
  await p.locator('#codigo').evaluate((el) => {
    const dt = new DataTransfer();
    dt.setData('text', 'Tu código: 123 456');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await p.waitForTimeout(400);
  const casillas = await p.evaluate(() => [...document.querySelectorAll('[data-casilla]')].map((c) => c.textContent).join(''));
  await p.screenshot({ path: join(SALIDA, 'pegar-en-telefono-emulado-390.png') });
  if (verificados.join() !== '123456') fallas.push(`pegar (emulado): verificó ${JSON.stringify(verificados)} y no 123456 una vez`);
  tabla.push({ archivo: 'pegar · iPhone 13 EMULADO', resultado: `casillas tras pegar «${casillas || '(vacías: el error las vació)'}» · verificó ${verificados.join() || 'nada'}` });
  await ctx.close();
}

await navegador.close();
console.table(tabla);
if (fallas.length) {
  console.error(`\n✗ ${fallas.length}:\n  ${fallas.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} filas en docs/informes/35/.`);
