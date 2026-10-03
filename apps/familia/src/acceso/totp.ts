import { supabase } from '../supabase';

/**
 * Verificar seis dígitos del autenticador: `challenge` + `verify` sobre el
 * factor TOTP de la cuenta (o el que se está enrolando). Lo usan P3, P4 y P8.
 *
 * Devuelve `'ok'`, `'incorrecto'` (el código no sirvió: cuenta como intento) o
 * `'fallo'` (no hubo factor o la red no contestó: no cuenta como intento).
 */
export async function verificarTotp(codigo: string, factorId?: string): Promise<'ok' | 'incorrecto' | 'fallo'> {
  let id = factorId;
  if (!id) {
    const factores = await supabase.auth.mfa.listFactors();
    id = factores.data?.totp?.[0]?.id;
  }
  if (!id) return 'fallo';
  const reto = await supabase.auth.mfa.challenge({ factorId: id });
  if (reto.error || !reto.data) return 'fallo';
  const { error } = await supabase.auth.mfa.verify({ factorId: id, challengeId: reto.data.id, code: codigo });
  return error ? 'incorrecto' : 'ok';
}
