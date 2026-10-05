La fecha, escrita como se escribe: dd/mm/aaaa, en los cuatro idiomas.

```jsx
<CampoFecha
  label="Fecha de nacimiento"
  value={nacimiento}          // ISO: '2026-08-10'
  onChange={setNacimiento}    // devuelve ISO
  calendarioLabel="Abrir calendario"
/>
```

- **Reemplaza al `<input type="date">` nativo en toda la app.** El nativo muestra el formato del idioma del **navegador**, no del producto: un Chrome en inglés dice «mm/dd/yyyy» en un formulario en español. No es un tema de gusto — es la diferencia entre el 8 de octubre y el 10 de agosto, y en una fecha de nacimiento eso no lo corrige nadie después.
- **Mismo contrato que el nativo**: `value` y `onChange` hablan ISO. Cambiarlo fue una línea por pantalla y ninguna consulta a la base.
- **El calendario es del kit.** Antes el botón abría el nativo con `showPicker()` sobre un input escondido, y esta ficha defendía esa decisión: «una grilla de días no tiene formato ambiguo». El argumento era cierto sobre la ambigüedad y falso sobre todo lo demás — lo que se abría era el «August 2026 · Clear · Today» en azul de sistema, en inglés, en el medio de un formulario en castellano. Ahora el panel es `CalendarioDeCampo` y flota con un portal, porque ocho de las dieciséis pantallas que usan este campo son diálogos.
- **«Hoy» siempre; «Quitar» solo donde la fecha es opcional.** El «Clear» del nativo aparecía también en las obligatorias, que es una promesa que el formulario no puede cumplir.
- **La hora tiene su propio campo**: [`CampoHora`](./CampoHora.prompt.md). Un `datetime-local` mezcla los dos formatos ambiguos a la vez.
- **No emite nada hasta que lo escrito ES una fecha.** Mientras alguien va por «10/0», el valor de arriba no se toca: un formulario que borra lo que había apenas se toca el campo es peor que uno que espera.
- Las barras se ponen solas al teclear y **nunca se quitan solas**: quien borra con retroceso pasa por encima de una barra sin que el campo se la devuelva delante del cursor.
- `31/02/2026` no se acepta: la validación pregunta por el calendario real, bisiestos incluidos.
