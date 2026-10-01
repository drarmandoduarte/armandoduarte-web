import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../seguridad-512/nucleo/usuario-del-pedido';
import { esEquipo } from '../seguridad-512/nucleo/roles';
import { EquipoRepositorio } from './equipo.repositorio';
import { CursoDto, EdicionDto, EdicionNuevaDto, SumarAlEquipoDto } from './equipo.dto';

/**
 * `/api/equipo/*` — el panel del equipo, orden #24 A.
 *
 * ── Tres frenos, y ninguno reemplaza a los otros ─────────────────────────
 *   1. **El guard global del kit** (`Aal2Guard`): a una cuenta de equipo sin
 *      segundo paso le devuelve `403 AAL2_REQUIRED` antes de llegar acá.
 *   2. **Este controlador**: un cliente pasa el guard con `aal1` —el kit no le
 *      exige TOTP— y acá se lo frena con `403 SOLO_EQUIPO`. «Sumar» y «Quitar»
 *      piden además que sea el dueño (`SOLO_DUENO`).
 *   3. **La base**: todo va con el token de quien pide (`EquipoRepositorio`) y
 *      la RLS decide qué filas existen. Si 1 y 2 se cayeran, un cliente vería
 *      listas vacías, no datos de nadie. Lo prueba el banco (`el-panel-del-
 *      equipo.test.ts` en `@codice/db`).
 *
 * Solo `GET` y `POST`: `api()` de la pantalla habla esos dos verbos, y editar es
 * un `POST` a la ruta de la fila, como en el resto de esta API.
 */
@Controller('equipo')
export class EquipoController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly repositorio: EquipoRepositorio,
  ) {}

  /** El token y quién es, con el rol que dice la base. Frena al que no es equipo. */
  private async quienPide(pedido: unknown, soloDueno = false) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const rol = await this.supabase.rolDe(token, usuario.id);
    if (!esEquipo(rol)) {
      throw new ForbiddenException({ message: 'Esta parte es del equipo.', code: 'SOLO_EQUIPO' });
    }
    if (soloDueno && rol !== 'dueno') {
      throw new ForbiddenException({ message: 'Solo el dueño puede cambiar el equipo.', code: 'SOLO_DUENO' });
    }
    return { token, id: usuario.id, rol };
  }

  @Get('cursos')
  async cursos(@Req() pedido: unknown) {
    const { token } = await this.quienPide(pedido);
    return { cursos: await this.repositorio.cursos(token) };
  }

  @Post('cursos')
  async crearCurso(@Req() pedido: unknown, @Body() cuerpo: CursoDto) {
    const { token } = await this.quienPide(pedido);
    await this.repositorio.crearCurso(token, { ...cuerpo });
    return { ok: true };
  }

  @Post('cursos/:id')
  async editarCurso(@Req() pedido: unknown, @Param('id', ParseUUIDPipe) id: string, @Body() cuerpo: CursoDto) {
    const { token } = await this.quienPide(pedido);
    await this.repositorio.editarCurso(token, id, { ...cuerpo });
    return { ok: true };
  }

  @Post('ediciones')
  async crearEdicion(@Req() pedido: unknown, @Body() cuerpo: EdicionNuevaDto) {
    const { token } = await this.quienPide(pedido);
    this.finDespuesDelInicio(cuerpo);
    await this.repositorio.crearEdicion(token, { ...cuerpo });
    return { ok: true };
  }

  @Post('ediciones/:id')
  async editarEdicion(@Req() pedido: unknown, @Param('id', ParseUUIDPipe) id: string, @Body() cuerpo: EdicionDto) {
    const { token } = await this.quienPide(pedido);
    this.finDespuesDelInicio(cuerpo);
    await this.repositorio.editarEdicion(token, id, { ...cuerpo });
    return { ok: true };
  }

  @Get('inscriptos/:edicion')
  async inscriptos(@Req() pedido: unknown, @Param('edicion', ParseUUIDPipe) edicion: string) {
    const { token } = await this.quienPide(pedido);
    return { inscriptos: await this.repositorio.inscriptos(token, edicion) };
  }

  @Get('clientes')
  async clientes(@Req() pedido: unknown) {
    const { token } = await this.quienPide(pedido);
    return { clientes: await this.repositorio.clientes(token) };
  }

  @Post('miembros')
  async sumar(@Req() pedido: unknown, @Body() cuerpo: SumarAlEquipoDto) {
    const { token, id } = await this.quienPide(pedido, true);
    if (cuerpo.persona_id === id) {
      throw new BadRequestException({ message: 'No puedes cambiar tu propio lugar en el equipo.', code: 'NO_VALIDO' });
    }
    await this.repositorio.sumarAlEquipo(token, cuerpo.persona_id, cuerpo.territorio, id);
    return { ok: true };
  }

  @Post('miembros/:id/quitar')
  async quitar(@Req() pedido: unknown, @Param('id', ParseUUIDPipe) persona: string) {
    const { token, id } = await this.quienPide(pedido, true);
    if (persona === id) {
      throw new BadRequestException({ message: 'No puedes quitarte a ti mismo del equipo.', code: 'NO_VALIDO' });
    }
    await this.repositorio.quitarDelEquipo(token, persona);
    return { ok: true };
  }

  /** La base también lo exige (`ediciones_fin_despues_del_inicio`); acá se contesta antes y en claro. */
  private finDespuesDelInicio(e: EdicionDto) {
    if (Date.parse(e.fin) <= Date.parse(e.inicio)) {
      throw new BadRequestException({ message: 'El fin tiene que ser después del inicio.', code: 'NO_VALIDO' });
    }
  }
}
