import { Controller, Get } from '@nestjs/common';
import { SinSegundoPaso } from './seguridad-512/nucleo/sin-segundo-paso.decorator';

/**
 * `GET /api/salud` — ¿está viva la función?
 *
 * No devuelve **ningún dato**: ni quién pregunta, ni qué versión corre, ni qué
 * variables hay cargadas. Es a propósito, porque es la única ruta pública de
 * toda la API y lo que se publica sin sesión se publica para todo internet.
 */
@Controller('salud')
export class SaludController {
  @Get()
  @SinSegundoPaso('chequeo de vida sin datos: no lee la base, no mira el token y no devuelve nada de nadie')
  salud() {
    return { ok: true };
  }
}
