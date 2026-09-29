import { Controller, Get, Post, Body, Req, BadRequestException } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../seguridad-512/nucleo/usuario-del-pedido';
import { SinSegundoPaso } from '../seguridad-512/nucleo/sin-segundo-paso.decorator';
import { PasoReciente } from '../seguridad-512/nucleo/paso-reciente.decorator';
import {
  BACKUP_CODE_COUNT,
  generateBackupCode,
  hashBackupCode,
  verifyBackupCode,
} from '../seguridad-512/nucleo/backup-codes';

/**
 * Los códigos de respaldo, recableados a `totp_backup_codes` de la #13.
 *
 * La lógica —generar, hashear con scrypt, verificar en tiempo constante— es del
 * núcleo del kit y no se toca. Lo de esta app es **dónde se guardan**, que en
 * Cenit era otra tabla con otro nombre.
 */

class CodigoDto {
  /* Diez caracteres del alfabeto sin ambiguos del kit (sin 0/O/1/I). Se acepta
     con guiones y en minúsculas porque la persona lo está copiando de un papel;
     `verifyBackupCode` canonicaliza antes de comparar. */
  @IsString()
  @Length(10, 24)
  @Matches(/^[A-Za-z0-9-]+$/, { message: 'El código solo lleva letras y números.' })
  codigo!: string;
}

@Controller('respaldo')
export class RespaldoController {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Cuántos códigos sin usar quedan. No devuelve ninguno: los códigos se ven
   * **una sola vez**, cuando se generan.
   */
  @Get('cuantos')
  async cuantos(@Req() pedido: unknown) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const { count, error } = await this.supabase
      .comoElUsuario(token)
      .from('totp_backup_codes')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', usuario.id)
      .is('usado_en', null);
    if (error) throw new BadRequestException('No pudimos contar tus códigos.');
    return { quedan: count ?? 0, de: BACKUP_CODE_COUNT };
  }

  /**
   * Genera diez códigos nuevos y **borra los anteriores**.
   *
   * ── Por qué `@PasoReciente(5)` ──────────────────────────────────────────
   * Tener la sesión en `aal2` significa «en algún momento del día puso el
   * código». Regenerar los de respaldo **invalida los que la persona tiene
   * guardados**: si alguien se levanta de una computadora abierta, con la
   * sesión viva alcanza para dejar a la dueña sin su vía de rescate. Es
   * exactamente el caso para el que el kit trae S6.
   */
  @Post('generar')
  @PasoReciente(5)
  async generar(@Req() pedido: unknown) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const codigos = Array.from({ length: BACKUP_CODE_COUNT }, () => generateBackupCode());

    const cliente = this.supabase.comoElUsuario(token);
    const borrado = await cliente.from('totp_backup_codes').delete().eq('persona_id', usuario.id);
    if (borrado.error) throw new BadRequestException('No pudimos reemplazar tus códigos.');

    const insercion = await cliente.from('totp_backup_codes').insert(
      codigos.map((codigo) => ({ persona_id: usuario.id, code_hash: hashBackupCode(codigo) })),
    );
    if (insercion.error) throw new BadRequestException('No pudimos guardar tus códigos.');

    /* La ÚNICA vez que los códigos en claro salen de este servidor. No se
       loguean, no se guardan y no se pueden volver a pedir. */
    return { codigos };
  }

  /**
   * Usa un código de respaldo para pasar el segundo paso.
   *
   * ── `@SinSegundoPaso`, y la razón es la razón de existir del kit ───────
   * Esta ruta **se llama desde la pantalla de entrada**, con la sesión en
   * `aal1`, por alguien que perdió el celular y por lo tanto no puede llegar a
   * `aal2` por el camino normal. Exigirle `aal2` para dejarlo llegar a `aal2`
   * es la puerta cerrada por dentro. Lo dice el `LEEME.md` del kit: «el código
   * de respaldo se usa desde la pantalla de entrada».
   *
   * Lo que la hace segura no es el guard sino el código: diez caracteres de un
   * alfabeto de 32 —cincuenta bits—, hasheados con scrypt, comparados en tiempo
   * constante y **quemados al primer uso**.
   */
  @Post('usar')
  @SinSegundoPaso('se llama desde la pantalla de entrada, con la sesión en aal1: es la vía de quien perdió el autenticador y no puede llegar a aal2 de otra forma')
  async usar(@Req() pedido: unknown, @Body() cuerpo: CodigoDto) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const cliente = this.supabase.comoElUsuario(token);

    const { data, error } = await cliente
      .from('totp_backup_codes')
      .select('id, code_hash')
      .eq('persona_id', usuario.id)
      .is('usado_en', null);
    if (error) throw new BadRequestException('No pudimos verificar tu código.');

    /* Se recorren TODOS y recién al final se decide, aunque el primero
       coincida: cortar en el acierto filtra por el tiempo de respuesta en qué
       posición estaba el código. `verifyBackupCode` ya compara en tiempo
       constante; esto es la misma idea un nivel más arriba. */
    let encontrado: string | null = null;
    for (const fila of data ?? []) {
      if (verifyBackupCode(cuerpo.codigo, fila.code_hash)) encontrado = fila.id;
    }
    if (!encontrado) throw new BadRequestException('Ese código no es válido o ya se usó.');

    const quemado = await cliente
      .from('totp_backup_codes')
      .update({ usado_en: new Date().toISOString() })
      .eq('id', encontrado)
      .is('usado_en', null)
      .select('id');
    /* Si el `update` no tocó ninguna fila, otro pedido lo quemó primero: el
       código ya se usó y esta llamada no vale. La condición `is('usado_en',
       null)` es lo que hace que la carrera se resuelva en la base y no acá. */
    if (quemado.error || (quemado.data ?? []).length === 0) {
      throw new BadRequestException('Ese código no es válido o ya se usó.');
    }

    const restantes = (data ?? []).length - 1;
    return { ok: true, quedan: restantes };
  }
}
