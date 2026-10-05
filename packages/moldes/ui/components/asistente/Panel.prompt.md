El panel del asistente: a la derecha en escritorio, desde abajo en celular. Compone `PanelLateral` y `HojaInferior`.

```jsx
<Panel abierto={abierto} titulo={t('asistente.titulo', { app })} onCerrar={cerrar} etiquetaCerrar={t('comun.cerrar')}>
  …la conversación…
</Panel>
```
