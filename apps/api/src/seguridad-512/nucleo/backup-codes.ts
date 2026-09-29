import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * KIT DE SEGURIDAD 512 · NÚCLEO (S5) — NO se edita en una app. Una mejora se
 * hace en el kit, sube la versión y se regeneran las huellas.
 *
 * Códigos de respaldo: generación crypto-secure, hash con scrypt y verificación
 * en tiempo constante. Sin dependencias fuera de `node:crypto`.
 */

export const BACKUP_CODE_COUNT = 10;
const CODE_LENGTH = 10;
const KEY_LEN = 32;
// Alfabeto sin caracteres ambiguos (sin 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Un código de respaldo crypto-secure (node:crypto). */
export function generateBackupCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Hashea un código con scrypt. Devuelve "salt:hash" (hex). NUNCA guarda plaintext. */
export function hashBackupCode(code: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(canonical(code), salt, KEY_LEN);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** Verifica un código contra un "salt:hash" en tiempo constante. */
export function verifyBackupCode(code: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length === 0) return false;
  const actual = scryptSync(canonical(code), Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function canonical(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
