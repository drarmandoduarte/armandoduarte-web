#!/usr/bin/env node
/**
 * Las capturas y las mediciones del WhatsApp con prefijo y bandera — orden Códice #32.
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/capturas-32.mjs http://127.0.0.1:4190
 *
 * En `/empezar` de una clienta nueva, a 1440×900 y 390×844: el campo
 * **cerrado**, **abierto buscando «arg»** y **con error** (un número corto).
 * En el navegador de verdad, además de lo de la #29 (un naranja como mucho, 0
 * pares bajo AA, sin scroll horizontal, sin violaciones de CSP), mide:
 *   · **un solo borde**: la caja tiene borde en los cuatro lados y el botón
 *     del país y el número no tienen borde propio salvo la hairline vertical;
 *   · las banderas se cargan del mismo origen (`/banderas/…`).
 * Sale con código 1 si algo no se cumple.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as ACENTO } from '../../web/check/acento.mjs';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', 'docs', 'informes', '32');
mkdirSync(SALIDA, { recursive: true });

const PERMITIDO = [
  ['.btn--naranja', 'el botón que hace avanzar: uno por pantalla'],
  ['.error', 'el texto de error de la casa (#15): una alerta, no un acento'],
  /* #32: el borde de error del campo WhatsApp es el mismo de cualquier campo
     inválido (`.campo__entrada[aria-invalid]`); el barrido lo ve porque esta
     caja tiene texto adentro («+52») y la de un campo común no. */
  ['.whatsapp__caja--error', 'el borde de un campo con error, como `.campo__entrada[aria-invalid]`'],
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
/** La misma clienta, la primera vez: sin apellido ni WhatsApp → `/empezar`. */
const NUEVA = { ...CLIENTA, yo: { ...CLIENTA.yo, persona: { ...CLIENTA.yo.persona, apellido: null, whatsapp: null } } };
const DUENO = {
  sesion: sesion('u-dueno', 'dueno@ejemplo.com', 'aal2', [{ id: 'f-1', factor_type: 'totp', status: 'verified', friendly_name: 'x', created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z' }]),
  yo: { rol: 'dueno', tipo: 'equipo', persona: { id: 'u-dueno', nombre: 'Armando', apellido: 'Prueba', whatsapp: '+52 999 000 0001', pais: 'MX', ciudad: 'Mérida' } },
};

/* ── Los datos de prueba ─────────────────────────────────────────────────── */
const TALLER = {
  inscripto_el: '2026-10-01T16:00:00Z', curso_titulo: 'El arte de amar a tu adolescente', curso_slug: 'el-arte-de-amar-a-tu-adolescente',
  inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Fiesta Inn Mérida', ciudad: 'Mérida',
  precio_monto: 1170, precio_moneda: 'MXN', motivo_rechazo: null, tiene_comprobante: false,
};
const id = (n) => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const mio = (n, estado, extra = {}) => ({ ...TALLER, referencia: `AD-004${n}`, inscripcion_id: id(n), estado, ...extra });
const CUATRO = [
  mio(1, 'pendiente_de_pago'),
  mio(2, 'en_revision', { curso_titulo: 'Límites con amor', tiene_comprobante: true }),
  mio(3, 'confirmada', { curso_titulo: 'Padres digitalmente responsables', tiene_comprobante: true }),
  mio(4, 'anulada', { curso_titulo: 'Taller de prueba anulado' }),
];
const COBRO = { banco: 'Banco de prueba', titular: 'Titular de prueba', clabe: '000000000000000000', concepto_sugerido: null };

const EDICION = {
  id: id(9), inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Fiesta Inn Mérida', ciudad: 'Mérida',
  pais: 'MX', cupo: 60, precio_monto: 1170, precio_moneda: 'MXN', inscripciones_hasta: '2026-11-05T14:30:00Z', estado: 'abierta', inscriptos: 4,
};
const CURSOS = [{ id: id(8), slug: 'el-arte-de-amar-a-tu-adolescente', titulo: 'El arte de amar a tu adolescente', bajada: null, descripcion: null, modalidad: 'presencial', estado: 'publicado', ediciones: [EDICION] }];
const libro = {
  ultimo_tipo: null, ultimo_el: null, ultimo_por: null, ultima_nota: null, monto_declarado: null, moneda_declarada: null,
  fecha_transferencia: null, banco: null, ultimos4_o_folio: null, comprobante_path: null, monto_confirmado: null, moneda_confirmada: null,
};
const inscripto = (n, nombre, estado, extra = {}) => ({
  inscripcion_id: id(n), referencia: `AD-005${n}`, nombre, apellido: 'Prueba', email: `cliente${n}@ejemplo.com`,
  whatsapp: `+52 999 000 00${n}0`, pais: 'MX', inscripto_el: '2026-10-01T16:00:00Z', estado, ...libro, ...extra,
});
const INSCRIPTOS = [
  inscripto(1, 'Ana', 'en_revision', {
    ultimo_tipo: 'declarado', ultimo_el: '2026-10-02T15:10:00Z', ultimo_por: 'Ana', monto_declarado: '1170.00', moneda_declarada: 'MXN',
    fecha_transferencia: '2026-10-02', banco: 'Banco de prueba', ultimos4_o_folio: '0000', comprobante_path: `${id(1)}/x.pdf`,
  }),
  inscripto(2, 'Bea', 'en_revision', {
    ultimo_tipo: 'declarado', ultimo_el: '2026-10-02T17:40:00Z', ultimo_por: 'Bea', monto_declarado: '1000.00', moneda_declarada: 'MXN',
    fecha_transferencia: '2026-10-02', banco: 'Banco de prueba', comprobante_path: `${id(2)}/x.png`,
  }),
  inscripto(3, 'Cata', 'confirmada', {
    ultimo_tipo: 'confirmado', ultimo_el: '2026-10-02T18:00:00Z', ultimo_por: 'Gabriela', monto_declarado: '1170.00', monto_confirmado: '1170.00', moneda_confirmada: 'MXN', comprobante_path: `${id(3)}/x.pdf`,
  }),
  inscripto(4, 'Dora', 'pendiente_de_pago', {
    ultimo_tipo: 'rechazado', ultimo_el: '2026-10-03T16:00:00Z', ultimo_por: 'Diana', ultima_nota: 'El monto no coincide', comprobante_path: `${id(4)}/x.pdf`,
  }),
];

const ABIERTO = {
  edicion_id: id(7), curso_slug: 'el-arte-de-amar-a-tu-adolescente', curso_titulo: 'El arte de amar a tu adolescente', curso_bajada: null,
  modalidad: 'presencial', inicio: '2026-11-05T14:30:00Z', fin: '2026-11-05T19:00:00Z', zona: 'America/Merida', sede: 'Fiesta Inn Mérida',
  ciudad: 'Mérida', pais: 'MX', precio_monto: 1170, precio_moneda: 'MXN', lugares: 12, mi_referencia: null,
};
const OTRO = { ...ABIERTO, edicion_id: id(6), curso_slug: 'limites-con-amor', curso_titulo: 'Límites con amor', inicio: '2026-12-03T15:00:00Z', fin: '2026-12-03T19:00:00Z', lugares: null };
const DOS_MIOS = { abiertos: [ABIERTO, OTRO], mios: [mio(1, 'pendiente_de_pago'), mio(2, 'en_revision', { curso_titulo: 'Límites con amor', inicio: '2026-12-03T15:00:00Z', fin: '2026-12-03T19:00:00Z', tiene_comprobante: true })], cobro: COBRO };
const SIN_MIOS = { abiertos: [ABIERTO, OTRO], mios: [], cobro: COBRO };

const abrir = async (p) => {
  await p.locator('#empezar-whatsapp-pais').click();
  await p.getByRole('combobox', { name: 'Busca tu país' }).fill('arg');
  await p.waitForTimeout(150);
};
const conError = async (p) => {
  await p.locator('#empezar-whatsapp').fill('999 123');
  await p.getByRole('button', { name: 'Guardar y entrar' }).click();
  await p.locator('#empezar-whatsapp-error').waitFor();
};

const PANTALLAS = [
  { nombre: '01-cerrado', quien: NUEVA, ruta: '/empezar', espera: '#empezar-whatsapp' },
  { nombre: '02-abierto-buscando-arg', quien: NUEVA, ruta: '/empezar', espera: '#empezar-whatsapp', llegar: abrir },
  { nombre: '03-con-error', quien: NUEVA, ruta: '/empezar', espera: '#empezar-whatsapp', llegar: conError },
];

const navegador = await chromium.launch();
const fallas = [];
const tabla = [];

for (const pantalla of PANTALLAS) {
  for (const [ancho, alto] of pantalla.anchos ?? ANCHOS) {
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
      if (ruta.startsWith('/api/equipo/inscriptos/')) return json(route, { inscriptos: INSCRIPTOS });
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
    /* Un solo borde: la caja lo tiene en los cuatro lados; adentro, solo la
       hairline vertical del botón del país. */
    const borde = await p.evaluate(() => {
      const ancho = (el, lado) => parseFloat(getComputedStyle(el)[`border${lado}Width`]);
      const caja = document.querySelector('[data-whatsapp]');
      const boton = caja.querySelector('button');
      const numero = caja.querySelector('input');
      return {
        caja: ['Top', 'Right', 'Bottom', 'Left'].every((l) => ancho(caja, l) === 1),
        adentro: ['Top', 'Bottom', 'Left'].every((l) => ancho(boton, l) === 0) && ancho(boton, 'Right') === 1
          && ['Top', 'Right', 'Bottom', 'Left'].every((l) => ancho(numero, l) === 0),
        banderas: [...document.querySelectorAll('img[src*="banderas"]')].every((i) => new URL(i.src).origin === location.origin && i.complete),
      };
    });
    if (!borde.caja || !borde.adentro) fallas.push(`${archivo}: el campo no se ve como uno solo (caja ${borde.caja}, adentro ${borde.adentro})`);
    if (!borde.banderas) fallas.push(`${archivo}: una bandera no viene del mismo origen o no cargó`);
    tabla.push({ archivo, unBorde: borde.caja && borde.adentro, mirados: acento.mirados, naranjaFuera: acento.hallazgos.length, botonesNaranja: naranjas, pares: pares.length, bajoAA: bajoAA.length, scrollHorizontal, csp: csp.length });
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

await navegador.close();
console.table(tabla);
if (fallas.length) {
  console.error(`\n✗ ${fallas.length}:\n  ${fallas.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} capturas en docs/informes/32/: un solo borde, banderas del mismo origen, un naranja como mucho, 0 pares bajo AA, sin scroll horizontal, sin violaciones de CSP.`);
