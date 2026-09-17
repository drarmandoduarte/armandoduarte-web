/**
 * El guardián de los tokens de la web — orden Códice #01, A3.
 *
 * ── Qué cuida ──────────────────────────────────────────────────────────────
 * Que `codice-tokens.json` siga describiendo **la web que existe** y no la que
 * alguien recuerda. El JSON es un documento: se lee, se cita en las órdenes y
 * nadie lo ejecuta, así que envejece sin avisar. Este archivo lo ata a dos cosas
 * que no se pueden falsear: **el contraste en aritmética** —cada par con su
 * número al lado, y los tres que NO llegan afirmados como igualdad para que
 * nadie los arregle en silencio— y la regla de que un color no se escribe dos
 * veces.
 *
 * ── Los dos pisos, y por qué van primero ──────────────────────────────────
 * Cada afirmación de acá puede pasar en verde hablando de la nada, así que antes
 * de creerle a una se comprueba que tenga de qué hablar. Es la regla de la casa:
 * el piso va ANTES de la afirmación que sostiene.
 *
 *   · **La fórmula sabe medir.** Negro sobre blanco da 21 y un color contra sí
 *     mismo da 1. Sin eso, una fórmula rota que devolviera siempre 21 pondría
 *     los treinta pares de contraste en verde.
 *   · **Se leyeron los colores.** La sección `color` tiene que traer al menos 15
 *     hex. Sin eso, «ningún color se escribe dos veces» es cierto sobre una
 *     lista vacía, que es la manera más silenciosa de no vigilar nada.
 *
 * Hasta la #04 había un tercero —que `estilo.css` del sitio estático pesara más
 * de 10 KB— y se fue con el bloque que lo necesitaba. Está contado abajo.
 *
 * ── Lo que se retiró en la #05 ────────────────────────────────────────────
 * La comparación contra `estilo.css` del sitio estático. El motivo está escrito
 * abajo, donde estaba el bloque.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

const tokens = JSON.parse(readFileSync(join(AQUI, 'codice-tokens.json'), 'utf8'));

/** Baja por una ruta con puntos («color.brand.ochre.mid»). `undefined` si no existe. */
function resolver(ruta, raiz = tokens) {
  let cur = raiz;
  for (const parte of ruta.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(parte in cur)) return undefined;
    cur = cur[parte];
  }
  return cur;
}

/** Todos los pares [ruta, valor] de hoja de un subárbol. */
function hojas(o, prefijo = '') {
  const out = [];
  if (o !== null && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) out.push(...hojas(v, prefijo ? `${prefijo}.${k}` : k));
  } else {
    out.push([prefijo, o]);
  }
  return out;
}

/** La luminancia relativa de la WCAG, y el cociente de contraste entre dos hex. */
function contraste(hexA, hexB) {
  const canal = (hex) => hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
  const lum = (hex) => {
    const [r, g, b] = canal(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [claro, oscuro] = [lum(hexA), lum(hexB)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

describe('los tokens de Códice', () => {
  it('la versión del documento es la que esta orden dejó', () => {
    expect(tokens.$meta.version).toBe('1.2.1');
    expect(tokens.$meta.changelog?.[0]?.version).toBe('1.2.1');
  });

  /*
   * ── El contraste, en el documento y no solo en la captura (orden #03) ────
   *
   * La orden del contraste lo verificó con Lighthouse y con capturas, que es lo
   * que hacía falta para decidir. Lo que hace falta para que la decisión dure es
   * otra cosa: **que nadie pueda volver atrás sin enterarse.** Un hex que se
   * aclara medio punto en `codice-tokens.css` no rompe nada, no se ve en un
   * diff de color y devuelve la web al 96 — seis meses después, y sin que
   * ninguna comprobación diga una palabra.
   *
   * Así que el umbral vive acá, en aritmética, al lado de los valores. Los
   * fondos de cada fila no son «el crema» por costumbre: son **el fondo más
   * exigente en el que ese token se usa de verdad en las cuatro páginas**,
   * medido recorriéndolas. Para el gris y el ocre ese fondo es el cálido, no el
   * crema, y ésa es exactamente la diferencia entre corregir y creer que se
   * corrigió: contra el crema, el ocre ya pasaba.
   */
  describe('el contraste del texto llega a AA donde el diseño lo usa', () => {
    const C = tokens.color;
    const PARES = [
      ['ink.muted sobre background.surfaceWarm', C.ink.muted.value, C.background.surfaceWarm.value],
      ['ink.muted sobre background.cream',       C.ink.muted.value, C.background.cream.value],
      ['ink.muted sobre background.surface',     C.ink.muted.value, C.background.surface.value],
      ['brand.ochre sobre background.surfaceWarm', C.brand.ochre.value, C.background.surfaceWarm.value],
      ['brand.ochre sobre background.cream',       C.brand.ochre.value, C.background.cream.value],
      ['background.cream sobre brand.ochre',       C.background.cream.value, C.brand.ochre.value],
      ['brand.ochre.mid sobre ink.primary',        C.brand.ochre.mid, C.ink.primary.value],
      ['ink.primary sobre brand.ochre.mid',        C.ink.primary.value, C.brand.ochre.mid],
    ];

    /*
     * ── Y los pares de la paleta CFF (orden #05) ──────────────────────────
     *
     * Los de arriba siguen siendo ciertos y siguen valiendo: describen el ocre
     * y el teal de D6, que es lo que **la app** va a usar. Lo que la orden #05
     * cambió es a cuál mira **la web**, así que sus pares se agregan, no se
     * reemplazan. Borrar los de arriba sería dejar de vigilar la paleta de la
     * app el día que alguien la toque.
     *
     * Dos umbrales distintos y por eso dos listas. El de 4,5 es el de texto
     * normal; el de 3 es el que la WCAG da para texto grande (≥ 24 px) y para
     * lo que no es texto —íconos, líneas, aros—. Escribir los dos grupos con el
     * mismo número habría sido más corto y habría prohibido el naranja del
     * manual en los íconos, que es exactamente lo que la orden vino a poner.
     */
    const PARES_CFF_45 = [
      ['cff.orangeText sobre background.cream',       C.cff.orangeText.value, C.background.cream.value],
      ['cff.orangeText sobre background.surfaceWarm', C.cff.orangeText.value, C.background.surfaceWarm.value],
      ['cff.orangeText sobre background.surface',     C.cff.orangeText.value, C.background.surface.value],
      ['background.cream sobre cff.orangeText',       C.background.cream.value, C.cff.orangeText.value],
      ['background.cream sobre cff.tealDark',         C.background.cream.value, C.cff.tealDark.value],
      ['cff.amber sobre ink.primary',                 C.cff.amber.value, C.ink.primary.value],
      ['ink.primary sobre cff.amber',                 C.ink.primary.value, C.cff.amber.value],
    ];

    /*
     * ── El telón del menú (orden #06, A) ──────────────────────────────────
     * El grafito es cromo, no marca, y encima va crema: a pleno para los ítems
     * y el cierre, y al 65 % para el pie. El ámbar solo aparece en el hover de
     * un ítem de 24 px, así que le rige el umbral de texto grande.
     *
     * El 65 % se calcula acá y no se escribe: es una mezcla, y una mezcla
     * escrita a mano es un cuarto valor que se puede desincronizar del CSS.
     */
    const sobre = (fg, bg, alfa) => {
      const c = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
      const [f, b] = [c(fg), c(bg)];
      return '#' + f.map((v, i) => Math.round(v * alfa + b[i] * (1 - alfa)).toString(16).padStart(2, '0')).join('');
    };

    const PARES_TELON_45 = [
      ['background.cream sobre chrome.graphite', C.background.cream.value, C.chrome.graphite.value],
      ['el pie del menú · crema al 65 % sobre grafito',
        sobre(C.background.cream.value, C.chrome.graphite.value, 0.65), C.chrome.graphite.value],
    ];

    const PARES_TELON_3 = [
      ['cff.amber sobre chrome.graphite · hover del ítem', C.cff.amber.value, C.chrome.graphite.value],
    ];

    /* Solo para ≥ 24 px, íconos y líneas. Ninguno de estos tres puede usarse
       como texto chico, y el comentario es la mitad del guardián: sin él, el
       número 3 se lee como «acá alcanza con menos» en vez de «acá el texto es
       grande». Dónde se usa cada uno está en `codice-tokens.css`. */
    const PARES_CFF_3 = [
      ['cff.orange sobre background.cream',      C.cff.orange.value, C.background.cream.value],
      ['cff.orange sobre background.surface',    C.cff.orange.value, C.background.surface.value],
      ['cff.tealLight sobre background.cream',   C.cff.tealLight.value, C.background.cream.value],
      ['cff.tealLight sobre background.surface', C.cff.tealLight.value, C.background.surface.value],
    ];

    it('piso · la fórmula sabe medir lo que ya se sabe', () => {
      /* Negro sobre blanco es 21:1 y un color contra sí mismo es 1:1. Sin este
         piso, una fórmula rota que devolviera siempre 21 pondría todo en verde. */
      expect(Math.round(contraste('#000000', '#FFFFFF'))).toBe(21);
      expect(contraste('#7A7267', '#7A7267')).toBe(1);
      /* Y el valor viejo del gris sobre el cálido, que es lo que la #03 vino a
         arreglar: si esto dejara de dar 4,00, la fórmula cambió de idea. */
      expect(Number(contraste('#7A7267', '#F3EBDD').toFixed(2))).toBe(4);
    });

    for (const [nombre, fg, bg] of [...PARES, ...PARES_CFF_45, ...PARES_TELON_45]) {
      it(`${nombre} ≥ 4,5`, () => {
        expect(
          Number(contraste(fg, bg).toFixed(2)),
          `${fg} sobre ${bg} no llega a 4,5:1. Es texto normal, y por debajo de ese número `
          + 'deja de cumplir AA: la web vuelve al 96 de Lighthouse sin que nada más se rompa.',
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    for (const [nombre, fg, bg] of [...PARES_CFF_3, ...PARES_TELON_3]) {
      it(`${nombre} ≥ 3 · solo para ≥ 24 px, íconos y líneas`, () => {
        expect(
          Number(contraste(fg, bg).toFixed(2)),
          `${fg} sobre ${bg} no llega a 3:1, que es el umbral de la WCAG para texto grande y para `
          + 'lo que no es texto. Por debajo de eso no se puede usar ni siquiera en un ícono.',
        ).toBeGreaterThanOrEqual(3);
      });
    }

    /*
     * El que NO pasa, escrito acá para que no se lo pueda olvidar.
     *
     * El ámbar sobre el teal da 2,81 y el umbral es 4,5: son los rótulos, los
     * enlaces y las flechas de las secciones teal, y es el pendiente 4c. La #05
     * lo movió de 2,51 a 2,81 sin querer —cambió la paleta, no el contraste— y
     * lo dejó igual de lejos de AA.
     *
     * Está afirmado como igualdad y no como «menor que» a propósito: el día que
     * alguien lo arregle, este test se pone rojo y lo obliga a venir hasta acá a
     * borrar la excepción. Una excepción que se arregla sola en silencio vuelve
     * a aparecer a los seis meses.
     */
    /*
     * El teal claro sobre el teal oscuro: 2,56, y no llega ni al 3.
     *
     * La orden #05 lo daba por bueno —«acento sobre teal oscuro»— y medido no lo
     * es: ni como texto grande, ni como ícono, ni como línea. Hoy no se usa así
     * en ningún lado (`--teal-medio` no aparece ni una vez en `index.css`), o
     * sea que no hay nada que arreglar; lo que hay es algo que impedir.
     *
     * Por eso está escrito como afirmación y no como comentario: el día que
     * alguien ponga un ícono teal sobre una sección teal, va a venir a leer esto
     * antes que a descubrirlo en Lighthouse. Sobre teal oscuro el acento que sí
     * pasa es el crema (7,74), que es el que la hoja usa.
     */
    it('el teal claro NO sirve sobre el teal oscuro: 2,56', () => {
      expect(
        Number(contraste(C.cff.tealLight.value, C.cff.tealDark.value).toFixed(2)),
        'si esto cambió, alguien movió uno de los dos teales del manual.',
      ).toBe(2.56);
    });

    /* Y tampoco sobre el cálido: 2,73. Los íconos teal van sobre crema (3,03) y
       sobre blanco (3,24), que son las dos secciones donde la #05 los puso. */
    it('el teal claro NO sirve sobre el cálido: 2,73', () => {
      expect(Number(contraste(C.cff.tealLight.value, C.background.surfaceWarm.value).toFixed(2))).toBe(2.73);
    });

    it('pendiente 4c · cff.amber sobre cff.tealDark sigue en 2,81 y no cumple AA', () => {
      expect(
        Number(contraste(C.cff.amber.value, C.cff.tealDark.value).toFixed(2)),
        'si este número cambió, el pendiente 4c se movió: se actualiza acá y en `docs/tareas.md`, '
        + 'que es donde dirección lo lee.',
      ).toBe(2.81);
    });
  });

  /*
   * ── Acá vivía la comparación contra `estilo.css` del sitio estático ──────
   *
   * **Retirados por D24: la referencia del port cumplió su propósito en la #04.**
   *
   * Ocho comprobaciones ataban la sección `web` de este JSON al CSS del sitio
   * estático: que cada `clamp()` de la escala display, el aire de sección, el
   * alto del hero, el radio del arco y las dos alturas del header estuvieran
   * **textualmente** en `qa/referencia/estilo.css`. Tenían razón de ser mientras
   * el estático fuera la especificación de la web; desde la #05 la web tiene
   * paleta, íconos y fotografías propias, y el estático es historia. Un guardián
   * que compara contra algo que ya no es verdad no vigila: hace ruido, y el
   * ruido se termina apagando.
   *
   * Lo que sigue vigilando que este JSON no envejezca es lo de arriba y lo de
   * abajo: el contraste en aritmética —treinta afirmaciones con sus valores al
   * lado— y que ningún color se escriba dos veces. Lo que ya no se afirma es que
   * la tipografía del documento coincida con la del CSS; si eso hace falta otra
   * vez, se ata a `apps/web/src/index.css`, que es lo que el navegador dibuja
   * hoy, y no a una carpeta que dice «referencia» en el nombre.
   */

  describe('ningún color se escribe dos veces', () => {
    const hexDeColor = new Set(
      hojas(tokens.color)
        .map(([, v]) => v)
        .filter((v) => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v))
        .map((v) => v.toLowerCase()),
    );

    it(`piso · se leyeron ${hexDeColor.size} colores de la sección \`color\``, () => {
      expect(hexDeColor.size).toBeGreaterThanOrEqual(15);
    });

    it('la sección `web` no repite ningún hex de `color`', () => {
      const repetidos = hojas(tokens.web)
        .filter(([, v]) => typeof v === 'string' && hexDeColor.has(v.toLowerCase()))
        .map(([ruta, v]) => `web.${ruta} = ${v}`);
      expect(
        repetidos,
        'un hex repetido son dos verdades que un día no coinciden: va la ruta del token, no el valor',
      ).toEqual([]);
    });

    it('cada color que `web` nombra existe de verdad en el documento', () => {
      const rotas = hojas(tokens.web)
        .filter(([, v]) => typeof v === 'string' && /^(color|typography)\.[A-Za-z.]+$/.test(v))
        .filter(([, v]) => resolver(v) === undefined)
        .map(([ruta, v]) => `web.${ruta} → ${v}`);
      expect(rotas, 'una referencia que no resuelve es un hex disfrazado de disciplina').toEqual([]);
    });
  });
});
