#!/bin/sh
# Guardián de enlaces internos — heredado del sitio estático (orden #01, B),
# traído al monorepo y puesto al día por la orden #05, F.
#
# Mira el HTML que el prerender deja en `dist/`, que es lo que Vercel sirve.
# El original miraba los cuatro `.html` sueltos del sitio estático; acá esos
# cuatro archivos los escribe `scripts/prerender.mjs`, así que hay que compilar
# antes. Si no hay `dist/`, no se salta: falla diciendo que falta.
#
#   Uso:  sh check/enlaces.sh     (desde `apps/web`)
#
# Sin dependencias. Sale 0 si todo está bien, 1 si algo falla.

cd "$(dirname "$0")/.." || exit 1

DIST=dist
fallas=0

echo "0) El piso: el build dejó las cuatro páginas"
paginas=$(ls "$DIST"/*.html 2>/dev/null | wc -l | tr -d ' ')
echo "   .html en $DIST: $paginas"
if [ "$paginas" -lt 4 ]; then
  echo "   NO PASA: se esperaban 4. Sin páginas, los ceros de abajo no afirman nada."
  echo "            Compilá primero:  pnpm --filter @codice/web build"
  echo ""
  echo "GUARDIÁN: NO PASA"
  exit 1
fi
echo "   PASA."

echo "1) Ningún href apunta a un .html"
# `cleanUrls` de Vercel sirve /merida desde merida.html: un enlace al .html
# funciona, pero cuesta una redirección por clic.
encontrados=$(grep -o 'href="[^"]*\.html"' "$DIST"/*.html | grep -v 'href="http')
if [ -n "$encontrados" ]; then
  echo "$encontrados"
  echo "   NO PASA: hay $(printf '%s\n' "$encontrados" | wc -l | tr -d ' ') enlace(s) a .html. Usar /, /merida, /#contacto."
  fallas=1
else
  echo "   PASA: cero líneas."
fi

echo "2) La página del taller se enlaza como /merida (orden #05, F)"
# `grep -o | wc -l` y no `grep -c`: `-c` cuenta LÍNEAS, y el HTML que deja el
# prerender trae los cinco enlaces en veintinueve líneas. El original usaba `-c`
# porque el sitio estático venía con una etiqueta por línea; acá habría contado 1
# donde hay 5 y el piso habría fallado con la casa en orden.
merida=$(grep -o 'href="/merida"' "$DIST/index.html" | wc -l | tr -d ' ')
echo "   href=\"/merida\" en index.html: $merida"
if [ "$merida" -lt 2 ]; then
  echo "   NO PASA: se esperaban al menos 2 (el hero y el pie, como mínimo)."
  fallas=1
else
  echo "   PASA."
fi

echo "3) Y ya nadie enlaza /taller, que ahora es solo una redirección"
viejos=$(grep -o 'href="/taller[^"]*"' "$DIST"/*.html)
if [ -n "$viejos" ]; then
  echo "$viejos"
  echo "   NO PASA: un enlace interno a /taller cuesta una redirección 308 por clic."
  echo "            La redirección es para quien tenga el link viejo guardado, no para nosotros."
  fallas=1
else
  echo "   PASA: cero líneas."
fi

echo "4) La redirección de /taller existe en el vercel.json de la raíz"
# El de la raíz es el que Vercel lee desde la orden #04. Sin esto, el link que
# Armando ya repartió por WhatsApp da 404 el día que se publique.
if grep -q '"/taller"' ../../vercel.json && grep -q '"/merida"' ../../vercel.json; then
  echo "   PASA."
else
  echo "   NO PASA: falta el redirect /taller → /merida en vercel.json de la raíz."
  fallas=1
fi

if [ "$fallas" -ne 0 ]; then
  echo ""
  echo "GUARDIÁN: NO PASA"
  exit 1
fi

echo ""
echo "GUARDIÁN: PASA"
