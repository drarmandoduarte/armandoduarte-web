/**
 * El renombre del kit 1.2.1 → 1.3.0: de «Seguridad 512» a «Acceso».
 *
 * Es la ÚNICA diferencia permitida entre el núcleo 1.2.1 y el 1.3.0 (además del
 * título de entrada, que es un archivo nuevo). Dirección: «núcleo 1.2.1 byte a
 * byte + renombre». Por eso el renombre no es un buscar-y-reemplazar de «512»:
 * es esta tabla de reemplazos EXACTOS, en orden, que se puede deshacer. El test
 * `el-nucleo-es-el-1.2.1.test.js` deshace el renombre en cada archivo 1.3.0 y
 * exige que dé el SHA-256 que el archivo tenía en el kit 1.2.1.
 *
 * Por qué exactos: el núcleo ya decía «acceso» una vez («Falta el token de
 * acceso.»). Un reemplazo a ciegas no se podría deshacer, y la prueba no
 * probaría nada.
 */
export const RENOMBRE = [
  ['scripts/check-seguridad-512.mjs', 'guardian/check.mjs'],
  ['scripts/huellas-seguridad-512.mjs', 'guardian/huellas.mjs'],
  ['seguridad-512/HUELLAS.txt', 'HUELLAS.txt'],
  ['seguridad-512.config', 'acceso.config'],
  ['KIT DE SEGURIDAD 512', 'KIT DE ACCESO'],
  ['Kit de Seguridad 512', 'Kit de Acceso'],
  ['ConfigSeguridad512', 'ConfigAcceso'],
  ['__seguridad512_', '__acceso_'],
  ['SEGURIDAD_512', 'ACCESO'],
];

/**
 * Solo FUERA del núcleo (tests por app, adaptador, documentación): las rutas de
 * instalación `…/seguridad-512/…` pasan a `…/acceso/…`. En el núcleo no hace
 * falta —no menciona carpetas sueltas— y no se usa, porque «acceso» suelto no se
 * puede deshacer.
 */
export const RENOMBRE_DE_RUTAS = [['seguridad-512', 'acceso']];

const reemplazar = (texto, pares) => pares.reduce((t, [a, b]) => t.split(a).join(b), texto);

/** 1.2.1 → 1.3.0. */
export function renombrar(texto, { rutas = false } = {}) {
  return reemplazar(texto, rutas ? [...RENOMBRE, ...RENOMBRE_DE_RUTAS] : RENOMBRE);
}

/**
 * 1.3.0 → 1.2.1, para la prueba. En orden inverso, y con los más largos antes
 * que los cortos: «KIT DE ACCESO» se deshace antes que «ACCESO».
 */
export function desrenombrar(texto) {
  const inversos = [...RENOMBRE].map(([a, b]) => [b, a]).sort((x, y) => y[0].length - x[0].length);
  return reemplazar(texto, inversos);
}
