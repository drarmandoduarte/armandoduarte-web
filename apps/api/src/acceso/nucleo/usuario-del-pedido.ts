import type { UsuarioVerificado } from './verificador-de-token';

/**
 * KIT DE ACCESO · NÚCLEO — NO se edita en una app.
 *
 * UNA sola validación del token por pedido.
 *
 * Desde que el guard del segundo paso es global (S3), las rutas que además
 * usan el guard de sesión de la app validan el MISMO token contra el proveedor
 * de identidad dos veces por pedido — dos viajes de red idénticos, uno al
 * lado del otro. El catálogo de propiedades es donde más se nota.
 *
 * Acá el primero que valida deja el resultado colgado del objeto `request`, y
 * el segundo lo reutiliza SOLO si el token es exactamente el mismo.
 *
 * Por qué esto es seguro:
 *  - El alcance es el objeto `request`, que Node crea y descarta por pedido. NO
 *    hay caché global, ni por usuario, ni por token: nada sobrevive al pedido.
 *  - La llave es el token completo. Un token distinto = validación nueva. No se
 *    confía en el `sub` ni en ningún claim para decidir el reúso.
 *  - Si el request no es un objeto donde se pueda guardar nada, se valida
 *    siempre. Falla hacia la validación, nunca hacia el atajo.
 */

/** Propiedad donde se cuelga el resultado. Prefijada para no chocar con nada. */
const RANURA = '__acceso_usuarioVerificado';

interface Ranura {
  token: string;
  usuario: UsuarioVerificado;
}

interface PedidoConRanura {
  [RANURA]?: Ranura;
}

/**
 * Devuelve el usuario del token, validándolo una sola vez por pedido.
 *
 * @param pedido   El objeto `request` del pedido en curso (alcance del reúso).
 * @param token    El access token crudo, ya recortado del header.
 * @param verificador Quien valida de verdad contra el proveedor de identidad.
 */
export async function usuarioDelPedido<U extends UsuarioVerificado>(
  pedido: unknown,
  token: string,
  verificador: { getUserFromToken(token: string | undefined): Promise<U> },
): Promise<U> {
  const ranura = leerRanura(pedido);
  // El genérico deja que cada app conserve SU tipo de usuario (en Cenit,
  // `AuthenticatedUser` con el email) sin que el núcleo lo conozca. Lo guardado
  // en el pedido salió del mismo verificador que se está usando ahora.
  if (ranura && ranura.token === token) return ranura.usuario as U;

  const usuario = await verificador.getUserFromToken(token);
  guardarRanura(pedido, { token, usuario });
  return usuario;
}

function leerRanura(pedido: unknown): Ranura | undefined {
  if (typeof pedido !== 'object' || pedido === null) return undefined;
  const guardado = (pedido as PedidoConRanura)[RANURA];
  if (!guardado || typeof guardado.token !== 'string' || !guardado.usuario) return undefined;
  return guardado;
}

function guardarRanura(pedido: unknown, ranura: Ranura): void {
  if (typeof pedido !== 'object' || pedido === null) return;
  try {
    (pedido as PedidoConRanura)[RANURA] = ranura;
  } catch {
    // Request congelado/proxy raro: se revalida en el próximo guard. Sin atajo.
  }
}
