Campo que se escribe y filtra su lista mientras se escribe. El de elegir una persona entre 700.

```jsx
<ComboBuscador
  label="Persona"
  placeholder="Escribe el nombre"
  options={[
    { value: 'a1', label: 'Marcos Leiva', detalle: 'Convenio · Pérez' },
    { value: 'a2', label: 'Mía Chávez', detalle: 'Particular · Rodríguez' },
  ]}
  value={personaId}
  onChange={setPersonaId}
  vacioTexto="Nadie coincide."
  ayudaTope="Hay más: escribe una letra más."
/>

<ComboBuscador label="Motivo" libre libreEtiqueta="Se guarda lo que escribiste."
  options={motivos} value={motivo} onChange={setMotivo} />
```

- **Se escribe y filtra**, sin acento y sin mayúsculas: «mar» trae a Marcos Leiva y a María.
  La cuenta vive en `buscar.js` y tiene test propio.
- **El detalle también se busca.** En el mostrador, quien llama dice su propio apellido antes
  que el nombre del titular.
- **El orden de la lista no se toca.** Quien la arma ya decidió cuál va primero; reordenar por
  relevancia movería las opciones bajo el dedo de quien apunta.
- **Cerrado, lo escrito no manda.** Sin `libre`, salir con media búsqueda restituye lo que
  estaba: un turno apunta a una ficha real. Con `libre`, lo escrito se guarda tal cual —es el
  motivo que la lista curada no previó.
- Teclado completo: flechas para recorrer, Enter para elegir, Escape para cerrar sin tocar
  nada. `combobox` + `listbox` con `aria-activedescendant`, no un `<datalist>` nativo.
- **Se dice cuándo hay más de lo que se ve.** Solo se dibujan los primeros 50 renglones —700
  nodos por tecla es una lista que se traba—, y el pie lo avisa: un tope silencioso se lee
  como "no está".
- Es el campo de la persona, y va a ser el del responsable y el del producto. Para todo lo demás está
  `Selector`, que absorbió el modo de búsqueda y el `libre` y decide el modo por el tamaño de la
  lista. Su hermano de lista corta, `ComboSugerido`, ya no existe: lo reemplazó este.
