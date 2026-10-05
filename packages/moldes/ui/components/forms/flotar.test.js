/**
 * La capa que flota: dónde abre, cuánto mide, y de qué caja se sale
 * el freno de la Parte 0.
 *
 * ── Las dos mitades, y por qué las dos hacen falta ──────────────────────────
 * El arreglo son dos cosas que se rompen por separado:
 *
 *   1. **la cuenta** —de qué lado abre y cuánto puede medir—, que se equivoca en
 *      silencio: un panel de 15 rem sobre un campo que tiene 120 px hasta el
 *      borde no da error, se dibuja fuera de la pantalla y la mitad de las
 *      opciones deja de existir para quien lo está usando;
 *   2. **que la lista salga del cuerpo que scrollea**, que es lo que el freno
 *      vino a resolver. Eso no se puede medir sin navegador —este repo no tiene
 *      librería de testing de DOM—, así que lo que se fija es que el mecanismo
 *      esté escrito donde tiene que estar: el portal, el `fixed`, y la capa por
 *      encima del velo. Que se DIBUJE bien se mira en la preview, sobre el caso
 *      peor que ya existe: un `SelectorConAlta` al pie de «Anotar una salida».
 *
 * Es la misma división que declara `canaleta.test.ts` para el riel.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ALTO_MAXIMO, MARGEN, ubicarPanel } from './flotar.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SELECTOR = readFileSync(join(AQUI, 'Selector.jsx'), 'utf8');
const DIALOGO = readFileSync(join(AQUI, '..', 'feedback', 'Dialog.jsx'), 'utf8');

/** Una ventana de 800 px de alto, con el campo donde diga cada caso. */
function campo(arriba, altoDelCampo = 40, altoDeVentana = 800) {
  return { arribaDelCampo: arriba, abajoDelCampo: arriba + altoDelCampo, altoDeVentana };
}

describe('de qué lado abre', () => {
  it('abajo cuando entra entero, que es lo que alguien espera', () => {
    // Campo arriba de todo: 760 px libres debajo.
    expect(ubicarPanel(campo(0)).hacia).toBe('abajo');
  });

  it('abajo también cuando entra JUSTO', () => {
    // El borde exacto: 800 − abajo − 8 = 240 → abajo = 552, arriba = 512.
    const justo = ubicarPanel(campo(512));
    expect(justo.hacia).toBe('abajo');
    expect(justo.alto).toBe(ALTO_MAXIMO);
  });

  it('arriba cuando abajo no entra y arriba hay más lugar', () => {
    // El caso del freno: el campo al pie de un diálogo largo.
    // 52 px libres debajo contra 692 arriba: la lista se da vuelta.
    const alPie = ubicarPanel(campo(700));
    expect(alPie.hacia).toBe('arriba');
    // Y arriba entra entera, así que mide su tope y no los 692 que sobran.
    expect(alPie.alto).toBe(ALTO_MAXIMO);
  });

  it('NO voltea por diez píxeles: si abajo no entra pero es el lado más ancho, se queda abajo', () => {
    // Ventana de 400: 202 px libres abajo y 142 arriba. No entra entera de
    // ningún lado, y darla vuelta para ganar menos espacio solo desorienta.
    const medio = ubicarPanel(campo(150, 40, 400));
    expect(medio.hacia).toBe('abajo');
    expect(medio.alto).toBe(202);
  });

  it('empatados, gana abajo', () => {
    // 172 de cada lado.
    const empate = ubicarPanel(campo(180, 40, 400));
    expect(empate.hacia).toBe('abajo');
  });
});

describe('cuánto mide', () => {
  it('nunca más que su tope, aunque sobre pantalla', () => {
    expect(ubicarPanel(campo(0)).alto).toBe(ALTO_MAXIMO);
  });

  it('se recorta al espacio que hay, en vez de dibujarse fuera de la ventana', () => {
    // Ventana de 220: quedan 152 px debajo del campo y 12 arriba.
    const apretado = ubicarPanel(campo(20, 40, 220));
    expect(apretado.hacia).toBe('abajo');
    expect(apretado.alto).toBe(220 - 60 - MARGEN);
  });

  it('nunca negativo, aunque el campo no entre en la ventana', () => {
    /*
     * Un `maxHeight` negativo no es «chiquito»: el navegador lo descarta y la
     * lista vuelve a medir lo que quiera, o sea justo lo que esta cuenta vino a
     * impedir. Y el caso existe: un teléfono apaisado con el teclado abierto
     * deja una ventana de 200 px, y ahí un campo alto se come los dos bordes.
     */
    const sinLugar = ubicarPanel(campo(5, 200, 200));
    expect(sinLugar.alto).toBe(0);

    // Y los dos casos de scroll con la lista abierta, que pasan todo el tiempo:
    // el campo empujado por debajo del borde, y por arriba.
    expect(ubicarPanel(campo(900)).alto).toBeGreaterThanOrEqual(0);
    expect(ubicarPanel(campo(-200)).alto).toBeGreaterThanOrEqual(0);
  });

  it('respeta el margen contra el borde: un panel pegado al canto se lee como cortado', () => {
    const pegado = ubicarPanel(campo(0, 40, 250));
    expect(pegado.alto).toBe(250 - 40 - MARGEN);
  });
});

describe('la lista sale del cuerpo que scrollea', () => {
  it('el `Selector` la dibuja con un portal, no como hija del campo', () => {
    expect(SELECTOR).toContain("import { createPortal } from 'react-dom'");
    expect(SELECTOR).toContain('createPortal(');
    expect(SELECTOR).toContain('document.body');
  });

  it('y con `position: fixed`, que es lo que el portal necesita para ubicarse', () => {
    // `absolute` volvería a colgar del primer ancestro posicionado, que ahora es
    // el `body`: la lista se quedaría en el alto de la página y no del campo.
    expect(SELECTOR).toContain("position: 'fixed'");
    expect(SELECTOR).toContain('ubicarPanel(');
  });

  it('y por encima del velo del diálogo, no debajo', () => {
    /*
     * Desde que la lista se dibuja en el `body` ya no es hija del diálogo: si
     * valiera menos que el velo, un desplegable abierto dentro de un diálogo se
     * dibujaría DEBAJO de la cortina. El número del velo se lee de `Dialog.jsx`
     * y no se copia: el día que ese suba, esto se pone rojo en vez de dejar la
     * lista tapada.
     */
    const velo = Number(/zIndex: (\d+)/.exec(DIALOGO)[1]);
    const capa = Number(/const CAPA = (\d+);/.exec(SELECTOR)[1]);
    expect(velo).toBeGreaterThan(0);
    expect(capa).toBeGreaterThan(velo);
  });

  it('se vuelve a medir con el scroll EN CAPTURA, o no se entera del cuerpo del diálogo', () => {
    // Lo que mueve el campo dentro de un diálogo es el scroll de un `div`, no el
    // de la ventana: sin el tercer argumento en `true`, la lista se queda
    // clavada donde estaba y el campo se va sin ella.
    expect(SELECTOR).toContain("window.addEventListener('scroll', medir, true)");
    expect(SELECTOR).toContain("window.addEventListener('resize', medir)");
    expect(SELECTOR).toContain("window.removeEventListener('scroll', medir, true)");
  });

  it('y el diálogo sigue siendo la caja que obligó a todo esto', () => {
    // Si algún día `Dialog` deja de recortar, el portal deja de ser necesario y
    // esta prueba es el lugar donde alguien lo va a leer. No se cambia sola: se
    // discute.
    expect(DIALOGO).toContain("overflow: 'hidden'");
    expect(DIALOGO).toContain("overflowY: 'auto'");
  });
});
