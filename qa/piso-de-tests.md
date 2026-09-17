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
| `@codice/ui` | 30 |
| `@codice/core` | 23 |
| `@codice/prompts` | 3 |
| `@codice/web` | 17 |
| `@codice/navegador` | 20 |

## De dónde salen estos números

Son los que dejó la orden Códice #01, Fase A, medidos contra la corrida real —no
estimados—. `@codice/ui` es el guardián de los tokens; `@codice/core`, el del
i18n y el de los enlaces de WhatsApp; `@codice/prompts`, el del perfil de estilo;
`@codice/web`, el de las rutas.

`@codice/navegador` no es un paquete: es el guardián de fidelidad, que corre en Chromium
y compara el port contra el sitio estático. Son las cuatro páginas por los tres anchos.
Entra a esta tabla por la misma puerta que los demás — un guardián que no corre no dice
nada, y desde afuera se ve igual que uno que corrió bien.

## Lo que movió la orden #06

`@codice/web` sube de 9 a **17**, `@codice/navegador` de 14 a **17** y `@codice/ui`
de 27 a **30**. Catorce tests nuevos, y casi todos vigilan cosas que **no se ven
en una captura**.

**Tres en `@codice/ui`** — los pares del telón del menú: crema sobre grafito
(16,62), el pie del menú en crema al 65 % sobre grafito (7,13) y el ámbar del
hover sobre grafito (6,03). El del 65 % se **calcula** en el test en vez de
escribirse: una mezcla escrita a mano es un cuarto valor que se desincroniza.

**Ocho en `@codice/web`** — `comportamiento.test.ts` pasó de 2 a 10. Antes
comprobaba que una lista de dos colores coincidiera con dos tokens; ahora
comprueba que la **medición** de luminancia clasifique bien los seis fondos que
la web pinta, más cuatro pisos: que la conversión convierta, que la medición
mida los dos extremos, que `rgba(0,0,0,0)` no cuente como oscuro y que una
cadena que no es un color no rompa nada.

El cambio de forma importa más que el número. El test viejo vigilaba **una
copia** y por eso se podía desincronizar apuntando a la fuente equivocada — y se
desincronizó: entre la #05 y la #06 el header quedó en 1,70:1 sobre el teal con
el test en verde (pendiente 14). El nuevo vigila una función que mide, y lo único
que puede fallar es que alguien elija un fondo que de verdad esté en el límite,
que es exactamente lo que un test debería hacer notar.

**Seis en `@codice/navegador`** — `comportamiento.spec.ts` pasó de 2 a 8. Tres
son del menú abierto y se agregaron **después de descubrir que nadie lo miraba**:
las doce capturas del guardián de fidelidad son de la página con el menú cerrado,
y cerrado el overlay es `visibility:hidden`. La mutación que la orden proponía
—devolver el `font-size` de los ítems al `clamp()` viejo— dio **cero capturas en
rojo** la primera vez que se corrió: el rediseño entero del menú no tenía nada
que lo vigilara. Ahora hay dos capturas del overlay (1440 y 390) y un test que
mide sus números con `getComputedStyle` contra los del motor de 512. Con eso la
misma mutación tira el test **y** 32.737 píxeles.

Los otros tres son de foco:

- que el anillo sea del color del texto, 2 px, offset 3, **y que el clic con el
  mouse no lo deje** —el orden de las dos mitades importa y está escrito: una
  vez que el teclado encendió `:focus-visible`, el navegador se lo deja puesto,
  así que medir el mouse después del Tab da verde siempre;
- que con el menú abierto el `Tab` recorra cierre → ítems → WhatsApp **sin salirse
  del overlay**;
- que `Escape` cierre y devuelva el foco al botón «Menú».

## Lo que la orden #05 **bajó**, que es lo que hay que leer con cuidado

`@codice/ui` baja de 35 a **27** y `@codice/web` de 13 a **9**. Doce tests menos,
y bajar un número de esta tabla es un acto visible: acá está el motivo.

**Retirados por D24: la referencia del port cumplió su propósito en la #04.** Los
doce comparaban la web contra `qa/referencia/`, el sitio estático:

- **8 en `@codice/ui`** — el bloque que ataba la sección `web` del JSON de tokens
  a `estilo.css`: que cada `clamp()` de la escala display, el aire de sección, el
  alto del hero, el radio del arco y las dos alturas del header estuvieran
  textualmente ahí.
- **4 en `@codice/web`** — `el-css-esta-entero.test.ts` entero, que comparaba
  regla por regla en las dos direcciones.

Desde la #05 la web tiene paleta, íconos y fotografías propias: el estático dejó
de ser su especificación. Un guardián que compara contra algo que ya no es verdad
no vigila, hace ruido, y el ruido termina apagado. Lo que sí sigue vigilando que
el JSON no envejezca son las 27 que quedan: el contraste en aritmética, con cada
par y su número al lado, y que ningún color se escriba dos veces.

`@codice/navegador` **no baja**, y eso es a propósito. `comportamiento.spec.ts`
también leía el estático, pero sus dos tests ya afirmaban **cada estado contra su
valor literal** —el menú cerrado en `opacidad '0'`, abierto en `'1'`, el velo de
la cabecera encendiendo en `'1'` y apagando en `'0'`— y encima de eso comparaban
contra la otra pestaña. Se retiró la comparación; se quedaron los literales, que
son los que cazaban un menú muerto. El `toEqual` nunca lo hizo: dos páginas rotas
igual se parecen muchísimo.

## Lo que movió la orden #05

`@codice/ui` sube de 21 a 35 y `@codice/core` de 12 a 23. Los veinticinco tests
nuevos son de las dos cosas que la orden #05 podía romper en silencio.

**Contraste (14 en `@codice/ui`).** La web cambió a la paleta del manual de
Construyendo Familias Fuertes, así que hay pares nuevos: el naranja de texto
contra los tres fondos claros, el crema contra el teal oscuro, el ámbar contra la
tinta. Los ocho pares viejos —el ocre y el teal de D6— **no se borraron**: siguen
siendo ciertos y son los que va a usar la app. Tres de los nuevos son al revés,
afirmaciones de lo que **no** llega: el teal claro sobre el teal oscuro (2,56), el
teal claro sobre el cálido (2,73) y el ámbar sobre el teal (2,81, el pendiente
4c). Están escritos como igualdad y no como «menor que» a propósito: el día que
alguien los arregle, el test se pone rojo y lo obliga a venir a borrar la
excepción. Una excepción que se arregla sola en silencio vuelve a los seis meses.

**Los dos teléfonos (11 en `@codice/core`).** Desde la #05 la portada llama a
Gaby y el taller a Mérida, y el modo de fallar no es un enlace roto: es un enlace
perfecto que suena en el teléfono equivocado. Eso no lo ve una captura, no lo ve
el `<head>` y no lo caza el guardián de fidelidad. Las dos comprobaciones que
importan son cruzadas —ningún `wa.me` de la portada con el número del taller, y
ninguno del taller con el de Gaby— y van en las dos direcciones por separado:
una sola dejaría pasar la mitad de los cruces.

`@codice/web` y `@codice/navegador` **no se mueven**, y vale decir por qué no: el
guardián de fidelidad sigue siendo doce comprobaciones —cuatro páginas por tres
anchos—, lo que cambió es contra qué compara (D24). Mismo número, referencia
nueva.

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
