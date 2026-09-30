import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { idDeEsteAparato } from './aparato';
import { clave } from './nombres';

/**
 * El id del aparato existe para UNA pregunta: "¿este navegador ya entró antes?".
 * Que sea estable importa: si cambiara en cada visita, la persona recibiría un
 * "entraste desde un aparato nuevo" todos los días y dejaría de leerlos — que es
 * la forma más segura de arruinar un aviso de seguridad.
 */
describe('idDeEsteAparato', () => {
  beforeEach(() => localStorage.clear());

  it('se genera una vez y después es el mismo', () => {
    const primero = idDeEsteAparato();
    expect(primero).toBeTruthy();
    expect(idDeEsteAparato()).toBe(primero);
    expect(idDeEsteAparato()).toBe(primero);
  });

  it('cumple el formato que valida el backend (16-64, letras/números/guiones)', () => {
    expect(idDeEsteAparato()).toMatch(/^[A-Za-z0-9-]{16,64}$/);
  });

  it('un valor guardado con formato inválido se reemplaza', () => {
    localStorage.setItem(clave('aparato_id'), 'corto');
    const id = idDeEsteAparato();
    expect(id).not.toBe('corto');
    expect(id).toMatch(/^[A-Za-z0-9-]{16,64}$/);
  });

  it('sin crypto.randomUUID igual genera algo válido', () => {
    const original = crypto.randomUUID;
    // @ts-expect-error se saca a propósito para probar el respaldo
    crypto.randomUUID = undefined;
    try {
      expect(idDeEsteAparato()).toMatch(/^[A-Za-z0-9-]{16,64}$/);
    } finally {
      crypto.randomUUID = original;
    }
  });

  describe('sin almacenamiento', () => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;

    afterEach(() => {
      Storage.prototype.getItem = getItem;
      Storage.prototype.setItem = setItem;
    });

    /**
     * En una ventana privada no hay dónde guardar. Se devuelve `null` y el aviso
     * no se manda: mejor eso que inventar un id nuevo cada vez y avisar "aparato
     * nuevo" en cada visita.
     */
    it('devuelve null en vez de inventar un id distinto cada vez', () => {
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('sin permiso');
      });
      expect(idDeEsteAparato()).toBeNull();
    });
  });
});
