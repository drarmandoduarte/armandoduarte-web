/**
 * Las imágenes al compartir existen de verdad — orden Códice #12, F.
 *
 * ── El defecto que persigue ─────────────────────────────────────────────
 * Un `og:image` que nombra un archivo que no está **no rompe nada visible**: la
 * página carga igual, Lighthouse no lo mira, ninguna captura lo nota. Lo único
 * que pasa es que el enlace se comparte por WhatsApp sin miniatura, que es
 * exactamente lo que Armando y Lucía pidieron arreglar en esta orden. Una letra
 * de más en un nombre de archivo y el trabajo entero de la sección F se pierde
 * en silencio.
 *
 * Y el silencio dura: la vista previa la ve el que comparte el enlace, no el que
 * lo publica. Se descubre cuando alguien lo comenta.
 *
 * ── Lo que comprueba ────────────────────────────────────────────────────
 * Que cada `og:image` de las páginas que lo declaran (1) apunte al dominio
 * propio, (2) corresponda a un archivo que existe en `public/`, y (3) mida
 * exactamente lo que dicen su `og:image:width` y su `og:image:height` — leído de
 * los píxeles del archivo, no del atributo. Un tamaño mal declarado hace que
 * Facebook baje la imagen para medirla y muestre la vista previa chica mientras
 * tanto.
 *
 * ── Lo que NO comprueba, declarado ──────────────────────────────────────
 * Que la imagen se vea bien, y que la plataforma la elija. Lo primero es
 * criterio y está en la captura del informe; lo segundo se mide con el depurador
 * de Facebook y con un enlace mandado por WhatsApp de verdad, y las dos cosas
 * están pegadas en el informe de la #12. Tampoco mira el peso: las dos entran
 * holgadas y el límite de las plataformas (5 MB) está lejísimos.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { etiquetasDe, type Pagina } from './web/comun/cabeza';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PUBLICO = join(AQUI, '..', 'public');
const SITIO = 'https://armandoduarte.com';
const PAGINAS: Pagina[] = ['inicio', 'taller', 'matrimonios', 'privacidad', 'terminos'];

/** Las `og:image` de una página con el `width`/`height` que le sigue a cada una. */
function imagenesDe(pagina: Pagina) {
  const metas = etiquetasDe(pagina).filter((e) => e.tipo === 'meta');
  const salida: { url: string; ancho?: number; alto?: number }[] = [];
  for (const m of metas) {
    const prop = m.attrs.property;
    if (prop === 'og:image') salida.push({ url: m.attrs.content });
    if (prop === 'og:image:width' && salida.length) salida[salida.length - 1].ancho = Number(m.attrs.content);
    if (prop === 'og:image:height' && salida.length) salida[salida.length - 1].alto = Number(m.attrs.content);
  }
  return salida;
}

/**
 * El ancho y el alto de un JPEG, leídos de sus marcadores SOF.
 *
 * Se lee el archivo en vez de usar una biblioteca porque una dependencia nueva
 * se justifica o no entra, y esto son doce líneas: se recorren los segmentos
 * hasta el `SOF` (0xC0–0xCF, salteando los cuatro que no describen una imagen) y
 * ahí están los dos números.
 */
function medidasJpeg(ruta: string): { ancho: number; alto: number } {
  const b = readFileSync(ruta);
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new Error(`${ruta} no es un JPEG`);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marca = b[i + 1];
    const largo = b.readUInt16BE(i + 2);
    const esSof = marca >= 0xc0 && marca <= 0xcf
      && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc;
    if (esSof) return { alto: b.readUInt16BE(i + 5), ancho: b.readUInt16BE(i + 7) };
    i += 2 + largo;
  }
  throw new Error(`${ruta}: no se encontró el marcador de tamaño`);
}

describe('las imágenes al compartir el enlace', () => {
  /* EL PISO, PRIMERO: que haya imágenes que mirar. Sin esto, un `etiquetasDe`
     que devolviera la lista vacía dejaría todas las afirmaciones de abajo
     cumplidas sobre cero elementos, que es la forma más limpia de un verde
     falso. Son cinco: una en la portada, dos en `/merida` y dos en
     `/matrimonios` (#38). */
  it('piso · hay cinco og:image declaradas entre las cinco páginas', () => {
    const total = PAGINAS.reduce((n, p) => n + imagenesDe(p).length, 0);
    expect(total, 'el barrido no encontró ninguna og:image: o las páginas no declaran, o esto no lee')
      .toBe(5);
    expect(imagenesDe('taller'), '/merida declara dos: la apaisada y la cuadrada de WhatsApp')
      .toHaveLength(2);
    expect(imagenesDe('matrimonios').map((i) => i.url), '/matrimonios: los dos og-matrimonios-* del insumo, la apaisada primero')
      .toEqual([`${SITIO}/img/og-matrimonios-1200x630.jpg`, `${SITIO}/img/og-matrimonios-1200x1200.jpg`]);
    /* Las legales no se comparten y no declaran ninguna: es una decisión de la
       #01 y si alguien le pone una, esto lo dice. */
    for (const pagina of ['privacidad', 'terminos'] as Pagina[]) {
      expect(imagenesDe(pagina), `${pagina} no se comparte`).toHaveLength(0);
    }
  });

  it('cada una apunta al dominio propio y el archivo está en public/', () => {
    for (const pagina of PAGINAS) {
      for (const { url } of imagenesDe(pagina)) {
        expect(url.startsWith(`${SITIO}/img/`), `${pagina}: «${url}» no es una ruta del dominio propio`).toBe(true);
        const ruta = join(PUBLICO, url.slice(`${SITIO}/`.length));
        expect(
          existsSync(ruta),
          `${pagina}: el og:image nombra ${url} y ese archivo no está en public/. El enlace se `
          + 'comparte sin miniatura y no hay nada en pantalla que lo delate.',
        ).toBe(true);
      }
    }
  });

  it('el tamaño declarado es el que el archivo mide de verdad', () => {
    for (const pagina of PAGINAS) {
      for (const { url, ancho, alto } of imagenesDe(pagina)) {
        const medido = medidasJpeg(join(PUBLICO, url.slice(`${SITIO}/`.length)));
        expect(
          [ancho, alto],
          `${pagina}: ${url} declara ${ancho}×${alto} y mide ${medido.ancho}×${medido.alto}`,
        ).toEqual([medido.ancho, medido.alto]);
      }
    }
  });
});
