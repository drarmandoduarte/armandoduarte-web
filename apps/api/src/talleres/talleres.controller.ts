import { BadRequestException, Body, Controller, Get, Post, Req } from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../seguridad-512/nucleo/usuario-del-pedido';
import { TalleresRepositorio } from './talleres.repositorio';
import { InscribirmeDto } from './talleres.dto';

/**
 * `/api/talleres` — «Talleres abiertos», «Me anoto» y «Mis talleres», orden #24 B.
 *
 * Para cualquiera con sesión: un **cliente** pasa el guard del kit con `aal1`
 * (no tiene autenticador que pedirle) y una cuenta de **equipo** necesita
 * `aal2`, como en todo lo demás. Por eso no lleva `@SinSegundoPaso`.
 *
 * Lo que se anota es siempre la persona del token: no hay campo para anotar a
 * otro, ni acá ni en la base (`inscribirme()` usa `auth.uid()`).
 */
@Controller('talleres')
export class TalleresController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly repositorio: TalleresRepositorio,
  ) {}

  @Get()
  async talleres(@Req() pedido: unknown) {
    const token = tokenDelPedido(pedido);
    await usuarioDelPedido(pedido, token, this.supabase);
    const [abiertos, mios] = await Promise.all([this.repositorio.abiertos(token), this.repositorio.mios(token)]);
    return { abiertos, mios };
  }

  /**
   * Anotarse. Si a la ficha le faltaban nombre, apellido o WhatsApp, tienen que
   * venir en el cuerpo y se guardan **antes** de inscribir: una inscripción sin
   * forma de avisarle a la persona no le sirve a Gaby.
   *
   * ── Por qué esto NO importa `@codice/core` ──────────────────────────────
   * La regla completa (qué falta, qué WhatsApp sirve) vive en `core` y la usa
   * la pantalla. Acá no se la puede importar: `core` exporta su fuente `.ts`, y
   * la función de Vercel no compila los paquetes del workspace — lo vigila
   * `apps/familia/src/la-api-llega-compilada.test.ts`, que se puso rojo en esta
   * misma rama. Lo que queda acá es el **piso** del servidor: que después de
   * esta llamada la ficha tenga los tres datos (la forma del WhatsApp la mira
   * el DTO). Compilar `core` para que la API lo reuse es una decisión de
   * dirección y está en el informe de la #24 B.
   */
  @Post('inscribirme')
  async inscribirme(@Req() pedido: unknown, @Body() cuerpo: InscribirmeDto) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const persona = await this.supabase.personaDe(token, usuario.id);

    /* Solo se completa lo que la ficha no tenía: nunca se pisa un dato que ya está. */
    const nuevos: Record<string, string> = {};
    for (const campo of ['nombre', 'apellido', 'whatsapp'] as const) {
      const valor = cuerpo[campo]?.trim();
      if (!persona?.[campo]?.trim() && valor) nuevos[campo] = valor;
    }
    const faltan = (['nombre', 'apellido', 'whatsapp'] as const).filter((c) => !persona?.[c]?.trim() && !nuevos[c]);
    if (faltan.length > 0) {
      throw new BadRequestException({ message: 'Faltan datos para anotarte.', code: 'FALTAN_DATOS', campos: faltan });
    }
    await this.repositorio.completarFicha(token, usuario.id, nuevos);

    const { referencia, ya_estaba } = await this.repositorio.inscribirme(token, cuerpo.edicion_id);
    const cobro = await this.repositorio.cobroVigente(token);
    return { referencia, ya_estaba, cobro };
  }
}
