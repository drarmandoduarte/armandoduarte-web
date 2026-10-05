/**
 * Un fuente sin sus comentarios. Los guardianes que afirman sobre código limpian
 * antes de mirar: un test que busca un hex o una llamada en el fuente la
 * encontraría igual dentro del comentario que la explica, y saldría verde (o
 * rojo) por la prosa y no por el código.
 *
 * Saca los bloques `/* … *\/` y las líneas que empiezan con `//` o con `*`.
 * La hermana, `soloCodigoPorRenglon`, hace lo mismo sin mover ningún renglón,
 * para el guardián que tiene que decir en qué línea está lo que encontró.
 *
 * No se exporta desde el índice del paquete: es herramienta de guardián, no
 * entra en el bundle de ninguna app.
 */
export function soloCodigo(fuente) {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n');
}

export function soloCodigoPorRenglon(fuente) {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, (bloque) => bloque.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => (l.trim().startsWith('//') || l.trim().startsWith('*') ? '' : l))
    .join('\n');
}
