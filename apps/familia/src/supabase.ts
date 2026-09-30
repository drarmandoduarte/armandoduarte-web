/**
 * El cliente de Supabase de Mi espacio — **solo para autenticarse**.
 *
 * ── La regla, que es de arquitectura y no de estilo (orden #15, A) ───────
 * Esta app **no lee la base desde el navegador**. Ni `.from(`, ni `.rpc(`, ni
 * `.storage`: los datos se le piden a `apps/api`, que valida el token una vez
 * por pedido y aplica el guard del kit. Lo comprueba
 * `src/sin-base-desde-el-navegador.test.ts`, que hace el `grep` y cae si
 * aparece alguno — con su mutación en el informe.
 *
 * Por qué importa, y no es purismo: el día que la pantalla lea `personas`
 * directo, la única defensa de esa lectura es la RLS. La RLS está bien escrita
 * (la #13 la probó con 83 tests), pero el segundo paso, el paso reciente y la
 * clasificación de roles viven en el guard del kit, **en el servidor**. Una
 * lectura que esquiva el servidor esquiva el kit entero.
 *
 * Lo que sí se usa: `signInWithOtp`, `verifyOtp`, `signInWithOAuth`,
 * `auth.mfa.*`, `signOut`, `getSession`, `onAuthStateChange`.
 *
 * ── La clave anónima es pública, y aun así va por variable ──────────────
 * `VITE_SUPABASE_ANON_KEY` viaja al navegador por diseño: es la clave que la
 * RLS espera. Va por variable de entorno igual, porque escribirla en el repo
 * la ata a un proyecto —y este repo es público (CLAUDE.md): lo que entra, entra
 * para siempre, también en los forks—.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const CLAVE_ANONIMA = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Qué falta para que esta app funcione, dicho por NOMBRE de variable.
 *
 * Se exporta y se muestra en pantalla en vez de reventar con un stack: la
 * persona que va a ver esto es dirección cargando el proyecto en Vercel, y lo
 * único que necesita saber es **cuál** variable falta. Nunca se imprime el
 * valor de ninguna.
 */
export function variablesQueFaltan(): string[] {
  const faltan: string[] = [];
  if (!URL_SUPABASE) faltan.push('VITE_SUPABASE_URL');
  if (!CLAVE_ANONIMA) faltan.push('VITE_SUPABASE_ANON_KEY');
  return faltan;
}

/**
 * El cliente, creado una sola vez.
 *
 * `persistSession` y `autoRefreshToken` quedan en su valor por defecto (los
 * dos, encendidos): el reloj de inactividad de treinta minutos y el tope de
 * doce horas los pone **el kit**, en la app y en la API, no Supabase. Está
 * dicho en `03 Producto/mi-espacio/infraestructura-2026-09-29.md`: en el plan
 * Free ese interruptor no existe, así que no se busca.
 *
 * `detectSessionInUrl` sí importa y queda encendido: es lo que recoge la sesión
 * cuando Google devuelve a la app con el fragmento en la URL.
 */
export const supabase: SupabaseClient = createClient(URL_SUPABASE ?? '', CLAVE_ANONIMA ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
