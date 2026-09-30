import { useEffect } from 'react';
import tokens from '@codice/ui/tokens.json';
import { RECURSOS_I18N } from '@codice/core';
import { CANALES } from './canales';

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
  | { tipo: 'link'; attrs: Record<string, string> }
  /* Datos estructurados. `datos` es un objeto y no una cadena a propósito: lo
     serializa este archivo, en un solo lugar, y así no puede entrar un JSON
     inválido escrito a mano — que es la forma habitual de romper un JSON-LD y
     no enterarse, porque no se ve en pantalla. */
  | { tipo: 'script'; mime: string; datos: unknown };

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

/**
 * Las imágenes al compartir el enlace.
 *
 * ── `/merida` pasó a llevar dos (orden #12, F) ───────────────────────────
 * Lucía mandó su miniatura en los dos formatos que las plataformas usan y
 * Armando pidió que se viera la suya, así que van las dos y **en este orden**:
 * primero la apaisada de 1200×630, que es la que Facebook, LinkedIn y Twitter
 * toman, y después la cuadrada de 1200×1200, que es la que WhatsApp prefiere
 * cuando la encuentra. Cada una va seguida de su `width` y su `height`: sin
 * ellos la plataforma tiene que bajar el archivo para saber de qué tamaño es, y
 * mientras tanto muestra la vista previa chica.
 *
 * La portada **no cambia**: sigue con la suya, que es otra pieza.
 * `img/og.jpg` —la que `check/og-taller.html` genera— deja de estar enlazada
 * desde ninguna página; queda en el repo y está anotado en `docs/creditos.md`.
 */
const OG_IMAGENES: Record<'inicio' | 'taller', { archivo: string; ancho: number; alto: number }[]> = {
  inicio: [{ archivo: 'og-home.jpg', ancho: 1200, alto: 630 }],
  taller: [
    { archivo: 'og-merida-1200x630.jpg', ancho: 1200, alto: 630 },
    { archivo: 'og-merida-1200x1200.jpg', ancho: 1200, alto: 1200 },
  ],
};

/**
 * El `Event` de schema.org de `/merida`, que vuelve con la fecha (orden #12, A).
 *
 * ── Por qué había desaparecido ──────────────────────────────────────────
 * Lo quitó entero la #02: `startDate`, `endDate` y `location.name` no tenían
 * dato real, y un `Event` con una fecha inventada o con un `[Auditorio]` de
 * relleno es peor que no tenerlo — Google lo publica en el buscador tal cual, y
 * el que se equivoca de día no es Google. Armando dio los tres el 28/9.
 *
 * ── El huso es `-06:00` y no `America/Merida`, y eso no contradice a D15 ──
 * D15 dice que en la **aplicación** los husos se guardan como zona IANA y nunca
 * como desplazamiento, porque un desplazamiento no sabe de horario de verano y
 * caduca. Esto no es la aplicación: es un dato estático de una fecha concreta,
 * y lo que schema.org define —y lo que Google lee— es una marca ISO 8601, que
 * lleva desplazamiento. El 5 de noviembre de 2026 Mérida está en −6, medido
 * contra `America/Merida` y no de memoria (la comprobación está en el informe).
 */
const EVENTO_MERIDA = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'El arte de amar a tu adolescente · taller para padres',
  description: 'Taller presencial de 4 horas y media para padres de adolescentes, con Armando Duarte.',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  image: [`${SITIO}/img/og-merida-1200x630.jpg`, `${SITIO}/img/og-merida-1200x1200.jpg`],
  startDate: '2026-11-05T08:30:00-06:00',
  endDate: '2026-11-05T13:00:00-06:00',
  location: {
    '@type': 'Place',
    name: 'Fiesta Inn Mérida',
    /* El mismo enlace que la franja de hechos (orden #20, E), de `CANALES`:
       una dirección escrita dos veces es una dirección que un día apunta a dos
       lugares. Google lo usa para el mapa del resultado enriquecido. */
    hasMap: CANALES.mapaSede,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mérida',
      addressRegion: 'Yucatán',
      addressCountry: 'MX',
    },
  },
  organizer: { '@type': 'Person', name: 'Armando Duarte', url: `${SITIO}/` },
  performer: { '@type': 'Person', name: 'Armando Duarte' },
  offers: {
    '@type': 'Offer',
    price: 1170,
    priceCurrency: 'MXN',
    availability: 'https://schema.org/LimitedAvailability',
    url: `${SITIO}/merida`,
  },
} as const;

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
    ...OG_IMAGENES[pagina].flatMap<Etiqueta>(({ archivo, ancho, alto }, i) => [
      { tipo: 'meta', attrs: { property: 'og:image', content: `${SITIO}/img/${archivo}` } },
      { tipo: 'meta', attrs: { property: 'og:image:width', content: String(ancho) } },
      { tipo: 'meta', attrs: { property: 'og:image:height', content: String(alto) } },
      /* El `alt` va una sola vez, con la primera: describe el contenido, que es
         el mismo en los dos recortes, y repetirlo no le dice nada a nadie. */
      ...(i === 0
        ? [{ tipo: 'meta' as const, attrs: { property: 'og:image:alt', content: textos.ogImageAlt ?? '' } }]
        : []),
    ]),
    { tipo: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tipo: 'link', attrs: { rel: 'canonical', href: CANONICA[pagina] } },
    ...ICONOS,
    ...(pagina === 'taller'
      ? [{ tipo: 'script' as const, mime: 'application/ld+json', datos: EVENTO_MERIDA }]
      : []),
  ];
}

const escapar = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * El JSON de un `<script type="application/ld+json">`, listo para meter en el
 * HTML. **No se escapan las entidades**: adentro de ese elemento el navegador no
 * las interpreta, y un `&amp;` ahí llega al analizador de JSON como cinco
 * caracteres y lo rompe. Lo único que hay que neutralizar es `<`, porque un
 * `</script` dentro de una cadena cierra el elemento antes de tiempo: `\u003c`
 * es JSON válido y no es un carácter `<` para el analizador de HTML.
 */
export const jsonLd = (datos: unknown) => JSON.stringify(datos).replace(/</g, '\\u003c');

/** El head como texto, para que el prerender lo meta en la plantilla. */
export function cabezaHtml(pagina: Pagina): string {
  return etiquetasDe(pagina).map((e) => {
    if (e.tipo === 'title') return `<title>${escapar(e.texto)}</title>`;
    if (e.tipo === 'script') return `<script type="${e.mime}">${jsonLd(e.datos)}</script>`;
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
    /* ── Los datos estructurados, primero y por reemplazo ─────────────────
       Solo `/merida` tiene `Event`, así que al navegar **hacia otra página hay
       que quitarlo**: un `Event` con la fecha del taller colgado del aviso de
       privacidad es peor que no tener ninguno. Se borran los que haya y se
       vuelve a escribir el de esta página, que es más corto de leer que
       comparar contenidos y no puede dejar uno viejo. */
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((n) => n.remove());

    /* ── Y el resto, contando las repetidas ───────────────────────────────
       Desde la #12 `/merida` declara **dos** `og:image`, cada una con su
       `og:image:width` y su `og:image:height`. Buscar por selector a secas
       devolvía siempre el primer nodo, así que la segunda tanda le pisaba los
       valores a la primera y la página quedaba con una sola imagen mal medida.
       Se lleva la cuenta de cuántas veces se vio cada selector y se toma la
       n-ésima; si no existe, se crea. */
    const vistos = new Map<string, number>();
    for (const e of etiquetasDe(pagina)) {
      if (e.tipo === 'title') { document.title = e.texto; continue; }
      if (e.tipo === 'script') {
        const nodo = document.createElement('script');
        nodo.type = e.mime;
        nodo.textContent = jsonLd(e.datos);
        document.head.appendChild(nodo);
        continue;
      }
      const selector = e.tipo === 'meta'
        ? `meta[${e.attrs.name ? `name="${e.attrs.name}"` : `property="${e.attrs.property}"`}]`
        : `link[rel="${e.attrs.rel}"]${e.attrs.sizes ? `[sizes="${e.attrs.sizes}"]` : ''}`;
      const cual = vistos.get(selector) ?? 0;
      vistos.set(selector, cual + 1);
      let nodo: Element | null = document.head.querySelectorAll(selector)[cual] ?? null;
      if (!nodo) {
        nodo = document.createElement(e.tipo);
        document.head.appendChild(nodo);
      }
      for (const [k, v] of Object.entries(e.attrs)) nodo.setAttribute(k, v);
    }
  }, [pagina]);
}
