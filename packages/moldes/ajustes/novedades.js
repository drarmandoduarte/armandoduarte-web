/**
 * Acerca de → Novedades, desde el `CHANGELOG` de la app (guion v1 §3.9 y mega
 * análisis §4.7: «se llena sola con el CHANGELOG, en lenguaje de persona»).
 *
 * Lee los encabezados de versión y sus viñetas. Acepta las dos formas en que se
 * escribe un CHANGELOG en estas apps:
 *
 *   ## 1.2.0 · 2026-10-03            ## [1.2.0] - 2026-10-03
 *   - Ahora se puede …               - Ahora se puede …
 *
 * Lo que no es una versión (un «## Sin publicar», un título de sección) se
 * salta: Novedades muestra lo que ya llegó, no lo que viene. Las sub-viñetas y
 * los `###` dentro de una versión también se saltan: son detalle para quien
 * programa, y la persona lee tres líneas.
 */
const VERSION = /^##\s+\[?v?(\d+\.\d+(?:\.\d+)?)\]?\s*(?:[·\-–—]\s*(.+))?\s*$/;

export function leerNovedades(markdown = '', { maximo = 5, porVersion = 3 } = {}) {
  const versiones = [];
  let actual = null;
  let enSubseccion = false;
  for (const renglon of String(markdown).split('\n')) {
    if (/^##\s/.test(renglon)) {
      const m = VERSION.exec(renglon.trim());
      actual = m ? { version: m[1], fecha: m[2]?.trim() || null, cambios: [] } : null;
      if (actual) versiones.push(actual);
      enSubseccion = false;
      continue;
    }
    // Un `###` dentro de una versión abre detalle para quien programa: se salta hasta la próxima versión.
    if (/^###/.test(renglon)) { enSubseccion = true; continue; }
    if (!actual || enSubseccion) continue;
    const vineta = /^[-*]\s+(.+)$/.exec(renglon);
    if (vineta && actual.cambios.length < porVersion) actual.cambios.push(vineta[1].trim());
  }
  return versiones.filter((v) => v.cambios.length > 0).slice(0, maximo);
}
