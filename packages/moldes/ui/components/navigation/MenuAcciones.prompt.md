Las acciones de una fila, detrás de los tres puntos.

```jsx
<MenuAcciones
  label="Acciones del turno"
  items={[
    { id: 'abrir', label: 'Abrir el turno', icon: 'eye', onSelect: abrir },
    { id: 'editar', label: 'Editar', icon: 'pencil', onSelect: editar },
    { id: 'cobrar', label: 'Cobrar', icon: 'wallet', onSelect: cobrar },
    { id: 'borrar', label: 'Eliminar', icon: 'trash-2', danger: true, onSelect: preguntar },
  ]}
/>
```

- **Existe para no repetir botones por fila.** Cuatro acciones a la vista en veinte renglones
  son ochenta botones, y el ojo deja de ver los datos.
- **Lo destructivo va último y separado**: `danger` lo pinta en el error y le pone una línea
  encima. No confirma nada por su cuenta —eso es de quien lo usa—, pero avisa antes de que el
  dedo llegue.
- Teclado completo: flechas para recorrer, Enter para ejecutar, Escape para salir sin tocar
  nada. **El foco vuelve al botón que lo abrió**, que es la parte que casi todos los menús se
  olvidan: sin eso, cerrar con Escape deja el foco en el body.
- Flota: `--floating-surface` + `--floating-border` + la sombra de flotante, que en dark los
  tokens apagan y resuelven con superficie y borde.
