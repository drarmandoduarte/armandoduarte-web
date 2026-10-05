Envoltorio de etiqueta, ayuda y error. `Input`, `Selector` y `Textarea` ya lo usan por dentro; usalo directo solo para controles compuestos.

```jsx
<Field label="Motivo" hint="Lo ve el cliente en su app" htmlFor="motivo">
  <textarea id="motivo" />
</Field>
```
