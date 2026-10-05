/**
 * Pinta la página con un `design.json`: enlaza dos hojas que la app sirve desde
 * su dominio. Es lo que una app llama una vez al arrancar, antes de montar React
 * (spec Kit UI §A.2).
 *
 *  · `/design.css`: las variables de claro y oscuro. La escribe
 *    `generar-css.mjs` en `public/` al armar la app, y se commitea.
 *  · `/fuentes/fuentes.css`: las fuentes PROPIAS de la app. Las deja
 *    `bajar-fuentes.mjs` en `public/fuentes/`, y se commitean.
 *
 * Nunca escribe un `<style>`: la CSP de las apps es `style-src 'self'`, y con
 * ella un `<style>` no se aplica. Solo `<link>` a archivos del mismo dominio.
 *
 * Idempotente: si se llama dos veces, reemplaza lo que había; no duplica.
 * El tema oscuro se elige con `data-theme="dark"` en `<html>`: lo decide la app.
 */
const ID_HOJA = 'design-molde';
const ID_FUENTES = 'design-molde-fuentes';

function enlazar(documento, id, href) {
  let enlace = documento.getElementById(id);
  if (!href) { enlace?.remove(); return; }
  if (!enlace) {
    enlace = documento.createElement('link');
    enlace.id = id;
    enlace.rel = 'stylesheet';
    documento.head.prepend(enlace);
  }
  enlace.href = href;
}

/* `design` no se lee: las variables ya están en `design.css`. Se recibe igual
   para que la llamada de cada app no cambie. */
export function aplicarDesign(design, { documento = globalThis.document, hoja = '/design.css', fuentes = 'propias', hojaDeFuentes = '/fuentes/fuentes.css' } = {}) {
  if (!documento) return;
  enlazar(documento, ID_FUENTES, fuentes === 'propias' ? hojaDeFuentes : null);
  enlazar(documento, ID_HOJA, hoja);
}
