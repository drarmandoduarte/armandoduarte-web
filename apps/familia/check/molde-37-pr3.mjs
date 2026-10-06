#!/usr/bin/env node
/**
 * Mi espacio dentro del molde, en un navegador — orden #37, PR 3 (fase-2 §10).
 *
 *     VITE_SUPABASE_URL=https://jrscpjdscgycetyvenco.supabase.co VITE_SUPABASE_ANON_KEY=de-mentira \
 *       pnpm --filter @codice/familia build
 *     node apps/familia/e2e/servidor.mjs apps/familia/dist 4190 &
 *     node apps/familia/check/molde-37-pr3.mjs http://127.0.0.1:4190 [~/Development/Apps/moldes-apps]
 *
 * La app compilada, servida con las cabeceras de su `vercel.json` (la CSP de
 * producción, `style-src 'self'`), con Supabase y la API simulados: nada real,
 * ni una clave ni una sesión. Dos roles —una clienta (Laura) y el dueño
 * (Armando)— y, para cada pantalla del molde (entrada, verificación, Inicio,
 * cada sección de Ajustes, Centro de alertas, Papelera, Equipo y Bienvenida) y
 * las del negocio que cuelgan del shell, a 390 y a 1440, en claro y en oscuro:
 *   · cero violaciones de la CSP y cero `<style>` en el documento;
 *   · ningún par de texto bajo AA (el barrido de contraste de la web), fuera de
 *     las piezas del molde (ésas van como propuesta, fase-2 §12);
 *   · sin scroll horizontal.
 * La entrada y la verificación, además, en inglés y portugués. Y cada captura
 * **al lado de la del molde** (`docs/capturas/` de `moldes-apps`) en
 * `docs/informes/37-pr3/comparadas/`. Sale con código 1 si algo no se cumple.
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECOLECTAR as CONTRASTE } from '../../web/check/contraste.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const MOLDE = (process.argv[3] || join(homedir(), 'Development/Apps/moldes-apps')).replace(/^~/, homedir());
const SALIDA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'informes', '37-pr3');
const COMPARADAS = join(SALIDA, 'comparadas');
mkdirSync(COMPARADAS, { recursive: true });

/* ── Las sesiones y los datos simulados ─────────────────────────────────── */
const REF = 'jrscpjdscgycetyvenco';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const ahora = Math.floor(Date.now() / 1000);
const dias = (n, hora = 15) => { const d = new Date(Date.now() + n * 86_400_000); d.setUTCHours(hora, 0, 0, 0); return d.toISOString(); };
const FACTOR = [{ id: 'f-1', factor_type: 'totp', status: 'verified', friendly_name: 'Armando Duarte', created_at: '2026-09-29T10:00:00Z', updated_at: '2026-09-29T10:00:00Z' }];
const sesion = (id, email, aal, factores) => ({
  access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: id, aal, amr: [{ method: aal === 'aal2' ? 'totp' : 'otp', timestamp: ahora }], exp: 4102444800, role: 'authenticated' })}.c2lnbmF0dXJh`,
  refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
  user: { id, aud: 'authenticated', role: 'authenticated', email, app_metadata: { providers: ['email'] }, user_metadata: {}, created_at: '2026-09-29T00:00:00Z', factors: factores },
});

const LAURA = { id: 'u-laura', nombre: 'Laura', apellido: 'Méndez', whatsapp: '+529991234567', pais: 'MX', ciudad: 'Mérida', zona_horaria: 'America/Merida', anio_nacimiento: 1984, nivel_educativo: 'licenciatura', avisos_por_correo: true, inicio: null };
const ARMANDO = { id: 'u-armando', nombre: 'Armando', apellido: 'Duarte', whatsapp: '+529990000000', pais: 'MX', ciudad: 'Mérida', zona_horaria: 'America/Merida', anio_nacimiento: null, nivel_educativo: null, avisos_por_correo: true, inicio: null };
const taller = (o) => ({ curso_bajada: null, modalidad: 'presencial', zona: 'America/Merida', sede: 'Fiesta Inn', ciudad: 'Mérida', pais: 'MX', precio_monto: 1170, precio_moneda: 'MXN', lugares: 24, ...o });
const ABIERTOS = [
  taller({ edicion_id: 'e-1', curso_slug: 'el-arte-de-amar', curso_titulo: 'El arte de amar a tu hijo adolescente', inicio: dias(3), fin: dias(3, 19), mi_referencia: 'AD-0007' }),
  taller({ edicion_id: 'e-2', curso_slug: 'matrimonios', curso_titulo: 'Matrimonios que se eligen', inicio: dias(20), fin: dias(20, 19), mi_referencia: 'AD-0009' }),
  taller({ edicion_id: 'e-3', curso_slug: 'padres-que-acompanan', curso_titulo: 'Padres que acompañan', inicio: dias(40), fin: dias(40, 19), ciudad: 'Ciudad de México', zona: 'America/Mexico_City', lugares: 12, mi_referencia: null }),
];
const MIOS = [
  { referencia: 'AD-0007', inscripto_el: dias(-10), curso_titulo: 'El arte de amar a tu hijo adolescente', curso_slug: 'el-arte-de-amar', inicio: dias(3), fin: dias(3, 19), zona: 'America/Merida', sede: 'Fiesta Inn', ciudad: 'Mérida', estado: 'confirmada', inscripcion_id: 'i-7', precio_monto: 1170, precio_moneda: 'MXN', motivo_rechazo: null, tiene_comprobante: true },
  { referencia: 'AD-0009', inscripto_el: dias(-2), curso_titulo: 'Matrimonios que se eligen', curso_slug: 'matrimonios', inicio: dias(20), fin: dias(20, 19), zona: 'America/Merida', sede: 'Fiesta Inn', ciudad: 'Mérida', estado: 'pendiente_de_pago', inscripcion_id: 'i-9', precio_monto: 1170, precio_moneda: 'MXN', motivo_rechazo: 'El monto no coincide con el precio del taller.', tiene_comprobante: true },
];
const CURSOS = [
  { id: 'c-1', slug: 'el-arte-de-amar', titulo: 'El arte de amar a tu hijo adolescente', bajada: null, descripcion: null, modalidad: 'presencial', estado: 'publicado', ediciones: [
    { id: 'ed-hoy', inicio: dias(0, 23), fin: dias(1, 3), zona: 'America/Merida', sede: 'Fiesta Inn', ciudad: 'Mérida', pais: 'MX', cupo: 60, precio_monto: 1170, precio_moneda: 'MXN', inscripciones_hasta: dias(-1), estado: 'abierta', inscriptos: 41 },
    { id: 'ed-5', inicio: dias(5), fin: dias(5, 19), zona: 'America/Mexico_City', sede: 'Hotel Galería', ciudad: 'Ciudad de México', pais: 'MX', cupo: 50, precio_monto: 1170, precio_moneda: 'MXN', inscripciones_hasta: dias(3), estado: 'abierta', inscriptos: 18 },
  ] },
];
const inscripto = (o) => ({ inscripcion_id: o.id, referencia: o.ref, nombre: o.nombre, apellido: 'Prueba', email: `${o.nombre.toLowerCase()}@ejemplo.mx`, whatsapp: '+529991112233', pais: 'MX', inscripto_el: dias(-3), estado: o.estado, ultimo_tipo: null, ultimo_el: null, ultimo_por: null, ultima_nota: null, monto_declarado: null, monto_confirmado: null, tiene_comprobante: o.estado === 'en_revision' });
const INSCRIPTOS = [inscripto({ id: 'i-1', ref: 'AD-0011', nombre: 'Rosa', estado: 'en_revision' }), inscripto({ id: 'i-2', ref: 'AD-0012', nombre: 'Clara', estado: 'en_revision' }), inscripto({ id: 'i-3', ref: 'AD-0013', nombre: 'Nora', estado: 'confirmada' })];
const PAPELERA = [
  { tipo: 'curso', id: 'c-viejo', nombre: 'Taller de prueba de 2025', borrado_el: dias(-3), persona: 'Gabriela Ruiz' },
  { tipo: 'edicion', id: 'ed-vieja', nombre: 'Matrimonios que se eligen · 12/09/2026', borrado_el: dias(-28), persona: 'Armando Duarte' },
];
const MIEMBROS = [
  { id: 'u-armando', nombre: 'Armando', apellido: 'Duarte', email: 'armando@armandoduarte.com', rol: 'dueno', territorio: 'todos', activo: true },
  { id: 'u-gabi', nombre: 'Gabriela', apellido: 'Ruiz', email: 'gabi@armandoduarte.com', rol: 'equipo', territorio: 'mexico', activo: true },
  { id: 'u-diana', nombre: 'Diana', apellido: 'Duarte', email: 'diana@armandoduarte.com', rol: 'equipo', territorio: 'internacional', activo: true },
  { id: 'u-pedro', nombre: 'Pedro', apellido: 'Lima', email: 'pedro@ejemplo.mx', rol: 'equipo', territorio: 'mexico', activo: false },
];

const ROLES = {
  cliente: { sesion: sesion('u-laura', 'laura@ejemplo.mx', 'aal1', []), yo: { rol: 'cliente', tipo: 'cliente', territorio: null, persona: LAURA, reseteoPendiente: null }, mios: MIOS },
  dueno: {
    sesion: sesion('u-armando', 'armando@armandoduarte.com', 'aal2', FACTOR), verificado: true,
    yo: { rol: 'dueno', tipo: 'equipo', territorio: 'todos', persona: ARMANDO, reseteoPendiente: { vence: dias(2, 2), confirmado: true } }, mios: [],
  },
};
const SIN_SESION = { sesion: null, yo: null, mios: [] };
const RETO = { sesion: sesion('u-armando', 'armando@armandoduarte.com', 'aal1', FACTOR), yo: null, reto: true, mios: [] };
const nuevo = (rol) => ({ ...ROLES[rol], yo: { ...ROLES[rol].yo, persona: { ...ROLES[rol].yo.persona, apellido: null, whatsapp: null } } });

/* ── Qué se captura, y la del molde que va al lado ─────────────────────── */
const P9 = 'docs/capturas/pr-9';
const P3 = 'docs/capturas/pr-3';
const molde = (ancho, tema, por) => por[`${ancho}-${tema}`] ?? por[`${ancho}`] ?? por.cualquiera;
const SECCIONES = ['perfil', 'cuenta', 'apariencia', 'idioma', 'notificaciones', 'privacidad', 'taller', 'acerca'];
const MOLDE_DE_SECCION = {
  perfil: { cualquiera: `${P3}/ajustes-perfil-inmobiliaria-oscuro-es-390.png` },
  cuenta: { 390: `${P3}/ajustes-cuenta-consultorio-claro-es-390.png`, cualquiera: `${P3}/ajustes-cuenta-consultorio-claro-es-1440.png` },
  apariencia: { cualquiera: `${P3}/ajustes-apariencia-consultorio-claro-en-1440.png` },
  idioma: { cualquiera: `${P9}/app-prueba/ajustes-1440.png` },
  notificaciones: { cualquiera: `${P9}/ajustes-notificaciones-consultorio-claro-es-1440.png` },
  privacidad: { cualquiera: `${P3}/ajustes-privacidad-consultorio-claro-es-1440.png` },
  taller: { cualquiera: `${P9}/app-prueba/ajustes-1440.png` },
  acerca: { cualquiera: `${P3}/ajustes-acerca-consultorio-claro-es-1440.png` },
};
const ENTRADA = { '390-oscuro': `${P9}/app-prueba/acceso-entrada-y-verificacion-oscuro-390.png`, cualquiera: `${P9}/app-prueba/acceso-entrada-y-verificacion-1440.png` };
const PANTALLAS = [
  { nombre: 'entrada', quien: SIN_SESION, ruta: '/login', espera: '#correo', idiomas: true, molde: ENTRADA },
  { nombre: 'verificacion', quien: RETO, ruta: '/auth/2fa', espera: '[data-casilla]', idiomas: true, molde: ENTRADA },
  ...['cliente', 'dueno'].flatMap((rol) => [
    { nombre: `inicio-${rol}`, quien: ROLES[rol], ruta: '/mi-espacio', espera: '[data-widget]', pantalla390: true,
      molde: { '1440-oscuro': `${P9}/inicio-inmobiliaria-oscuro-es-1440.png`, 390: `${P9}/inicio-consultorio-claro-es-390-pantalla.png`, cualquiera: `${P9}/inicio-consultorio-claro-es-1440.png` } },
    { nombre: `alertas-${rol}`, quien: ROLES[rol], ruta: '/alertas', espera: '[data-columna]', pantalla390: true,
      molde: { 390: `${P9}/alertas-inmobiliaria-oscuro-es-390-pantalla.png`, cualquiera: `${P9}/alertas-consultorio-claro-es-1440.png` } },
    { nombre: `papelera-${rol}`, quien: ROLES[rol], ruta: '/papelera', espera: 'main h1', molde: { cualquiera: `${P9}/papelera-consultorio-claro-es-1440.png` } },
    { nombre: `ajustes-lista-${rol}`, quien: ROLES[rol], ruta: '/ajustes', espera: '[data-vista]', solo390: true, pantalla390: true,
      molde: { cualquiera: `${P9}/ajustes-lista-inmobiliaria-oscuro-es-390-pantalla.png` } },
    ...SECCIONES.map((s) => ({ nombre: `ajustes-${s}-${rol}`, quien: ROLES[rol], ruta: `/ajustes?s=${s}`, espera: 'main h2', molde: MOLDE_DE_SECCION[s] })),
    { nombre: `bienvenida-${rol}`, quien: nuevo(rol), ruta: '/bienvenida', espera: '[data-paso]',
      molde: { 390: `${P9}/bienvenida-inmobiliaria-oscuro-es-390.png`, cualquiera: `${P9}/bienvenida-consultorio-claro-es-1440.png` } },
    { nombre: `talleres-${rol}`, quien: ROLES[rol], ruta: '/talleres', espera: 'main h1', molde: null },
    { nombre: `mis-talleres-${rol}`, quien: ROLES[rol], ruta: '/mis-talleres', espera: 'main h1', molde: null },
  ]),
  { nombre: 'equipo-dueno', quien: ROLES.dueno, ruta: '/equipo/personas', espera: '[data-persona]', pantalla390: true,
    molde: { 390: `${P9}/equipo-consultorio-oscuro-es-390-pantalla.png`, cualquiera: `${P9}/equipo-rescate-solo-inmobiliaria-claro-es-1440.png` } },
  { nombre: 'panel-dueno', quien: ROLES.dueno, ruta: '/equipo', espera: '.pestanas', molde: null },
  /* §5: las pantallas del molde en inglés y portugués, con la clienta. */
  ...['inicio', 'ajustes-cuenta', 'ajustes-taller'].map((n) => ({
    nombre: `${n}-cliente`, quien: ROLES.cliente, ruta: n === 'inicio' ? '/mi-espacio' : `/ajustes?s=${n.split('-')[1]}`, espera: n === 'inicio' ? '[data-widget]' : 'main h2',
    soloIdiomas: true, molde: n === 'inicio' ? { cualquiera: `${P9}/inicio-inmobiliaria-claro-en-1440.png` } : MOLDE_DE_SECCION[n.split('-')[1]],
  })),
];

/* ── El navegador ───────────────────────────────────────────────────────── */
const navegador = await chromium.launch();
const fallas = [];
const alMolde = new Set();
const esDelSelectorDelMolde = (x) => x.donde === 'button' && /^(es|en|pt)$/.test(x.texto);
const esDecoracion = (x) => x.texto === '·';
const tabla = [];

async function contexto({ quien, ancho, alto, idioma, tema }) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: 'reduce', colorScheme: tema === 'oscuro' ? 'dark' : 'light' });
  await ctx.addInitScript(({ clave, valor, idioma, verificado, tema }) => {
    if (valor) window.localStorage.setItem(clave, valor);
    window.localStorage.setItem('codice.idioma', idioma);
    window.localStorage.setItem('codice.tema', tema);
    if (verificado) window.localStorage.setItem('armando-duarte.aal2_verified_at', new Date().toISOString());
    window.localStorage.setItem('armando-duarte.last_activity_at', String(Date.now()));
    window.__violaciones = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__violaciones.push(`${e.violatedDirective} · ${e.blockedURI}`));
  }, { clave: `sb-${REF}-auth-token`, valor: quien.sesion ? JSON.stringify(quien.sesion) : null, idioma, verificado: !!quien.verificado, tema });
  const json = (route, cuerpo, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.route(`https://${REF}.supabase.co/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/user')) return json(route, quien.sesion?.user ?? {});
    return json(route, {});
  });
  await ctx.route('**/api/**', (route) => {
    const ruta = new URL(route.request().url()).pathname;
    if (ruta === '/api/yo') {
      if (quien.reto) return json(route, { code: 'AAL2_REQUIRED' }, 403);
      return quien.yo ? json(route, { ...quien.yo, persona: { ...quien.yo.persona, idioma } }) : json(route, {}, 401);
    }
    if (ruta === '/api/talleres') return json(route, { abiertos: ABIERTOS.map((a) => (quien.mios.length ? a : { ...a, mi_referencia: null })), mios: quien.mios, cobro: null });
    if (ruta === '/api/equipo/cursos') return json(route, { cursos: CURSOS });
    if (ruta.startsWith('/api/equipo/inscriptos/')) return json(route, { inscriptos: INSCRIPTOS });
    if (ruta === '/api/equipo/clientes') return json(route, { clientes: [] });
    if (ruta === '/api/equipo/miembros') return json(route, { miembros: MIEMBROS });
    if (ruta === '/api/papelera') return json(route, { items: PAPELERA });
    if (ruta === '/api/respaldo/cuantos') return json(route, { quedan: 8 });
    if (ruta === '/api/rescate/aplicar') return json(route, { aplicado: false });
    return json(route, { ok: true });
  });
  return ctx;
}

async function capturar(pantalla, ancho, tema, idioma) {
  const alto = ancho === 390 ? 844 : 900;
  const ctx = await contexto({ quien: pantalla.quien, ancho, alto, idioma, tema });
  const p = await ctx.newPage();
  const consola = [];
  p.on('console', (m) => { if (/Content Security Policy|Refused to apply/i.test(m.text())) consola.push(m.text()); });
  const archivo = `${pantalla.nombre}-${ancho}-${tema}${idioma === 'es' ? '' : `-${idioma}`}.png`;
  try {
    await p.goto(`${BASE}${pantalla.ruta}`, { waitUntil: 'networkidle' });
    await p.locator(pantalla.espera).first().waitFor({ timeout: 10000 });
  } catch (e) {
    const texto = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
    fallas.push(`${archivo}: no llegó (${e.message.split('\n')[0]}). En pantalla: «${texto}»`);
    await ctx.close();
    return null;
  }
  await p.evaluate(() => document.fonts.ready);
  await p.mouse.move(0, 0);
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(SALIDA, archivo), fullPage: true });
  if (ancho === 390 && pantalla.pantalla390) await p.screenshot({ path: join(SALIDA, archivo.replace('.png', '-pantalla.png')) });
  const pares = await p.evaluate(CONTRASTE);
  const apagados = await p.evaluate(() => [...document.querySelectorAll('button:disabled, button:disabled *')].map((b) => b.textContent.trim()));
  const bajoAA = pares.filter((x) => x.ratio < x.umbral && !apagados.includes(x.texto));
  const m = await p.evaluate(() => ({
    violaciones: window.__violaciones,
    estilos: document.querySelectorAll('style').length,
    scroll: document.documentElement.scrollWidth > window.innerWidth,
    titulo: (document.querySelector('main h1, h1')?.textContent ?? '').trim(),
    tema: document.documentElement.getAttribute('data-theme'),
  }));
  tabla.push({ archivo, titulo: m.titulo, csp: m.violaciones.length + consola.length, style: m.estilos, pares: pares.length, bajoAA: bajoAA.length });
  for (const v of [...m.violaciones, ...consola]) fallas.push(`${archivo}: CSP · ${v.slice(0, 140)}`);
  if (m.estilos) fallas.push(`${archivo}: ${m.estilos} <style> en el documento`);
  for (const x of bajoAA.filter((y) => !esDecoracion(y))) {
    if (esDelSelectorDelMolde(x)) alMolde.add(`Idioma (@moldes/ui): «${x.texto}» no activo, ${x.fg} sobre ${x.bg} = ${x.ratio}:1 (< ${x.umbral})`);
    else fallas.push(`${archivo}: ${x.fg} sobre ${x.bg} ${x.ratio} < ${x.umbral} · ${x.donde} «${x.texto.slice(0, 60)}»`);
  }
  if (m.scroll) fallas.push(`${archivo}: scroll horizontal`);
  if (tema === 'oscuro' && m.tema !== 'dark') fallas.push(`${archivo}: el tema oscuro no se aplicó`);
  if (tema === 'claro' && m.tema === 'dark') fallas.push(`${archivo}: el tema claro no se aplicó`);
  await ctx.close();
  return archivo;
}

/** Una al lado de la otra: la de Mi espacio y la del molde, a la misma altura, con su rótulo. */
async function comparar(archivo, delMolde) {
  const origen = join(MOLDE, delMolde);
  if (!existsSync(origen)) { fallas.push(`${archivo}: falta la captura del molde ${delMolde}`); return; }
  const pagina = await navegador.newPage({ viewport: { width: 1800, height: 1000 } });
  const a = `data:image/png;base64,${readFileSync(join(SALIDA, archivo)).toString('base64')}`;
  const b = `data:image/png;base64,${readFileSync(origen).toString('base64')}`;
  await pagina.setContent(`<!doctype html><body style="margin:0;background:gray;font:600 15px system-ui;color:black">
    <div style="display:flex;gap:16px;padding:16px;align-items:flex-start">
      <figure style="margin:0;flex:1"><figcaption style="padding:0 0 8px">Mi espacio · ${archivo}</figcaption><img src="${a}" style="width:100%;display:block"></figure>
      <figure style="margin:0;flex:1"><figcaption style="padding:0 0 8px">Molde 1.1.2 · ${delMolde}</figcaption><img src="${b}" style="width:100%;display:block"></figure>
    </div></body>`);
  await pagina.waitForTimeout(100);
  await pagina.screenshot({ path: join(COMPARADAS, archivo.replace('.png', '.jpg')), fullPage: true, type: 'jpeg', quality: 72 });
  await pagina.close();
}

for (const pantalla of PANTALLAS) {
  const anchos = pantalla.solo390 ? [390] : [1440, 390];
  for (const ancho of anchos) {
    for (const tema of pantalla.soloIdiomas ? ['claro'] : ['claro', 'oscuro']) {
      const idiomas = pantalla.soloIdiomas ? (ancho === 1440 ? ['en', 'pt'] : []) : (pantalla.idiomas && tema === 'claro' ? ['es', 'en', 'pt'] : ['es']);
      for (const idioma of idiomas) {
        const archivo = await capturar(pantalla, ancho, tema, idioma);
        if (archivo && pantalla.molde) await comparar(archivo, molde(ancho, tema, pantalla.molde));
      }
    }
  }
}
await navegador.close();

const lineas = tabla.map((f) => `${f.archivo.padEnd(48)} CSP ${f.csp} · <style> ${f.style} · ${f.pares} pares, ${f.bajoAA} bajo AA · «${f.titulo}»`);
const propuestas = [...alMolde];
writeFileSync(join(SALIDA, 'mediciones.txt'), `${lineas.join('\n')}\n\n${fallas.length ? fallas.join('\n') : 'Sin fallas.'}\n\nPropuestas al molde (fase-2 §12):\n${propuestas.join('\n') || '—'}\n`);
console.log(lineas.join('\n'));
if (propuestas.length) console.log(`\nPropuestas al molde (no se arreglan en la copia):\n${propuestas.join('\n')}`);
if (fallas.length) {
  console.error(`\n${fallas.length} falla(s):\n${fallas.join('\n')}`);
  process.exit(1);
}
console.log(`\n✓ ${tabla.length} capturas: CSP sin violaciones, sin <style>, ningún par bajo AA fuera de las piezas del molde.`);
