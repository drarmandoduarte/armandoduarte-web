# #23 · dos héroes iguales, aire de verdad, Armando entero, los núcleos como 512

Orden Códice #23. Rama `web/23-heroes-y-aire`, desde `main` con el #33 adentro (`89d32c2`).

## Qué se hizo

**La regla de 100 vh, acotada.** Las secciones vuelven a `padding-block: clamp(96px,12vh,144px)`: 108 px a 1440×900, antes 45. `#quien` y `#facilitador`, que apoyan a Armando en el borde, pasan el mismo aire a su columna de texto. Se fue el padding apretado de `.suena-fondo`.

`check:altura` (y `e2e/altura.spec.ts`, que importa el mismo `JUZGAR`) afirma dos cosas:
- los héroes miden exactamente la pantalla;
- ninguna sección pasa de 1,6 pantallas.

`PENDIENTES` quedó vacía y la fila de `#quien` se fue: mide 1160 contra un tope de 1440. La más alta de `/merida` es `#facilitador`, con 1049. Mutaciones vistas en rojo:
- hero con 40 px de más → 4 hallazgos;
- `#testimonios` con `padding-block: 500px` → «pasa el tope de 1.6 pantallas».

**A · un solo hero.** Es `web/comun/Hero.tsx`. Portada y taller le pasan textos, botones y la línea de datos, y nada más. A 1440×900:
- arco en **(747, 124) 621×776**, a 48 px de la cabecera y apoyado abajo;
- rótulo en **y=148**, a 72 px de la cabecera;
- título a 80 px en las dos páginas.

El del taller quedó en tres renglones: «El arte de / amar a tu / ADOLESCENTE». «El arte de amar a tu» pide 762 px a 80 y la columna da 625. Partido en «de / amar» no deja ningún huérfano. Test nuevo: `e2e/heroes-iguales.spec.ts`, a 1440×900 y 1920×1080. Lo vi caer devolviéndole al taller las columnas de la #16. Captura: `A-heroes-1440x900.jpg`, con las dos reglas.

**B · la banda de hechos.** Es `taller/Hechos.tsx`, entre el hero y «¿Te suena?», con el mismo `padding` que «AHORA». Va sobre `--calido`, con íconos teal, etiquetas en tinta y una sola fila a escritorio. Mide **136** de alto contra 141 de «AHORA». «¿Te suena?» arranca con su aire, y lo demás no cambia.

**A 375 la cara del chico queda detrás del título**, como anticipó el CEO al cerrar el #33. El título arranca a 143 px del borde de la sección, dentro de los 812 de la foto. Capturas: `B-hechos-y-suena-1440.jpg` y `B-suena-375x812.jpg`.

**C · Armando entero.** Entra la v3 de `de-pie` (1400×2791) y `Retrato.tsx` declara 2791. Test nuevo en `armando-no-flota.test.ts`: la primera fila es transparente en todo el ancho. Con la v2 cae con «228 píxeles con alfa». En `#quien` y `#facilitador`, a 1440 y 375, la cabeza está entera y el borde de abajo queda a **0 px** del de la sección. Capturas: `C-armando-*-{cabeza,pies}.jpg`.

**D · los núcleos como «Cuatro etapas».** A ≥ 1100 px van cinco columnas de 227 con 40 de separación:
- círculo de 44 con borde de 1 px `--teal`;
- el ícono de Lucía adentro, a 20 px, en `--teal`;
- una línea de 1 px `--hair` al siguiente, y el último sin línea;
- «01»…«05» en 12 px, título 24/400 y texto 16.

Debajo de 1100 va la misma línea en vertical. Textos sin tocar y sin naranja.
- Para el teal, de cada ícono se sacó **solo el dibujo** (`img/iconos/glifo-*.png` y `glifo-cambios.svg`) y se pinta como máscara SVG en línea sobre `currentColor`. Así el color sale del token y la URL lleva su `?v=` del prerender. Un `mask-image` en el CSS no la llevaría (#21 A).
- Capturas: `D-nucleos-1440-junto-a-512.jpg` (la de 512 sacada a 1440 en esta sesión) y `D-nucleos-375.jpg`.

**Páginas enteras a 1440:** `E-portada-1440.jpg` y `E-merida-1440.jpg`.

## Lo que no estaba en la orden y hubo que hacer (declarado)

1. **A 1920×1080 el arco es más angosto que 4/5: 711×956.** Con el 4/5 medía 765 de ancho y a la columna de texto le quedaban 571. «Familias fuertes» se partía en cuatro renglones. La columna del arco tiene un tope: lo que deja libre el titular (`min(44vw, 625px)`). A 1440 no muerde (621×776, 4/5 exacto). Se angostó en lugar de bajarlo porque la orden fija dónde arranca y dónde apoya. El busto va en `cover`.
2. **`--ocre-texto` #795B34 → #755832** (design system 1.2.3). Sin la franja, el título y los números de «¿Te suena?» quedaron sobre otra parte de la foto, y a 1440 «01» y «03» caían a 4,32 y 4,43. Mover el encuadre no alcanzaba: probé 20, 30, 55 y 70 % vertical. Apliqué el mismo criterio de la #21, el mínimo medido: 1440 → 4,54, 900 → 5,14, 390 → 5,24, 375 → 5,22. Un paso más claro da 4,47.
3. **Dos renglones huérfanos nuevos en los núcleos, declarados en `PENDIENTES` de `check/renglones.mjs`.** Son «Estudiar la / adolescencia» (1440, 390, 375) y «Realizar los / cambios» (1440). A 24 px en 227 no entran en un renglón, y en dos cualquier corte deja una palabra sola.

## Verificación de cierre (E)

| | resultado |
|---|---|
| gate | verde · 388 declarados (39 en Chromium), 0 saltados |
| `check:contraste` | **0 bajo AA** (191 pares) |
| `check:acento` | verde |
| `check:renglones` | 0, con las dos pendientes nuevas declaradas (punto 3) |
| `check:altura` | verde con la regla nueva; mutaciones arriba |
| e2e | 39/39 |
| fidelidad | **las 12 capturas actualizadas por la orden #23** (`--update-snapshots`): `inicio`, `taller`, `privacidad` y `terminos` a 1440/900/390, por el aire |

**Lighthouse 13.5.0, móvil, simulate, `dist/` en local.** La base es `main` (`89d32c2`), construida y medida en esta sesión.

| ruta | `main` | esta rama |
|---|---|---|
| `/` (9 corridas) | 96 96 96 95 96 96 96 95 96 | 96 95 95 95 96 95 96 96 96 |
| `/merida` (15 corridas) | peor **95**, mediana 95 | peor **94** (dos veces), mediana 95 |

Accesibilidad 100 en las dos rutas. En `/merida` el LCP de la rama es ~75 ms más lento (2703–2779 contra 2629–2708). **No son los glifos**: sacándolos del HTML da lo mismo (2703–2748). No encontré la causa.

## Qué decisión necesita dirección

1. **Los dos huérfanos de los núcleos** (punto 3). Salidas: aceptarlos, títulos a 22 px, o cuatro columnas en vez de cinco. Cualquiera de las tres cambia algo que fijó la orden.
2. **El arco a 1920** (punto 1): ¿vale angostarlo, o se prefiere el 4/5 bajando el arco?
3. **Lighthouse de `/merida`**: dos 94 en 15 corridas contra un piso de 95 en `main`, con la misma mediana. ¿Se acepta o se investiga más?

---

## Auditoría del CEO (PR #35, 30/9 13:05): el ajuste y las decisiones

- **Una sola numeración por núcleo:** se quitó la línea «01»…«05» y queda «NÚCLEO 1»…, que es el nombre que usa Armando. Captura `D-nucleos-1440-junto-a-512.jpg` rehecha. Fidelidad de `taller` a 1440/900/390 actualizada por el ajuste: cambian el texto y la imagen.
- **Títulos en dos renglones: aprobados.** Pasaron de `PENDIENTES` a `APROBADAS` en `check/renglones.mjs`, con el motivo de dirección.
- **Arco a 1920 como está** y **Lighthouse de `/merida` aceptado**: sin cambios.
- `main` con el #34 adentro. El conflicto en `qa/piso-de-tests.md` se resolvió con `web` 63 y `familia` 83, más las secciones de la #23 y la #22.
