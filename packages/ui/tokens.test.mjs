/**
 * El guardián de los tokens de la web — orden Códice #01, A3.
 *
 * ── Qué cuida ──────────────────────────────────────────────────────────────
 * Que `codice-tokens.json` siga describiendo **la web que existe** y no la que
 * alguien recuerda. El JSON es un documento: se lee, se cita en las órdenes y
 * nadie lo ejecuta, así que envejece sin avisar. Este archivo lo ata a la única
 * fuente que no miente —`estilo.css` del sitio estático, que es lo que el
 * navegador dibuja hoy— y a la regla de que un color no se escribe dos veces.
 *
 * ── El piso va primero, y por qué ─────────────────────────────────────────
 * La comprobación central es «este valor aparece textualmente en el CSS». Si el
 * CSS no se pudo leer, esa comprobación no falla: **pasa a hablar de la nada**,
 * y un `includes()` sobre cadena vacía es rojo por el motivo equivocado —o
 * verde, si algún día se afloja a `?.`—. Así que antes de medir se afirma que
 * hay algo que medir: el archivo pesa más de 10 KB. Es la regla de la casa —el
 * piso va ANTES de la afirmación que sostiene— y acá se paga sola: sin ella, un
 * `ESTATICO_DIR` mal puesto se lee como «los tokens no coinciden».
 *
 * ── Dónde está el sitio estático ──────────────────────────────────────────
 * En `qa/referencia/` de este mismo repo, versionado, desde la orden #04 —antes
 * era un repo de al lado—. `ESTATICO_DIR` sigue pudiendo apuntar a otro lado,
 * pero por omisión no hace falta. **No se saltea si falta**: un guardián que se
 * saltea cuando no encuentra su insumo es un guardián que se apaga solo el día
 * que más falta hace.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const ESTATICO = process.env.ESTATICO_DIR || join(RAIZ, 'qa', 'referencia');

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
    expect(tokens.$meta.version).toBe('1.2.0');
    expect(tokens.$meta.changelog?.[0]?.version).toBe('1.2.0');
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

    for (const [nombre, fg, bg] of [...PARES, ...PARES_CFF_45]) {
      it(`${nombre} ≥ 4,5`, () => {
        expect(
          Number(contraste(fg, bg).toFixed(2)),
          `${fg} sobre ${bg} no llega a 4,5:1. Es texto normal, y por debajo de ese número `
          + 'deja de cumplir AA: la web vuelve al 96 de Lighthouse sin que nada más se rompa.',
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    for (const [nombre, fg, bg] of PARES_CFF_3) {
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

  describe('la sección `web` describe el CSS que el navegador dibuja hoy', () => {
    /* EL PISO, PRIMERO. Ver la cabecera: sin esto, el rojo de abajo miente. */
    const rutaCss = join(ESTATICO, 'estilo.css');
    let css = '';
    let bytes = 0;
    try {
      bytes = statSync(rutaCss).size;
      css = readFileSync(rutaCss, 'utf8');
    } catch {
      /* se cae en el piso, con el nombre del archivo a la vista */
    }

    it(`piso · se leyó ${rutaCss}`, () => {
      expect(
        bytes,
        `no se pudo leer ${rutaCss}. Es la especificación del port: sin él este guardián no `
        + 'compara nada. Vive en `qa/referencia/` de este repo y se versiona con él.',
      ).toBeGreaterThan(10_000);
      expect(css.length).toBeGreaterThan(10_000);
    });

    for (const [nombre, escala] of Object.entries(tokens.web.typography.display)) {
      it(`display ${nombre}: «${escala.size}» está textualmente en estilo.css`, () => {
        expect(css).toContain(escala.size);
      });
    }

    it('lead y script también', () => {
      expect(css).toContain(tokens.web.typography.lead.size);
      expect(css).toContain(tokens.web.typography.script.size);
    });

    it('el aire de sección, el hero y el arco también', () => {
      expect(css).toContain(tokens.web.section.paddingBlock);
      expect(css).toContain(tokens.web.hero.minHeight);
      expect(css).toContain(tokens.web.foto.arco.borderRadius);
    });

    it('el header mide lo que dice medir, arriba y abajo de los 600px', () => {
      expect(css).toContain(`--header-h:${tokens.web.header.height.default}`);
      expect(css).toContain(`--header-h:${tokens.web.header.height.compact}`);
    });
  });

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
