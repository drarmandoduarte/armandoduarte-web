import { BadRequestException, Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../acceso/nucleo/usuario-del-pedido';
import { SinSegundoPaso } from '../acceso/nucleo/sin-segundo-paso.decorator';
import { CorreoService } from '../correo/correo.service';
import { TEXTOS_DEL_RESCATE, rellenar, type IdiomaDelCorreo } from '../correo/textos';
import { RescateRepositorio, type Rescate } from './rescate.repositorio';

/**
 * El rescate solo — orden #37, PR 2 (fase-2 §8 del molde).
 *
 * Mi espacio es de **rescate solo**: nadie resetea el autenticador de otra
 * persona —ni el dueño—, así que no hay ninguna ruta para hacerlo. Quien perdió
 * el teléfono **y** los códigos de respaldo:
 *
 *   1. `POST /api/rescate/pedir` con su correo. Se crea el pedido (vence a las
 *      48 h) y salen dos correos: el de **confirmación** (enlace para
 *      confirmar) y el de **aviso** (enlace para cancelar).
 *   2. `POST /api/rescate/confirmar` desde el enlace del primer correo.
 *   3. `POST /api/rescate/cancelar` desde el del segundo, si no fue ella.
 *   4. Cumplidas las 48 h, entra con el código por correo (sesión en `aal1`) y
 *      la pantalla llama a `POST /api/rescate/aplicar`: se borran su
 *      autenticador y sus códigos, y el núcleo la manda a enrolar uno nuevo.
 *
 * Las cuatro llevan `@SinSegundoPaso`, y lo que las hace seguras no es el guard
 * (ver `aal2-cobertura.spec.ts`):
 *
 *   · `pedir` contesta **igual** exista o no el correo, tenga o no
 *     autenticador: `{ vence }` a 48 h. No sirve para averiguar quién tiene
 *     cuenta. Y con un pedido ya abierto devuelve ese, sin mandar más correos.
 *   · `confirmar` y `cancelar` piden el token del enlace: 32 bytes al azar que
 *     solo viajan en el correo; en la base está su SHA-256 y se compara en
 *     tiempo constante. Las páginas que abren esos enlaces no llaman solas: hay
 *     que tocar un botón (un lector de correo que abre los enlaces no confirma
 *     nada).
 *   · `aplicar` solo hace algo con un rescate **de quien llama** (por su token
 *     validado), confirmado, sin cancelar, sin usar y vencido.
 *
 * La regla del vencimiento la escribe `@codice/core` (`estadoDelRescate`) para
 * la pantalla; acá la sostiene la consulta y, debajo, la base (013).
 */

/** Las 48 horas, otra vez: la API no puede importar `@codice/core` (ver `correo/textos.ts`). La 013 la exige igual. */
export const HORAS_DE_ESPERA = 48;
const MS_DE_ESPERA = HORAS_DE_ESPERA * 60 * 60 * 1000;

/** La app, adonde llevan los enlaces del correo. Es `APP_FAMILIA` de `@codice/core` (#25), como en pagos. */
export const BASE_DE_LA_APP = 'https://familia.armandoduarte.com';

const IDIOMAS = ['es', 'en', 'pt'] as const;

class PedirDto {
  @IsEmail({}, { message: 'Ese correo no es válido.' })
  @MaxLength(254)
  correo!: string;

  /** El idioma de la pantalla desde la que se pidió: el de los dos correos. */
  @IsOptional()
  @IsIn(IDIOMAS)
  idioma?: IdiomaDelCorreo;
}

class EnlaceDto {
  @IsUUID()
  id!: string;

  /* 32 bytes en base64url, sin relleno: 43 caracteres. */
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  token!: string;

  @IsOptional()
  @IsIn(IDIOMAS)
  idioma?: IdiomaDelCorreo;
}

export const hashDelToken = (token: string): string => createHash('sha256').update(token).digest('hex');

function mismoToken(token: string, hash: string): boolean {
  const a = Buffer.from(hashDelToken(token), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** La fecha de vencimiento como la lee una persona, en su zona (D15) y su idioma. */
export function fechaDelCorreo(vence: Date, idioma: IdiomaDelCorreo, zona: string | null): string {
  const local = idioma === 'en' ? 'en-US' : idioma === 'pt' ? 'pt-BR' : 'es-MX';
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  };
  try {
    return new Intl.DateTimeFormat(local, { ...opciones, timeZone: zona ?? 'America/Mexico_City' }).format(vence);
  } catch {
    return new Intl.DateTimeFormat(local, { ...opciones, timeZone: 'America/Mexico_City' }).format(vence);
  }
}

export function enlace(id: string, token: string, accion: 'confirmar' | 'cancelar'): string {
  const q = new URLSearchParams({ r: id, t: token, a: accion });
  return `${BASE_DE_LA_APP}/rescate?${q.toString()}`;
}

@Controller('rescate')
export class RescateController {
  private readonly logger = new Logger(RescateController.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly repo: RescateRepositorio,
    private readonly correo: CorreoService,
  ) {}

  @Post('pedir')
  @SinSegundoPaso('rescate solo: lo pide quien perdió el autenticador y los códigos, sin sesión; contesta igual exista o no el correo')
  async pedir(@Body() cuerpo: PedirDto): Promise<{ vence: string }> {
    const ahora = new Date();
    const respuestaNeutra = { vence: new Date(ahora.getTime() + MS_DE_ESPERA).toISOString() };
    const idioma = cuerpo.idioma ?? 'es';

    const persona = await this.repo.personaPorCorreo(cuerpo.correo);
    /* Sin cuenta, o sin autenticador que resetear: la misma respuesta, y nada
       más. Ni un correo ni una fila. */
    if (!persona || !(await this.repo.tieneAutenticador(persona.id))) return respuestaNeutra;

    const abierto = await this.repo.abiertoDe(persona.id);
    if (abierto) {
      /* Uno sin confirmar que ya venció no vale: se cierra y se pide otro. Uno
         vigente se devuelve tal cual, sin mandar más correos (pedir de nuevo no
         sirve para llenarle la casilla a nadie). */
      const caducado = !abierto.confirmado_el && new Date(abierto.vence_el).getTime() <= ahora.getTime();
      if (!caducado) return { vence: new Date(abierto.vence_el).toISOString() };
      await this.repo.cerrar(abierto.id, 'cancelado_el');
    }

    const token = randomBytes(32).toString('base64url');
    const vence = new Date(ahora.getTime() + MS_DE_ESPERA);
    const id = await this.repo.crear({ userId: persona.id, pedido: ahora, vence, tokenHash: hashDelToken(token) });

    const para = await this.repo.correoDe(persona.id);
    if (para) {
      const textos = TEXTOS_DEL_RESCATE[idioma];
      const fecha = fechaDelCorreo(vence, idioma, persona.zona);
      /* El correo es la única forma de confirmar: si no sale, se dice en el log
         (sin la dirección de nadie) y el pedido queda abierto. Se puede volver
         a pedir cuando caduque. */
      const confirmacion = await this.correo.enviar({
        para,
        asunto: textos.confirm.subject,
        texto: rellenar(textos.confirm.body, { enlace: enlace(id, token, 'confirmar'), fecha }),
      });
      const aviso = await this.correo.enviar({
        para,
        asunto: textos.notice.subject,
        texto: rellenar(textos.notice.body, { enlace: enlace(id, token, 'cancelar') }),
      });
      if (!confirmacion || !aviso) this.logger.warn('Rescate pedido, pero algún correo no salió.');
    }
    return { vence: vence.toISOString() };
  }

  @Post('confirmar')
  @SinSegundoPaso('rescate solo: se abre desde el enlace del correo, sin sesión; vale solo con el token del enlace')
  async confirmar(@Body() cuerpo: EnlaceDto): Promise<{ vence: string }> {
    const rescate = await this.delEnlace(cuerpo);
    /* Sin confirmar dentro de las 48 h, caducó (`estadoDelRescate` de core):
       confirmarlo después lo dejaría listo en el acto, sin la espera. */
    if (!rescate.confirmado_el && new Date(rescate.vence_el).getTime() <= Date.now()) throw this.invalido();
    if (!rescate.confirmado_el && !(await this.repo.cerrar(rescate.id, 'confirmado_el'))) throw this.invalido();
    return { vence: new Date(rescate.vence_el).toISOString() };
  }

  @Post('cancelar')
  @SinSegundoPaso('rescate solo: se abre desde el enlace del correo de aviso, sin sesión; vale solo con el token del enlace')
  async cancelar(@Body() cuerpo: EnlaceDto): Promise<{ ok: true }> {
    const rescate = await this.delEnlace(cuerpo);
    if (!(await this.repo.cerrar(rescate.id, 'cancelado_el'))) throw this.invalido();
    return { ok: true };
  }

  @Post('aplicar')
  @SinSegundoPaso('rescate solo: a las 48 h la persona entra con el código por correo (aal1) y no puede llegar a aal2 sin autenticador')
  async aplicar(@Req() pedido: unknown): Promise<{ aplicado: boolean }> {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const rescate = await this.repo.abiertoDe(usuario.id);
    const listo = rescate !== null && rescate.confirmado_el !== null
      && new Date(rescate.vence_el).getTime() <= Date.now();
    if (!listo || !rescate) return { aplicado: false };

    await this.repo.borrarAutenticadores(usuario.id);
    await this.repo.cerrar(rescate.id, 'usado_el');
    return { aplicado: true };
  }

  /** El rescate de un enlace, si el token es el suyo y sigue abierto. Si no, el mismo 400 para todo. */
  private async delEnlace(cuerpo: EnlaceDto): Promise<Rescate> {
    const rescate = await this.repo.porId(cuerpo.id);
    if (!rescate || !mismoToken(cuerpo.token, rescate.token_hash)) throw this.invalido();
    if (rescate.cancelado_el || rescate.usado_el) throw this.invalido();
    return rescate;
  }

  private invalido(): BadRequestException {
    return new BadRequestException({ message: 'Ese enlace ya no es válido.', code: 'RESCATE_INVALIDO' });
  }
}
