Cómo se mira una lista: dos iconos sin etiqueta, al borde derecho de la fila del buscador.

```jsx
<ConmutadorVista
  label="Cómo se ve la lista"
  value="lista"
  options={[
    { value: 'tarjetas', icon: 'layout-grid', label: 'Vista de tarjetas' },
    { value: 'lista', icon: 'list', label: 'Vista de lista' },
  ]}
/>
```

- La activa va en el acento **soft** con borde el acento; la otra, apagada y sin fondo. Nunca relleno sólido: el sólido es de la urgencia, y la acción el acento de la pantalla ya está en «Nuevo X».
- `label` de cada opción es obligatorio: no se dibuja, pero es el nombre accesible y el tooltip. Va traducido a los cuatro idiomas.
- Es un radiogroup: se navega con flechas y envuelve en los extremos.
- Su lugar es fijo — borde derecho de la fila del buscador y los filtros, en toda pantalla de listado.
