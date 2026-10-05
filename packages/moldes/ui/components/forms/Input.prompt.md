Campo de texto del sistema — alto según densidad (`--control-h`), borde de la casa, foco en el acento.

```jsx
<Input label="Buscar persona" icon="search" placeholder="Nombre o responsable" />
<Input label="SKU" trailing={<IconButton icon="scan-barcode" label="Escanear" size="sm" />} />
<Input label="Email del responsable" error="Falta el dominio" defaultValue="ana@" />
```

- El error reemplaza al hint y pinta el borde en el error.
- `pill` solo para el buscador global (píldora); los campos de formulario se quedan en 8px — informan un valor, no disparan una acción.
- No fijes anchos: en francés y portugués las etiquetas crecen.
- Con `type="number"` **no dibuja las flechitas del navegador** : la pieza pone sola la clase `molde-sin-flechas` y la regla vive en `tokens/base.css`. El `type` sigue siendo `number`, así que el teclado numérico del teléfono, `min`/`max`/`step` y las flechas del teclado no cambian; lo que se va es el dibujo del sistema.
