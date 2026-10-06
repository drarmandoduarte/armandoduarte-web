# CHANGELOG · moldes-apps

## 1.1.2 · 5/10/2026
- Las apps cargan sus colores y su letra desde archivos propios: funcionan con la política de seguridad más estricta del navegador.
- Las pruebas del molde corren solas en cada cambio propuesto, con la hora de un servidor.
- Se sumó a lo vigilado el archivo que dice cómo se compila el molde.

### PR 9 · estilos como archivo (CSP `style-src 'self'`), `globals`, la huella del `tsconfig.base.json` y el CI
- `@moldes/design`: `generar-css.mjs <design.json> <public>` escribe `public/design.css` (las variables de claro y oscuro, con cabecera), igual que `bajar-fuentes.mjs` escribe las fuentes; se corre al armar la app y se commitea. `hojaDeDesign()` es lo que escribe. `aplicarDesign(design)` ahora solo enlaza `/design.css` y `/fuentes/fuentes.css` con `<link>` (rutas cambiables con `hoja` y `hojaDeFuentes`) y no crea ningún `<style>`. El modo `fuentes: 'google'` se fue: el storybook tampoco lo usa.
- `ui/tokens/sin-estilos-por-js.test.js`: ninguna pieza de ningún paquete escribe estilos por JS (`<style>`, `createElement('style')`, `setAttribute('style')`, `cssText`, `innerHTML`, `dangerouslySetInnerHTML`, `insertRule`/`CSSStyleSheet`, `style` como texto). Las props `style={{…}}` de React quedan: van por el CSSOM y la CSP no las bloquea (medido, ver abajo).
- Storybook armado como una app: `construir.mjs` escribe `dist/design/<marca>.css` y `dist/fuentes/<marca>/` (con `--fuentes`, que usan las capturas), el `<style>` del `index.html` pasa a `galeria.css`, y `servir.js` sirve `dist/` con la CSP de las apps. `storybook/csp.test.js` recorre la galería (tres marcas, dos temas, tres idiomas, 390 y 1440) y las doce pantallas de la app armada en dos marcas, y exige cero violaciones, cero `<style>`, el `design.css` aplicado y las props `style` aplicadas; un `<style>` plantado sí viola. Las capturas también se sacan con la CSP y fallan si algo la viola.
- El guardián vigila `packages/tsconfig.base.json` (archivo suelto, clave `tsconfig.base.json` en `HUELLAS.txt`).
- `.github/workflows/test.yml`: `pnpm test` con `TZ=UTC` en cada PR y en `main`, con Chromium para la prueba de la CSP. `test:utc` ya no repite esa prueba (no depende de la hora).
- Docs: `docs/fase-2.md` §1 con la CSP exacta de las apps y los dos archivos generados, §4, §7 paso 8 (`globals: true` para los tests del núcleo del frontend, también en el `LEEME.md` del kit), §10 (capturas de acceso con los headers de producción) y §11.

## 1.1.1 · 5/10/2026
- Las pantallas del molde se arman también dentro de cada app, no solo acá.
- En portugués, la app se nombra sin «o» ni «do» delante: «Entre em *Nombre*.», «Pergunte a Nombre».
- El control que verifica que nadie cambió el molde ahora no se puede apagar editándolo.

### PR 8 · los seis arreglos de la revisión (molde instalado en una app de prueba)
- La línea del `test` de cada app verifica desde afuera (`sha256sum`) los tres archivos del guardián contra `HUELLAS.txt` antes de correrlo: un `check.mjs` editado para salir con 0 ya no deja pasar el `test`. La misma línea en el `test` del molde, en `guardian-del-kit.spec.ts` (CI de cada app) y en `docs/fase-2.md`; un test exige que sea la misma en los tres lugares y prueba que frena un guardián editado.
- `tsconfig.base.json` pasa a `packages/`, y los `extends` apuntan a `../tsconfig.base.json`: copiar `packages/` entero deja todo válido, y Vite compila los `.jsx` del molde desde una app.
- `sin-la-casa-de-origen.test.js`: el barrido del repo entero se saltea, con mensaje, cuando no hay `storybook/` ni `docs/` al lado (el molde instalado en una app).
- `calendario.test.js` fija su zona horaria (`America/Montevideo`) antes de cualquier `Date`, y el `pnpm test` del molde corre todo dos veces: con la hora de la máquina y con `TZ=UTC`, como un CI.
- PT: «Entre em *{app}*.», «Pergunte a {app}», «Assistente de {app}», «o assistente de {app}» y «o que {app} propõe», sin artículo.
- `acceso/tests-por-app/`: son plantillas. Todo import que no es del núcleo dice `← ADAPTAR`, los nombres de la app de origen pasan a nombres genéricos (`salud`, `integraciones`, `recursos`, `informes`, `modulo-raiz`, roles `dueno`/`recepcion`) y cada archivo dice en qué carpeta va. `roles-clasificados.spec.ts` encuentra la raíz también con `pnpm-lock.yaml`. `docs/fase-2.md` §7: se copian, se adaptan y recién ahí se corren.
- `docs/fase-2.md`: §1 con la línea nueva y cómo va en CI, §7 con las plantillas, §11 con la línea del guardián en `test`, `TZ=UTC` y las plantillas adaptadas.

## 1.1.0 · 4/10/2026
- El entrar de las apps (Google, código por mail, autenticador y respaldo) ahora es parte del molde, con el mismo cuidado que lo demás.
- La pantalla de entrada muestra la frase de cada app en el idioma de quien entra.
- Un solo control verifica que nadie haya cambiado el molde dentro de una app.

### PR 7 · el Kit de Acceso entra al molde
- `packages/acceso`: el Kit de Acceso 1.3.0 = el núcleo del kit 1.2.1 byte a byte, más el renombre (tabla exacta en `renombre.js`) y el título de entrada con la frase de marca en tres idiomas (`nucleo/frontend/titulo-de-entrada.ts`). `el-nucleo-es-el-1.2.1.test.js` deshace el renombre y exige las 19 huellas del 1.2.1.
- Un solo guardián: el de los moldes cuida también el núcleo instalado en el backend y el frontend de cada app (huellas, archivos sin huella, las dos configs idénticas, sin `console.log`, piso de 21). `instalaciones.json` se funde en `moldes/instalacion.json` (clave `acceso`).
- `renombrar-en-app.mjs`: la misma tabla, para pasar el código de una app del kit viejo al nuevo.
- El guardián se cuida a sí mismo: sus tres archivos (`check`, `huellas`, `revisar`, ahora todos `.mjs`) tienen huella. Editarlo para que dé verde lo pone rojo.
- El guardián de la casa de origen mira también los `.mjs` (no los miraba) y prohíbe el nombre viejo del kit en `packages/`, con excepciones nombradas.
- `docs/fase-2.md`: cómo se reemplaza el kit 1.2.1 por el 1.3.0 y cómo se apaga el guardián viejo; el `OtpInput` de Bitácora Clínica va dentro de su orden.

## 1.0.0 · 4/10/2026
- Las pantallas de entrar, ajustar e inicio son iguales en todas las apps, con los colores y la letra de cada una.
- Todo en español, inglés y portugués, con voseo donde la app lo usa.
- Las fuentes se sirven desde cada app: nada se le pide a Google al abrir.

Fase 1 cerrada: siete paquetes, un guardián y la lista para instalar en cada app (`docs/fase-2.md`). Lo que sigue es el detalle, PR por PR.

### PR 5 · el guardián y el cierre de la fase 1
- Un solo guardián (`guardian/`) con el formato 1.2 del kit de acceso: el SHA-256 de cada archivo de los siete paquetes en `HUELLAS.txt`, sin archivos sin huella, sin faltantes, una sola versión en `VERSION` y en cada `package.json`, sin `console.log`, con piso de 300 archivos. Corre primero en `pnpm test`.
- `VERSION` 1.0.0 y los siete paquetes en 1.0.0.
- La marca va sola en su línea en la barra de escritorio; «Pregúntale a {app}» pasa a «Pregúntale» cuando no entra.
- El storybook muestra cada `design.json` con datos de su rubro, y las capturas fallan si una muestra habla de otro.
- `docs/fase-2.md` completo: el orden de las apps, cómo se instala, la lista de cada punto con cómo se verifica, cuándo una app está instalada y cómo se propone un cambio al molde.

### PR 4 · `@moldes/inicio` + `@moldes/app-shell` + `@moldes/bienvenida`
- El esqueleto: barra lateral (marca, campana, Pregúntale ⌘K, módulos, alertas, papelera, usuario, cerrar sesión y Ajustes), contraer, celular con menú y pestaña inferior de cuatro.
- Centro de alertas (cuatro columnas), Papelera (30 días, restaurar) y Equipo (las reglas de reglas-pr-3: quien manda administra, nadie se toca a sí mismo, sin reset con rescate solo).
- Inicio: «Hola, *nombre*.», hasta tres acciones, catálogo de widgets registrado por la app con defaults por rol, ajustar (mostrar, tamaño, orden, deshacer, como al principio), filas llenas, lectura única con aviso de lo que no cargó, primeros pasos y el hueco del asistente.
- Bienvenida: hasta tres pantallas, «Saltar» salvo en la primera y en las obligatorias, no avanza si guardar falla.
- Ajustes: la hora del resumen (8:00 por defecto), que se esconde si no hay resumen.

### PR 3 · `@moldes/ajustes`
- Ajustes según el guion v1.2: dos grupos («Tú» y el nombre de la app), Plan y Acerca de sueltos, Seguridad dentro de Cuenta, Equipo fuera de Ajustes (Actividad para quien manda), el correo en Cuenta.
- Las doce secciones comunes con sus filas del anexo, conectadas por un adaptador (`config`, `valores`, `acciones`); «Guardado» al confirmar; zona peligrosa con palabra y código; Novedades desde el CHANGELOG; celular con la lista primero.
- Reglas como datos probados: quién ve qué sección, las filas de Cuenta, el autenticador por rol, el asistente de noche, `reset2fa` con `rescate: 'solo'`.
- Kit: «Guardado» a la derecha del control y sin desborde en celular, `Boton tamano="chico"`, `useEsCelular` compartido.
- `design.ejemplo.json` con la frase en tres idiomas. Las capturas fallan si una página se sale de la pantalla.

### PR 2b · lo que no llegó a `main`
- Trae el PR 2 entero (había quedado mergeado en la rama del PR 1) y el nombre nuevo: `moldes-apps`, `@moldes/`, «Kit UI».
- Frase de marca en tres idiomas: `app.frase` texto u objeto `{ es, en, pt }`; `fraseDeMarca()` y, si falta el idioma, el título genérico del molde, nunca la frase en otro idioma; `avisos()` para la frase en un solo idioma.
- Cinco textos: invitar, autenticador obligatorio/opcional, almacenamiento, «Como al principio» (una sola acción), `reset2fa` (regla para el PR 3).
- `docs/fase-2.md` (lo que hay que hacer al instalar en cada app) y `docs/reglas-pr-3.md`.

### PR 2 · `@moldes/idiomas` + fuentes propias + limpieza + el nombre
- `t(clave, variables)` con plural (`{n|uno|varios}`) y palabra acentuada; `es.json` (neutro), `en.json`, `pt.json` con 244 claves (`auth.*`, `settings.*`, `asistente.*`, `inicio.*`, `comun.*`) y `es-UY.json` con las 36 que cambian con voseo; `elegirIdioma()` (perfil → aparato → navegador → es).
- Test `sin-textos`: ningún texto en español en el código de los componentes, ni valores por defecto con palabras. Se sacaron los 10 que había.
- Fuentes autoalojadas por defecto: `bajar-fuentes.mjs` baja los woff2 (latin y latin-ext) a `public/fuentes/` y escribe el `@font-face`; `aplicarDesign()` las enlaza. Google Fonts solo en el storybook.
- `--accent` (el color que avisa) se renombra a `--warning`, para no confundirlo con el `acento` del `design.json`. `Badge tone="accent"` sigue andando como alias.
- Fuera los comentarios con números de orden y rutas del repo de origen, `pacienteId` y la paleta de origen en prosa; el guardián `sin-la-casa-de-origen` ahora también los persigue.
- Storybook en tres idiomas (`?idioma=`), con voseo según el `design.json`.
- El molde pasa a llamarse por lo que es, los moldes de mis apps: repo `moldes-apps`, scope `@moldes/`, clases `molde-*`, «Kit UI». El Kit de Seguridad 512 conserva su nombre hasta la fase 2. El guardián persigue el nombre viejo en todo el repo.

### PR 1 · `@moldes/design` + `@moldes/ui` (Kit UI)
- `design.json` como única entrada: esquema, validador con mensajes en palabras, resolver a variables CSS (`--c-*`, `--f-*`, `--r-*`) que **deriva el escalón de letra de cada color midiendo AA y la distancia a la tinta**, y `aplicarDesign()` para el arranque de una app.
- El kit de componentes extraído de las apps de origen, sin su nombre, su paleta ni su dominio: 44 piezas heredadas.
- 21 piezas nuevas de los guiones (acceso, Ajustes, Asistente), entre ellas `OtpInput` (la casilla de 6 huecos aprobada, generalizada a tokens).
- Storybook estático que pinta todo con cualquier `design.json`, en claro y oscuro, y captura a 390 y 1440.
- Guardianes: sin la casa de origen, sin literales, espejo de variables, contraste AA y distancia a la tinta contra todos los `design.json` de muestra.
