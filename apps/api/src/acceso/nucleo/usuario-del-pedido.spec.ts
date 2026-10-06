import { describe, it, expect, vi } from 'vitest';

import { usuarioDelPedido } from './usuario-del-pedido';

/**
 * UNA sola validación del token por pedido.
 *
 * Desde que `Aal2Guard` es global (S3), las rutas que además usan
 * `SupabaseAuthGuard` validaban el MISMO token contra Supabase dos veces por
 * pedido: dos viajes de red idénticos, uno al lado del otro. El catálogo de
 * propiedades es donde más se nota.
 */

describe('usuarioDelPedido', () => {
  it('valida una vez y reutiliza dentro del MISMO pedido', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    const pedido = {};
    const a = await usuarioDelPedido(pedido, 'tok', { getUserFromToken: verificar });
    const b = await usuarioDelPedido(pedido, 'tok', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('un token DISTINTO se vuelve a validar aunque sea el mismo pedido', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    const pedido = {};
    await usuarioDelPedido(pedido, 'tok-a', { getUserFromToken: verificar });
    await usuarioDelPedido(pedido, 'tok-b', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(2);
  });

  it('NO hay caché entre pedidos: otro pedido con el mismo token revalida', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    await usuarioDelPedido({}, 'tok', { getUserFromToken: verificar });
    await usuarioDelPedido({}, 'tok', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(2);
  });

  it('si el pedido no admite guardar nada, valida siempre (falla hacia la validación)', async () => {
    const verificar = vi.fn().mockResolvedValue({ id: 'u1', email: 'ana@x.com' });
    await usuarioDelPedido(null, 'tok', { getUserFromToken: verificar });
    await usuarioDelPedido(null, 'tok', { getUserFromToken: verificar });
    expect(verificar).toHaveBeenCalledTimes(2);
  });

  it('propaga el error del verificador (no se inventa un usuario)', async () => {
    const verificar = vi.fn().mockRejectedValue(new Error('token inválido'));
    await expect(usuarioDelPedido({}, 'tok', { getUserFromToken: verificar })).rejects.toThrow(
      'token inválido',
    );
  });
});
