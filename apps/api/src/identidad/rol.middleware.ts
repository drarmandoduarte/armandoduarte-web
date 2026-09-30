import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { SupabaseService } from './supabase.service';
import { usuarioDelPedido } from '../seguridad-512/nucleo/usuario-del-pedido';

/**
 * Deja el rol de quien pide en `request.profile.role`, **antes** del guard.
 *
 * ── Por qué existe, y por qué es middleware y no otro guard ─────────────
 * El `Aal2Guard` del kit consulta `request.profile.role` para saber si esta
 * cuenta es de equipo (y entonces exigirle el segundo paso) o de cliente (y
 * dejarla pasar). Esa lectura es **defensiva**: si nadie resolvió el perfil,
 * `undefined` significa «no sé» y el guard **falla cerrado**, o sea le pide
 * `aal2` a todo el mundo, clientes incluidos. Eso dejaría a una mamá que se
 * inscribió a un taller obligada a configurar un autenticador para ver su
 * propia inscripción, que es exactamente lo que la clasificación de roles del
 * kit existe para evitar.
 *
 * Va como **middleware** y no como un guard más porque en Nest los middlewares
 * corren antes que los guards; un segundo guard no tiene orden garantizado
 * contra el global. Y el núcleo del kit no se toca para acomodarlo.
 *
 * ── No autentica: eso lo hace el guard ──────────────────────────────────
 * Si el token falta o es inválido, este middleware **no tira**: deja el pedido
 * sin `profile` y sigue. Quien rechaza es el guard, un paso después, con su
 * 401. Dos lugares tirando 401 por lo mismo es un lugar donde un día uno de los
 * dos deja de hacerlo. Y `usuarioDelPedido` guarda el resultado en el pedido,
 * así que la validación que hace acá es la **misma** que el guard reusa: no hay
 * dos viajes de red.
 */
@Injectable()
export class RolMiddleware implements NestMiddleware {
  constructor(private readonly supabase: SupabaseService) {}

  async use(pedido: Request, _respuesta: Response, siguiente: NextFunction): Promise<void> {
    const crudo = pedido.headers?.authorization;
    const uno = Array.isArray(crudo) ? crudo[0] : crudo;
    const token = uno?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return siguiente();

    try {
      const usuario = await usuarioDelPedido(pedido, token, this.supabase);
      const rol = await this.supabase.rolDe(token, usuario.id);
      (pedido as Request & { profile?: { role: string } }).profile = { role: rol };
    } catch {
      /* Token inválido, o la base no contestó: se sigue sin perfil y el guard
         decide. Falla cerrado por construcción — sin `profile`, el guard exige
         el segundo paso. */
    }
    return siguiente();
  }
}
