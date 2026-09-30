/**
 * La palabra acentuada de un título — orden Códice #18, B.2 y C.
 *
 * Los títulos de Mi espacio llevan **una** palabra en `--teal` («Entra a tu
 * *espacio*.»). La marca va en el texto de `familia.json` entre corchetes —
 * `"Entra a tu [espacio]."`— y no partida en tres claves, por dos motivos:
 *
 *   · quien traduzca o edite el título lo ve entero, y decide dónde cae el
 *     acento en su idioma sin tener que reconstruir la frase de tres pedazos;
 *   · una sola clave por título es una sola cosa que `check:i18n` cuenta.
 *
 * Es una función pura y vive fuera del `.tsx` por la regla 1 de la casa: la
 * pantalla solo pinta lo que esta función parte.
 *
 * Solo se lee el **primer** par de corchetes, a propósito: una palabra por
 * título. Un segundo par queda como texto, y así se ve —en vez de convertirse
 * en un segundo acento que nadie decidió—.
 */
export interface TituloPartido {
  antes: string;
  palabra: string | null;
  despues: string;
}

export function partirAcento(texto: string): TituloPartido {
  const abre = texto.indexOf('[');
  const cierra = abre === -1 ? -1 : texto.indexOf(']', abre + 1);
  if (abre === -1 || cierra === -1 || cierra === abre + 1) {
    return { antes: texto, palabra: null, despues: '' };
  }
  return {
    antes: texto.slice(0, abre),
    palabra: texto.slice(abre + 1, cierra),
    despues: texto.slice(cierra + 1),
  };
}
