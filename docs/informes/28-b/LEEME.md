# Orden Códice #28 · PR B — `/entrar`: Armando más chico, entero, dentro del panel

Capturas: `entrar-1440-antes.jpg`, `entrar-1440-despues.jpg` y `entrar-1920-despues.jpg`.

## Qué se hizo

- La figura (`.panel__foto`) pasa a **absoluta** dentro del panel. Arranca en la **línea de la cabecera** (y = 72, el borde de abajo de `.cab__dentro`) y termina en el **borde de abajo del panel**.
- El busto se pinta **entero**: `object-fit: contain`, anclado abajo y centrado. La firma no se movió.
- **A 1440 el busto tocaba la firma**: entero a todo el alto (742 px) arrancaba en el 72, y la firma va de 126 a 172. Por eso, como pide la orden, se limita a `max-height: calc(100% − 120px)`. Queda así:

| | busto pintado | desde y | firma | figura |
|---|---|---|---|---|
| 1440×900 | 515×622 | 192 | 126–172 | 72–814 |
| 1920×1080 | 664×802 | 192 | 137–183 | 72–994 |

- Debajo de 1100 px no cambia nada (el panel no se monta).

## Test

`apps/familia/e2e/entrar-busto.spec.ts`, a 1440 y 1920, comprueba:
- que el rectángulo **pintado** (natural × escala, según `object-position`) cabe entero en la figura, ±1 px, apoyado abajo y centrado;
- que la figura va de la línea de la cabecera al borde del panel, ±1 px;
- que la firma no se cruza con el busto.

| mutación | cae en |
|---|---|
| volver a `cover` | «el busto (cover) se sale 121 px (1440) / 40 px (1920) por arriba: no se ve entero» |
| sin el `max-height` | «la firma (126–172) se cruza con el busto (desde 72)» |
| la figura con `top:0` | «la figura arranca en 0, la línea de la cabecera en 72» |

En los tres casos, al devolver el archivo volvió a verde.

## Lo que decide dirección

1. **Los cortes de los brazos se ven.** La foto termina en seco en los dos brazos. Con `cover` (#18) esos cortes coincidían con los bordes del panel; ahora que el busto es más angosto, quedan como dos líneas verticales dentro del cálido. Abajo a la izquierda, además, asoma un resto del respaldo de la silla del archivo (ver `entrar-1440-despues.jpg`). Si molesta, hay dos salidas: pedirle a Lucía un busto con los hombros desvanecidos, o fundir los lados con una máscara (sería una decisión de diseño nueva).
2. **El busto no arranca en la línea.** Con el límite de 120 px que pide la orden para no tapar la firma, la caja arranca en el 192. La cabeza queda unos 10 px más abajo, por el aire transparente del archivo.
3. **Este test no corre en la gate.** El guardián solo levanta Chromium para la web (`apps/web`); el `e2e/` de `apps/familia` se corre a mano, como F.4. Para que entre a `pnpm test` hay que tocar el guardián, y eso no lo pide la orden.
