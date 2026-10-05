La hora, escrita como se escribe: hh:mm en 24 h, en los cuatro idiomas.

```jsx
<CampoHora
  label="Desde"
  value={desde}        // 'HH:MM'
  onChange={setDesde}  // devuelve 'HH:MM'
/>
```

- **Reemplaza al `<input type="time">` nativo en toda la app.** El nativo dibuja el reloj del idioma del **navegador**: en un Chrome en inglés el campo se parte en hora, minutos y un AM/PM sobre un formulario en castellano donde el resto del día está en 24 h. Y «02:30» sin ese AM/PM son dos horas distintas — en la franja de un profesional, abrir de madrugada o abrir después de comer.
- **Mismo contrato que el nativo**: `value` y `onChange` hablan `HH:MM`. Cambiarlo fue una línea por pantalla y ninguna consulta a la base.
- **No tiene panel, y es deliberado.** Una fecha trae una pregunta que el teclado no contesta («¿qué martes?») y por eso tiene calendario; una hora no. Un desplegable de horas obliga a elegir el paso: cada 15 minutos deja fuera el turno de las 09:20, y cada 5 son 288 renglones para escribir cuatro teclas.
- **Se apoya en `Input`** en vez de repetir su estilo: en un formulario todos los campos visten igual, y un segundo bloque de borde y foco copiado sería el que se olvide de cambiar.
- **No emite nada hasta que lo escrito ES una hora.** Mientras alguien va por «1», el valor de arriba no se toca.
- Los dos puntos se ponen solos al teclear y **nunca se quitan solos**: quien borra con retroceso pasa por encima sin que el campo se los devuelva delante del cursor.
- `24:00` no se acepta: la medianoche del final del día se escribe `00:00` del día siguiente, que es lo que la columna `time` de la base admite.
