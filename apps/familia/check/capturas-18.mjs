#!/usr/bin/env node
/**
 * Las capturas y las mediciones de la orden Códice #18, sobre el build de Mi espacio.
 *
 *     pnpm --filter @codice/familia build        (con VITE_SUPABASE_URL y una clave cualquiera)
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/capturas-18.mjs http://127.0.0.1:4190
 *
 * ── Cómo se llega a las pantallas de adentro sin tocar una cuenta ────────
 * Enrolar, el reto, los códigos y Mi espacio necesitan una sesión y un rol.
 * Acá **no hay red**: cada pedido a Supabase (`/auth/v1/…`) y a la API (`/api/…`)
 * lo contesta este script con `page.route`, y la sesión se siembra en
 * `localStorage` antes de que cargue la app, con la misma clave que usa
 * `supabase-js`. La app no sabe que está en un banco: corre su código entero,
 * con la CSP de `vercel.json` puesta por `servidor.mjs`.
 *
 * Lo que eso NO prueba, dicho: que Supabase y la API contesten así de verdad.
 * Eso es F.4, contra el preview. Esto mide **cómo se ven** las cinco pantallas.
 *
 * ── Qué mide además de capturar ─────────────────────────────────────────
 * Con los mismos barridos de la web —importados, no copiados—:
 *   · `acento`: el naranja solo en el botón que hace avanzar (D26);
 *   · `contraste`: cero pares de texto bajo AA;
 *   · `renglones`: ningún título partido con un renglón de una palabra o de
 *     menos de seis caracteres, sin excepciones (Mi espacio no hereda las de
 *     la web).
 * Y sale con código 1 si cualquiera de los tres encuentra algo.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as ACENTO } from '../../web/check/acento.mjs';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';
import { RECOLECTAR as RENGLONES, MINIMO_CARACTERES } from '../../web/check/renglones.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '18');
mkdirSync(SALIDA, { recursive: true });

/** Los cinco anchos de la orden (E), con un alto de pantalla real para cada uno. */
const ANCHOS = [[1440, 900], [1100, 800], [900, 900], [390, 844], [375, 812]];

/**
 * Lo que puede ser naranja en Mi espacio: **el botón, y nada más** (B.2, D26).
 * No se hereda la lista de la web: allá también la firma y los rótulos de
 * sección pueden serlo, y acá la orden lo cerró al botón.
 */
const PERMITIDO = [['.btn--naranja', 'el botón que hace avanzar: uno por pantalla']];

/** Cuántos elementos tiene que mirar el barrido para creer que la pantalla cargó. */
const PISO_DE_ELEMENTOS = 25;

/* ── La sesión simulada ──────────────────────────────────────────────── */
const REF = 'jrscpjdscgycetyvenco';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (aal) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
  sub: 'u-prueba', aal, amr: [{ method: 'otp', timestamp: 1 }], exp: 4102444800, role: 'authenticated',
})}.c2lnbmF0dXJh`;
const usuario = (conFactor) => ({
  id: 'u-prueba', aud: 'authenticated', role: 'authenticated', email: 'ana@ejemplo.com',
  app_metadata: {}, user_metadata: {}, created_at: '2026-09-30T00:00:00Z',
  factors: conFactor ? [{ id: 'f-1', factor_type: 'totp', status: 'verified', friendly_name: 'x', created_at: '2026-09-30T00:00:00Z', updated_at: '2026-09-30T00:00:00Z' }] : [],
});
const sesion = (aal, conFactor) => ({
  access_token: jwt(aal), refresh_token: 'r', token_type: 'bearer',
  expires_in: 3600, expires_at: 4102444800, user: usuario(conFactor),
});

/** Un QR de mentira: la captura muestra dónde va, no uno que se pueda escanear. */
const QR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" width="200" height="200">'
  + '<rect width="29" height="29" fill="white"/>'
  + [...Array(29 * 29).keys()].filter((i) => ((i * 7919) % 13) < 6)
    .map((i) => `<rect x="${i % 29}" y="${Math.floor(i / 29)}" width="1" height="1" fill="black"/>`).join('')
  + '</svg>';

const YO_CLIENTE = { rol: 'cliente', tipo: 'cliente', persona: { id: 'p-1', nombre: 'Ana', apellido: 'López', whatsapp: null, pais: 'México' } };
const YO_DUENO = { rol: 'dueno', tipo: 'equipo', persona: { id: 'p-2', nombre: 'Ana', apellido: 'López', whatsapp: '+52 999 123 4567', pais: 'México' } };
const CODIGOS = ['K7Q2-M9XA', 'P3VD-8HNE', 'T6WR-2LJC', 'B9FX-4KQM', 'H2NS-7EVA', 'R5CJ-3TPW', 'X8LM-6DQE', 'V4HA-9SNB', 'E7PK-2WRC', 'M3TD-5XJF'];

/**
 * Cada pantalla: qué sesión se siembra, qué contesta la API y qué se toca para
 * llegar. `yo` es la respuesta de `GET /api/yo`: un objeto, o `'AAL2'` para el
 * 403 que dice «falta el segundo paso».
 */
const PANTALLAS = [
  { nombre: '01-entrar-correo', ruta: '/entrar' },
  {
    nombre: '02-entrar-codigo', ruta: '/entrar',
    llegar: async (p) => {
      await p.fill('#correo', 'ana@ejemplo.com');
      await p.getByRole('button', { name: /enviarme el código/i }).click();
      await p.locator('#codigo').waitFor();
      await p.locator('#codigo').fill('4821');
    },
  },
  { nombre: '03-enrolar', ruta: '/mi-espacio', sesion: sesion('aal1', false), yo: 'AAL2', espera: '.qr' },
  { nombre: '04-reto', ruta: '/mi-espacio', sesion: sesion('aal1', true), yo: 'AAL2', espera: '#totp' },
  {
    nombre: '05-codigos', ruta: '/mi-espacio', sesion: sesion('aal2', true), yo: YO_DUENO, ventana: true,
    llegar: async (p) => {
      await p.getByRole('button', { name: /generar códigos nuevos/i }).click();
      await p.locator('.codigos').waitFor();
    },
  },
  { nombre: '06-mi-espacio', ruta: '/mi-espacio', sesion: sesion('aal1', false), yo: YO_CLIENTE, espera: '#nombre' },
];

async function prepararContexto(navegador, pantalla, [ancho, alto]) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(({ clave, valor, ventana }) => {
    if (valor) window.localStorage.setItem(clave, valor);
    if (ventana) {
      window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
      window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
    }
  }, { clave: `sb-${REF}-auth-token`, valor: pantalla.sesion ? JSON.stringify(pantalla.sesion) : null, ventana: !!pantalla.ventana });

  const json = (route, cuerpo, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });
  await ctx.route(`https://${REF}.supabase.co/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/otp')) return json(route, {});
    if (url.includes('/auth/v1/user')) return json(route, pantalla.sesion?.user ?? {});
    if (url.endsWith('/auth/v1/factors') || url.includes('/auth/v1/factors?')) {
      return json(route, { id: 'f-nuevo', type: 'totp', friendly_name: 'x', totp: { qr_code: QR, secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', uri: 'otpauth://totp/x' } });
    }
    return json(route, {});
  });
  await ctx.route('**/api/**', (route) => {
    const ruta = new URL(route.request().url()).pathname;
    if (ruta === '/api/yo') {
      return pantalla.yo === 'AAL2'
        ? json(route, { code: 'AAL2_REQUIRED', message: 'x' }, 403)
        : json(route, pantalla.yo ?? {});
    }
    if (ruta === '/api/respaldo/cuantos') return json(route, { quedan: 10, de: 10 });
    if (ruta === '/api/respaldo/generar') return json(route, { codigos: CODIGOS });
    return json(route, {});
  });
  return ctx;
}

const navegador = await chromium.launch();
const fallas = [];
const tabla = [];

for (const pantalla of PANTALLAS) {
  for (const medida of ANCHOS) {
    const [ancho] = medida;
    const ctx = await prepararContexto(navegador, pantalla, medida);
    const p = await ctx.newPage();
    const csp = [];
    p.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) csp.push(m.text()); });
    await p.goto(`${BASE}${pantalla.ruta}`, { waitUntil: 'networkidle' });
    try {
      await p.locator('h1').first().waitFor({ timeout: 10000 });
      if (pantalla.espera) await p.locator(pantalla.espera).first().waitFor({ timeout: 10000 });
      if (pantalla.llegar) await pantalla.llegar(p);
    } catch (e) {
      const texto = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
      throw new Error(`${pantalla.nombre} a ${medida[0]}: no llegó (${e.message.split('\n')[0]}). En pantalla: «${texto}»`);
    }
    await p.evaluate(() => document.fonts.ready);
    /* El mouse, fuera: si queda sobre un enlace después de un clic, la captura
       sale con un hover que nadie ve al entrar. */
    await p.mouse.move(0, 0);
    await p.waitForTimeout(200);

    const archivo = `${pantalla.nombre}-${ancho}.jpg`;
    await p.screenshot({ path: join(SALIDA, archivo), type: 'jpeg', quality: 86, fullPage: true });

    /* A · el botón principal a la vista sin desplazar, a 375 (solo /entrar). */
    const botonALaVista = pantalla.nombre === '01-entrar-correo'
      ? await p.evaluate(() => {
        const b = document.querySelector('.btn--naranja')?.getBoundingClientRect();
        return !!b && b.bottom <= window.innerHeight;
      })
      : null;
    const scrollHorizontal = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

    const acento = await p.evaluate(ACENTO, { permitido: PERMITIDO });
    const pares = await p.evaluate(CONTRASTE);
    /* Los botones **deshabilitados** se apartan, y solo ésos: WCAG 1.4.3 exime
       el texto de «un componente de interfaz inactivo». Hoy son dos —«Guardar»
       en Mi espacio, apagado hasta que exista `PATCH /api/yo`, y «Ya los
       guardé», apagado hasta que la persona guarde los códigos— y los dos van
       al 45 % a propósito, para que se lean como no disponibles. Se cuentan y
       salen en la tabla: apartados, no escondidos. */
    const apagados = await p.evaluate(() => [...document.querySelectorAll('button:disabled')].map((b) => b.textContent.trim()));
    const esApagado = (x) => x.donde.startsWith('button') && apagados.includes(x.texto);
    const bajoAA = pares.filter((x) => x.ratio < x.umbral && !esApagado(x));
    const inactivos = pares.filter((x) => x.ratio < x.umbral && esApagado(x)).length;

    const renglones = await p.evaluate(RENGLONES, { excepciones: [], minimoCaracteres: MINIMO_CARACTERES });
    const viudas = renglones.hallazgos.map((h) => `${h.titulo} «${h.texto}» (${h.porque})`);

    tabla.push({ archivo, mirados: acento.mirados, naranja: acento.hallazgos.length, pares: pares.length, bajoAA: bajoAA.length, inactivos, renglones: renglones.hallazgos.length, botonALaVista, scrollHorizontal, csp: csp.length });
    /* EL PISO, antes del cero: medido el 30/9, estas pantallas tienen entre 36
       y 50 elementos. Menos de 25 es que la pantalla no cargó. */
    if (acento.mirados < PISO_DE_ELEMENTOS) fallas.push(`${archivo}: el barrido del acento miró ${acento.mirados} elementos y el piso es ${PISO_DE_ELEMENTOS}; la pantalla no cargó`);
    for (const h of acento.hallazgos) fallas.push(`${archivo}: naranja fuera del botón · ${h.donde} ${h.prop} «${h.texto}»`);
    for (const x of bajoAA) fallas.push(`${archivo}: ${x.fg} sobre ${x.bg} ${x.ratio} < ${x.umbral} · ${x.donde} «${x.texto}»`);
    for (const v of viudas) fallas.push(`${archivo}: título mal partido · ${v}`);
    if (scrollHorizontal) fallas.push(`${archivo}: hay scroll horizontal`);
    if (botonALaVista === false && ancho === 375) fallas.push(`${archivo}: el botón principal no se ve sin desplazar`);
    for (const c of csp) fallas.push(`${archivo}: CSP · ${c.slice(0, 120)}`);
    await ctx.close();
  }
}
/* ── E · lado a lado con la entrada de Bitácora Clínica, a 1440 ──────────
   Lo mismo que comparó dirección: las dos pantallas de entrada, en español y
   al mismo ancho. Bitácora se captura en vivo (es pública); se cierra su aviso
   de cookies con «solo necesarias» en un navegador que se tira al terminar,
   para que la comparación sea de pantalla contra pantalla. */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'es-MX' });
  const p = await ctx.newPage();
  await p.goto('https://bitacora.ai/login', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /solo necesarias|only necessary/i }).click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  const bitacora = (await p.screenshot({ type: 'png' })).toString('base64');
  const nuestra = readFileSync(join(SALIDA, '01-entrar-correo-1440.jpg')).toString('base64');
  await p.setViewportSize({ width: 2920, height: 960 });
  await p.setContent(`<body style="margin:0;background:gray;display:flex;gap:40px;padding:0;font:600 14px system-ui;color:white">
    <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">Bitácora Clínica · bitacora.ai/login</figcaption><img width="1440" height="900" src="data:image/png;base64,${bitacora}"></figure>
    <figure style="margin:0"><figcaption style="height:60px;line-height:60px;padding-left:12px">Mi espacio · /entrar (esta rama)</figcaption><img width="1440" height="900" src="data:image/jpeg;base64,${nuestra}"></figure>
  </body>`);
  await p.screenshot({ path: join(SALIDA, 'lado-a-lado-bitacora-1440.jpg'), type: 'jpeg', quality: 82 });
  await ctx.close();
}

await navegador.close();

console.table(tabla);
if (fallas.length) {
  console.error(`\n✗ ${fallas.length}:\n  ${fallas.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} capturas en docs/informes/18/: naranja solo en el botón, 0 pares bajo AA, sin renglones de una palabra, sin scroll horizontal, sin violaciones de CSP.`);
