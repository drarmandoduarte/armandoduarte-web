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
 * En `ESTATICO_DIR`, y si no está, en `../armandoduarte-web` al lado de este
 * repo, que es donde vive en la carpeta del proyecto. **No se saltea si falta**:
 * un guardián que se saltea cuando no encuentra su insumo es un guardián que se
 * apaga solo el día que más falta hace.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const ESTATICO = process.env.ESTATICO_DIR || join(RAIZ, '..', 'armandoduarte-web');

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

describe('los tokens de Códice', () => {
  it('la versión del documento es la que esta orden dejó', () => {
    expect(tokens.$meta.version).toBe('1.1.0');
    expect(tokens.$meta.changelog?.[0]?.version).toBe('1.1.0');
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
        + 'compara nada. Pasá ESTATICO_DIR o poné el repo estático al lado de éste.',
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
