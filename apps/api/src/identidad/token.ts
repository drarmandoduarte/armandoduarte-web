import { UnauthorizedException } from '@nestjs/common';

/**
 * El access token crudo del pedido, recortado del header.
 *
 * Existe una sola copia de esta lectura a propósito: el guard del kit hace la
 * suya adentro del núcleo (que no se toca) y los controladores necesitan el
 * mismo token para hablarle a Supabase con la identidad de quien pide. Dos
 * lecturas distintas del mismo header son dos formas de equivocarse.
 */
export function tokenDelPedido(pedido: unknown): string {
  const headers = (pedido as { headers?: Record<string, string | string[] | undefined> })?.headers;
  const crudo = headers?.authorization;
  const uno = Array.isArray(crudo) ? crudo[0] : crudo;
  const token = uno?.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new UnauthorizedException('Falta el token de acceso.');
  return token;
}
