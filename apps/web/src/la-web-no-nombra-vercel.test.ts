/**
 * La web no nombra Vercel, y sus puertas van a la app de Armando — orden #25.
 *
 * Mira el **`dist` de esta corrida**, que es lo que se publica: las cuatro
 * páginas. Afirma dos cosas:
 *
 *   · **ningún `vercel.app`**, en ninguna parte del HTML (enlaces, JSON-LD,
 *     texto). Mientras el subdominio no exista, el preview puede apuntar a la
 *     app de Vercel con `VITE_APP_FAMILIA` en el build; sin esa variable
 *     —producción— no queda rastro;
 *   · y, como piso (va primero), que **sí** están las puertas: «Mi espacio» en
 *     la cabecera, el menú y el pie de cada página, y en `/merida` el «Reservar
 *     mi lugar» del hero, el de la sección final y el `offers.url` del Event,
 *     todos a `familia.armandoduarte.com/entrar…`.
 *
 * ── Desde la orden #33, con las dos ramas de la bandera ────────────────
 * Armando pidió (2/10) esconder Mi espacio y Spotify de la web «por ahora»:
 * `MI_ESPACIO_EN_LA_WEB` y `SPOTIFY_EN_LA_WEB` en `@codice/core`. Cada test
 * de abajo afirma **lo que corresponde a la bandera que se publicó**:
 *
 *   · prendida → lo de la #25 y la #28, tal cual estaba;
 *   · apagada  → **cero** `familia.armandoduarte.com` en el HTML, todo
 *     «Reservar» por WhatsApp (un solo botón donde había uno, «Ver el
 *     programa» secundario donde lo era) y el Event sin `offers.url`.
 *
 * Las dos ramas quedan escritas y ninguna se salta: el día que se prenda,
 * los tests ya saben qué mirar. Mutación (informe de la #33): build con una
 * bandera y test leyendo la otra → caen los de la rama que no se publicó.
 *
 * Qué NO mira: el JS publicado (no arma enlaces: la web no hidrata) ni el
 * `dist` de un build con `VITE_APP_FAMILIA` puesta, que es justamente el que
 * sí puede nombrar Vercel y no se publica en producción.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MI_ESPACIO_EN_LA_WEB, SPOTIFY_EN_LA_WEB } from '@codice/core';
import { RUTAS } from './rutas';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const APP = 'https://familia.armandoduarte.com';
const RESERVAR = `${APP}/entrar?ir=%2Fme-anoto%2Fel-arte-de-amar-a-tu-adolescente`;

const paginas = RUTAS.map(({ archivo }) => {
  const ruta = join(DIST, archivo);
  return { archivo, html: existsSync(ruta) ? readFileSync(ruta, 'utf8') : '' };
});
const pagina = (archivo: string) => paginas.find((p) => p.archivo === archivo)!.html;
const seccion = (html: string, id: string) => html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';
const entradas = (html: string) => [...html.matchAll(/href="(https:\/\/familia\.armandoduarte\.com\/entrar[^"]*)"/g)].map((m) => m[1]);
/** Los botones (`class="btn…"`) de un trozo de HTML, en orden: destino, clase y texto sin íconos. */
const botones = (html: string) => [...html.matchAll(/<a href="([^"]*)" class="(btn[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
  .map(([, href, clase, texto]) => ({
    href,
    clase,
    texto: texto.replace(/<svg[\s\S]*?<\/svg>|<!-- -->|<[^>]+>|→/g, '').trim(),
  }));
const WA = /^https:\/\/wa\.me\/\d+\?text=/;
/** Con la bandera apagada: un WhatsApp naranja que dice «Reservar por WhatsApp». */
const esReservarPorWhatsApp = (b: { href: string; clase: string; texto: string }) =>
  WA.test(b.href) && b.clase === 'btn btn--naranja' && b.texto === 'Reservar por WhatsApp';

describe('la web y Mi espacio (órdenes #25, #28 y #33)', () => {
  it('EL PISO, PRIMERO: las cuatro páginas están en dist', () => {
    expect(paginas.length, 'RUTAS no tiene páginas').toBeGreaterThanOrEqual(4);
    for (const { archivo, html } of paginas) {
      expect(html.length, `${archivo} no está en dist: corre el build antes`).toBeGreaterThan(1000);
    }
  });

  it('cabecera, menú y pie: «Mi espacio» con la bandera prendida; con la apagada, ni un enlace a la app', () => {
    for (const { archivo, html } of paginas) {
      if (MI_ESPACIO_EN_LA_WEB) {
        const aMiEspacio = entradas(html).filter((h) => h === `${APP}/entrar`);
        expect(aMiEspacio.length, `${archivo}: «Mi espacio» tiene que estar en cabecera, menú y pie`).toBeGreaterThanOrEqual(3);
      } else {
        /* El piso, antes del cero: la cabecera, el menú y el pie están, así que
           el cero se cuenta sobre ellos y no sobre una página vacía. Busca la
           URL de la app escrita tal cual (enlace, JSON-LD o texto) en el HTML de
           las cuatro páginas; no mira el JS, que no arma enlaces. */
        for (const pieza of ['class="hd__wa"', 'id="ov"', 'class="ft__grid"']) {
          expect(html, `${archivo}: falta ${pieza}`).toContain(pieza);
        }
        expect(html, `${archivo}: la #33 esconde la app, y el HTML la nombra`).not.toContain('familia.armandoduarte.com');
        expect(html, `${archivo}: queda el «Mi espacio →» de la cabecera`).not.toContain('hd__espacio');
      }
    }
  });

  it('/merida: el hero reserva en la app (#25) o por WhatsApp con «Ver el programa» de secundario (#33)', () => {
    const merida = pagina('merida.html');
    const hero = merida.match(/class="hero-cta">[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(hero.length, 'no encontré los botones del hero de /merida').toBeGreaterThan(100);
    if (MI_ESPACIO_EN_LA_WEB) {
      expect(entradas(merida).filter((h) => h === RESERVAR).length, 'hero, «Lo que te llevas», «Inversión» y cierre de /merida').toBe(4);
      expect(merida, 'el Event no dice dónde se reserva').toContain(`"url":"${RESERVAR}"`);
      expect(merida, '«Ver el programa ↓» debajo de la línea de datos').toContain('class="hero-enlace"');
    } else {
      const [principal, segundo, ...resto] = botones(hero);
      expect(esReservarPorWhatsApp(principal), `el principal del hero: ${JSON.stringify(principal)}`).toBe(true);
      expect(segundo, '«Ver el programa» vuelve a ser el secundario').toEqual({ href: '#programa', clase: 'btn', texto: 'Ver el programa' });
      expect(resto, 'dos botones en el hero').toEqual([]);
      expect(merida, 'el enlace de texto «Ver el programa ↓» se va con la #33').not.toContain('hero-enlace');
    }
  });

  it('/merida: «Lo que te llevas», «Inversión» y el cierre', () => {
    const merida = pagina('merida.html');
    const llevas = seccion(merida, 'llevas');
    const inversion = seccion(merida, 'inversion');
    const cierre = seccion(merida, 'reservar');
    for (const [id, html] of [['llevas', llevas], ['inversion', inversion], ['reservar', cierre]]) {
      expect(html.length, `no encontré la sección #${id}`).toBeGreaterThan(200);
    }
    if (MI_ESPACIO_EN_LA_WEB) {
      /* Auditoría del #41. */
      expect(entradas(inversion), '«Inversión» no lleva a la app').toContain(RESERVAR);
      expect(inversion, '«Inversión» perdió WhatsApp como secundario').toMatch(/href="https:\/\/wa\.me\/[^"]+"[^>]*class="btn"/);
      expect(entradas(llevas), '«Lo que te llevas» no lleva a la app').toContain(RESERVAR);
      expect(llevas, '«Lo que te llevas» lleva solo el botón principal').not.toContain('wa.me');
    } else {
      /* Un solo botón donde había uno. */
      for (const [id, html] of [['llevas', llevas], ['inversion', inversion]]) {
        const b = botones(html);
        expect(b.length, `#${id}: un solo botón`).toBe(1);
        expect(esReservarPorWhatsApp(b[0]), `#${id}: ${JSON.stringify(b[0])}`).toBe(true);
      }
      /* El cierre, como antes de la #25: WhatsApp naranja y «Conocer a Armando». */
      const [principal, segundo, ...resto] = botones(cierre);
      expect(esReservarPorWhatsApp(principal), `el principal del cierre: ${JSON.stringify(principal)}`).toBe(true);
      expect(segundo).toEqual({ href: '/#quien', clase: 'btn', texto: 'Conocer a Armando' });
      expect(resto).toEqual([]);
      /* Y el Event sin `offers.url`: no se inventa otro destino. */
      const evento = [...merida.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((m) => JSON.parse(m[1]) as { '@type'?: string; offers?: Record<string, unknown> })
        .find((j) => j['@type'] === 'Event');
      expect(evento?.offers, 'el Event de /merida perdió su oferta').toBeDefined();
      expect(Object.keys(evento!.offers!), 'el Event no lleva offers.url con la #33').not.toContain('url');
    }
  });

  it('la portada: la tarjeta del taller y la banda «AHORA» (#28 / #33)', () => {
    const portada = pagina('index.html');
    const taller = seccion(portada, 'taller');
    const ahora = seccion(portada, 'ahora');
    expect(taller.length, 'no encontré la sección #taller de la portada').toBeGreaterThan(200);
    expect(ahora.length, 'no encontré la banda #ahora').toBeGreaterThan(100);
    if (MI_ESPACIO_EN_LA_WEB) {
      expect(entradas(ahora), 'la banda «AHORA»').toContain(RESERVAR);
      expect(entradas(taller), '«Reservar mi lugar» de la tarjeta del taller no lleva a la app').toEqual([RESERVAR]);
      expect(taller, 'el principal tiene que ser el que reserva').toMatch(/href="https:\/\/familia\.armandoduarte\.com\/entrar[^"]*"[^>]*class="btn btn--naranja"/);
      expect(taller, '«Ver el programa» va en contorno a /merida#programa').toMatch(/href="\/merida#programa"[^>]*class="btn"/);
      expect(taller, 'la tarjeta del taller ya no lleva WhatsApp').not.toContain('wa.me');
    } else {
      const [principal, segundo, ...resto] = botones(taller);
      expect(esReservarPorWhatsApp(principal), `el principal de la tarjeta: ${JSON.stringify(principal)}`).toBe(true);
      expect(segundo, '«Ver el programa» de secundario').toEqual({ href: '/merida#programa', clase: 'btn', texto: 'Ver el programa' });
      expect(resto).toEqual([]);
      expect(ahora, 'la banda «AHORA» reserva por WhatsApp').toMatch(/<a href="https:\/\/wa\.me\/\d+\?text=[^"]+" class="link"[^>]*>Reservar por WhatsApp/);
    }
  });

  it('Términos, «Qué es este sitio»: nombra Mi espacio solo con la bandera prendida (#42)', () => {
    const terminos = pagina('terminos.html');
    /* El piso: el párrafo está, con su principio y su final. */
    expect(terminos).toContain('armandoduarte.com es un sitio informativo:');
    expect(terminos).toContain('te da una vía para ponerte en contacto. La información que encuentras acá es orientativa'
      .replace('. La', MI_ESPACIO_EN_LA_WEB ? '. Desde él se entra a Mi espacio, donde puedes inscribirte a los talleres. La' : '. La'));
    if (!MI_ESPACIO_EN_LA_WEB) expect(terminos, 'la #33 esconde Mi espacio').not.toContain('Desde él se entra a Mi espacio');
  });

  it('la portada, «Qué hago»: los próximos son los dos talleres (#42)', () => {
    const portada = pagina('index.html');
    expect(portada).toContain('Los próximos: el taller para padres de adolescentes en Mérida y «Cómo sanar un matrimonio herido», en línea.');
    expect(portada).not.toContain('El próximo: el taller');
  });

  it('Spotify: escondido con su bandera (#33); YouTube, Facebook e Instagram siguen', () => {
    for (const { archivo, html } of paginas) {
      for (const canal of ['youtube.com/c/DrArmandoDuarte', 'facebook.com/armandoduartepantoja', 'instagram.com/dr.armandoduarte']) {
        expect(html, `${archivo}: el pie perdió ${canal}`).toContain(canal);
      }
      if (SPOTIFY_EN_LA_WEB) expect(html, `${archivo}: el pie sin Spotify`).toContain('open.spotify.com');
      else expect(html, `${archivo}: la #33 esconde Spotify`).not.toMatch(/spotify/i);
    }
  });

  it('ningún vercel.app en el HTML publicado', () => {
    for (const { archivo, html } of paginas) {
      const vistos = html.match(/[a-z0-9.-]*vercel\.app[^"'\s<]*/gi) ?? [];
      expect(vistos, `${archivo} nombra Vercel`).toEqual([]);
    }
  });
});
