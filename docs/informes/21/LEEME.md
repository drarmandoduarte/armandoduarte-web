# #21 · lo que se ve es lo que hay

Orden Códice #21. Rama `web/21-lo-que-se-ve`, desde `main` (`d1bb0a9`).

## Qué se hizo

**A · la caché de las imágenes.** Cada URL de imagen sale del prerender con `?v=` y los 8 primeros hex del SHA-256 del archivo publicado. Aplica en `src`, `srcset`, `<source>`, `og:image` y el JSON-LD, en sus formas relativa, absoluta y con dominio (`apps/web/scripts/huellas.mjs`). Son 20 URLs en `/` y 32 en `/merida`. `immutable` en `/img/` se queda. Muestra: `A-huellas-en-dist.txt`.

- **Guardián nuevo en la gate:** `apps/web/src/las-imagenes-llevan-su-huella.test.ts`, con 4 tests sobre `dist/`. Busca con una expresión propia, no la del prerender.
- **Las dos mutaciones de la orden, vistas en rojo:**
  - un `.webp` cambiado sin regenerar el HTML: cae («el archivo da 78fbc39d»);
  - un `<img>` escrito a mano sin `?v=`: cae, y lo nombra.
- No existe `twitter:image` en el sitio (X usa `og:image`), así que no se agregó. El test la cubre si un día aparece.

**B · «¿Te suena?» como la captura de Lucía.**
- El recorte del CEO entra con nombres nuevos: `suena-lucia-{2400,1600,900}.webp` y `-1600.jpg`, con `<source media>` 2400/1600/900 y `object-position` 50 % 40 % (52 % 40 % a ≤ 900). `porque-fondo*` quedó sin uso y se borró; los créditos y el LEEME de fotos están actualizados.
- Rótulo y números 01–03 en el token nuevo **`--ocre-texto` #795B34** (`color.brand.ochre.text`, design system 1.2.2). Es el ocre de la casa (#866539, matiz 34°; el de la captura mide ~35°) oscurecido lo mínimo, en pasos de 0,5 %, hasta 4,5 sobre el **píxel pintado** a 12 px, en los cuatro anchos de `check/contraste.mjs`:

  | ancho | 390 | 375 | 900 | 1440 |
  |---|---|---|---|---|
  | peor elemento (media) | **4,51** («03») | 4,60 | 4,89 | 4,92 |
  | rincón más oscuro (p5) | 4,46 | 4,55 | 4,27 | 4,83 |

  Un paso más claro (#7A5C34) da 4,45 a 390.
- La cita va al 84 % del contenedor y alineada a la izquierda, desde 901 px; debajo sigue a lo ancho, como estaba. Al 84 % envolvía un renglón más y la sección medía 905 a 1440×900. Por el orden de la #20, el padding vertical de la cita baja de 28 a 24 y la sección vuelve a entrar.
- Captura: `B-te-suena-1377x980-junto-a-lucia.jpg`, sin la cabecera fija, que la de Lucía tampoco tiene.

**C · «Qué hago».** A ≥ 1100 px, rótulo y título a la izquierda, arriba, y las tres filas a la derecha, con la descripción debajo del nombre. Columnas 7/5: con 5/7, a 1440 «juntos.» quedaba solo en su renglón (lo cazó `renglones.spec.ts`). La sección mide **556** de alto (antes 748). Debajo de 1100 se apila como antes. Captura: `C-que-hago-1440x900.jpg`.

## Verificación de cierre (D)

| | resultado |
|---|---|
| gate | verde · 386 declarados, 0 saltados |
| `check:acento` | verde |
| `check:renglones` | 0 huérfanos |
| `check:altura` | la misma única excepción (`#quien`) |
| `check:contraste` | **12 bajo AA**: los 12 son la franja de hechos (ver decisión 1). El ocre nuevo pasa en todos |
| fidelidad | **capturas actualizadas por la orden #21** (ver abajo) |
| Lighthouse móvil | no baja (ver abajo) |

**Capturas de fidelidad actualizadas por la orden #21** (`--update-snapshots`):
- `inicio-1440.png`: «Qué hago» en dos columnas;
- `taller-1440/900/390.png`: la foto con el encuadre de Lucía, el ocre y la cita;
- `inicio-cabeza.json` y `taller-cabeza.json`: `og:image` con `?v=`.

`inicio-900/390` no cambiaron: debajo de 1100 «Qué hago» sigue igual.

**Lighthouse 13.5.0, móvil, simulate, `dist/` en local.** La base es `origin/main`, medida en esta sesión.

| ruta | `main` | esta rama | peor |
|---|---|---|---|
| `/` (8 corridas) | 95 95 96 95 95 96 96 96 | 95 95 96 95 95 95 96 96 | 95 = 95 |
| `/merida` (3 corridas) | 96 95 95 | 96 95 96 | 95 = 95 |

La accesibilidad da 100 en las dos rutas.

## Qué decisión necesita dirección

1. **La franja de hechos de «¿Te suena?» baja de AA con la foto nueva.** Con el encuadre de Lucía, el pelo del chico queda detrás de la franja, y las etiquetas grises de 11 px (FECHA, HORARIO, DÓNDE, MODALIDAD) caen a **3,69–4,31** en los cuatro anchos. En `main` pasaban. La orden dice que la franja no cambia, así que no se tocó. Medido:
   - **(a) las etiquetas de la franja en `--tinta`**, como el resto del texto de esa sección desde la #19: **0 pares bajo AA** en los cuatro anchos. Es una regla CSS.
   - (b) subir el velo **no alcanza**: al 88 % quedan en 3,87–4,41, al 90 % en 4,05–4,45 y al 92 % en 4,25–4,49.
   - Mover el encuadre tampoco alcanza: probados 20, 40, 55, 70 y 100 % vertical.
2. **A 375 la cara del chico no entra entera.** La sección mide 375×2242 y `cover` dibuja el recorte apaisado a ~3150×2242: se ve el **12 %** del ancho, media cara. Con `porque-fondo` (2:3) se veía el 25 %, que tampoco era la cara entera. La salida concreta es servir a ≤ 600 px un recorte **vertical** del mismo original, con la cara centrada, en lugar de `suena-lucia-900`. Hace falta que el CEO lo recorte, como hizo con el apaisado.

## Qué quedó pendiente

Nada más de la orden. La prueba real de A la hace Germán: con el PASA, merge, recarga normal en su Chrome, y ver las fotos nuevas.
