/**
 * Las reglas de las pantallas de acceso — orden #35 (guion v1 del Kit 512).
 *
 * La lógica de seguridad es del núcleo del kit y no se toca. Esto es lo que la
 * **cara** necesita decidir y que no le toca a un `.tsx`:
 *
 *   · cuántos intentos le quedan a un código (§3: «Te quedan N intentos»);
 *   · cuánto se espera para reenviar el código por correo (P2);
 *   · cómo se rellenan los textos del guion, que traen `{app}`, `{email}`, `{n}`
 *     con **una** llave (la tabla §5 se copia tal cual);
 *   · cómo se parte un título en «antes», la palabra acentuada y «después»
 *     (`*palabra*`, §2).
 */

/**
 * Intentos por código, en la pantalla. Supabase no le dice al navegador cuántos
 * le quedan, y el guion pide decirlo (§3). Es un tope **de la cara**: al
 * llegar a cero, la casilla se apaga y hay que pedir un código nuevo (correo) o
 * salir y volver (autenticador). El límite de verdad sigue siendo el de
 * Supabase; éste solo evita prometer intentos que no existen.
 */
export const INTENTOS_POR_CODIGO = 5;

export function intentosQueQuedan(fallidos: number): number {
  return Math.max(0, INTENTOS_POR_CODIGO - Math.max(0, Math.floor(fallidos)));
}

/**
 * P2 · «Reenviar código» aparece después de esta cuenta regresiva. El guion
 * dice 30 s; Supabase rechaza un segundo envío antes del intervalo mínimo del
 * proyecto (hoy 60 s, configuración de dirección, D17). Con 30 el botón
 * fallaría la mitad de las veces: queda en 60 hasta que dirección baje el del
 * proyecto, y entonces cambia este número y nada más.
 */
export const SEGUNDOS_PARA_REENVIAR = 60;

/** `{app}`, `{email}`, `{n}`: las variables de una llave de la tabla §5. Una que no viene queda escrita. */
export function rellenar(texto: string, variables: Record<string, string | number> = {}): string {
  return texto.replace(/(?<!\{)\{([a-zA-Z0-9_]+)\}(?!\})/g, (todo, nombre: string) =>
    nombre in variables ? String(variables[nombre]) : todo);
}

/** «Verifica tu *identidad*.» → antes «Verifica tu », palabra «identidad», después «.». */
export function partirTituloDeAcceso(texto: string): { antes: string; palabra: string | null; despues: string } {
  const m = texto.match(/^(.*?)\*([^*]+)\*(.*)$/s);
  if (!m) return { antes: texto, palabra: null, despues: '' };
  return { antes: m[1], palabra: m[2], despues: m[3] };
}
