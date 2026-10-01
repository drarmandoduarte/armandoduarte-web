import { supabase } from '../supabase';

/**
 * El único camino de esta app hacia `apps/api`.
 *
 * ── Nunca se muestra el `message` del servidor ─────────────────────────
 * Y no es una preferencia de estilo: el núcleo del Kit de Seguridad 512 devuelve
 * sus mensajes en **voseo rioplatense**, porque nació en Cenit, que es uruguayo.
 * El caso concreto está en
 * `apps/api/src/seguridad-512/nucleo/aal2.guard.ts:147` —el `message` del 403
 * con `PASO_RECIENTE_REQUERIDO`— y el núcleo no se edita dentro de una app, así
 * que ese texto no se puede arreglar desde este repo. Está anotado con sus
 * palabras exactas en `scripts/check-tuteo.mjs` y en el informe de la #15.
 *
 * (Acá no se transcribe la frase a propósito: `check:tuteo` barre esta carpeta
 * y no sabe distinguir una cita de un texto de interfaz. Tiene razón en no
 * saberlo — un voseo citado en un comentario es, con el tiempo, un voseo
 * copiado a una pantalla.)
 *
 * Lo que sí está en nuestras manos es no pintarlo. La API devuelve un **código**
 * —`AAL2_REQUIRED`, `PASO_RECIENTE_REQUERIDO`— y la pantalla lo traduce a un
 * texto de `familia.json`, que está escrito en tuteo mexicano y lo revisó
 * dirección. El `message` queda para el log de quien programa.
 *
 * El otro motivo, que vale igual: un mensaje del servidor pintado tal cual en
 * la pantalla es texto que nadie tradujo, nadie revisó y nadie puede cambiar
 * sin tocar el backend.
 */

/** Los códigos que la API puede devolver y que la pantalla sabe interpretar. */
export type CodigoDeError =
  /** La cuenta es de equipo y la sesión todavía no pasó el segundo paso. */
  | 'AAL2_REQUIRED'
  /** La acción pide un código del autenticador puesto hace minutos. */
  | 'PASO_RECIENTE_REQUERIDO'
  /** No hay sesión, o venció. */
  | 'SIN_SESION'
  /** Cualquier otra cosa: se muestra el texto genérico. */
  | 'DESCONOCIDO';

export class ErrorDeApi extends Error {
  constructor(
    readonly codigo: CodigoDeError,
    readonly estado: number,
    /** El texto crudo del servidor. **Para el log, no para la pantalla.** */
    readonly detalle: string,
    /** Minutos de frescura que pidió `@PasoReciente`, si vino. */
    readonly minutos?: number,
    /** El `code` que mandó el servidor tal cual (`SLUG_REPETIDO`, `SOLO_EQUIPO`…), para las pantallas que lo leen. */
    readonly codigoDelServidor?: string,
  ) {
    super(`${codigo} (${estado})`);
    this.name = 'ErrorDeApi';
  }
}

/** El token de la sesión actual, o nada. */
async function tokenActual(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Llama a la API con la sesión puesta.
 *
 * ── `credentials: 'same-origin'`, y el caso que lo obligó ───────────────
 * Acá decía `'omit'`, con este argumento: la autenticación viaja en el header
 * `Authorization` y no en una cookie, así que mandar cookies solo agrandaría la
 * superficie (CSRF) sin que nada las use. El argumento sigue siendo correcto
 * **sobre nuestras cookies**. El problema es que no somos los únicos que ponen
 * una.
 *
 * **F.4, tercera corrida, 29/9/2026.** Los previews de Vercel están detrás de
 * *Vercel Authentication*, que protege el despliegue con una cookie de su
 * dominio. El navegador la tiene —por eso la pantalla carga—, pero cada `fetch`
 * de esta función salía con `omit`, llegaba al borde **sin** esa cookie y volvía
 * **503**. O sea: la app se veía y no funcionaba, y la causa no estaba en la
 * API. Sin esto, F.4 no se puede correr nunca contra un preview.
 *
 * Por qué `'same-origin'` y no `'include'`: el `fetch` es a `/api/…`, mismo
 * origen que la pantalla, y `'same-origin'` es exactamente eso — las cookies
 * van cuando el destino es nuestro propio origen y no en un pedido cruzado. Con
 * `'include'` viajarían también hacia afuera, que es la superficie que el
 * comentario viejo quería evitar y que sigue sin hacer falta.
 *
 * Y la superficie de CSRF **no cambia**: la API no autoriza con cookies. Un
 * pedido de otro sitio que llegue con la cookie de Vercel pero sin el header
 * `Authorization` es un 401 del `Aal2Guard`, igual que antes.
 */
export async function api<T>(
  ruta: string,
  opciones: { metodo?: 'GET' | 'POST'; cuerpo?: unknown } = {},
): Promise<T> {
  const token = await tokenActual();
  if (!token) throw new ErrorDeApi('SIN_SESION', 401, 'no hay sesión en el navegador');

  const respuesta = await fetch(`/api/${ruta}`, {
    method: opciones.metodo ?? 'GET',
    credentials: 'same-origin',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opciones.cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  });

  if (respuesta.ok) return (await respuesta.json()) as T;

  /* El cuerpo de error de Nest es `{ message, code, minutos }`, pero un 502 del
     borde no es JSON: se lee defensivo y se cae al código desconocido. */
  let cuerpo: { message?: unknown; code?: unknown; minutos?: unknown } = {};
  try {
    cuerpo = (await respuesta.json()) as typeof cuerpo;
  } catch {
    /* Respuesta sin JSON: queda el estado, que ya dice bastante. */
  }

  const codigo: CodigoDeError =
    cuerpo.code === 'AAL2_REQUIRED'
      ? 'AAL2_REQUIRED'
      : cuerpo.code === 'PASO_RECIENTE_REQUERIDO'
        ? 'PASO_RECIENTE_REQUERIDO'
        : respuesta.status === 401
          ? 'SIN_SESION'
          : 'DESCONOCIDO';

  throw new ErrorDeApi(
    codigo,
    respuesta.status,
    typeof cuerpo.message === 'string' ? cuerpo.message : respuesta.statusText,
    typeof cuerpo.minutos === 'number' ? cuerpo.minutos : undefined,
    typeof cuerpo.code === 'string' ? cuerpo.code : undefined,
  );
}

/** Lo que devuelve `GET /api/yo`. */
export interface Yo {
  persona: {
    id: string;
    nombre: string | null;
    apellido: string | null;
    whatsapp: string | null;
    pais: string | null;
    /** IANA, o nulo si la persona no la cargó (#24 B, para la fecha en su hora). */
    zona_horaria?: string | null;
    /** #27 D: el perfil, todo opcional. */
    ciudad?: string | null;
    anio_nacimiento?: number | null;
    nivel_educativo?: string | null;
  } | null;
  rol: 'dueno' | 'equipo' | 'cliente';
  tipo: 'equipo' | 'cliente';
}
