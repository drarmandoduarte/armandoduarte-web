import React from 'react';
import { ICONOS } from './iconos.js';

/* Lucide es el set base del molde (stroke 1.5, currentColor, sin fill).
   Autoalojado vía lucide-react (peer dependency) — nunca CDN.
   "Lucide opera, la firma identifica": los íconos de firma llegan con el logo. */
const aPascal = (name) => String(name).replace(/(^|[-_ ])(\w)/g, (m, a, b) => b.toUpperCase());

/* ── EL SILENCIO, ARREGLADO
   Un nombre que Lucide no tiene devolvía `null` y no pasaba nada más. **Un
   icono que falta no se ve como un error: se ve como un espacio.** Nadie lo
   reporta porque no hay nada roto — simplemente el botón está vacío.

   Y no era teórico. Un censo del origen encontró **tres** nombres que hoy no
   dibujan nada en producción, y los tres por la misma causa: Lucide los
   renombró y el `null` se tragó el aviso.

   Lo que cambia y lo que NO cambia:

   · **En producción no cambia nada.** Se sigue devolviendo `null`. Un icono que
     falta no puede tirar abajo el trabajo de alguien a la mitad, y
     dibujar un cuadrado de emergencia sería meter en la pantalla algo que nadie
     diseñó. Cero píxeles distintos.
   · **En desarrollo grita**, una vez por nombre. Una vez y no una por render:
     un icono roto en una lista de veinte filas llenaría la consola de veinte
     copias del mismo aviso y el resto se perdería.

   El aviso dice el nombre; **dónde** lo dice el guardián de cada app, que
   recorre los usos con nombre literal y falla si alguno no existe. Los que arman
   el nombre con una variable no se pueden ver desde afuera, y para esos está
   este aviso. Entre los dos cubren el agujero; ninguno solo. */
const yaAvisados = new Set();

/** `true` cuando corre en desarrollo o en un test; en el bundle de producción, `false`. */
const enDesarrollo = (() => {
  try { return Boolean(import.meta.env?.DEV); } catch { return false; }
})();

function avisarDelNombre(name) {
  if (!enDesarrollo || yaAvisados.has(name)) return;
  yaAvisados.add(name);
  console.error(
    `[Kit UI] Icon: «${name}» no existe en Lucide, así que no se dibujó nada y quedó un hueco. `
    + 'Si el icono existía antes, puede que Lucide lo haya renombrado.',
  );
}

/* ── Solo los que la app usa
   Hasta este PR el nombre se buscaba en el set entero de Lucide (~1.500
   íconos, todos en el bundle principal) para dibujar unos noventa. Ahora se
   busca en `ICONOS`, que genera `scripts/iconos-usados.mjs` con los nombres
   que el código dice; un nombre nuevo pide correr el script, y si no se corre
   el guardián `todo-icono-existe.test.ts` se pone rojo. */
export function Icon({ name, size = 16, strokeWidth = 1.5, style, ...rest }) {
  const L = ICONOS[name];
  if (!L) {
    avisarDelNombre(name);
    return null;
  }
  return React.createElement(L, {
    size,
    strokeWidth,
    'aria-hidden': rest['aria-label'] ? undefined : true,
    focusable: false,
    style: { flex: '0 0 auto', ...style },
    ...rest
  });
}
