import { useEffect } from 'react';

/**
 * El fundido de entrada de cada bloque — portado del `<script>` del sitio
 * estático, línea por línea.
 *
 * ── Lo que hace, y por qué las dos mitades ────────────────────────────────
 * Cada elemento con `.reveal` arranca en `opacity:0` (solo si hay JavaScript:
 * la regla es `.js .reveal`) y pasa a `1` cuando entra en pantalla. Eso es el
 * `IntersectionObserver`.
 *
 * La segunda mitad —el `setTimeout` de 1200 ms— no es un cinturón por las
 * dudas: es **lo que hace que la página se lea si el observer no dispara**. Un
 * bloque que ya está en pantalla al cargar, con el navegador restaurando la
 * posición del scroll, puede no generar intersección nunca; sin esa red, se
 * queda invisible para siempre. Se porta igual, con el mismo número.
 *
 * `unobserve` al revelar: una vez que apareció, no vuelve a desaparecer.
 */
export function useRevelar() {
  useEffect(() => {
    document.documentElement.classList.add('js');

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    const red = window.setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
      });
    }, 1200);

    return () => {
      io.disconnect();
      window.clearTimeout(red);
    };
  }, []);
}
