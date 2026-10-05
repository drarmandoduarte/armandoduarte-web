// @moldes/design — el esquema de design.json y lo que lo vuelve variables CSS.
export { validar, avisos, fraseDeMarca, IDIOMAS_DE_FRASE, COLORES, TIPOGRAFIAS, RADIOS } from './validar.js';
export { aVariables, aCss, hojaDeDesign, urlDeFuentes, escalonDeLetra, mezclar, SELECTOR_CLARO, SELECTOR_OSCURO } from './resolver.js';
export { aplicarDesign } from './aplicar.js';
export { razonDeContraste, distanciaPerceptual, croma, sobreColor } from './contraste.js';
export { asignarArchivos, leerHojaDeGoogle, filtrarCaras, nombreDeArchivo, hojaDeFuentes, SUBCONJUNTOS } from './fuentes.js';
