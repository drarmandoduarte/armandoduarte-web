/**
 * Un icono que falta grita en desarrollo.
 *
 * ── Qué guarda ─────────────────────────────────────────────────────────────
 * `Icon` devolvía `null` sin decir nada cuando el nombre no existía. **Un icono
 * que falta no se ve como un error: se ve como un espacio**, y por eso tres
 * nombres rotos convivieron con la app sin que nadie los reportara.
 *
 * El arreglo tiene dos mitades y las dos se prueban aquí:
 *
 *   1. **avisa**, para que en desarrollo se entere quien está mirando;
 *   2. **y no cambia nada de lo que ve una profesional**: sigue devolviendo
 *      `null`. Un icono que falta no puede tirar abajo un trabajo a la mitad,
 *      y dibujar un cuadrado de emergencia sería meter en la pantalla algo que
 *      nadie diseñó.
 *
 * La tercera comprobación es la que evita que el arreglo se vuelva insoportable:
 * **avisa una vez por nombre y no una por render**. Un icono roto en una lista
 * de veinte filas llenaría la consola de veinte copias y el resto se perdería —
 * que es otra manera de no avisar.
 *
 * ── Alcance declarado ─────────────────────────────────────────────────────
 * Llama a `Icon()` como función, sin montar React: lo que se mide es qué
 * devuelve y qué escribe, no cómo se dibuja. **No** comprueba el bundle de
 * producción —ahí `import.meta.env.DEV` es `false` y el aviso no sale, que es
 * justamente lo que se quiere—; eso se lee en el fuente y está declarado en su
 * comentario.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Icon } from './Icon.jsx';

let errores;

beforeEach(() => {
  errores = [];
  vi.spyOn(console, 'error').mockImplementation((...args) => { errores.push(args.join(' ')); });
});

afterEach(() => { vi.restoreAllMocks(); });

describe('el piso: Icon dibuja lo que sí existe', () => {
  it('un nombre bueno devuelve un elemento y no avisa de nada', () => {
    // Sin esto, un `Icon` que devolviera `null` siempre dejaría en verde las dos
    // comprobaciones de abajo por la razón equivocada.
    expect(Icon({ name: 'house' }), 'piso · «house» tiene que dibujar').not.toBeNull();
    expect(errores, 'piso · un icono que existe no avisa').toEqual([]);
  });
});

describe('un icono que falta avisa, y no rompe nada', () => {
  it('avisa por consola, con el nombre adentro', () => {
    Icon({ name: 'este-icono-no-existe' });
    expect(errores.length, 'tiene que haber avisado').toBe(1);
    expect(errores[0], 'el aviso tiene que decir cuál').toContain('este-icono-no-existe');
  });

  it('y sigue devolviendo null: en la pantalla no cambia nada', () => {
    expect(Icon({ name: 'otro-que-tampoco-existe' })).toBeNull();
  });

  it('avisa una vez por nombre, no una por render', () => {
    for (let i = 0; i < 20; i += 1) Icon({ name: 'uno-solo-repetido' });
    expect(errores.length, 'veinte renglones con el mismo icono roto son un aviso, no veinte').toBe(1);
  });
});
