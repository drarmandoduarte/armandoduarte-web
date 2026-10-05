Filtro de dos estados en una fila de control: convenio, «Datos incompletos», estado de un listado.

```jsx
<ChipFiltro activo cuantos={7} onClick={alternar}>Con convenio</ChipFiltro>
<ChipFiltro cuantos={2} icon="circle-alert">Datos incompletos</ChipFiltro>
```

- **No es un `Tag`.** El Tag describe y no se toca; esto cambia lo que se ve debajo. Por eso es píldora y declara `aria-pressed`.
- El contador va adentro y en tabular-nums: son cifras comparables entre chips.
- Puesto usa el acento suave (lo que actúa); sin puesto, papel con borde — no compite con la acción primaria.
- En pantalla angosta la fila de chips **scrollea en horizontal**; los chips no se apilan ni se recortan.
