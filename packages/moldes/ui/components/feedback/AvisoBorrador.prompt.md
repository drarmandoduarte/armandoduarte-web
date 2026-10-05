La cinta que dice que se recuperó un borrador.

```jsx
<AvisoBorrador
  texto="Retomaste lo que estabas escribiendo."
  accionDescartar="Descartar y empezar de cero"
  onDescartar={() => borrador.descartar()}
/>
```

- **Discreta a propósito.** el gris informa, y esto informa: no pasó nada malo, no hay nada que arreglar y no hay que decidir ya. Un banner de advertencia asustaría por una función que existe justamente para que nadie se asuste.
- La salida va **en la misma línea** que el texto, porque las dos cosas se deciden juntas: quien lee esto o sigue escribiendo, o quiere la hoja en blanco.
- El descarte es un enlace de texto y no un `Button`: al lado de «Guardar» y «Cancelar» del pie, un tercer botón con caja compite por la mirada, y este no es una acción del formulario.
- **Sin icono de basura.** Descartar un borrador no destruye nada de la cuenta: la ficha guardada sigue donde estaba.
- Va arriba de todo en el formulario, antes del primer campo.
