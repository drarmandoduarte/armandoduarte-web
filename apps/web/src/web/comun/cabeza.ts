import { useEffect } from 'react';
import tokens from '@codice/ui/tokens.json';
import { RECURSOS_I18N } from '@codice/core';

/**
 * El `<head>` de cada página.
 *
 * ── Por qué es una lista de etiquetas y no un componente ──────────────────
 * Porque lo consumen **dos** cosas muy distintas: el prerender, que lo escribe
 * como texto dentro de la plantilla de Vite antes de que exista un navegador, y
 * el cliente, que lo ajusta al navegar de `/` a `/merida` sin recargar. Una
 * lista de datos sirve para las dos; un componente, para ninguna de las dos
 * bien.
 *
 * ── El orden importa, y por eso está escrito a mano ───────────────────────
 * Es el mismo orden que tienen los cuatro HTML del sitio estático, incluida la
 * diferencia entre las páginas de contenido —donde el `canonical` va después de
 * `twitter:card`— y las legales, donde va después de los iconos. Nada de eso se
 * ve en pantalla, pero el guardián de fidelidad compara el `<head>` y esta es la
 * forma de que compare contra algo escrito y no contra lo que salga.
 *
 * ── El único valor que no está escrito acá ────────────────────────────────
 * `theme-color`, que sale del token: es el crema del fondo, el mismo que pinta
 * la barra del navegador en Android. Escribirlo a mano serían dos verdades —y
 * `check:tokens` no deja ningún hex en `apps/`.
 */

export type Pagina = 'inicio' | 'taller' | 'privacidad' | 'terminos';

const SITIO = 'https://armandoduarte.com';
const CREMA = tokens.color.background.cream.value;

/** Una etiqueta del head: el nombre y sus atributos, en orden. */
export type Etiqueta =
  | { tipo: 'title'; texto: string }
  | { tipo: 'meta'; attrs: Record<string, string> }
  | { tipo: 'link'; attrs: Record<string, string> };

const ICONOS: Etiqueta[] = [
  { tipo: 'link', attrs: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' } },
  { tipo: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
  { tipo: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
];

/** Las rutas canónicas, que no son las del router: `/` lleva barra y las otras no. */
const CANONICA: Record<Pagina, string> = {
  inicio: `${SITIO}/`,
  taller: `${SITIO}/merida`,
  privacidad: `${SITIO}/privacidad`,
  terminos: `${SITIO}/terminos`,
};

const OG_IMAGEN: Record<'inicio' | 'taller', string> = {
  inicio: `${SITIO}/img/og-home.jpg`,
  taller: `${SITIO}/img/og.jpg`,
};

export function etiquetasDe(pagina: Pagina): Etiqueta[] {
  const textos = RECURSOS_I18N.es.web[pagina].head as {
    title: string;
    description: string;
    ogImageAlt?: string;
  };

  /* Las legales: sin Open Graph —no se comparten— y con `noindex, follow`, que
     es lo correcto para un aviso legal: que no aparezca en una búsqueda pero
     que sus enlaces cuenten. */
  if (pagina === 'privacidad' || pagina === 'terminos') {
    return [
      { tipo: 'title', texto: textos.title },
      { tipo: 'meta', attrs: { name: 'description', content: textos.description } },
      { tipo: 'meta', attrs: { name: 'robots', content: 'noindex, follow' } },
      { tipo: 'meta', attrs: { name: 'theme-color', content: CREMA } },
      ...ICONOS,
      { tipo: 'link', attrs: { rel: 'canonical', href: CANONICA[pagina] } },
    ];
  }

  return [
    { tipo: 'title', texto: textos.title },
    { tipo: 'meta', attrs: { name: 'description', content: textos.description } },
    { tipo: 'meta', attrs: { name: 'theme-color', content: CREMA } },
    { tipo: 'meta', attrs: { property: 'og:type', content: 'website' } },
    { tipo: 'meta', attrs: { property: 'og:site_name', content: 'Armando Duarte' } },
    /* `og:url` se agrega en la #08, y no es cosmético: es la URL que WhatsApp,
       Facebook y LinkedIn toman como la del contenido. Sin él usan la que se
       compartió — y desde que el dominio está abierto, esa puede ser la de
       `.vercel.app`, que sirve exactamente lo mismo. La orden #08 pedía
       verificar que fuera absoluta y del dominio propio; no existía. Es la misma
       URL que la canónica, y por eso sale de la misma constante: dos fuentes
       para la misma dirección son dos verdades que un día no coinciden. */
    { tipo: 'meta', attrs: { property: 'og:url', content: CANONICA[pagina] } },
    { tipo: 'meta', attrs: { property: 'og:title', content: textos.title } },
    { tipo: 'meta', attrs: { property: 'og:description', content: textos.description } },
    { tipo: 'meta', attrs: { property: 'og:locale', content: 'es_MX' } },
    { tipo: 'meta', attrs: { property: 'og:image', content: OG_IMAGEN[pagina] } },
    { tipo: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
    { tipo: 'meta', attrs: { property: 'og:image:height', content: '630' } },
    { tipo: 'meta', attrs: { property: 'og:image:alt', content: textos.ogImageAlt ?? '' } },
    { tipo: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tipo: 'link', attrs: { rel: 'canonical', href: CANONICA[pagina] } },
    ...ICONOS,
  ];
}

const escapar = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** El head como texto, para que el prerender lo meta en la plantilla. */
export function cabezaHtml(pagina: Pagina): string {
  return etiquetasDe(pagina).map((e) => {
    if (e.tipo === 'title') return `<title>${escapar(e.texto)}</title>`;
    const attrs = Object.entries(e.attrs).map(([k, v]) => `${k}="${escapar(v)}"`).join(' ');
    return `<${e.tipo} ${attrs}>`;
  }).join('\n');
}

/**
 * El head en el cliente. En una carga directa no cambia nada —el prerender ya
 * lo dejó escrito— y su trabajo aparece al navegar dentro de la web: sin esto,
 * ir de `/` a `/merida` dejaría el título de la home en la pestaña.
 *
 * Solo toca lo que puede cambiar entre páginas. Los iconos son los mismos en
 * las cuatro y no se tocan.
 */
export function useCabeza(pagina: Pagina) {
  useEffect(() => {
    for (const e of etiquetasDe(pagina)) {
      if (e.tipo === 'title') { document.title = e.texto; continue; }
      const selector = e.tipo === 'meta'
        ? `meta[${e.attrs.name ? `name="${e.attrs.name}"` : `property="${e.attrs.property}"`}]`
        : `link[rel="${e.attrs.rel}"]${e.attrs.sizes ? `[sizes="${e.attrs.sizes}"]` : ''}`;
      let nodo = document.head.querySelector(selector);
      if (!nodo) {
        nodo = document.createElement(e.tipo);
        document.head.appendChild(nodo);
      }
      for (const [k, v] of Object.entries(e.attrs)) nodo.setAttribute(k, v);
    }
  }, [pagina]);
}
