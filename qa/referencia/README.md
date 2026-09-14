> **Qué es esto.** El sitio público de `armandoduarte.com`: dos páginas estáticas, sin build y sin `package.json`.
> **Cómo se publica.** Push a `main` → Vercel publica la raíz del repo tal cual. Rutas limpias y cabeceras salen de `vercel.json`.
> **El HTML es la fuente.** `build.py` (el generador que sobrescribía las dos páginas) ya no existe en el repo: quedó en `_historico/` del proyecto. No volver a meterlo.
> **Nada a `main` sin PR.** `main` está protegida en GitHub: solo entra por PR (el repo es público desde el 12/9/2026). Antes de cada commit se corre `sh check/enlaces.sh`.
> **Las órdenes viven fuera del repo**, en `03 Producto/web/ordenes/` del proyecto. Los pendientes abiertos, en `docs/tareas.md`.

# armandoduarte.com · v1.1 · 12/9/2026

Dos páginas estáticas, sin backend: `index.html` (la web de Armando) y `taller.html` (la landing del taller). Comparten `estilo.css`, `fuentes/` (Montserrat, Open Sans y Great Vibes, de Google, servidas locales) e `img/`. Se publican tal cual en Vercel (proyecto estático, carpeta raíz): el HTML es la fuente, no hay generador ni paso de build.

## Qué cambió de la v1 a la v1.1 (revisión de Germán)

- **Ritmo de fondos.** La v1 era toda crema y las secciones no se distinguían. Ahora alternan: crema → franja «Ahora» en teal → crema → cálido → teal → blanco → cálido → tinta (contacto), y en el taller: crema → blanco → cálido → crema → teal → blanco → cálido → crema → tinta (cierre). Ninguna sección tiene el mismo fondo que la anterior.
- **Fotos recortadas.** Armando ya no está sobre el gris del estudio: se lo recortó del fondo y va sobre el color de cada sección (arco cálido en el hero, crema en «Quién soy», teal en «Sobre el facilitador»). Los originales quedan en `img/` por si se quieren volver a usar.
- **Acento teal en los titulares.** El ocre a 80 px se veía barroso; el teal sobre crema es más elegante y es el color que los tokens asignan al «rigor». El ocre sigue en eyebrows, botones y detalles.
- **Header a lo Rolls-Royce.** Transparente sobre el hero; al bajar toma el color de la sección que tiene debajo (crema, cálido, blanco, teal o tinta) de lado a lado, con velo del 92 % y desenfoque, y el texto pasa a claro sobre las oscuras. Nunca se esconde: en reposo es transparente; mientras se hace scroll toma el color de la sección, y al detenerse vuelve a transparente. La línea es una hairline del color del texto al 15 %. Lo hace el script del pie leyendo el fondo de la sección bajo el header; no hay que marcar nada en el HTML.
- El hero ya no fuerza 100 vh en pantallas muy altas (tope 880 px) para no dejar un vacío debajo.

## Decisiones que ya están tomadas

- **Gramática 512** (header de tres columnas, hairlines, eyebrows, listas numeradas, pasos, cifras cortas, footer con marquita) sobre **los tokens del design system de la app** (`docs/design/armando-design-system.tokens.json`): crema, tinta, ocre, teal; Montserrat para títulos, navegación y botones; Open Sans para lectura; Great Vibes una sola vez (el tagline del pie). Las mismas fuentes que va a usar la app, para que la web y la app sean una sola cosa.
- **WhatsApp en el header, a la derecha, nunca flotante.** Cada botón lleva un mensaje prearmado distinto (header, hero, después del programa, inversión, cierre) para saber desde dónde escribió cada persona.
- **La marca es «Armando Duarte»** tipográfico. Construyendo Familias Fuertes aparece como programa (sello chico junto a los libros y tagline en el pie).
- **Tuteo mexicano** («tú», «reserva», «tu hijo»). Los textos de Armando se respetaron en estructura y se podaron adjetivos.
- **Un bloque «Ahora»** debajo del hero de la home (`<section id="ahora" data-ahora="…">`) es lo que cambia según lo que Armando necesite destacar: hoy el taller; mañana un curso. Es un solo bloque, no un carrusel.
- **La web dice lo que existe**: consultoría, talleres, libros. Academia y asistente entran cuando estén en el producto.

## Lo que falta antes de publicar (lo tiene que dar Armando)

Los datos pendientes se ven **punteados en ocre** en la página (`<span class="dato">`), a propósito, para que no se publique sin ellos:

1. **Fecha del taller** (aparece en la home, el hero del taller, la franja de hechos, la ficha del taller y el JSON-LD).
2. **Nombre completo del lugar** (hoy «Auditorio del Club …»).
3. **Cupo**, si se quiere mostrar el número. Si no es real, se deja «cupo limitado».
4. **Testimonios**: los dos que mandó Armando están puestos con los nombres que él dio (Dra. Mariana G., Sofi L.). Hay que confirmar que son reales y que las personas autorizan; si no, se sacan y la sección desaparece sin dejar hueco.
5. **Aviso de privacidad y términos**: los enlaces del pie apuntan a `#`. Hace falta un aviso de privacidad mexicano (LFPDPPP) aunque la página no tenga formulario, porque hay WhatsApp y va a haber píxel.
6. **Imagen para compartir (og:image)**, 1200×630, con el título y la fecha. Se genera cuando haya fecha.
7. **Probar el enlace de WhatsApp en un celular real** de México: es `wa.me/525555015641` sin el «1» después del 52.
8. **Instagram**: el enlace está punteado porque no tengo el usuario confirmado. YouTube (`youtube.com/c/DrArmandoDuarte`), el podcast en Spotify y Facebook (`armandoduartepantoja`) están puestos con lo que aparece públicamente; que Armando confirme que son los suyos y si falta alguno (TikTok, X).
9. **Foto horizontal** de Armando (pedida a la secretaria) para mejorar el hero en escritorio; y si hay fotos del set con luz ámbar, mejor que las de estudio.

## Para subirla (CEO de la web de Armando / Rodolfo)

- Repo en el GitHub de Armando, proyecto estático en Vercel, dominio `armandoduarte.com` apuntando a Vercel **tocando solo A y CNAME: los registros MX quedan en IONOS** o el correo development@ deja de llegar.
- `taller.html` se sirve también como `/taller` (rewrite en `vercel.json`). El sitio viejo en Divi se reemplaza entero; las URLs viejas (`/biografia`, `/conferencias`) redirigen a la home.
- Search Console con el dominio verificado y sitemap. Píxel de Meta solo si se va a pautar.
- Lighthouse móvil: accesibilidad 100, performance ≥95. Las imágenes ya están optimizadas (270 KB la del hero); si hace falta, pasar a AVIF.
- Vara: S·A·P·E completas más V (titular con qué/para quién/dónde; prueba real arriba del pliegue; un CTA por pantalla; cero relleno). Auditar PASA/NO PASA con captura antes de publicar.
- Guion de respuesta para la secretaria (dos plantillas: «quiero reservar» y «cuánto cuesta / cómo pago»). Sin eso, la landing convierte y el chat pierde.
