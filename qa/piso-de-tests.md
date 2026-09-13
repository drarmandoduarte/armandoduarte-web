# Piso de tests

Cuántos tests tiene que **declarar** cada suite como mínimo. Lo lee
`scripts/guardian-de-guardianes.mjs` y se compara contra el reporte de cada
corrida.

Cuenta los **declarados**, corran o no. Su trabajo es cazar a los que
desaparecen —el archivo renombrado que se sale del glob y no deja ni rastro de
saltado—; de los que están y no corren se ocupa `qa/skips-permitidos.md`.

**Bajar un número de esta tabla es un acto visible**: es un renglón en el diff y
alguien lo va a leer en el PR. Ése es el punto.

> Este archivo tiene **una sola tabla**, y no es una preferencia de formato: el
> lector se queda con la primera y una segunda le pisaría los números en
> silencio. El relato va abajo, en prosa.

| paquete | piso |
|---|---|
| `@codice/ui` | 12 |
| `@codice/core` | 12 |
| `@codice/prompts` | 3 |
| `@codice/web` | 9 |
| `@codice/navegador` | 12 |

## De dónde salen estos números

Son los que dejó la orden Códice #01, Fase A, medidos contra la corrida real —no
estimados—. `@codice/ui` es el guardián de los tokens; `@codice/core`, el del
i18n y el de los enlaces de WhatsApp; `@codice/prompts`, el del perfil de estilo;
`@codice/web`, el de las rutas.

`@codice/navegador` no es un paquete: es el guardián de fidelidad, que corre en Chromium
y compara el port contra el sitio estático. Son las cuatro páginas por los tres anchos.
Entra a esta tabla por la misma puerta que los demás — un guardián que no corre no dice
nada, y desde afuera se ve igual que uno que corrió bien.
