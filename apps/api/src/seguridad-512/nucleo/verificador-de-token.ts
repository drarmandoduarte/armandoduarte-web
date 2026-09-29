/**
 * KIT DE SEGURIDAD 512 · NÚCLEO (S3) — NO se edita en una app.
 *
 * El núcleo no puede importar el `SupabaseService` de Cenit (ni el de ninguna
 * app) sin dejar de ser neutro. Declara en cambio el enchufe mínimo que
 * necesita —"dame el usuario de este token, o tirá"— y cada app lo conecta con
 * lo suyo en su módulo compartido:
 *
 *   { provide: VERIFICADOR_DE_TOKEN, useExisting: SupabaseService }
 */

/** Lo único que el kit necesita saber del usuario: quién es. */
export interface UsuarioVerificado {
  id: string;
}

/**
 * Verifica la AUTENTICIDAD de un access token (firma + expiración) contra el
 * proveedor de identidad y devuelve el usuario. Tira 401 si el token falta, está
 * vacío o es inválido. Nunca devuelve un usuario para un token que no validó.
 */
export interface VerificadorDeToken {
  getUserFromToken(token: string | undefined): Promise<UsuarioVerificado>;
}

/** Token de inyección (Nest). String y no Symbol para que se lea en los errores de DI. */
export const VERIFICADOR_DE_TOKEN = 'SEGURIDAD_512_VERIFICADOR_DE_TOKEN';
