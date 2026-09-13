import { useEffect } from 'react';

/**
 * El tinte del header — portado del `<script>` del sitio estático sin
 * reinterpretarlo.
 *
 * ── Qué hace, con las palabras del comentario original ────────────────────
 * «El header es transparente en reposo. Mientras se hace scroll toma el color
 * de la sección que tiene debajo; al quedarse quieto, vuelve a transparente. El
 * texto sigue el tono de la sección (claro sobre teal y tinta). Nunca se
 * esconde.»
 *
 * ── Las dos cosas que NO se tocaron, aunque dan ganas ─────────────────────
 * **Los dos colores oscuros van escritos como `rgb(...)` y no como token.** Es
 * la cadena que devuelve `getComputedStyle().backgroundColor`, o sea el formato
 * del navegador, no el del diseño: comparar contra `var(--teal)` no compararía
 * nada, porque ese valor nunca llega hasta acá resuelto.
 *
 * Son el teal y la tinta, o sea `color.brand.teal` y `color.ink.primary`. Y que
 * sigan siéndolo no depende de que alguien se acuerde: `useTinteDeCabecera.test.ts`
 * los recalcula desde los tokens y compara. Sin ese test esto serían dos copias
 * de un color escritas en otro formato —el peor tipo de copia, la que no se
 * encuentra buscando el hex.
 *
 * **El `setTimeout` de 650 ms.** Es lo que hace que el velo se apague al
 * detenerse, y su duración está medida contra la transición de `.hd::before`.
 * Un número redondo distinto se vería.
 *
 * ── Lo único que cambió ───────────────────────────────────────────────────
 * El original leía las secciones una vez, al cargar. Acá se leen dentro de
 * `pintar()` en cada llamada: en una SPA el árbol cambia al navegar de `/` a
 * `/taller`, y una lista capturada al montar apuntaría a secciones que ya no
 * están en el documento. Es el mismo comportamiento en una carga directa —que
 * es como el guardián de fidelidad mide— y el correcto al navegar.
 */

/** Los dos fondos oscuros, como los devuelve `getComputedStyle`. */
export const SECCIONES_OSCURAS = new Set(['rgb(51, 88, 92)', 'rgb(46, 43, 37)']);

export function useTinteDeCabecera() {
  useEffect(() => {
    const hd = document.getElementById('hd');
    if (!hd) return undefined;

    let quieto: number | undefined;

    const pintar = () => {
      const y = window.scrollY;
      const linea = y + hd.offsetHeight - 1;
      const secciones = [...document.querySelectorAll('main > section, footer')];
      const s = secciones.find((el) => {
        const r = el.getBoundingClientRect();
        return r.top + y <= linea && r.bottom + y > linea;
      });
      const bg = s ? getComputedStyle(s).backgroundColor : '';
      const esBg = bg && bg !== 'rgba(0, 0, 0, 0)';
      hd.style.setProperty('--hd-bg', esBg ? bg : getComputedStyle(document.body).backgroundColor);
      hd.classList.toggle('claro', SECCIONES_OSCURAS.has(bg));
      hd.classList.toggle('scrolled', y > 24);
      window.clearTimeout(quieto);
      quieto = window.setTimeout(() => hd.classList.remove('scrolled'), 650);
    };

    pintar();
    window.addEventListener('scroll', pintar, { passive: true });
    window.addEventListener('resize', pintar);
    return () => {
      window.removeEventListener('scroll', pintar);
      window.removeEventListener('resize', pintar);
      window.clearTimeout(quieto);
    };
  }, []);
}
