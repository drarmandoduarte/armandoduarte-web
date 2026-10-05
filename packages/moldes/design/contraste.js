/* Las tres preguntas que se le hacen a un color, medidas y no estimadas.

   · `razonDeContraste`   — ¿se lee esta letra sobre este fondo? (WCAG 2.1)
   · `distanciaPerceptual` — ¿se distingue de aquel otro color, tono incluido? (ΔE en OKLab)
   · `croma`               — ¿tiene color, o es gris?

   Vive en `@moldes/design` y no en el kit porque el resolver la necesita para
   DERIVAR colores del `design.json` (el escalón de letra de cada color se busca
   hasta que pasa AA), y los tests de `@moldes/ui` la necesitan para medirlos. Una
   sola casa para la matemática, dos lectores.

   Se escribe a mano —matemática publicada, pocas líneas— y no entra ninguna
   dependencia por esto. */

function lineal(hex) {
  const c = String(hex).replace('#', '');
  return [0, 2, 4]
    .map((i) => parseInt(c.substr(i, 2), 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
}

function luminancia(hex) {
  const v = lineal(hex);
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

/** Razón de contraste WCAG 2.1 entre dos hex de seis cifras. */
export function razonDeContraste(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* `razonDeContraste` es luminancia y nada más: no sabe de tono. Un rojo y un
   verde pueden dar la misma razón contra la tinta y verse uno rojo y el otro
   casi negro. OKLab separa esos dos casos: es la distancia euclídea en un
   espacio pensado para que un salto igual se vea igual. */
function aOklab(hex) {
  const [r, g, b] = lineal(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** Cuánto color tiene un color: el croma en OKLab, la distancia al eje gris. */
export function croma(hex) {
  const [, a, b] = aOklab(hex);
  return Math.hypot(a, b);
}

/** Cuán distintos se ven dos colores, tono incluido (ΔE en OKLab). */
export function distanciaPerceptual(a, b) {
  const A = aOklab(a);
  const B = aOklab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

/**
 * De dos tintas, la que mejor se lee sobre `fondo`.
 *
 * Las dos tintas son de la app —su papel y su texto— y no dos hex escritos acá:
 * el molde no tiene colores propios. Se devuelve la de mayor contraste, y quien
 * necesite saber si además pasa AA lo mide con `razonDeContraste`.
 */
export function sobreColor(fondo, tintaClara, tintaOscura) {
  return razonDeContraste(tintaClara, fondo) >= razonDeContraste(tintaOscura, fondo)
    ? tintaClara
    : tintaOscura;
}
