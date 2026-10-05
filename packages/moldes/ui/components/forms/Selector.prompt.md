El selector de la casa. Reemplaza al `<select>` del navegador en toda la app: una sola pieza con dos modos que se eligen solos por el tamaño de la lista.

```jsx
{/* Cinco opciones: desplegable de la casa, sin búsqueda. */}
<Selector
  label="Medio de pago"
  placeholder="Elige un medio"
  options={[{ value: 'efectivo', label: 'Efectivo' }, { value: 'debito', label: 'Débito' }]}
  value={medio}
  onChange={setMedio}
/>

{/* Doscientos responsables: se escribe y filtra. El modo no se pide, se deduce. */}
<Selector
  label="Responsable"
  options={responsables.map((t) => ({ value: t.id, label: t.nombre, detalle: t.telefono }))}
  value={responsableId}
  onChange={setResponsableId}
  vacioTexto="Ningún responsable coincide."
  ayudaTope="Hay más: escribe una letra más."
/>

{/* Con secciones, y forzando la búsqueda aunque sean pocas. */}
<Selector label="Especialidad" buscable groups={porGrupo} value={especialidad} onChange={setEspecialidad} />
```

- **El modo lo decide el tamaño**: hasta 7 opciones, desplegable; de 8 en adelante, búsqueda.
  El umbral vive en `opciones.js` con su test, y `buscable` lo fuerza en los dos sentidos —hay
  vocabularios de seis que se escriben mejor y otros que jamás: los días de la semana no se
  buscan, se ven.
- **`onChange` recibe el valor, no un evento.** Esto no es un `<select>` nativo y fingir un
  `e.target.value` sería mentir sobre lo que es.
- **Los grupos son `role="group"` con su nombre**, con todas sus opciones adentro. Un grupo que
  la búsqueda dejó vacío no dibuja su encabezado.
- **Se abre parado en lo que ya está elegido**, no en el primero: quien abre para cambiar tiene
  que ver dónde está antes de moverse.
- Teclado completo: flechas para recorrer, Inicio y Fin para los extremos, Enter para elegir,
  Escape para cerrar sin tocar nada, y la barra abre y elige en el modo desplegable. El lector
  de pantalla sigue la opción activa con `aria-activedescendant`.
- **Con `libre` acepta lo que la lista no tiene**: al salir del campo, lo escrito se guarda tal
  cual. Es el caso de la especialidad —«Acupuntura médica» es una especialidad aunque no esté en ninguna
  lista— y el de los campos sin lista curada. Sin `libre`, salir con media búsqueda restituye
  lo que estaba: un turno tiene que apuntar a una ficha real.
  (Esta línea decía lo contrario antes. Envejeció cuando el `libre` de
  `ComboBuscador` se absorbió aquí y nadie volvió a este archivo.)
- **La lista se dibuja en un portal, fuera del cuerpo que scrollea**. Un `Dialog` de
  la casa recorta lo que se le sale, así que un desplegable abierto al pie de un diálogo quedaba
  atrapado adentro. No hay nada que hacer en el call site: la pieza mide sola de qué lado abre y
  cuánto puede medir (`flotar.js`, con test).
- Los textos de los estados —vacío, tope— llegan traducidos desde la app: `packages/ui` no
  sabe de idiomas.
