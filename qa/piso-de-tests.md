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
| `@codice/ui` | 21 |
| `@codice/core` | 12 |
| `@codice/prompts` | 3 |
| `@codice/web` | 13 |
| `@codice/navegador` | 14 |

## De dónde salen estos números

Son los que dejó la orden Códice #01, Fase A, medidos contra la corrida real —no
estimados—. `@codice/ui` es el guardián de los tokens; `@codice/core`, el del
i18n y el de los enlaces de WhatsApp; `@codice/prompts`, el del perfil de estilo;
`@codice/web`, el de las rutas.

`@codice/navegador` no es un paquete: es el guardián de fidelidad, que corre en Chromium
y compara el port contra el sitio estático. Son las cuatro páginas por los tres anchos.
Entra a esta tabla por la misma puerta que los demás — un guardián que no corre no dice
nada, y desde afuera se ve igual que uno que corrió bien.

## Lo que movió la orden #03

`@codice/ui` sube de 12 a 21: nueve tests nuevos de contraste. Ocho son un par
token-contra-token que tiene que dar ≥ 4,5:1, y el noveno es su piso —negro sobre
blanco da 21, un color contra sí mismo da 1, y el gris viejo sobre el cálido sigue
dando 4,00—. Van en aritmética y al lado de los valores porque un hex que se
aclara medio punto dentro de seis meses no rompe nada, no se ve en un diff de
color y devuelve la web al 96 de Lighthouse sin que ninguna comprobación diga una
palabra.

## Lo que movió la orden #02

`@codice/web` sube de 9 a 13 y `@codice/navegador` de 12 a 14, y los seis tests nuevos
son el mismo trabajo mirado desde dos distancias. La orden le sacó React al navegador,
así que hacen falta dos cosas que antes nadie tenía que comprobar: que el bundle no
vuelva —`el-html-no-carga-react`, cuatro afirmaciones baratas sobre el `dist/`— y que los
tres comportamientos sigan vivos sin él —`comportamiento.spec.ts`, dos en Chromium contra
el sitio estático—. Las doce de fidelidad no los cubrían: miden la página quieta, y lo
único que React hacía en el navegador era moverse.
