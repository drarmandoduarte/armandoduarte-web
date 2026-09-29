import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { UsuarioVerificado } from '../seguridad-512/nucleo/verificador-de-token';

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
      /* Firma inválida y «este proyecto no publica JWKS» se distinguen por el
         código de `jose`: solo el segundo justifica el respaldo. Cualquier otra
         cosa es un token que no vale, y se rechaza. */
      if (!esProyectoSinJwks(error)) throw new UnauthorizedException('Token inválido o vencido.');
      this.logger.warn('El proyecto no publica JWKS: se valida con auth.getUser()');
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
    const { data, error } = await this.clienteConToken(token)
      .from('miembros')
      .select('rol, activo')
      .eq('persona_id', personaId)
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
    const { data, error } = await this.clienteConToken(token)
      .from('personas')
      .select('id, nombre, apellido, whatsapp, pais, zona_horaria')
      .eq('id', personaId)
      .maybeSingle();
    if (error) throw new UnauthorizedException('No pudimos leer tus datos.');
    return data;
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

/** ¿El error de `jose` dice que este proyecto no publica JWKS? */
function esProyectoSinJwks(error: unknown): boolean {
  const codigo = (error as { code?: unknown })?.code;
  return codigo === 'ERR_JWKS_NO_MATCHING_KEY' || codigo === 'ERR_JWKS_INVALID' || codigo === 'ERR_JWKS_TIMEOUT';
}
