# Kit de Seguridad 512 · v1

Las reglas de acceso (S0–S7) implementadas una vez, para copiarse igual en las
cinco apps. **Cenit es la implementación de referencia.**

## Núcleo y adaptadores

El kit tiene dos clases de archivos y la diferencia no es de estilo:

**Núcleo** (`apps/*/src/seguridad-512/nucleo/`) — lógica que no depende de
ninguna app. Es **idéntico byte por byte** en todas. **No se edita dentro de una
app.** Si hace falta una mejora: se hace en el kit, se sube
`seguridad-512/VERSION` y se regeneran las huellas
(`npm run seguridad-512:huellas`). `scripts/check-seguridad-512.mjs` compara cada
archivo contra `HUELLAS.txt` en cada `npm run test` y falla nombrando el archivo
que cambió.

**Adaptadores** — todo lo que toca cosas propias de la app: las tablas con
`agency_id`, el audit log, el cliente de la base, las pantallas con su diseño y
sus textos. Siguen el flujo del kit, pero cada app los escribe con lo suyo.

### Qué hay en el núcleo hoy (v1)

| Archivo                         | Qué es                                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| `aal2.guard.ts`                 | Guard global: toda ruta exige segundo paso, verificado y reciente |
| `sin-segundo-paso.decorator.ts` | La única salida, con razón obligatoria                            |
| `verificador-de-token.ts`       | El enchufe: "alguien que valide un token"                         |
| `usuario-del-pedido.ts`         | Una sola validación del token por pedido                          |
| `backup-codes.ts`               | Códigos de respaldo: generar, hashear, verificar                  |
| `cobertura.ts`                  | Maquinaria del test guardián de cobertura de rutas                |
| `roles.ts`                      | `esEquipo()` — quién necesita el segundo paso (S0)                |
| `nombres.ts`                    | Nombre del autenticador, archivo de códigos, claves locales       |
| `useAalWindow.ts`               | Ventana de inactividad (30 min), con vuelta a primer plano        |
| `decidir-reto.ts`               | La decisión del gate: enrolar / reto / cerrar / pasar             |
| `modo-instalado.ts`             | ¿Corre instalada o en el navegador? (orden de los botones)        |

### Qué NO está en el núcleo, y por qué

- **`seguridad-512.config.ts`** — es el adaptador por definición: el nombre de la
  app y la clasificación de sus roles. Es lo único que el núcleo lee de afuera.
  Las dos copias (backend y frontend) tienen que ser idénticas entre sí, y el
  guardián lo verifica.
- **`aal2-cobertura.spec.ts`** — la maquinaria se fue al núcleo
  (`cobertura.ts`), pero la **lista de excepciones** de cada app no puede ser
  neutra: cuáles rutas no exigen el segundo paso, y por qué, es la decisión de
  seguridad que hay que leer en el review de esa app.
- **`roles-clasificados.spec.ts`** — lee el enum de roles de las migraciones de
  la app. La fuente de verdad es distinta en cada una.
- **`RequireAal2.tsx`, `TotpChallenge.tsx`, `ForceEnroll.tsx`, `Login.tsx`** — son
  pantallas: diseño, textos e i18n propios. La decisión que toman sí es núcleo
  (`decidir-reto.ts`); el cableado y la pintura, no.
- **`auth.guard.ts`** — resuelve el perfil contra las tablas de la app.

## El flujo que tienen que respetar los adaptadores (S2 a S5)

1. **S2 — Entrar.** Sin contraseñas. Google, o un código de 6 dígitos al correo
   (código, no enlace: el enlace obliga a abrirlo en el mismo navegador donde se
   pidió, y en el celular eso falla). Entrar es el PRIMER paso, nunca el segundo.
2. **S3 — El servidor manda.** Todo endpoint exige el segundo paso por defecto.
   La única salida es `@SinSegundoPaso('razón')`, con la razón escrita, y el
   inventario completo de excepciones se testea. Nunca alcanza con que la
   pantalla lo pida: el freno vive en el servidor.
3. **S4 — La ventana.** 30 minutos sin actividad cierran la sesión (no re-piden
   el código: se cierra). El cálculo se apoya en la hora guardada, nunca en un
   temporizador, y se recalcula al volver a primer plano.
4. **S5 — Perder el celular tiene salida.** Códigos de respaldo de un solo uso,
   ofrecidos también desde la pantalla de acceso. Usar uno borra el autenticador
   viejo y obliga a configurar uno nuevo antes de ver nada: nunca es un atajo
   hacia los datos. La dueña puede resetear el de un miembro.

## Regla del service worker (apps instalables)

Cenit no tiene service worker; las otras cuatro apps del kit sí. Para ellas esto
no es una recomendación:

- Cachea **solo archivos estáticos** (el shell: HTML, JS, CSS, fuentes, íconos).
- **Nunca** respuestas de la API.
- **Nunca** una petición que lleve `Authorization`.
- **Nunca** nada bajo `/auth`.
- Se **limpia al cerrar sesión** (`caches.keys()` → borrar las del app shell y
  cualquier otra), para que en un teléfono compartido no quede nada de la
  persona anterior.

En las apps que tienen service worker esto se testea; acá queda escrito porque
es donde vive el kit.

## Comandos

```bash
node scripts/check-seguridad-512.mjs   # el guardián (va dentro de `npm run test`)
npm run seguridad-512:huellas          # regenerar HUELLAS.txt — solo si el KIT cambió
```

El guardián falla si: una huella no coincide, falta un archivo del núcleo,
aparece un archivo en `nucleo/` sin huella, hay un `console.log` en cualquier
carpeta del kit, falta la config, las dos copias de la config no coinciden, o
comparó menos archivos de los que el kit tiene (un guardián que compara cero y
dice "todo bien" es peor que ninguno).
