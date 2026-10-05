Un formulario largo dicho en bloques, para que lo corto siga siendo corto.

```jsx
<SeccionPlegable titulo="Objetivo" resumen="38,2 °C · 96 lpm · 11 sistemas normales">
  {/* constantes y examen por sistemas */}
</SeccionPlegable>
```

1. **Cerrada es el estado natural.** Una ficha completa tiene cuatro bloques y
   once apartados; una carga rápida es el motivo y dos líneas. Solo se abre de
   entrada el bloque donde de verdad se empieza a escribir.
2. **No es un acordeón.** Varias abiertas a la vez, y cerrar una no abre otra.
   Un examen físico se completa saltando entre bloques, no en fila india.
3. El **resumen** solo aparece con la sección cerrada, y lo arma la pantalla: el
   kit no sabe qué es una constante. Abierta, el contenido ya está a la vista.
4. La flecha gira, no rebota. El movimiento late; nunca gira sobre sí mismo ni
   escala.
5. Separa por línea fina arriba, no por caja: es un bloque del formulario, no una
   tarjeta suelta.
