# Orden Códice #02 · las capturas

Los estados que la orden pide mirar. En cada imagen: **izquierda el sitio
estático, derecha el port sin hidratar**. Si se ven iguales, la orden cumplió:
ninguno de estos tres comportamientos tiene ya una línea de React detrás.

| archivo | qué muestra |
|---|---|
| `menu-abierto-390.jpg` | el menú de pantalla completa abierto con el botón «Menú». Cierra con la ✕ y con Escape (eso lo afirma el test, no la foto). |
| `cabecera-tenida-1440.jpg` | a 600 px de desplazamiento: la cabecera toma el color de la sección que tiene debajo. |
| `cabecera-quieta-1440.jpg` | 1,1 s quieta en el mismo lugar: el velo se apagó y volvió a transparente. |
| `fundido-1440.jpg` | tras recorrer la página, los 32 bloques con `.reveal` quedaron revelados de los dos lados. |

Los píxeles de la página en reposo no están acá: los mide el guardián de
fidelidad de la #01, que sigue exigiendo **cero** diferencia en las cuatro
páginas por los tres anchos.
