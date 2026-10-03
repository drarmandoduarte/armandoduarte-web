/**
 * El WhatsApp con prefijo de país — orden #32.
 *
 * Hasta la #32 la regla era «de 8 a 15 dígitos» (`telefonoParaWa`): un número
 * de México con un dígito de menos pasaba, y uno de Argentina con el 15 de los
 * celulares, también. Ahora se valida **para el país elegido** con
 * `libphonenumber-js/min` (MIT): la metadata mínima de Google, que mira el largo
 * y los primeros dígitos de cada país.
 *
 * Lo que se guarda es **E.164** (`+529991234567`), como siempre en
 * `personas.whatsapp`; lo que se muestra, el formato internacional
 * (`+52 999 123 4567`). `telefonoParaWa` sigue armando los `wa.me`: un E.164 sin
 * el `+` es exactamente lo que pide.
 *
 * Un número guardado antes sin `+` (la #15 no lo exigía) se lee como de México,
 * que es donde está casi toda la base. Si no es válido así, la persona lo
 * corrige en `/empezar`, que lo trae escrito.
 */
import {
  AsYouType, getCountryCallingCode, getExampleNumber, isSupportedCountry, parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';
import ejemplos from 'libphonenumber-js/mobile/examples';

/** El país por defecto del campo, y para leer un número viejo sin `+`. */
export const PAIS_DEL_WHATSAPP = 'MX';

const comoPais = (pais: string | null | undefined): CountryCode =>
  (pais && isSupportedCountry(pais) ? pais : PAIS_DEL_WHATSAPP) as CountryCode;

/** «+52». Para un código que la metadata no conoce, el de México. */
export function prefijoDe(pais: string | null | undefined): string {
  return `+${getCountryCallingCode(comoPais(pais))}`;
}

/** Si la metadata conoce el país (para el selector: los que no, no se ofrecen). */
export function tienePrefijo(pais: string): boolean {
  return isSupportedCountry(pais);
}

function leer(texto: string | null | undefined, pais?: string | null) {
  const limpio = (texto ?? '').trim();
  if (!limpio) return undefined;
  return parsePhoneNumberFromString(limpio, limpio.startsWith('+') ? undefined : comoPais(pais));
}

/**
 * Lo que la persona escribió (internacional con `+`, o nacional del país
 * elegido) en E.164, **si es válido para ese país**. `null` si no.
 */
export function whatsappE164(texto: string | null | undefined, pais?: string | null): string | null {
  const n = leer(texto, pais);
  if (!n || !n.isValid()) return null;
  if (pais && !(texto ?? '').trim().startsWith('+') && n.country && n.country !== comoPais(pais)) return null;
  return n.number;
}

/** ¿Sirve como WhatsApp? La regla que usan «Me anoto», `/empezar`, Mis datos y la ficha. */
export function whatsappValido(texto: string | null | undefined, pais?: string | null): boolean {
  return whatsappE164(texto, pais) !== null;
}

/** «+52 999 123 4567» para mostrar; el texto tal cual si no se puede leer. */
export function formatearWhatsapp(texto: string | null | undefined): string {
  const n = leer(texto);
  return n ? n.formatInternational() : (texto ?? '');
}

/** El número nacional formateado mientras se escribe, para el país elegido. */
export function nacionalMientrasSeEscribe(digitos: string, pais: string): string {
  return new AsYouType(comoPais(pais)).input(digitos);
}

/** El placeholder del campo: un celular de ejemplo del país, en formato nacional. */
export function ejemploNacional(pais: string): string {
  return getExampleNumber(comoPais(pais), ejemplos)?.formatNational() ?? '';
}

/**
 * Un número guardado, partido para el campo: el país (del número, o el que se
 * sugiere) y los dígitos nacionales. Para `+1` (Estados Unidos y Canadá, entre
 * otros) el país lo decide el número.
 */
export function partirWhatsapp(texto: string | null | undefined, paisSugerido?: string | null): { pais: string; nacional: string } {
  const n = leer(texto);
  if (n?.country) return { pais: n.country, nacional: String(n.nationalNumber) };
  const limpio = (texto ?? '').trim();
  const pais = comoPais(paisSugerido);
  if (!limpio) return { pais, nacional: '' };
  if (limpio.startsWith('+')) {
    const prefijo = prefijoDe(pais).replace('+', '');
    const digitos = limpio.replace(/\D/g, '');
    return { pais, nacional: digitos.startsWith(prefijo) ? digitos.slice(prefijo.length) : digitos };
  }
  return { pais, nacional: limpio.replace(/\D/g, '') };
}

/** El valor del campo: prefijo + dígitos nacionales. Vacío si no hay dígitos. */
export function armarWhatsapp(pais: string, nacional: string): string {
  const digitos = nacional.replace(/\D/g, '');
  return digitos ? `${prefijoDe(pais)}${digitos}` : '';
}
