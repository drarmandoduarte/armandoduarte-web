import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { SupabaseService } from '../identidad/supabase.service';
import { tokenDelPedido } from '../identidad/token';
import { usuarioDelPedido } from '../seguridad-512/nucleo/usuario-del-pedido';
import { esEquipo } from '../seguridad-512/nucleo/roles';
import { CorreoService } from '../correo/correo.service';
import { TEXTOS_DE_CORREO, rellenar } from '../correo/textos';
import { DeclararDto, ResolverDto } from './pagos.dto';
import { PagosRepositorio, estadoDelLibro, type DatosDelCorreo } from './pagos.repositorio';

/**
 * Mi espacio, a donde lleva el enlace de los correos. Es `APP_FAMILIA` de
 * `@codice/core` (#25) más la ruta; la API no puede importar `core` (ver
 * `correo/textos.ts`), así que se escribe acá, una vez.
 */
export const ENLACE_A_MI_ESPACIO = 'https://familia.armandoduarte.com/mi-espacio';

/**
 * `/api/pagos/*` — el comprobante de pago, de punta a punta. Orden #27 C.
 *
 *   · `POST /pagos/declarar` — el **cliente** dice «ya transferí». El archivo
 *     ya está en Storage: lo subió la pantalla con su sesión (la función de
 *     Vercel tiene tope de 4,5 MB por cuerpo, y la policy de la 006 ya decide
 *     quién sube a qué carpeta). Acá se anota el renglón `declarado`.
 *   · `POST /pagos/resolver` — el **equipo** confirma o rechaza; el **dueño**
 *     anula. Con el correo al cliente después de confirmar o rechazar.
 *   · `GET /pagos/comprobante/:inscripcion` — una URL firmada de 60 s del
 *     último comprobante declarado, para quien la base deje leerlo: el cliente,
 *     el suyo; el equipo, los de su territorio con segundo paso.
 *
 * ── Tres frenos, como el panel ──────────────────────────────────────────
 *   1. **El guard global del kit**: un miembro del equipo sin `aal2` recibe
 *      `403 AAL2_REQUIRED` en las tres rutas antes de llegar acá. Un cliente
 *      pasa con `aal1` (no tiene autenticador que pedirle).
 *   2. **Este controlador**: resolver es solo del equipo (`SOLO_EQUIPO`) y
 *      anular solo del dueño (`SOLO_DUENO`) — la policy de la 003 se lo dejaría
 *      a todo el equipo, y la orden pide defensa doble. Un rechazo o una
 *      anulación sin motivo es `400 FALTA_MOTIVO`. Y la ruta del archivo tiene
 *      que estar en la carpeta de la inscripción que se declara (`RUTA_AJENA`).
 *   3. **La base**: todo va con el token de quien pide (`PagosRepositorio`).
 */
@Controller('pagos')
export class PagosController {
  private readonly logger = new Logger(PagosController.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly repositorio: PagosRepositorio,
    private readonly correo: CorreoService,
  ) {}

  @Post('declarar')
  async declarar(@Req() pedido: unknown, @Body() cuerpo: DeclararDto) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);

    /* La carpeta del archivo es la de esta inscripción, o no se declara. La
       policy de la 006 ya frenó la subida a una carpeta ajena; esto frena
       declarar con el archivo de otra inscripción propia. */
    if (!cuerpo.comprobante_path.startsWith(`${cuerpo.inscripcion_id}/`)) {
      throw new ForbiddenException({ message: 'Ese comprobante no es de esta inscripción.', code: 'RUTA_AJENA' });
    }

    const inscripcion = await this.repositorio.inscripcion(token, cuerpo.inscripcion_id);
    if (!inscripcion || inscripcion.persona_id !== usuario.id) {
      throw new ForbiddenException({ message: 'Esa inscripción no es tuya.', code: 'SIN_PERMISO' });
    }

    /* Una declaración por vez: con una en revisión, o ya confirmada o anulada,
       no se sube otra. Después de un rechazo, sí (orden #27 C.1). */
    const estado = estadoDelLibro(await this.repositorio.libro(token, cuerpo.inscripcion_id));
    if (estado !== 'pendiente_de_pago') {
      throw new ConflictException({ message: 'Esta inscripción no espera un comprobante.', code: 'NO_ESPERA_COMPROBANTE' });
    }

    try {
      await this.repositorio.anotar(token, {
        inscripcion_id: cuerpo.inscripcion_id,
        tipo: 'declarado',
        monto: cuerpo.monto,
        moneda: cuerpo.moneda,
        fecha_transferencia: cuerpo.fecha_transferencia,
        banco: cuerpo.banco.trim(),
        ultimos4_o_folio: cuerpo.ultimos4_o_folio?.trim() || null,
        comprobante_path: cuerpo.comprobante_path,
        hecho_por: usuario.id,
      });
    } catch (error) {
      await this.repositorio.borrarComprobante(token, cuerpo.comprobante_path);
      throw error;
    }
    return { ok: true, estado: 'en_revision' as const };
  }

  @Post('resolver')
  async resolver(@Req() pedido: unknown, @Body() cuerpo: ResolverDto) {
    const token = tokenDelPedido(pedido);
    const usuario = await usuarioDelPedido(pedido, token, this.supabase);
    const rol = await this.supabase.rolDe(token, usuario.id);
    if (!esEquipo(rol)) {
      throw new ForbiddenException({ message: 'Esta parte es del equipo.', code: 'SOLO_EQUIPO' });
    }
    if (cuerpo.tipo === 'anulado' && rol !== 'dueno') {
      throw new ForbiddenException({ message: 'Solo el dueño puede anular.', code: 'SOLO_DUENO' });
    }
    const nota = cuerpo.nota?.trim() || null;
    if (cuerpo.tipo !== 'confirmado' && !nota) {
      throw new BadRequestException({ message: 'Falta el motivo.', code: 'FALTA_MOTIVO' });
    }

    const inscripcion = await this.repositorio.inscripcion(token, cuerpo.inscripcion_id);
    if (!inscripcion) throw new NotFoundException({ message: 'Esa inscripción no existe.', code: 'NO_EXISTE' });
    const libro = await this.repositorio.libro(token, cuerpo.inscripcion_id);
    const estado = estadoDelLibro(libro);
    if (cuerpo.tipo !== 'anulado' && estado !== 'en_revision') {
      throw new ConflictException({ message: 'Ese pago no está en revisión.', code: 'NO_ESTA_EN_REVISION' });
    }
    if (cuerpo.tipo === 'anulado' && estado === 'anulada') {
      throw new ConflictException({ message: 'Esa inscripción ya está anulada.', code: 'YA_ANULADA' });
    }

    /* Al confirmar, el monto por defecto es lo declarado (la pantalla lo
       prellena igual); la moneda, la de la declaración. */
    const declarado = libro.find((r) => r.tipo === 'declarado');
    const monto = cuerpo.monto ?? (cuerpo.tipo === 'confirmado' && declarado?.monto != null ? Number(declarado.monto) : null);
    await this.repositorio.anotar(token, {
      inscripcion_id: cuerpo.inscripcion_id,
      tipo: cuerpo.tipo,
      monto,
      moneda: monto === null ? null : (declarado?.moneda ?? 'MXN'),
      nota,
      hecho_por: usuario.id,
    });

    const correo = cuerpo.tipo === 'anulado' ? 'no_corresponde' as const : await this.avisar(token, cuerpo.inscripcion_id, cuerpo.tipo, nota);
    return { ok: true, correo };
  }

  @Get('comprobante/:inscripcion')
  async comprobante(@Req() pedido: unknown, @Param('inscripcion', ParseUUIDPipe) inscripcion: string) {
    const token = tokenDelPedido(pedido);
    await usuarioDelPedido(pedido, token, this.supabase);
    const libro = await this.repositorio.libro(token, inscripcion);
    const ruta = libro.find((r) => r.tipo === 'declarado' && r.comprobante_path)?.comprobante_path;
    if (!ruta) throw new NotFoundException({ message: 'No hay comprobante.', code: 'SIN_COMPROBANTE' });
    return { url: await this.repositorio.urlFirmada(token, ruta) };
  }

  /**
   * El correo, como cortesía: **nunca tira**. Si no se pudo leer lo que dice o
   * Resend falla, el renglón ya está en el libro y se contesta igual.
   */
  private async avisar(token: string, inscripcion: string, tipo: 'confirmado' | 'rechazado', motivo: string | null) {
    try {
      const datos = await this.repositorio.datosParaElCorreo(token, inscripcion);
      if (!datos) {
        this.logger.warn('El correo no salió: no se pudieron leer los datos de la inscripción.');
        return 'no_enviado' as const;
      }
      /* #34 B.3: la persona pidió no recibirlo. No es una falla: el libro ya
         dice lo que pasó y Mis talleres lo muestra. */
      if (!datos.avisos) return 'apagado' as const;
      const enviado = await this.correo.enviar(armarCorreo(datos, tipo, motivo));
      return enviado ? ('enviado' as const) : ('no_enviado' as const);
    } catch {
      this.logger.warn('El correo no salió: falló al armarse.');
      return 'no_enviado' as const;
    }
  }
}

/**
 * El correo armado: asunto y texto plano. La fecha y el horario van **en la
 * zona de la edición** (D15), con el nombre de la ciudad al lado.
 */
export function armarCorreo(d: DatosDelCorreo, tipo: 'confirmado' | 'rechazado', motivo: string | null) {
  const t = TEXTOS_DE_CORREO;
  const fecha = new Intl.DateTimeFormat('es-MX', { timeZone: d.zona, weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(d.inicio));
  /* «8:30» y no «08:30»: como `horaCorta()` de `core` y como escribe la web. */
  const hora = (i: string) => new Intl.DateTimeFormat('es-MX', { timeZone: d.zona, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(i)).replace(/^0(\d)/, '$1');
  const valores: Record<string, string> = {
    nombre: d.nombre?.trim() ?? '',
    curso: d.curso,
    referencia: d.referencia,
    fecha,
    horario: `${hora(d.inicio)} a ${hora(d.fin)}`,
    ciudad: d.ciudad ?? d.zona.split('/').pop()?.replace(/_/g, ' ') ?? '',
    sede: d.sede ?? '—',
    motivo: motivo ?? '',
    enlace: ENLACE_A_MI_ESPACIO,
  };
  const plantilla = t[tipo];
  const saludo = valores.nombre ? rellenar(t.saludo, valores) : t.saludoSinNombre;
  return {
    para: d.email,
    asunto: rellenar(plantilla.asunto, valores),
    texto: `${saludo}\n\n${rellenar(plantilla.cuerpo, valores)}\n\n${t.firma}\n`,
  };
}
