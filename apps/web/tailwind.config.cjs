/**
 * Códice · puente Tailwind → tokens.
 *
 * Regla: una clase resuelve SIEMPRE a `var(--token)` de
 * `packages/ui/codice-tokens.css`. **La paleta default de Tailwind está
 * reemplazada a propósito**: `bg-red-500` no existe acá — si un color no tiene
 * token, no entra al producto. Es el mismo puente que usan Omnia y Bitácora,
 * reescrito sobre los nombres que ya usaba `estilo.css` de la web pública.
 *
 * ── `preflight` apagado, y ésta es la razón entera ────────────────────────
 * La orden #01 dice que la versión React tiene que ser **indistinguible** de la
 * estática, y el reset de Tailwind no es neutro: le pone `font-size: inherit` y
 * `font-weight: inherit` a los seis niveles de título, le saca el `list-style`
 * y el relleno a las listas, y le cambia el borde por defecto a todo elemento.
 * La web estática **ya trae su propio reset** —`*{box-sizing:border-box;
 * margin:0;padding:0}`, en la línea 21 de `estilo.css`— y sobre él está medido
 * cada espacio de las cuatro páginas.
 *
 * Encender preflight sería agregar un segundo reset encima del primero y
 * después escribir CSS de compensación hasta que el guardián de fidelidad se
 * ponga verde: dos capas peleando, y el CSS portado dejando de ser el mismo. Lo
 * que se apaga acá no es una decisión de diseño, es **la única forma de que no
 * haya ninguna**: con preflight apagado, Tailwind no emite una sola regla que
 * la web no haya pedido.
 *
 * Queda encendido el resto del puente para lo que viene —consultorio, academia,
 * asistente, que se escriben con utilidades— y el día que una pantalla nueva
 * quiera el reset, se enciende para esa app, no para ésta.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/components/**/*.{js,jsx}',
  ],
  /*
   * Dos plugins apagados, y los dos por el mismo motivo: que Tailwind no
   * escriba reglas que la web no pidió.
   *
   * `preflight` — su reset le pone `font-size: inherit` y `font-weight:
   * inherit` a los seis niveles de título, le saca el `list-style` y el relleno
   * a las listas y le cambia el borde por defecto a todo elemento. La web
   * estática **ya trae su propio reset** (`*{box-sizing:border-box;margin:0;
   * padding:0}`, primera línea del CSS portado) y sobre ése está medido cada
   * espacio de las cuatro páginas. Encenderlo sería apilar dos resets y después
   * escribir CSS de compensación hasta que el guardián se ponga verde.
   *
   * `container` — **esto lo cazó el guardián de fidelidad, no el ojo.** La web
   * tiene su propia clase `.container`, con `width: min(90%, 1400px, calc(100%
   * - 40px))`. El plugin de Tailwind genera **otra** `.container`, con
   * `max-width` por breakpoint. Como son propiedades distintas —`width` contra
   * `max-width`— no hay pelea que ganar por orden ni por especificidad: las dos
   * aplican, y la de Tailwind recorta. Medido a 900px de ancho: el contenedor
   * del sitio mide **810px** y el del port medía **768px**, el `max-width` de
   * `md`. Cada línea de texto de las cuatro páginas, corrida 21px. Se veía bien;
   * no era igual.
   *
   * Lo que se apaga no es una decisión de diseño: es la única forma de que no
   * haya ninguna.
   */
  corePlugins: { preflight: false, container: false },
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      crema: 'var(--crema)',
      superficie: 'var(--superficie)',
      calido: 'var(--calido)',

      tinta: 'var(--tinta)',
      gris: {
        DEFAULT: 'var(--gris)',
        claro: 'var(--gris-claro)',
      },

      ocre: {
        DEFAULT: 'var(--ocre)',
        medio: 'var(--ocre-medio)',
        suave: 'var(--ocre-suave)',
      },
      teal: {
        DEFAULT: 'var(--teal)',
        medio: 'var(--teal-medio)',
        suave: 'var(--teal-suave)',
      },
      navy: 'var(--navy)',

      hair: {
        DEFAULT: 'var(--hair)',
        hover: 'var(--hair-hover)',
        oscura: 'var(--hair-oscura)',
      },
    },
    fontFamily: {
      display: 'var(--display)',
      lectura: 'var(--lectura)',
      script: 'var(--script)',
    },
    fontSize: {
      'display-xl': 'var(--display-xl)',
      'display-l': 'var(--display-l)',
      'display-m': 'var(--display-m)',
      'display-s': 'var(--display-s)',
      lead: 'var(--lead)',
      script: 'var(--script-size)',
    },
    spacing: {
      0: '0',
      3: 'var(--s3)',
      4: 'var(--s4)',
      5: 'var(--s5)',
      6: 'var(--s6)',
      7: 'var(--s7)',
      8: 'var(--s8)',
    },
    borderRadius: {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      pill: '999px',
      full: '999px',
    },
    /* `elevation.shadow: none` en el design system: ninguna sombra, nunca. La
       jerarquía es color de superficie y aire. Si la clase no existe, no se
       escribe por descuido. */
    boxShadow: { none: 'none' },
    extend: {},
  },
  plugins: [],
};
