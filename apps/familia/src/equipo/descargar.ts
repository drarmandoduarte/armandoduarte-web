/**
 * Baja un texto como archivo. El CSV lo arma `aCsv()` de `@codice/core` (BOM,
 * `\r\n`, fórmulas desarmadas); esto solo lo entrega al navegador.
 *
 * Con un `Blob` y un enlace temporal, sin `data:` en la URL: la CSP de esta app
 * no necesita cambiar para una descarga, que es una navegación y no una carga.
 */
export function descargar(nombre: string, contenido: string, tipo = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  /* Un momento después, no en el acto: Safari cancela la descarga si la URL
     se revoca en el mismo turno del clic. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
