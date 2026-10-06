/**
 * KIT DE ACCESO · NÚCLEO (S1, celular) — NO se edita en una app.
 *
 * ¿La app está corriendo INSTALADA (pantalla de inicio / app web) o dentro del
 * navegador? Cambia el orden de los botones de la pantalla de entrada: en un
 * iPhone con la app instalada, "Continuar con Google" abre Safari por afuera y
 * la sesión no siempre vuelve a la app. Cuando está instalada, el código por
 * mail —que se escribe en la misma pantalla y no sale a ningún lado— va
 * primero; en el navegador, Google va primero porque es un clic y listo.
 *
 * Cenit no se instala: aquí siempre da `false`. Las otras apps del kit sí.
 */
export function estaInstalada(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof window.matchMedia === 'function') {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
    }
    // iOS (Safari) no soporta `display-mode: standalone` en todas sus versiones
    // y expone en cambio esta bandera propia. Se lee defensivamente.
    const navegadorIos = window.navigator as Navigator & { standalone?: unknown };
    return navegadorIos.standalone === true;
  } catch {
    // matchMedia puede no existir en un entorno de test: navegador, entonces.
    return false;
  }
}
