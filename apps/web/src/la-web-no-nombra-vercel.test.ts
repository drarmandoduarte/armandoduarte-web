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
 * Qué NO mira: el JS publicado (no arma enlaces: la web no hidrata) ni el
 * `dist` de un build con `VITE_APP_FAMILIA` puesta, que es justamente el que
 * sí puede nombrar Vercel y no se publica en producción.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUTAS } from './rutas';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const APP = 'https://familia.armandoduarte.com';

const paginas = RUTAS.map(({ archivo }) => {
  const ruta = join(DIST, archivo);
  return { archivo, html: existsSync(ruta) ? readFileSync(ruta, 'utf8') : '' };
});
const entradas = (html: string) => [...html.matchAll(/href="(https:\/\/familia\.armandoduarte\.com\/entrar[^"]*)"/g)].map((m) => m[1]);

describe('la web no nombra Vercel (orden #25)', () => {
  it('EL PISO, PRIMERO: cada página trae sus puertas a la app (cabecera, menú y pie)', () => {
    expect(paginas.length, 'RUTAS no tiene páginas').toBeGreaterThanOrEqual(4);
    for (const { archivo, html } of paginas) {
      expect(html.length, `${archivo} no está en dist: corre el build antes`).toBeGreaterThan(1000);
      const aMiEspacio = entradas(html).filter((h) => h === `${APP}/entrar`);
      expect(aMiEspacio.length, `${archivo}: «Mi espacio» tiene que estar en cabecera, menú y pie`).toBeGreaterThanOrEqual(3);
    }
  });

  it('EL PISO: /merida reserva en la app (hero, «Lo que te llevas», «Inversión», cierre y offers.url) y la portada desde «AHORA»', () => {
    const reservar = `${APP}/entrar?ir=%2Fme-anoto%2Fel-arte-de-amar-a-tu-adolescente`;
    const merida = paginas.find((p) => p.archivo === 'merida.html')!.html;
    expect(entradas(merida).filter((h) => h === reservar).length, 'hero, «Lo que te llevas», «Inversión» y cierre de /merida').toBe(4);
    expect(merida, 'el Event no dice dónde se reserva').toContain(`"url":"${reservar}"`);
    const portada = paginas.find((p) => p.archivo === 'index.html')!.html;
    expect(entradas(portada), 'la banda «AHORA»').toContain(reservar);
  });

  it('«Lo que te llevas» e «Inversión» reservan en la app; Inversión deja WhatsApp en contorno (auditoría del #41)', () => {
    const reservar = `${APP}/entrar?ir=%2Fme-anoto%2Fel-arte-de-amar-a-tu-adolescente`;
    const merida = paginas.find((p) => p.archivo === 'merida.html')!.html;
    const seccion = (id: string) => merida.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';
    const inversion = seccion('inversion');
    const llevas = seccion('llevas');
    expect(inversion.length, 'no encontré la sección #inversion').toBeGreaterThan(200);
    expect(llevas.length, 'no encontré la sección #llevas').toBeGreaterThan(200);
    expect(entradas(inversion), '«Inversión» no lleva a la app').toContain(reservar);
    expect(inversion, '«Inversión» perdió WhatsApp como secundario').toMatch(/href="https:\/\/wa\.me\/[^"]+"[^>]*class="btn"/);
    expect(entradas(llevas), '«Lo que te llevas» no lleva a la app').toContain(reservar);
    expect(llevas, '«Lo que te llevas» lleva solo el botón principal').not.toContain('wa.me');
  });

  it('ningún vercel.app en el HTML publicado', () => {
    for (const { archivo, html } of paginas) {
      const vistos = html.match(/[a-z0-9.-]*vercel\.app[^"'\s<]*/gi) ?? [];
      expect(vistos, `${archivo} nombra Vercel`).toEqual([]);
    }
  });
});
