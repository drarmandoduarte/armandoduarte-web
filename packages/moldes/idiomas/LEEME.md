# @moldes/idiomas

Ningún texto que vea una persona está escrito en el código. Todo pasa por `t()`.

```js
import { crearT, elegirIdioma } from '@moldes/idiomas';
import design from './design.json';
import propios from './idiomas';                    // { es: {…}, en: {…}, pt: {…}, 'es-UY'?: {…} }

const idioma = elegirIdioma({ perfil: usuario?.idioma, aparato: localStorage.idioma, navegador: navigator.language });
const t = crearT({ idioma, espanol: design.app.espanol, extras: propios, comunes: { app: design.app.nombre } });

t('auth.totp.title');                  // «Verifica tu *identidad*.» (voseo: «Verificá tu *identidad*.»)
t('auth.code.wrong', { n: 2 });        // «Código incorrecto. Te quedan 2 intentos.»
```

## Los archivos

| Archivo | Qué trae |
|---|---|
| `es.json` | Español **neutro** (tuteo). La fuente. |
| `en.json`, `pt.json` | Las mismas claves, traducidas. Un test exige que sean exactamente las mismas, con las mismas variables. |
| `es-UY.json` | Solo lo que cambia con voseo («perdés», «entrá», «Verificá»). Se superpone si `design.json → app.espanol` es `voseo`. |

Claves planas con punto: `auth.*` (pantallas de acceso), `settings.*` (Ajustes), `asistente.*`, `inicio.*`, `comun.*`. En Ajustes, `.d` es la línea gris de explicación debajo de una fila.

## Variables

- `{app}`, `{email}`, `{n}`, `{fecha}`…: se reemplazan. Los nombres son en español y **los mismos en los tres idiomas**.
- `{n|intento|intentos}`: plural según `n`.
- `*palabra*`: la palabra acentuada del título. `t()` la deja; la pinta `Titulo`.

## Los textos de la app

La app suma los suyos con `extras` (`propiedades.*`, `turnos.*`), en los mismos tres idiomas y, si usa voseo, en `es-UY`. No se editan los archivos del molde: si un texto del molde no sirve, se propone al molde.

## Lo que no se traduce

Nombres propios, el nombre de la app, direcciones, y el vocabulario del negocio que la app decida mantener. Cada app lo lista en su propio LEEME de idiomas.
