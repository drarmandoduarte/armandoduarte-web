# Kit de Acceso · 1.3.0

Todo el entrar de las apps: Google, código por mail, autenticador obligatorio para el equipo, códigos de respaldo, recuperación, 30 minutos de inactividad y 12 horas en el servidor, guard global, auditoría, reglas de celular. Es un paquete del molde (`@moldes/acceso`, molde 1.1.2) y lo cuida el mismo guardián que a los demás.

**1.3.0 = el kit 1.2.1, byte a byte, más dos cosas:**
1. **El renombre:** el kit deja de llamarse por la empresa y pasa a llamarse por lo que es. La tabla exacta está en `renombre.js`: la carpeta de instalación pasa a ser `acceso/`, la config `acceso.config.ts`, la constante `ACCESO`, el tipo `ConfigAcceso`, y los comentarios dicen «Kit de Acceso».
2. **El título de entrada** (`nucleo/frontend/titulo-de-entrada.ts`, archivo nuevo): la frase de marca en tres idiomas en la pantalla de entrada.

Nada más cambia en el núcleo. `el-nucleo-es-el-1.2.1.test.js` lo prueba: deshace el renombre en cada archivo y exige la huella que tenía en el 1.2.1.

---

## Qué hay en cada carpeta, y qué se hace con ella

| Carpeta | Qué es | Qué hace el programador |
|---|---|---|
| `nucleo/backend/` | La lógica del servidor: guard global deny-by-default, `@SinSegundoPaso`, `@PasoReciente`, códigos de respaldo (scrypt), una sola validación del token por pedido, `esEquipo()`, la maquinaria del test de cobertura. | Se copia **byte por byte** a `<api>/src/acceso/nucleo/`. **No se edita.** |
| `nucleo/frontend/` | La lógica de pantalla: reloj de 30 minutos, decisión enrolar/reto/cerrar, modo instalado, huella del aparato, nombres, `esEquipo()`, y el título de entrada. | Se copia **byte por byte** a `<web>/src/acceso/nucleo/`. **No se edita.** |
| `adaptador/acceso.config.ts` | El **único** archivo que cada app escribe: el nombre de la app y **todos sus roles**, cada uno `equipo` o `cliente`. | Se copia dos veces (`<api>/src/acceso/` y `<web>/src/acceso/`), idénticas, con los roles de **su** app. El guardián verifica que las dos copias coincidan. |
| `tests-por-app/` | **Plantillas** de tests: las excepciones al guard (`aal2-cobertura.spec.ts`), el enum de roles de las migraciones (`roles-clasificados.spec.ts`), el guard, el paso reciente y el que corre el guardián en CI. **Tal cual no compilan**: nombran módulos que cada app tiene con su propio nombre. Todo import que no es del núcleo, y cada ruta o rol de la app de origen, dice `← ADAPTAR`; la cabecera de cada archivo dice en qué carpeta va. | Se copian, se adaptan todas las líneas `← ADAPTAR`, y **recién ahí se corren**. **Se ven en rojo antes de verde**, y eso se cuenta en el PR. |
| `renombre.js` · `referencia-1.2.1/` | La tabla del renombre y las huellas del 1.2.1: la prueba de que el núcleo es el mismo. | Nada: viven en el molde. |

El guardián es el de los moldes (`guardian/check.mjs`, en la raíz del molde y de cada app). Las dos instalaciones del kit se declaran en `moldes/instalacion.json`:

```json
{
  "paquetes": "packages/moldes",
  "acceso": { "backend": "apps/backend/src/acceso", "frontend": "apps/frontend/src/acceso" }
}
```

Las pantallas, servidor y migraciones de referencia de la app donde nació el kit **no viajan en el paquete**: siguen en la carpeta del kit congelado, en `Moldes/`, y se leen, no se copian. Las pantallas del molde ya traen las piezas para armarlas (`OtpInput`, `Titulo`, `CodigosRespaldo`, `Cartel`…).

## El título de entrada (P1)

```ts
import { tituloDeEntrada } from './acceso/nucleo/titulo-de-entrada';
<Titulo texto={tituloDeEntrada(design.app.frase, idioma, t('auth.login.titleDefault'))} tamano="portada" />
```

Si hay frase en el idioma de la pantalla, va esa. Si no, va el título genérico **en ese idioma**, nunca la frase en otro. Es la misma regla que `fraseDeMarca()` de `@moldes/design`, y un test del paquete exige que las dos digan lo mismo.

## Dependencias del kit

| Paquete | Dónde | Para qué |
|---|---|---|
| `vitest` | backend y frontend | Corre los tests del kit |
| `jsdom` | frontend | Entorno de `aparato.test.ts`, `modo-instalado.test.ts`, `useAalWindow.test.tsx` (lo declaran con `// @vitest-environment jsdom`) |
| `@testing-library/react` | frontend | `useAalWindow.test.tsx` |
| `@nestjs/common`, `@nestjs/core`, `reflect-metadata` | backend | El guard global y la cobertura de rutas |
| `react` | frontend | `useAalWindow.ts` |

Los tests del núcleo corren **en cada app**, donde está instalado: importan la config de la app. En el molde corren los del paquete y el del título de entrada.

**Los tests del núcleo del frontend necesitan `globals: true` en el vitest de la app.** `useAalWindow.test.tsx` usa `@testing-library/react`, que limpia lo dibujado después de cada test solo si `afterEach` es global. Sin `globals: true`, cada `render` se suma al anterior y los tests fallan por encontrar dos veces lo mismo. En el `vitest.config.ts` del frontend:

```ts
export default defineConfig({ test: { globals: true } });
```

## Lo que depende de cada app (y se declara en el PR)

- Los roles y su tipo. Ante la duda, `equipo`.
- La lista de rutas con `@SinSegundoPaso('razón')`, cada una con su razón. El CEO las revisa una por una.
- Si la app **lee la base desde el navegador**, además del guard, el segundo paso va en las policies RLS: `(auth.jwt() ->> 'aal') = 'aal2'` para los roles de equipo.
- Si la app tiene **service worker**, la regla de celular se convierte en test.
- El nombre de la tabla de auditoría donde caen los avisos.
- Si el rescate es del dueño o `solo` (con espera de 48 h): lo usan Ajustes y Equipo del molde.

## Lo que ninguna app cambia

30 minutos de inactividad y 12 horas en el servidor · sin contraseña · autenticador obligatorio para todo rol de equipo · descargar, copiar o compartir los códigos es obligatorio para terminar · el código de respaldo se usa desde la pantalla de entrada · los archivos de `nucleo/`.

## Lo que hace Dirección en el panel de cada app (nunca el programador)

Google activado con su client ID y secret · MFA TOTP activado · la plantilla del mail del código · Resend como SMTP · correr las migraciones. **Ninguna clave pasa por el kit, por la orden ni por el repo.**
