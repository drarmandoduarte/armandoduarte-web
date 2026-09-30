/**
 * El `Event` de `/merida` dice lo mismo que la página — orden Códice #12, A y F.
 *
 * ── Por qué hace falta una comprobación y no alcanza con la captura ──────
 * Porque este bloque **no se ve**. El `<script type="application/ld+json">` del
 * `<head>` es lo que Google publica en el buscador: la fecha del taller, la
 * sede y el precio. Si dice otra cosa que la página, el que llega tarde o con
 * el dinero contado no se entera por la web — se entera en la puerta del hotel.
 *
 * El guardián de fidelidad ya lo mira (su `cabeza()` lo incluye desde esta misma
 * orden) y eso caza que **cambie**. Lo que caza este archivo es distinto y no se
 * puede pedir a una captura: que lo que dice sea **cierto**.
 *
 * ── Las tres cosas que comprueba, y por qué cada una ─────────────────────
 *
 * **1 · Que exista, que parsee y que esté solo en `/merida`.** Un JSON-LD roto
 * no se ve en pantalla: Google descarta el bloque en silencio y la página pierde
 * su ficha de evento sin que nada avise. Y un `Event` colgado del aviso de
 * privacidad sería peor que ninguno.
 *
 * **2 · Que el huso se calcule, no se copie.** El desplazamiento `-06:00` está
 * escrito a mano en `cabeza.ts` porque un JSON-LD estático lleva marca ISO 8601
 * y no zona IANA. Un valor escrito a mano es una copia, y las copias envejecen:
 * el día que México vuelva a mover su horario de verano —ya lo hizo en 2022— ese
 * `-06:00` se queda viejo **en silencio**, y la hora que publica Google se corre
 * una hora. Así que el test no compara contra otro `-06:00` escrito: le pregunta
 * a `America/Merida` qué desplazamiento tiene ese día y compara contra eso. Es
 * la lección de la #06 —un guardián que compara contra otra copia vigila la
 * copia— aplicada a una fecha.
 *
 * **3 · Que el precio y la sede sean los de la página.** `offers.price` contra
 * `taller.inversion.precio`, y `location.name` contra `taller.hechos.dondeValor`.
 * Los dos viven hoy en dos lugares —el i18n y este objeto— y dos lugares es
 * exactamente el modo de falla que esta casa ya pagó con el token duplicado de
 * la #06: nadie cambia los dos.
 *
 * ── Lo que NO comprueba, declarado ───────────────────────────────────────
 * Que Google lo acepte. Eso lo dice el Rich Results Test, que es una corrida
 * contra un servicio de terceros y está pegada en el informe de la #12. Este
 * archivo mira el HTML que se publica; aquélla mira qué entiende el buscador.
 * Tampoco mira las plantillas `check/og-*.html`: no dibujan este bloque.
 */
import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '@codice/core';
import { cabezaHtml, type Pagina } from './web/comun/cabeza';
import { CANALES } from './web/comun/canales';

const PAGINAS: Pagina[] = ['inicio', 'taller', 'privacidad', 'terminos'];

/** Los bloques de datos estructurados que una página publica, ya parseados. */
function datosDe(pagina: Pagina): unknown[] {
  const html = cabezaHtml(pagina);
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map(([, cuerpo]) => JSON.parse(cuerpo) as unknown);
}

/**
 * El desplazamiento horario que `America/Merida` tiene ese instante, en la forma
 * en que lo escribe ISO 8601 (`-06:00`). Sale de la base de husos del sistema,
 * que es la misma que usa el resto del mundo, y no de una constante de este
 * repo: el sentido del test es justamente no volver a escribir el número.
 */
function husoDeMerida(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Merida',
    timeZoneName: 'longOffset',
  }).formatToParts(fecha);
  const nombre = partes.find((p) => p.type === 'timeZoneName')?.value ?? '';
  return nombre.replace('GMT', '') || '+00:00';
}

interface Evento {
  '@type': string;
  startDate: string;
  endDate: string;
  location: { name: string; hasMap: string; address: { addressLocality: string; addressRegion: string; addressCountry: string } };
  offers: { price: number; priceCurrency: string };
}

describe('el Event de schema.org de /merida', () => {
  /* EL PISO, PRIMERO: que este archivo esté leyendo un `<head>` de verdad. Si
     `cabezaHtml` devolviera vacío, todas las afirmaciones de abajo que buscan
     «un solo bloque» o «ningún bloque» se cumplirían solas y en verde. */
  it('piso · las cuatro páginas dibujan un <head> con contenido', () => {
    for (const pagina of PAGINAS) {
      expect(cabezaHtml(pagina).length, `${pagina}: el head salió vacío`).toBeGreaterThan(500);
    }
  });

  it('existe uno y solo uno, y solo en /merida', () => {
    expect(datosDe('taller'), 'el Event tiene que estar en /merida').toHaveLength(1);
    for (const pagina of ['inicio', 'privacidad', 'terminos'] as Pagina[]) {
      expect(
        datosDe(pagina),
        `${pagina} no organiza ningún evento: un Event con la fecha del taller colgado de otra `
        + 'página es una ficha equivocada en el buscador',
      ).toHaveLength(0);
    }
  });

  it('el huso de las dos fechas es el que America/Merida tiene ese día, calculado', () => {
    const [evento] = datosDe('taller') as Evento[];
    for (const marca of [evento.startDate, evento.endDate]) {
      const huso = marca.slice(-6);
      expect(
        huso,
        `«${marca}» lleva el desplazamiento ${huso} y America/Merida tiene `
        + `${husoDeMerida(new Date(marca))} ese día. Un desplazamiento escrito a mano se queda viejo `
        + 'sin avisar, y la hora que publica Google se corre.',
      ).toBe(husoDeMerida(new Date(marca)));
    }
  });

  it('empieza y termina cuando dice la página, y dura lo que dice la página', () => {
    const [evento] = datosDe('taller') as Evento[];
    const inicio = new Date(evento.startDate);
    const fin = new Date(evento.endDate);
    expect(fin.getTime(), 'el final tiene que ser posterior al comienzo').toBeGreaterThan(inicio.getTime());
    /* Cuatro horas y media, que es lo que dicen el hero, la ficha de la portada
       y la sección «Inversión». La duración es el único dato del taller que NO
       cambió en esta orden, así que si el `Event` deja de cumplirla, se movió una
       de las dos puntas y nadie lo escribió en los textos. */
    expect(
      (fin.getTime() - inicio.getTime()) / 3_600_000,
      'el Event tiene que durar las 4 horas y media que la página promete',
    ).toBe(4.5);
    expect(evento['@type']).toBe('Event');
  });

  it('el precio y la sede son los que la página muestra', () => {
    const [evento] = datosDe('taller') as Evento[];
    const web = RECURSOS_I18N.es.web;

    /* «$1,170» → 1170. Se normaliza acá y no se escribe el número: lo que se
       compara es el texto que el visitante lee. */
    const precioDeLaPagina = Number(web.taller.inversion.precio.replace(/[^\d]/g, ''));
    expect(precioDeLaPagina, 'no se pudo leer el precio del i18n').toBeGreaterThan(0);
    expect(
      evento.offers.price,
      `el Event publica ${evento.offers.price} y la página cobra ${precioDeLaPagina}. `
      + 'Google muestra el del Event.',
    ).toBe(precioDeLaPagina);
    expect(evento.offers.priceCurrency).toBe('MXN');

    expect(
      evento.location.name,
      'la sede del Event tiene que ser la que dice la franja de hechos de /merida',
    ).toBe(web.taller.hechos.dondeValor);
    expect(evento.location.address.addressLocality).toBe('Mérida');
    expect(evento.location.address.addressRegion).toBe('Yucatán');
    expect(evento.location.address.addressCountry).toBe('MX');

    /* ── Y el mapa es EL MISMO que el de la franja (orden #20, E) ────────
       No se compara contra una URL escrita acá: se compara contra `CANALES`,
       que es de donde salen las dos. Una copia en este archivo vigilaría la
       copia y no el hecho — la lección del token duplicado de la #06. Si
       alguien pega otra URL en la franja, este test no se entera; si alguien
       cambia `CANALES.mapaSede`, los dos lugares se mueven juntos, que es el
       punto de que haya una sola fuente. */
    expect(
      evento.location.hasMap,
      'el Event no publica el mapa de la sede, o publica otro que el de la página',
    ).toBe(CANALES.mapaSede);
  });
});
