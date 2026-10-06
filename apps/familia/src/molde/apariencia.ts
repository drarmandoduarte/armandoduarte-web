/**
 * Ajustes → Apariencia (orden #37, PR 3 · fase-2 §6): el tema y el tamaño del
 * texto, **en este aparato**.
 *
 * Por aparato y no por persona porque así lo define el molde
 * (`settings.appearance.hint`: «Cómo se ve la app en este aparato»): el
 * teléfono de noche puede ir oscuro y la computadora del trabajo, claro. Se
 * guarda en el navegador, como el idioma de la entrada (`comun/idioma.ts`), con
 * `try` porque una ventana privada puede no tener almacenamiento: ahí vale lo
 * del sistema y texto normal, que es lo mismo que sin elegir nada.
 *
 * Qué hace cada valor sobre `<html>`:
 *   · `data-theme="dark"` — lo lee `design.css` del molde (y `estilos.css` de
 *     Mi espacio para sus pantallas propias). «Sistema» sigue a
 *     `prefers-color-scheme`, también si cambia con la app abierta.
 *   · `data-texto="grande"` — `estilos.css` sube la letra base: las medidas del
 *     molde son `rem` y crecen con ella.
 */
export type Tema = 'claro' | 'oscuro' | 'sistema';
export type TamanoDelTexto = 'normal' | 'grande';

const CLAVE_TEMA = 'codice.tema';
const CLAVE_TAMANO = 'codice.tamanoTexto';
const OSCURO = '(prefers-color-scheme: dark)';

function leer(clave: string): string | null {
  try { return window.localStorage.getItem(clave); } catch { return null; }
}
function escribir(clave: string, valor: string): void {
  try { window.localStorage.setItem(clave, valor); } catch { /* Sin almacenamiento: vale hasta recargar. */ }
}

export function temaGuardado(): Tema {
  const v = leer(CLAVE_TEMA);
  return v === 'claro' || v === 'oscuro' ? v : 'sistema';
}

export function tamanoGuardado(): TamanoDelTexto {
  return leer(CLAVE_TAMANO) === 'grande' ? 'grande' : 'normal';
}

/** ¿Va oscuro? «Sistema» pregunta al aparato. */
export function vaOscuro(tema: Tema): boolean {
  if (tema !== 'sistema') return tema === 'oscuro';
  try { return window.matchMedia(OSCURO).matches; } catch { return false; }
}

/** Pone en `<html>` lo que dicen el tema y el tamaño. */
export function pintar(tema: Tema = temaGuardado(), tamano: TamanoDelTexto = tamanoGuardado()): void {
  const html = document.documentElement;
  if (vaOscuro(tema)) html.setAttribute('data-theme', 'dark');
  else html.removeAttribute('data-theme');
  if (tamano === 'grande') html.setAttribute('data-texto', 'grande');
  else html.removeAttribute('data-texto');
}

export function guardarTema(tema: Tema): void {
  escribir(CLAVE_TEMA, tema);
  pintar(tema, tamanoGuardado());
}

export function guardarTamano(tamano: TamanoDelTexto): void {
  escribir(CLAVE_TAMANO, tamano);
  pintar(temaGuardado(), tamano);
}

/**
 * Lo que `main.tsx` llama una vez: pinta lo guardado y, mientras el tema sea
 * «Sistema», sigue al aparato si cambia de claro a oscuro con la app abierta.
 */
export function arrancarApariencia(): void {
  pintar();
  try {
    window.matchMedia(OSCURO).addEventListener('change', () => { if (temaGuardado() === 'sistema') pintar(); });
  } catch {
    /* Un navegador sin `matchMedia`: el tema queda como arrancó. */
  }
}
