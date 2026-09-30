# #18 · la entrada

Orden Códice #18, «La entrada a la altura de la web». Rama `mi-espacio/04-la-entrada`, desde `main` (`e271cab`).

> La orden dice «el informe en el mismo PR #27». El #27 ya estaba mergeado cuando se actualizó la orden (30/9 01:30), y esa misma actualización pide **PR propio**. Así que el informe va en este PR.

## Qué se hizo

**A · dos mitades a ≥ 1100.** A la izquierda, el panel `--calido` a sangre, con «Construyendo familias fuertes» en Great Vibes y el busto (`medio-cuerpo`, recorte de 900) llenando el panel de borde a borde, apoyado en la línea del pie. A la derecha, la columna de 420. Por debajo de 1100 el panel no se monta y queda el retrato circular de 64 px arriba del título. A 375 no hay scroll horizontal y el botón principal se ve sin desplazar (lo mide el script).

**B · la columna, de arriba abajo.**
- Cabecera con el wordmark y «← Volver a la web», los dos hacia `armandoduarte.com`.
- «Entra a tu *espacio*.» con «espacio» en `--teal`.
- La bajada nueva.
- **Continuar con Google primero**, con el logo oficial.
- Separador «o con tu correo».
- Campo con fondo cálido, hairline y foco teal.
- «Enviarme el código», el único naranja.
- El paso del código: «Te enviamos un código a …» + «Cambiar», **seis casillas** y la cuenta regresiva.
- El aviso legal y el pie: © · Aviso de privacidad · Términos · ¿Necesitas ayuda? WhatsApp (el de Gaby, con `enlaceWhatsApp`).

**C · las otras cuatro pantallas heredan el marco.** Enrolar, reto, códigos y Mi espacio pasan por la misma `Pantalla`: misma cabecera, mismo pie, misma columna de 420. Cada título tiene una palabra en teal: «Protege tu *cuenta*», «Confirma que eres *tú*», «Guarda tus *códigos* de respaldo» y «Hola, *nombre*».

**F.**
- Con sesión, rol y `pasar`, la URL pasa a `/mi-espacio`; sin sesión, a `/entrar`. Usa `replaceState`, y los estados intermedios no la mueven. La regla es una función pura con tabla: `rutaQueCorresponde`.
- `OtpInput` no existía en el kit y se hizo acá: `CampoDeCodigo`.

## Cómo se verificó

`apps/familia/check/capturas-18.mjs` corre el build real con la CSP de `vercel.json`. Supabase y `/api` van simulados, así que ninguna cuenta se toca. Hace 30 capturas: 6 pantallas × 1440/1100/900/390/375. En cada una mide con los barridos de la web, **importados y no copiados**:

| | resultado |
|---|---|
| `acento` (naranja solo en `.btn--naranja`) | **0** fuera del botón en las 30 |
| `contraste` | **0** pares bajo AA en las 30 |
| `renglones` (títulos) | **0** renglones de una palabra |
| scroll horizontal / CSP | 0 / 0 |

Dos cosas declaradas del contraste:
- Los botones **deshabilitados** («Guardar», «Ya los guardé», al 45 %) se apartan por WCAG 1.4.3, que exime a los componentes inactivos. Salen contados en la columna `inactivos`.
- Para importar `RECOLECTAR`, `contraste.mjs` pasó a exportarlo, con la corrida de consola detrás de la misma guarda que `acento.mjs`. Se corrió sobre la web **antes y después del cambio: la salida y el JSON son byte a byte iguales** (204 pares, 0 bajo AA).

**Lado a lado con Bitácora Clínica a 1440:** `lado-a-lado-bitacora-1440.jpg`, las dos en español. A Bitácora se le cerró el aviso de cookies en un navegador descartable.

**`check:tokens`.** Ahora barre los SVG de `apps/familia/public` y excusa **exactamente** `img/google.svg`, con tope 1. Tres mutaciones, cada una vista en rojo:
- otro SVG con hex: cae;
- una segunda fila en la lista: cae por el tope;
- el logo sin color: cae, porque la fila sobra.

**Tests:** `@codice/familia` pasa de 59 a **80**, con seis mutaciones en `qa/piso-de-tests.md`. La gate da **381 declarados**, 0 saltados, y `typecheck`, los `check:` y el build, verdes.

## Lighthouse — el número con su método

**Lighthouse 13.5.0, móvil, `--throttling-method=simulate`, `dist/` servido en local por `e2e/servidor.mjs`, 3 corridas.** La base se midió **en esta sesión** sobre `origin/main`, y dio **76**, no el 77 de la orden.

| `/entrar` | performance | accesibilidad | LCP |
|---|---|---|---|
| `main` | 76 76 76 | 100 | 4,2 s |
| primera versión de la rama | 71 71 71 | 100 | 5,0 s |
| **esta rama** | **75 75 75** | **100** | 4,3–4,4 s |

De 71 a 75, medido:
1. El busto se descargaba **también en el teléfono**, oculto con `display:none` y con `fetchpriority="high"`. Ahora el panel y el retrato se montan según el ancho (`usar-ancho.ts`), y cada ancho baja solo su imagen: 73.
2. El retrato chico y el logo de Google van con `loading="lazy"`: 75.

El punto que falta **no está en las imágenes**. Medido sin retrato: 75. Sin retrato y sin logo: 75. `fetchpriority="low"`: 75. Es el marco nuevo (cabecera, pie, separador), que suma trabajo de pintado antes del LCP en la CPU simulada.

## Qué quedó pendiente

- **Performance 75 contra 76 de `main` hoy: baja un punto.** Por la regla de la orden («no baja»), esto **no pasa** tal cual. Ver decisión 1.
- Un defecto previo, visto al armar el banco y **no tocado** (fuera de alcance): si `leerNiveles()` tira una excepción, `recargar()` no la atrapa y la app queda en «Un momento…» para siempre. Lo destapó un JWT de prueba mal formado. Merece su orden.
- El mensaje de WhatsApp del pie es nuevo («Hola, necesito ayuda para entrar a Mi espacio.»): Gaby recibe el contexto de dónde viene. Por D23 lo puede cambiar el equipo de Armando.
- «Confirma que eres tú» lleva un espacio duro entre «Confirma» y «que». Sin él, a 1440, «Confirma» quedaba solo en su renglón (lo cazó `renglones`).

## Qué decisión necesita dirección

1. **Performance de `/entrar` móvil en 75 (`main` 76).** Las opciones:
   - (a) aceptar el punto como costo de la cabecera y el pie que pide la orden;
   - (b) pedir otra vuelta sobre el marco.

   Ya se probaron las palancas de las imágenes.
2. **El color de la firma.** Va en `--tinta` porque en esta pantalla el naranja es solo del botón (B.2). En el pie de la web es naranja. Si dirección la quiere en otro color, es un renglón.

## Auditoría del CEO (30/9 02:05) · aplicada

- **Performance 75: aceptado.** Firma en `--tinta`: se queda. El «Un momento…» eterno va en la orden #22.
- **Decisión 2, el busto:** pasa al recorte de **900** (`medio-cuerpo-900.webp`, 67 KB; el de 560 se borró de `public/`). Ahora **llena el panel de borde a borde**: el corte del brazo izquierdo coincide con el borde de la pantalla y el del derecho con el cambio a crema. Se ve en `zoom-brazo-izquierdo-1440.jpg`, que es la esquina de abajo a la izquierda del panel al doble, con la línea del pie adentro.
- **Lo que costó la primera vuelta, dicho:** con la foto a `width:100%` en el flujo, a 1440 medía 782 px de alto, estiraba la fila y mandaba el pie debajo del pliegue (la captura medía 1073 en una pantalla de 900). Ahora la foto vive en una caja que toma el espacio que queda debajo de la firma, sin aportar altura, y la llena con `object-fit:cover` anclada arriba. Las capturas vuelven a medir la pantalla exacta: 1440×900 y 1100×800.
- El marco en el teléfono no cambia: a < 1100 el panel no se monta y el busto no se descarga (`usar-ancho.ts`).
