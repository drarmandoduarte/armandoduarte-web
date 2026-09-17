/**
 * El enlace de WhatsApp tiene que salir carácter por carácter igual al del
 * sitio estático: la codificación del `text=` no cambió en la #05 —cambió el
 * número—, así que estas cinco cadenas siguen siendo la especificación.
 *
 * ── Y desde la #05, la pregunta que de verdad importa ────────────────────
 * Ya no es «¿el enlace codifica bien?». Es **«¿este botón llama a quién tiene
 * que llamar?»**. Son dos números —el de Gaby en la portada, el de Mérida en el
 * taller— y el modo de fallar no es un enlace roto: es un enlace perfecto que
 * suena en el teléfono equivocado. Eso no se ve en una captura, no se ve en el
 * `<head>` y no lo caza el guardián de fidelidad. Lo descubre Gaby cuando le
 * escriben cinco personas preguntando por un taller en otra ciudad.
 *
 * Por eso abajo hay dos comprobaciones cruzadas: que ningún `wa.me` de la
 * portada lleve el número del taller, y que ninguno del taller lleve el de
 * Gaby. Se prueban las dos direcciones por separado a propósito — una sola
 * dejaría pasar la mitad de los cruces.
 */
import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '../i18n/recursos';
import {
  CONTACTO_DE_PAGINA,
  TELEFONO_GABY,
  TELEFONO_GABY_VISIBLE,
  TELEFONO_TALLER,
  TELEFONO_TALLER_VISIBLE,
  enlaceWhatsApp,
} from './contacto';

/** Los cinco `text=` del sitio estático, que la #05 no tocó. */
const ESPERADOS: Record<string, string> = {
  general: 'text=Hola%2C%20Armando.%20Te%20escribo%20desde%20tu%20p%C3%A1gina%20web.',
  reservar: 'text=Hola%2C%20quiero%20reservar%20mi%20lugar%20en%20el%20taller%20El%20arte%20de%20amar%20a%20tu%20adolescente.',
  programa: 'text=Hola%2C%20vi%20el%20programa%20del%20taller%20El%20arte%20de%20amar%20a%20tu%20adolescente%20y%20quiero%20reservar%20mi%20lugar.',
  asegurar: 'text=Hola%2C%20quiero%20asegurar%20mi%20lugar%20en%20el%20taller%20El%20arte%20de%20amar%20a%20tu%20adolescente.',
  arco: 'text=Hola%2C%20quiero%20ejercer%20mis%20derechos%20ARCO.',
};

describe('el enlace de WhatsApp', () => {
  it('piso · los cinco mensajes de i18n son los cinco que el sitio usa', () => {
    expect(Object.keys(RECURSOS_I18N.es.web.comun.mensajes).sort()).toEqual(Object.keys(ESPERADOS).sort());
  });

  for (const [clave, esperado] of Object.entries(ESPERADOS)) {
    it(`«${clave}» se codifica igual que en el sitio estático`, () => {
      const mensaje = RECURSOS_I18N.es.web.comun.mensajes[clave as keyof typeof RECURSOS_I18N.es.web.comun.mensajes];
      expect(enlaceWhatsApp(TELEFONO_GABY, mensaje)).toBe(`https://wa.me/${TELEFONO_GABY}?${esperado}`);
    });
  }

  it('el número escrito y el del enlace son el mismo · Gaby', () => {
    expect(TELEFONO_GABY_VISIBLE.replace(/\D/g, '')).toBe(TELEFONO_GABY);
  });

  it('el número escrito y el del enlace son el mismo · Mérida', () => {
    expect(TELEFONO_TALLER_VISIBLE.replace(/\D/g, '')).toBe(TELEFONO_TALLER);
  });

  it('son dos números distintos, que es lo que hace que esto tenga sentido', () => {
    expect(TELEFONO_GABY).not.toBe(TELEFONO_TALLER);
  });
});

describe('a qué teléfono llama cada página (orden #05, E)', () => {
  const PAGINAS = ['inicio', 'taller', 'privacidad', 'terminos'] as const;

  it('piso · el mapa cubre las cuatro páginas y ninguna más', () => {
    expect(Object.keys(CONTACTO_DE_PAGINA).sort()).toEqual([...PAGINAS].sort());
  });

  for (const pagina of PAGINAS) {
    it(`${pagina}: el número escrito y el del enlace coinciden`, () => {
      const { numero, visible } = CONTACTO_DE_PAGINA[pagina];
      expect(visible.replace(/\D/g, '')).toBe(numero);
    });
  }

  it('la portada y las dos legales llaman a Gaby', () => {
    expect(CONTACTO_DE_PAGINA.inicio.numero).toBe(TELEFONO_GABY);
    expect(CONTACTO_DE_PAGINA.privacidad.numero).toBe(TELEFONO_GABY);
    expect(CONTACTO_DE_PAGINA.terminos.numero).toBe(TELEFONO_GABY);
  });

  it('el taller llama a Mérida', () => {
    expect(CONTACTO_DE_PAGINA.taller.numero).toBe(TELEFONO_TALLER);
  });

  /*
   * Las dos cruzadas. Miran el enlace ARMADO y no la constante: es la diferencia
   * entre comprobar la tabla y comprobar lo que sale al HTML.
   */
  it('ningún wa.me de la portada lleva el número del taller', () => {
    for (const mensaje of Object.values(RECURSOS_I18N.es.web.comun.mensajes)) {
      const enlace = enlaceWhatsApp(CONTACTO_DE_PAGINA.inicio.numero, mensaje);
      expect(enlace, `«${mensaje.slice(0, 40)}…» salió con el número de Mérida`).not.toContain(TELEFONO_TALLER);
      expect(enlace).toContain(`wa.me/${TELEFONO_GABY}?`);
    }
  });

  it('ningún wa.me del taller lleva el número de Gaby', () => {
    for (const mensaje of Object.values(RECURSOS_I18N.es.web.comun.mensajes)) {
      const enlace = enlaceWhatsApp(CONTACTO_DE_PAGINA.taller.numero, mensaje);
      expect(enlace, `«${mensaje.slice(0, 40)}…» salió con el número de Gaby`).not.toContain(TELEFONO_GABY);
      expect(enlace).toContain(`wa.me/${TELEFONO_TALLER}?`);
    }
  });
});
