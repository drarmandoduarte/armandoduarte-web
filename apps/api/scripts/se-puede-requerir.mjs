/**
 * ¿Node puede `require()` este paquete? — una regla, un archivo.
 *
 * Vive sola porque la usan dos: `empaquetar-funcion.mjs`, para decidir qué mete
 * adentro del empaquetado, y `apps/familia/src/la-api-llega-compilada.test.ts`,
 * para comprobar que lo que quedó afuera se puede requerir de verdad. Dos
 * copias de esta regla serían dos verdades que un día no coinciden — y el día
 * que no coincidan, la que manda es la del servidor, en vivo.
 *
 * La regla es la de Node: un paquete es requerible si no declara
 * `"type": "module"`, o si, declarándolo, publica una condición `require` en su
 * `exports`. Un `exports` con `default` a secas **no** alcanza, y ése es el
 * punto: es la forma exacta de `jose@6`, que el 29/9/2026 tiró la función
 * entera con ERR_REQUIRE_ESM.
 */
export function sePuedeRequerir(manifiesto) {
  if (!manifiesto || typeof manifiesto !== 'object') return false;
  if (manifiesto.type !== 'module') return true;

  const tieneRequire = (valor) => {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
    if ('require' in valor) return true;
    return Object.values(valor).some(tieneRequire);
  };
  const exportaciones = manifiesto.exports;
  if (!exportaciones || typeof exportaciones !== 'object') return false;
  return tieneRequire(exportaciones['.'] ?? exportaciones);
}
