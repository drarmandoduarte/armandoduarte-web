/**
 * La cabecera de pantalla, y las tres reglas que no se pueden
 * dejar libradas a que nadie las toque.
 *
 * El corredor de `packages/ui` no monta un DOM: lee el árbol que devuelve el
 * componente, que para uno hecho con `React.createElement` es un objeto plano.
 * Alcanza, porque lo que hay que fijar no son píxeles —el alto lo manda el
 * idioma activo— sino la ANATOMÍA: cuántos renglones puede tener una cabecera,
 * y dónde vive el dato.
 */
import { describe, expect, it } from 'vitest';
import { CabeceraDePantalla } from './CabeceraDePantalla.jsx';

/** Los hijos del árbol, aplanados y sin los `null` de los condicionales. */
function hijosDe(elemento) {
  const c = elemento.props.children;
  return (Array.isArray(c) ? c.flat(Infinity) : [c]).filter(Boolean);
}

/** El bloque de texto: primer div de la fila de arriba. */
function bloqueDeTexto(el) {
  const fila = hijosDe(el).find((h) => h.type === 'div');
  return hijosDe(fila).find((h) => h.type === 'div');
}

const completa = () => CabeceraDePantalla({
  titulo: 'Lo que hay que mirar hoy.',
  dato: '5 cosas para mirar',
  contexto: 'Todo junto, leído de donde ya está.',
});

describe('la cabecera de pantalla dice el nombre una vez', () => {
  /*
   * La regla de la orden: la etiqueta en versalitas de arriba no existe. No hay
   * prop para pasarla, y este test es el que impide que vuelva por la puerta de
   * atrás el día que una pantalla la extrañe — que es exactamente como
   * volvieron las once copias que esta pieza vino a juntar.
   */
  it('no acepta una etiqueta arriba del titular: el titular es lo primero', () => {
    const texto = bloqueDeTexto(completa());
    const titular = hijosDe(texto)[0];
    expect(titular.props.children.filter(Boolean)[0].type).toBe('h1');
  });

  it('el dato vive en la línea del titular, no en la suya', () => {
    const titular = hijosDe(bloqueDeTexto(completa()))[0];
    const [encabezado, dato] = titular.props.children.filter(Boolean);
    expect(encabezado.type).toBe('h1');
    expect(dato.type).toBe('span');
    /* Alineados por la línea de base y no por el centro: 28 px de Fraunces y
       12,5 de Outfit centrados dejan el número flotando a media altura. */
    expect(titular.props.style.alignItems).toBe('baseline');
  });

  it('el dato informa: gris, nunca color de alarma', () => {
    const titular = hijosDe(bloqueDeTexto(completa()))[0];
    const dato = titular.props.children.filter(Boolean)[1];
    expect(dato.props.style.color).toBe('var(--text-3)');
  });

  /*
   * Dos piezas y nada más. Sin dato ni contexto, el bloque de texto es un solo
   * renglón — que es lo que tienen Informes y Honorarios, y está bien así.
   */
  it('sin dato ni contexto la cabecera es un renglón', () => {
    const sola = CabeceraDePantalla({ titulo: 'Lo que los números dicen.' });
    const texto = bloqueDeTexto(sola);
    expect(hijosDe(texto)).toHaveLength(1);
    expect(hijosDe(sola)).toHaveLength(1); // la fila, sin el bloque de debajo
  });

  it('con todo puesto son dos: el titular y la línea de contexto', () => {
    expect(hijosDe(bloqueDeTexto(completa()))).toHaveLength(2);
  });

  /*
   * La medida de lectura es un token y no un número: el `max-w-3xl` que las
   * once pantallas repetían a mano es justamente lo que se vino a juntar aquí.
   */
  it('el texto se mide con el token, no con un ancho escrito a mano', () => {
    expect(bloqueDeTexto(completa()).props.style.maxWidth).toBe('var(--measure-cabecera)');
    expect(bloqueDeTexto(completa()).props.style.minWidth).toBe(0);
  });

  it('lo que se toca cuelga debajo y no se mete en el texto', () => {
    const conPestanas = CabeceraDePantalla({
      titulo: 'Lo que hay.', children: 'las pestañas',
    });
    const debajo = hijosDe(conPestanas)[1];
    expect(debajo.props.children).toBe('las pestañas');
    expect(debajo.props.style.marginTop).toBe('var(--space-12)');
  });
});
