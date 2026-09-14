/**
 * El guardián del i18n de la web — orden Códice #01, A4.
 *
 * ── Qué cuida, y por qué el piso va primero ───────────────────────────────
 * Que el archivo de textos **esté y tenga texto**. Suena a nada hasta que se
 * mira cómo falla lo contrario: una clave vacía no rompe nada en pantalla —
 * i18next dibuja la cadena vacía sin chistar— y un `web.json` que se quedó a
 * medias tampoco. Los dos se ven exactamente igual que un sitio que perdió su
 * copy, y el que lo note va a ser un padre buscando la hora del taller.
 *
 * Por eso la primera comprobación es el piso: **cuántas claves hay**. Si el
 * archivo se cargó vacío o se recortó, el cero de claves vacías se cumple
 * solo, y sin piso este guardián diría que todo está bien mirando la nada.
 *
 * ── Por qué el número es 284 y no el 120 que pedía la orden ───────────────
 * Porque 120 no cazaba nada, y está medido. Al correr la mutación de este
 * guardián —borrar del archivo tres de las cuatro páginas, que es la forma
 * real de perder copy— quedaron **127 claves y el piso salió VERDE**: un piso
 * que tolera perder el 57 % del texto de la web no es un piso, es un adorno.
 * Lo que se cayó fue otra comprobación, la de que las cuatro páginas estén, y
 * ésa se cae porque el recorte fue prolijo; un recorte a la mitad de una página
 * no la habría despertado.
 *
 * 284 es el número **medido** en esta orden, como los de `qa/piso-de-tests.md`.
 * Subirlo cuando entre texto nuevo es un renglón en el diff, que es como esta
 * casa mueve una vigilancia: hacia arriba también se ve.
 */
import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from './recursos';

/** Pares [ruta, valor] de todas las hojas de un objeto anidado. */
function hojas(o: unknown, prefijo = ''): [string, unknown][] {
  if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
    return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
      hojas(v, prefijo ? `${prefijo}.${k}` : k),
    );
  }
  return [[prefijo, o]];
}

const claves = hojas(RECURSOS_I18N.es.web);

describe('los textos de la web pública', () => {
  it('piso · el archivo se leyó y trae todo el copy de las cuatro páginas', () => {
    expect(
      claves.length,
      'si esto baja, desapareció texto: son las cuatro páginas enteras, clave por clave',
    ).toBeGreaterThanOrEqual(284);
  });

  it('ninguna clave está vacía', () => {
    const vacias = claves
      .filter(([, v]) => typeof v !== 'string' || v.trim() === '')
      .map(([ruta, v]) => `${ruta} = ${JSON.stringify(v)}`);
    expect(vacias, 'una clave vacía se dibuja como nada y no se queja').toEqual([]);
  });

  it('las cuatro páginas y lo común están', () => {
    expect(Object.keys(RECURSOS_I18N.es.web).sort()).toEqual(
      ['comun', 'inicio', 'privacidad', 'taller', 'terminos'],
    );
  });

  it('cada página declara su `<title>` y su descripción', () => {
    for (const pagina of ['inicio', 'taller', 'privacidad', 'terminos'] as const) {
      const head = (RECURSOS_I18N.es.web as Record<string, { head: { title: string; description: string } }>)[pagina].head;
      expect(head.title.length, `${pagina}: title`).toBeGreaterThan(10);
      expect(head.description.length, `${pagina}: description`).toBeGreaterThan(30);
    }
  });

  it('los cinco mensajes de WhatsApp están, y ninguno se repite', () => {
    const mensajes = Object.values(RECURSOS_I18N.es.web.comun.mensajes);
    expect(mensajes).toHaveLength(5);
    expect(new Set(mensajes).size).toBe(5);
  });
});
