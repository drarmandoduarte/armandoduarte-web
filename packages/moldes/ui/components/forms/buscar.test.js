/**
 * La búsqueda de `ComboBuscador`, probada donde se decide.
 *
 * Lo que fijan estos casos es lo que separa un campo que sirve en un mostrador
 * de uno que hay que pelear:
 *
 * 1. **El acento no cuenta.** Nadie escribe «Nº» ni pone la tilde con el responsable
 *    esperando al teléfono, y media cuenta carga las fichas sin acentos.
 * 2. **Se busca en cualquier parte del nombre**, no solo al principio: quien
 *    llama dice «el de los Pérez» antes que el nombre del titular.
 * 3. **El orden no se toca.** Filtrar no reordena; si lo hiciera, cada tecla
 *    movería las opciones bajo el dedo que está por hacer clic.
 * 4. **El tope corta lo que se dibuja, no lo que se busca.**
 */
import { describe, expect, it } from 'vitest';
import { filtrarOpciones, normalizar, opcionDe } from './buscar.js';

const PERSONAS = [
  { value: '1', label: 'Carla', detalle: 'Particular · Pérez' },
  { value: '2', label: 'María', detalle: 'Mutualista · Gómez' },
  { value: '3', label: 'Miguel', detalle: 'Mutualista · Pérez' },
  { value: '4', label: 'Rocio', detalle: 'Particular · Silva' },
];

describe('el acento no cuenta', () => {
  it('escribir sin tilde encuentra lo que la tiene', () => {
    expect(filtrarOpciones(PERSONAS, 'maria').map((o) => o.value)).toEqual(['2']);
  });

  it('y escribir con tilde encuentra lo que no la tiene', () => {
    expect(filtrarOpciones(PERSONAS, 'Rocío').map((o) => o.value)).toEqual(['4']);
  });

  it('la mayúscula tampoco', () => {
    expect(filtrarOpciones(PERSONAS, 'CARLA').map((o) => o.value)).toEqual(['1']);
  });

  it('normalizar deja el texto listo para comparar', () => {
    expect(normalizar('  Pérez ')).toBe('perez');
    expect(normalizar(null)).toBe('');
  });
});

describe('se busca donde el mostrador busca', () => {
  it('un pedazo del medio alcanza: no hace falta el principio', () => {
    expect(filtrarOpciones(PERSONAS, 'arl').map((o) => o.value)).toEqual(['1']);
  });

  it('el apellido del responsable encuentra a sus personas, aunque esté en el detalle', () => {
    expect(filtrarOpciones(PERSONAS, 'perez').map((o) => o.value)).toEqual(['1', '3']);
  });

  it('el convenio también, que es la otra manera de acordarse', () => {
    expect(filtrarOpciones(PERSONAS, 'mutualista').map((o) => o.value)).toEqual(['2', '3']);
  });

  it('sin nada escrito, la lista entera', () => {
    expect(filtrarOpciones(PERSONAS, '')).toHaveLength(4);
  });

  it('lo que no coincide con nada devuelve nada, no la lista entera', () => {
    expect(filtrarOpciones(PERSONAS, 'zzz')).toEqual([]);
  });
});

describe('el orden de la lista es de quien la arma', () => {
  it('filtrar conserva el orden en que venían', () => {
    // 'o' está en Gómez, Miguel y Rocio, y no en Carla: el resultado sale en el
    // orden de la lista, nunca en orden de "cuán bien coincide".
    const valores = filtrarOpciones(PERSONAS, 'o').map((o) => o.value);
    expect(valores).toEqual([...valores].sort());
  });
});

describe('el tope corta el dibujo, no la búsqueda', () => {
  const setecientas = Array.from({ length: 700 }, (_, i) => ({
    value: String(i), label: `Persona ${i}`,
  }));

  it('con tope, se devuelven los primeros y nada más', () => {
    expect(filtrarOpciones(setecientas, 'persona', 50)).toHaveLength(50);
  });

  it('sin tope, se devuelve todo lo que coincide', () => {
    expect(filtrarOpciones(setecientas, 'persona')).toHaveLength(700);
  });

  it('el tope no cambia qué coincide: filtra primero y corta después', () => {
    expect(filtrarOpciones(setecientas, 'persona 699', 50)).toHaveLength(1);
  });
});

describe('encontrar la opción por su valor', () => {
  it('la trae cuando está', () => {
    expect(opcionDe(PERSONAS, '3')?.label).toBe('Miguel');
  });

  it('sin valor no hay opción: un campo vacío no elige la primera', () => {
    expect(opcionDe(PERSONAS, '')).toBeNull();
    expect(opcionDe(PERSONAS, undefined)).toBeNull();
  });

  it('un valor que la lista no tiene no inventa nada', () => {
    expect(opcionDe(PERSONAS, 'borrado')).toBeNull();
  });
});
