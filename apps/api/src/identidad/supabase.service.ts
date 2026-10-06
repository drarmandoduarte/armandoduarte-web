import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { UsuarioVerificado } from '../acceso/nucleo/verificador-de-token';

/**
 * El enchufe que el kit pide: «dame el usuario de este token, o tirá».
 *
 * `VERIFICADOR_DE_TOKEN` del núcleo declara esta interfaz y nada más; quién la
 * cumple es decisión de cada app. Acá la cumple este servicio, que además es el
 * único lugar del repo donde vive la `service_role`.
 *
 * ── Cómo se valida, y por qué JWKS y no `auth.getUser()` (orden #15, B) ──
 * **Se valida la firma localmente contra el JWKS del proyecto**
 * (`/auth/v1/.well-known/jwks.json`), y no con `auth.getUser(token)`.
 *
 * El motivo es lo que esta app es: una función de Vercel. `auth.getUser()` es
 * **un viaje de red a Supabase por cada pedido** —y en una función fría, con la
 * conexión sin reusar, eso es el costo dominante de un `GET /api/yo` que por lo
 * demás no hace nada—. `jwtVerify` contra un JWKS cacheado valida firma y
 * expiración en microsegundos y **no pide permiso a nadie**: la firma asimétrica
 * es justamente lo que permite verificar sin llamar al emisor.
 *
 * Lo que se pierde con JWKS está dicho para que nadie lo descubra después: un
 * token **revocado** (alguien cerró la sesión) sigue validando hasta que expira,
 * que en Supabase es una hora por defecto. `auth.getUser()` lo notaría en el
 * momento. Es el intercambio clásico y acá se puede pagar porque lo que protege
 * la app no es el token solo: el segundo paso del kit exige `aal2` **reciente**
 * (12 h de tope, y el reloj del frontend lo refresca cada 30 min de
 * inactividad), y «cerrar las otras sesiones» —que es la acción que de verdad
 * quiere revocar— usa la `service_role` y corta del lado de Supabase.
 *
 * ── Y el respaldo, que no es un atajo ───────────────────────────────────
 * Si el proyecto todavía firma con **secreto compartido** (los proyectos
 * viejos de Supabase) el JWKS viene vacío y `jwtVerify` falla siempre. En ese
 * caso se cae a `auth.getUser(token)`, que funciona con las dos clases de
 * llave. Cuál de los dos caminos tomó cada pedido se puede leer en el log, y
 * `cual()` lo expone para el informe. `armandoduarte-familia` se creó el
 * 29/9/2026, así que nace con llaves asimétricas; el respaldo existe porque
 * «qué llave usa este proyecto» es una configuración de panel que puede cambiar
 * sin que el código se entere.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  /** El JWKS del proyecto, resuelto una vez y cacheado por `jose`. */
  private readonly jwks;

  /** Qué camino se usó por última vez. Solo para el informe y el log. */
  private ultimoCamino: 'jwks' | 'getUser' | null = null;

  constructor() {
    const url = variableObligatoria('SUPABASE_URL');
    this.jwks = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', url));
  }

  /** Cliente con la clave anónima: lo que hace se rige por la RLS. */
  private clienteConToken(token: string): SupabaseClient {
    return createClient(variableObligatoria('SUPABASE_URL'), variableObligatoria('SUPABASE_ANON_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }

  /**
   * Cliente con `service_role`: **salta la RLS**. Se usa en un solo lugar
   * (cerrar las otras sesiones) y cada uso nuevo tiene que justificarse en su
   * orden. La clave se lee de `process.env` y no se devuelve nunca.
   */
  private clienteAdministrador(): SupabaseClient {
    return createClient(
      variableObligatoria('SUPABASE_URL'),
      variableObligatoria('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /** Lo que el kit llama: valida el token y devuelve quién es. */
  async getUserFromToken(token: string | undefined): Promise<UsuarioVerificado> {
    if (!token || token.trim() === '') throw new UnauthorizedException('Falta el token de acceso.');

    try {
      const { payload } = await jwtVerify(token, this.jwks);
      const id = typeof payload.sub === 'string' ? payload.sub : '';
      if (!id) throw new UnauthorizedException('El token no dice a quién pertenece.');
      this.ultimoCamino = 'jwks';
      return { id };
    } catch (error) {
      /* Lo que este método ya decidió adentro del `try` sale tal cual: un
         `sub` vacío no es un error de `jose` y no tiene que disfrazarse de uno. */
      if (error instanceof UnauthorizedException) throw error;

      /* Firma inválida y «este proyecto no publica JWKS» se distinguen por el
         código de `jose`: solo el segundo justifica el respaldo. Cualquier otra
         cosa es un token que no vale, y se rechaza. */
      if (!esProyectoSinJwks(error)) {
        /* ── El renglón que costó tres horas (orden #15, punto 1) ──────────
           El 29/9 a las 12:29 la función devolvió `401 Token inválido o
           vencido` sobre un token que era válido, y el log de Vercel de esa
           invocación decía «External APIs: No outgoing requests»: `jose` había
           tirado **antes de salir a buscar el JWKS**. Qué error era no se supo,
           porque este `catch` lo convertía en un 401 pelado y lo tiraba a la
           basura. Dos de las tres horas que costó el incidente se fueron en
           averiguar algo que la biblioteca ya había dicho.

           Va `nombre · código · mensaje` de `jose`, y **nunca el token**: el
           token es la credencial, y un log con credenciales adentro es peor
           que no tener log. Los mensajes de `jose` no lo incluyen. */
        this.logger.warn(`El token no pasó la verificación: ${describir(error)}`);
        throw new UnauthorizedException('Token inválido o vencido.');
      }
      /* El mensaje dice lo que se sabe y no más: `ERR_JWKS_NO_MATCHING_KEY`
         significa «ninguna clave del juego sirve para este token», y eso pasa
         tanto si el proyecto firma con secreto compartido como si el token lo
         firmó un desconocido. Los dos terminan igual —`auth.getUser()` rechaza
         al segundo— pero el desconocido cuesta un viaje de red. Estrechar el
         respaldo a «el JWKS vino vacío» es una decisión de dirección y está en
         el informe de la #15; no se decide acá. */
      this.logger.warn(
        `El JWKS no tiene clave para este token (${describir(error)}): se prueba con auth.getUser(), `
        + 'que es también el camino si el proyecto firma con secreto compartido',
      );
    }

    const { data, error } = await this.clienteConToken(token).auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Token inválido o vencido.');
    this.ultimoCamino = 'getUser';
    return { id: data.user.id };
  }

  /** Para el informe: por qué camino se validó el último token. */
  cual(): 'jwks' | 'getUser' | null {
    return this.ultimoCamino;
  }

  /**
   * El rol de una persona, leído **con su propio token** y no con
   * `service_role`.
   *
   * Es una decisión de la orden y vale su renglón: la #13 le deja a cada
   * miembro leer su fila de `miembros`, así que la RLS alcanza. Usar
   * `service_role` acá sería pedir permiso de administrador para una consulta
   * que el usuario puede hacer solo — y cada consulta que salta la RLS es una
   * consulta cuya corrección deja de estar probada por los 83 tests de la #13 y
   * pasa a depender de que este archivo no tenga un error.
   *
   * Sin fila activa en `miembros` → `cliente`. Es la definición de la spec: el
   * cliente no es un rol guardado, es la ausencia de membresía.
   */
  async rolDe(token: string, personaId: string): Promise<'dueno' | 'equipo' | 'cliente'> {
    const { data, error } = await this.comoElUsuario(token)
      .from('miembros')
      .select('rol, activo')
      /* `user_id`, no `persona_id`: la columna se llama así desde la migración
         `001` (`miembros.user_id`, que además es su clave primaria). Acá decía
         `persona_id` y Postgres contestaba `42703 column miembros.persona_id
         does not exist`; el middleware se lo tragaba, el pedido seguía sin
         `profile` y el guard le exigía `aal2` a todo el mundo. Un cliente no
         podía entrar de ninguna forma. */
      .eq('user_id', personaId)
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      this.logger.error(`No se pudo leer la membresía: ${error.code ?? 'sin código'}`);
      throw new UnauthorizedException('No pudimos confirmar tu cuenta.');
    }
    const rol = data?.rol;
    return rol === 'dueno' || rol === 'equipo' ? rol : 'cliente';
  }

  /** La persona que corresponde a este usuario, con su propio token. */
  async personaDe(token: string, personaId: string) {
    const { data, error } = await this.comoElUsuario(token)
      .from('personas')
      .select('id, nombre, apellido, whatsapp, pais, zona_horaria, ciudad, anio_nacimiento, nivel_educativo, avisos_por_correo')
      .eq('id', personaId)
      .maybeSingle();
    if (error) throw new UnauthorizedException('No pudimos leer tus datos.');
    return data;
  }

  /**
   * El territorio del miembro activo (#34 A.3: «Equipo · México»), o nulo para
   * un cliente. Solo para pintar el rol: lo que cada quien ve lo decide la RLS.
   */
  async territorioDe(token: string, personaId: string): Promise<'mexico' | 'internacional' | 'todos' | null> {
    const { data, error } = await this.comoElUsuario(token)
      .from('miembros')
      .select('territorio')
      .eq('user_id', personaId)
      .eq('activo', true)
      .maybeSingle();
    if (error) {
      this.logger.warn(`No se pudo leer el territorio: ${error.code ?? 'sin código'}`);
      return null;
    }
    const t = data?.territorio;
    return t === 'mexico' || t === 'internacional' || t === 'todos' ? t : null;
  }

  /** Cierra todas las otras sesiones de esta persona. Único uso de service_role. */
  async cerrarOtrasSesiones(personaId: string): Promise<void> {
    const { error } = await this.clienteAdministrador().auth.admin.signOut(personaId, 'others');
    if (error) throw new UnauthorizedException('No pudimos cerrar las otras sesiones.');
  }

  /** El cliente con el token del usuario, para lo que se rige por RLS. */
  comoElUsuario(token: string): SupabaseClient {
    return this.clienteConToken(token);
  }

  /**
   * El cliente `service_role`, para lo que **el esquema no le deja hacer a la
   * persona**. Salta la RLS, así que cada consulta que lo use filtra por el
   * `user_id` que salió del token validado, nunca por uno que venga en el
   * cuerpo del pedido.
   *
   * ── Por qué existe, y quién lo decidió ──────────────────────────────────
   * No lo decide este archivo: lo decidió la migración `005`, que escribió
   * `revoke insert, update, delete on public.totp_backup_codes from anon,
   * authenticated` con el comentario «Escritura (generar / consumir /
   * regenerar): SOLO backend con `service_role`», y lo confirmó la `007`, que a
   * `authenticated` le da **select y nada más** sobre esa tabla.
   *
   * `respaldo` estaba escrito contra el esquema contrario —generaba, borraba y
   * quemaba códigos con el token de la persona—, así que aunque los nombres de
   * columna hubieran estado bien habría chocado igual, con `42501` en vez de
   * `42703`. Se descubrió al correr sus consultas contra el banco:
   * `src/las-consultas-corren-contra-la-base.spec.ts`.
   */
  comoElServicio(): SupabaseClient {
    return this.clienteAdministrador();
  }
}

/**
 * Lee una variable de entorno o dice **su nombre** y se detiene.
 *
 * Nunca devuelve ni registra el valor. Es lo que la orden pide: «si falta una,
 * se dice el nombre y se espera: Germán la carga en Vercel».
 */
export function variableObligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}. La carga dirección en el proyecto de Vercel; `
      + 'no se escribe en el repo ni se pasa por el PR.',
    );
  }
  return valor;
}

/**
 * `nombre · código · mensaje` de un error, para el log.
 *
 * **No lleva la pila y no lleva el error crudo**: la pila de `jose` incluye la
 * URL del JWKS y no aporta nada acá, y un `JSON.stringify` del error es la
 * forma más fácil de meter sin querer algo que no se quería.
 */
function describir(error: unknown): string {
  const e = error as { name?: unknown; code?: unknown; message?: unknown };
  const texto = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : '—');
  return `${texto(e?.name)} · ${texto(e?.code)} · ${texto(e?.message)}`;
}

/** ¿El error de `jose` deja abierta la posibilidad de que el proyecto firme con secreto compartido? */
function esProyectoSinJwks(error: unknown): boolean {
  const codigo = (error as { code?: unknown })?.code;
  return codigo === 'ERR_JWKS_NO_MATCHING_KEY' || codigo === 'ERR_JWKS_INVALID' || codigo === 'ERR_JWKS_TIMEOUT';
}
