Opciones excluyentes en fila de píldoras; la activa en el acento soft con borde el acento.

```jsx
<SegmentedControl
  label="Modo"
  value="sistema"
  options={[{value:'claro',label:'Claro'},{value:'oscuro',label:'Oscuro'},{value:'sistema',label:'Sistema'}]}
/>
```

- Hasta 4 o 5 opciones cortas. Con más, o con etiquetas largas, va `Selector`.
- La activa NUNCA es relleno sólido: el sólido es de la urgencia, y la acción el acento de la pantalla ya está en el botón.
- Envuelve en varias filas si el idioma estira las etiquetas; no se comprime el texto.
