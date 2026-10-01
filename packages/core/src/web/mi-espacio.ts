/**
 * La puerta desde la web a Mi espacio — orden #25, A.
 *
 * **Una sola verdad para la dirección de la app**: la web arma todos sus
 * enlaces a Mi espacio con `enlaceAMiEspacio()`, y la dirección vive acá. Si
 * mañana cambia, cambia en un renglón.
 *
 * ── Y el preview ─────────────────────────────────────────────────────────
 * Mientras `familia.armandoduarte.com` no exista (lo monta el CEO), el preview
 * de la web puede apuntar a la URL de Vercel **solo por variable de entorno de
 * build** (`VITE_APP_FAMILIA`), que se le pasa a esta función como `base`.
 * Nunca en código: el repo es público y `dist` no puede nombrar `vercel.app`
 * (lo vigila `apps/web/src/la-web-no-nombra-vercel.test.ts`).
 */
export const APP_FAMILIA = 'https://familia.armandoduarte.com';

/** El slug del taller de Mérida: el de la semilla de la base (`semillas/001_taller_de_merida.sql`). */
export const SLUG_DEL_TALLER_DE_MERIDA = 'el-arte-de-amar-a-tu-adolescente';

/** La ruta de la app que abre «Me anoto» con el taller de Mérida elegido. */
export const RUTA_RESERVAR_MERIDA = `/me-anoto/${SLUG_DEL_TALLER_DE_MERIDA}`;

/**
 * Una base aceptable: `https://` + un nombre de host, sin barra final ni ruta.
 * Cualquier otra cosa (vacía, `http:`, con ruta) se ignora y vale `APP_FAMILIA`.
 */
export function baseDeLaApp(desdeElEntorno: string | null | undefined): string {
  const valor = (desdeElEntorno ?? '').trim();
  return /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(valor) ? valor : APP_FAMILIA;
}

/**
 * `…/entrar` o `…/entrar?ir=<ruta>`. La app (#24 B) acepta en `?ir=` solo rutas
 * internas; acá se aplica la misma regla de forma —empieza con una `/` y no con
 * `//`— para no armar nunca un enlace que la app vaya a ignorar. (Cuando el
 * PR B y éste estén en `main`, esta comprobación puede pasar a usar
 * `rutaInternaSegura()` de `mi-espacio/me-anoto.ts`.)
 */
export function enlaceAMiEspacio(destino?: string, base: string = APP_FAMILIA): string {
  const entrar = `${baseDeLaApp(base)}/entrar`;
  if (!destino || !destino.startsWith('/') || destino.startsWith('//') || destino.includes('\\')) return entrar;
  return `${entrar}?ir=${encodeURIComponent(destino)}`;
}
