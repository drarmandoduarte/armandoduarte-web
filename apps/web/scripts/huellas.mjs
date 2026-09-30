/**
 * La huella de cada imagen en su URL — orden Códice #21, A.
 *
 * ── El caso, del 30/9/2026 ──────────────────────────────────────────────
 * `vercel.json` sirve `/img/` con `max-age=31536000, immutable` desde la #01,
 * y ninguna imagen tenía hash en el nombre. Desde el 16/9 se reemplazaron en
 * el MISMO nombre `llevas-*`, `de-pie-*`, `medio-cuerpo-*` y las `og*`, así que
 * el navegador de Germán, el de Lucía y el de Armando siguieron mostrando las
 * fotos viejas —la mujer meditando, el Armando que flotaba— sin volver a
 * preguntar. Producción servía lo correcto; lo que no llegaba era la noticia.
 *
 * La regla de la #11 («`immutable` solo para lo que tiene hash») era correcta y
 * su test miraba solo `/assets/`. Esto la cumple para `/img/` sin renombrar
 * archivos: cada URL sale del prerender con `?v=` + los 8 primeros hex del
 * SHA-256 **del archivo que se publica**. Cambia el archivo, cambia la URL, y la
 * caché vieja no se consulta. Con eso `immutable` pasa a ser verdad.
 *
 * ── Qué formas toca ─────────────────────────────────────────────────────
 * Toda referencia a una imagen de `img/` en el HTML: relativa (`img/…`, que es
 * como la escriben los componentes), absoluta (`/img/…`) y con dominio
 * (`https://armandoduarte.com/img/…`, la de `og:image`, `twitter:image` y el
 * JSON-LD). Da igual el atributo: `src`, `srcset`, `<source>`, `content` o un
 * string de JSON, porque se busca la URL y no el atributo.
 *
 * Lo vigila `src/las-imagenes-llevan-su-huella.test.ts`, que **no** usa esta
 * expresión: busca con una propia, más ancha, para no compartir sus puntos
 * ciegos.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** `img/…` con extensión de imagen, con o sin `/` y dominio delante, sin `?v=` todavía. */
const URL_DE_IMAGEN = /((?:https:\/\/armandoduarte\.com)?\/?)(img\/[A-Za-z0-9_\-/.]+?\.(?:webp|png|jpe?g|svg|avif|gif))(?![A-Za-z0-9_\-/.?])/g;

/** Los 8 primeros hex del SHA-256 de un archivo. */
export function huellaDe(archivo) {
  return createHash('sha256').update(readFileSync(archivo)).digest('hex').slice(0, 8);
}

/**
 * Devuelve el HTML con `?v=<huella>` en cada URL de imagen, y cuántas tocó.
 * Si una URL apunta a un archivo que no está en `dist/`, tira: una imagen rota
 * no se publica con una huella inventada.
 */
export function ponerHuellas(html, dist) {
  const cache = new Map();
  let tocadas = 0;
  const salida = html.replace(URL_DE_IMAGEN, (_todo, prefijo, ruta) => {
    const archivo = join(dist, ruta);
    if (!cache.has(ruta)) {
      if (!existsSync(archivo)) throw new Error(`la página enlaza ${ruta} y dist/${ruta} no existe`);
      cache.set(ruta, huellaDe(archivo));
    }
    tocadas += 1;
    return `${prefijo}${ruta}?v=${cache.get(ruta)}`;
  });
  return { html: salida, tocadas };
}
