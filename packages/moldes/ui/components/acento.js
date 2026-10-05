import React from 'react';

/**
 * Parte un texto con la palabra acentuada marcada entre asteriscos.
 *
 *   «Verifica tu *identidad*.» → ['Verifica tu ', <em>identidad</em>, '.']
 *
 * Es la convención de todos los guiones (y de `design.json → app.frase`): la
 * palabra entre asteriscos va en la serif de la app, en cursiva y en el color
 * del acento; el resto, en la sans. El `em` no lleva estilo propio: lo pinta
 * `.molde-display em` en `tokens/base.css`, que es donde vive la regla.
 *
 * Un texto sin asteriscos sale tal cual. Un asterisco suelto (sin cerrar) se
 * deja como está: es preferible un asterisco visible a una palabra perdida.
 */
export function partirAcento(texto) {
  if (typeof texto !== 'string') return [texto];
  const partes = [];
  const patron = /\*([^*]+)\*/g;
  let desde = 0;
  let m;
  while ((m = patron.exec(texto))) {
    if (m.index > desde) partes.push({ acento: false, texto: texto.slice(desde, m.index) });
    partes.push({ acento: true, texto: m[1] });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) partes.push({ acento: false, texto: texto.slice(desde) });
  return partes;
}

/** Lo mismo, como nodos de React. */
export function conAcento(texto) {
  if (typeof texto !== 'string') return texto;
  return partirAcento(texto).map((p, i) => (p.acento ? React.createElement('em', { key: i }, p.texto) : p.texto));
}
