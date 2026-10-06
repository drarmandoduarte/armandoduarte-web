import {
  BadRequestException, Body, Controller, ForbiddenException, Get, Logger, NotFoundException, Post, Req,
} from '@nestjs/common';
import { IsIn, IsUUID } from 'class-validator';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../acceso/nucleo/usuario-del-pedido';
import { esEquipo } from '../acceso/nucleo/roles';

class RestaurarDto {
  @IsIn(['curso', 'edicion'])
  tipo!: 'curso' | 'edicion';

  @IsUUID()
  id!: string;
}

/** Una fila de `en_la_papelera()` (014). */
export interface Borrado {
  tipo: 'curso' | 'edicion';
  id: string;
  nombre: string;
  borrado_el: string;
  persona: string;
}

/**
 * La papelera (orden #37, PR 3, §9) — la pantalla es `<Papelera>` del molde.
 *
 * Es del equipo: un curso archivado o una edición cerrada **sin inscripciones**
 * (la regla está en la 014, con su porqué). Con segundo paso, como todo el panel
 * (lo pide el guard global: esta ruta no tiene excepción).
 *
 * `GET` primero **vacía lo vencido** —lo que lleva más de 30 días— y después
 * lee: el borrado definitivo lo hace la app en su base, y este es el momento en
 * que alguien la mira. Si vaciar falla, se lee igual y se anota en el log: una
 * papelera que no se vació hoy se vacía la próxima vez.
 */
@Controller('papelera')
export class PapeleraController {
  private readonly logger = new Logger(PapeleraController.name);

  constructor(private readonly supabase: SupabaseService) {}

  private async delEquipo(pedido: unknown): Promise<string> {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const rol = await this.supabase.rolDe(token, usuario.id);
    if (!esEquipo(rol)) throw new ForbiddenException({ message: 'Esta parte es del equipo.', code: 'SOLO_EQUIPO' });
    return token;
  }

  @Get()
  async leer(@Req() pedido: unknown): Promise<{ items: Borrado[] }> {
    const token = await this.delEquipo(pedido);
    const cliente = this.supabase.comoElUsuario(token);
    const vaciado = await cliente.rpc('vaciar_la_papelera');
    if (vaciado.error) this.logger.warn(`No se pudo vaciar la papelera: ${vaciado.error.code ?? 'sin código'}`);
    const { data, error } = await cliente.rpc('en_la_papelera');
    if (error) {
      this.logger.warn(`No se pudo leer la papelera: ${error.code ?? 'sin código'}`);
      throw new BadRequestException({ message: 'No pudimos leer la papelera.', code: 'DESCONOCIDO' });
    }
    return { items: (data ?? []) as Borrado[] };
  }

  @Post('restaurar')
  async restaurar(@Req() pedido: unknown, @Body() cuerpo: RestaurarDto) {
    const token = await this.delEquipo(pedido);
    const { error } = await this.supabase.comoElUsuario(token)
      .rpc('restaurar_de_la_papelera', { tipo: cuerpo.tipo, fila: cuerpo.id });
    if (error) {
      if (/NO_ESTA/.test(error.message ?? '')) throw new NotFoundException({ message: 'Eso ya no está en la papelera.', code: 'NO_ESTA' });
      this.logger.warn(`No se pudo restaurar: ${error.code ?? 'sin código'}`);
      throw new BadRequestException({ message: 'No pudimos restaurarlo.', code: 'DESCONOCIDO' });
    }
    return { ok: true };
  }
}
