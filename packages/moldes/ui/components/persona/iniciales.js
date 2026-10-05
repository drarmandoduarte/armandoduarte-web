/* Las iniciales de un nombre, para cuando no hay foto.

   Vive suelta porque la usan DOS avatares —el del cliente final y el del equipo— y
   la última vez que esta función se copió en vez de compartirse perdió sus seis
   casos de test por el camino. Con un solo cuerpo, la red
   de `iniciales.test.js` cubre a los dos.

   `Array.from` y no `charAt`: hay nombres con letras fuera del plano básico, y
   `charAt` de una de ellas devuelve media letra — un rombo negro en el avatar. */

export function inicialesDeNombre(nombre) {
  return String(nombre || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => Array.from(palabra)[0].toUpperCase())
    .join('');
}
