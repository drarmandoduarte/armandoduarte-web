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
 * ¿Esta sección es oscura? Se decide **midiendo**, no consultando una lista.
 *
 * ── La lista que había acá, y lo que costó ───────────────────────────────
 * Hasta la #06 esto era `SECCIONES_OSCURAS`, un `Set` con dos cadenas —
 * `'rgb(51, 88, 92)'` y `'rgb(46, 43, 37)'`— porque ése es el formato en el que
 * `getComputedStyle().backgroundColor` devuelve un color. Tenía su test, que
 * recalculaba los dos valores desde los tokens y comparaba.
 *
 * **Y aun así se desincronizó.** La #05 movió el teal de la web al del manual
 * CFF —`color.cff.tealDark`— dejando `color.brand.teal` intacto para la app, así
 * que el test siguió en verde mirando el token de la app mientras la web pintaba
 * el otro. Resultado en producción, medido el 17/9: sobre «Sobre el facilitador»
 * el header no se ponía claro y el wordmark quedaba en **1,70:1** sobre el teal.
 * Ilegible, y sin que nada más se rompiera.
 *
 * La lección no es «apuntar el test al token correcto»: es que **una lista de
 * colores es una copia**, y una copia se desincroniza aunque tenga un test —
 * basta con que el test mire la copia equivocada. Así que no hay lista. Se mide
 * la luminancia del fondo que el navegador realmente pintó y se decide con ella.
 * Un color nuevo, un token renombrado o una sección con un fondo a estrenar
 * funcionan sin tocar este archivo.
 *
 * El umbral 0,5 es el de siempre para elegir entre texto claro y oscuro. Los
 * fondos de esta web están lejos del límite —el más oscuro de los claros es el
 * cálido en 0,84 y el más claro de los oscuros es el teal en 0,09— así que no
 * hay caso dudoso.
 */
export function esOscuro(fondo: string): boolean {
  const n = fondo.match(/[\d.]+/g);
  if (!n || n.length < 3) return false;
  /* Transparente: la sección no tiene fondo propio y la decide la de atrás. */
  if (n.length > 3 && Number(n[3]) === 0) return false;
  const [r, g, b] = n.slice(0, 3).map(Number).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}

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
    /* El header se tiñe del fondo **de la sección que pisa** —teal sobre teal,
       tinta sobre tinta— y nunca de crema mezclada con un oscuro, que era el
       beige sucio que dirección vio sobre «Contacto». */
    const fondo = esBg ? bg : getComputedStyle(document.body).backgroundColor;
    hd.style.setProperty('--hd-bg', fondo);
    hd.classList.toggle('claro', esOscuro(fondo));
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
    /* El header se aparta mientras el telón está arriba (orden #06, C): debajo
       del desenfoque se transparentaba y se veían dos wordmarks. Lo hace una
       clase en el `<body>` y no un estilo en línea, para que la regla viva en
       la hoja con las demás del header. */
    document.body.classList.add('ov-abierto');
  };
  const cerrarlo = () => {
    const teniaElFoco = ov.contains(document.activeElement);
    ov.classList.remove('open');
    abrir.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.body.classList.remove('ov-abierto');
    /* Y el foco vuelve al botón que abrió el menú, **solo si estaba adentro**.
       Sin esto, cerrar con Escape lo deja en el `<body>` y el siguiente `Tab`
       empieza de nuevo desde arriba de la página; con esto pero sin la
       condición, un `Escape` con el menú ya cerrado le robaría el foco a lo que
       el visitante estuviera usando. */
    if (teniaElFoco) abrir.focus();
  };

  abrir.addEventListener('click', abrirlo);
  cerrar.addEventListener('click', cerrarlo);
  ov.querySelectorAll('[data-nav]').forEach((a) => a.addEventListener('click', cerrarlo));

  /*
   * ── El foco no se escapa del menú (orden #06, H) ───────────────────────
   *
   * Un overlay a pantalla completa que deja seguir al `Tab` hacia la página de
   * atrás está a medio hacer: quien navega con teclado sigue tabulando y
   * empieza a recorrer, a ciegas, botones que están tapados por el telón. Hasta
   * acá pasaba exactamente eso — medido: después del octavo `Tab` el foco salía
   * al «Ver el taller en Mérida» del hero.
   *
   * La vuelta es el único caso que hay que manejar, y son tres:
   *
   *   · `Tab` en el último  → al primero;
   *   · `Shift+Tab` en el primero → al último;
   *   · el foco **fuera** del overlay con el menú abierto → adentro. Este
   *     tercero no es defensivo: es el caso normal. Al abrir con el mouse el
   *     foco se queda en el botón «Menú», que está fuera, y sin esta rama el
   *     primer `Tab` iría al header oculto en vez de a «Cerrar».
   *
   * La lista se calcula en cada pulsación y no una vez al abrir: los destinos
   * del menú son los mismos siempre, pero una lista cacheada es una copia, y
   * una copia se desincroniza el día que alguien agregue un enlace. Son ocho
   * elementos; recorrerlos cuesta nada.
   */
  const enfocables = () => [...ov.querySelectorAll<HTMLElement>('a[href], button')];

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { cerrarlo(); return; }
    if (e.key !== 'Tab' || !ov.classList.contains('open')) return;

    const focos = enfocables();
    if (!focos.length) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    const actual = document.activeElement;
    const adentro = actual instanceof Node && ov.contains(actual);

    if (e.shiftKey ? (actual === primero || !adentro) : (actual === ultimo || !adentro)) {
      e.preventDefault();
      (e.shiftKey ? ultimo : primero).focus();
    }
  });
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
