/**
 * Los tres comportamientos de la web pública — orden Códice #02, A.
 *
 * ── Por qué este archivo existe ───────────────────────────────────────────
 * Porque la web pública **no se hidrata**. El HTML sale escrito del prerender y
 * el navegador no baja React: lo único que baja es este archivo. Lo que compra
 * son tres cosas, las mismas tres que compraba el `<script>` de dos kilobytes
 * del sitio estático —el tinte de la cabecera, el menú de pantalla completa y el
 * fundido de entrada— y ninguna más.
 *
 * Es la traducción literal de los hooks de la orden #01
 * (`useTinteDeCabecera`, `useRevelar`, y el `useEffect` de `MenuMovil`), que se
 * borraron el mismo día que nació este archivo. No hay dos implementaciones de
 * lo mismo: **ésta es la única**, y es la que corre también en `vite dev`.
 *
 * ── Sin imports, y no es un capricho ──────────────────────────────────────
 * Ni React, ni i18n, ni un solo `import`. Todo lo que este archivo necesita ya
 * está en el HTML que el prerender escribió: los `id`, las clases y los textos.
 * Un import acá sería un módulo más en el grafo, y el grafo es exactamente lo
 * que esta orden vino a achicar. El presupuesto son **3 KB minificados** y está
 * medido en el PR.
 *
 * ── Lo que NO se tocó al traducir, aunque dé ganas ────────────────────────
 * Los dos números —650 ms de quietud, 1200 ms de red— y los dos colores escritos
 * como los devuelve el navegador. Cada uno tiene su porqué escrito abajo, y el
 * de los colores tiene además un test que los recalcula desde los tokens.
 */

/**
 * Los dos fondos oscuros, como los devuelve `getComputedStyle`.
 *
 * Van escritos como `rgb(...)` y no como token porque ésa es la cadena que
 * devuelve `getComputedStyle().backgroundColor`, o sea el formato del navegador
 * y no el del diseño: comparar contra `var(--teal)` no compararía nada, porque
 * ese valor nunca llega hasta acá resuelto.
 *
 * Son el teal y la tinta, o sea `color.brand.teal` y `color.ink.primary`. Que
 * sigan siéndolo no depende de que alguien se acuerde: `comportamiento.test.ts`
 * los recalcula desde los tokens y compara. Sin ese test serían dos copias de un
 * color escritas en el único formato en el que nadie las va a encontrar.
 */
export const SECCIONES_OSCURAS = new Set(['rgb(51, 88, 92)', 'rgb(46, 43, 37)']);

/**
 * El tinte de la cabecera.
 *
 * «El header es transparente en reposo. Mientras se hace scroll toma el color de
 * la sección que tiene debajo; al quedarse quieto, vuelve a transparente. El
 * texto sigue el tono de la sección (claro sobre teal y tinta). Nunca se
 * esconde.» — el comentario del sitio estático, que sigue describiendo esto.
 *
 * El `setTimeout` de 650 ms es lo que hace que el velo se apague al detenerse, y
 * su duración está medida contra la transición de `.hd::before`. Un número
 * redondo distinto se vería.
 */
function tinteDeCabecera(): void {
  const hd = document.getElementById('hd');
  if (!hd) return;

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
}

/**
 * El menú de pantalla completa. Se abre desde el botón de la cabecera y se
 * cierra con la ✕, con Escape o al elegir un destino.
 *
 * El scroll del fondo se bloquea mientras está abierto —`document.body.style.
 * overflow`— y se limpia al cerrar: un overflow que queda puesto deja la página
 * trabada.
 */
function menuDePantallaCompleta(): void {
  const ov = document.getElementById('ov');
  const abrir = document.getElementById('abrir');
  const cerrar = document.getElementById('cerrar');
  if (!ov || !abrir || !cerrar) return;

  const abrirlo = () => {
    ov.classList.add('open');
    abrir.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const cerrarlo = () => {
    ov.classList.remove('open');
    abrir.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  abrir.addEventListener('click', abrirlo);
  cerrar.addEventListener('click', cerrarlo);
  ov.querySelectorAll('[data-nav]').forEach((a) => a.addEventListener('click', cerrarlo));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarlo(); });
}

/**
 * El fundido de entrada de cada bloque.
 *
 * Cada elemento con `.reveal` arranca en `opacity:0` —solo si hay JavaScript: la
 * regla es `.js .reveal`— y pasa a `1` cuando entra en pantalla. Eso es el
 * `IntersectionObserver`.
 *
 * La segunda mitad —el `setTimeout` de 1200 ms— no es un cinturón por las dudas:
 * es **lo que hace que la página se lea si el observer no dispara**. Un bloque
 * que ya está en pantalla al cargar, con el navegador restaurando la posición
 * del scroll, puede no generar intersección nunca; sin esa red, se queda
 * invisible para siempre.
 *
 * `unobserve` al revelar: una vez que apareció, no vuelve a desaparecer.
 */
function revelar(): void {
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

  window.setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
    });
  }, 1200);
}

/**
 * Los tres, en el orden del sitio estático.
 *
 * `js` en el `<html>` va primero y no dentro del fundido: es la clase que apaga
 * los bloques (`.js .reveal{opacity:0}`), y si llegara después de que el
 * observer ya reveló alguno, ese bloque parpadearía.
 *
 * No hay limpieza —ni `removeEventListener`, ni `disconnect`— y es correcto: en
 * la web pública cada página es una carga completa del documento. Los hooks de
 * la #01 sí limpiaban porque React desmonta; acá lo que desmonta es el
 * navegador.
 */
export function comportamiento(): void {
  document.documentElement.classList.add('js');
  tinteDeCabecera();
  menuDePantallaCompleta();
  revelar();
}
