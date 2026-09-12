#!/bin/sh
# Guardián de enlaces internos — Orden #01 (B).
#
# vercel.json usa cleanUrls: un enlace a "taller.html" funciona, pero cuesta
# una redirección por clic. Este script falla si vuelve a aparecer uno.
#
# Uso: sh check/enlaces.sh   (desde la raíz del repo). Sin dependencias.
# Sale 0 si todo está bien, 1 si algo falla.

cd "$(dirname "$0")/.." || exit 1

fallas=0

echo "1) Ningún href apunta a un .html"
encontrados=$(grep -n 'href="[^"]*\.html' ./*.html)
if [ -n "$encontrados" ]; then
  echo "$encontrados"
  echo "   NO PASA: hay $(printf '%s\n' "$encontrados" | wc -l | tr -d ' ') enlace(s) a .html. Usar /, /taller, /#contacto."
  fallas=1
else
  echo "   PASA: cero líneas."
fi

echo "2) El grep está mirando de verdad (piso: >= 2 href=\"/taller\" en index.html)"
taller=$(grep -c 'href="/taller"' index.html)
echo "   href=\"/taller\" en index.html: $taller"
if [ "$taller" -lt 2 ]; then
  echo "   NO PASA: se esperaban al menos 2."
  fallas=1
else
  echo "   PASA."
fi

if [ "$fallas" -ne 0 ]; then
  echo ""
  echo "GUARDIÁN: NO PASA"
  exit 1
fi

echo ""
echo "GUARDIÁN: PASA"
