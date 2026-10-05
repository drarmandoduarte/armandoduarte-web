El calendario de la casa: el que cuelga de un campo de fecha y reemplaza al panel del navegador. En la app se usa siempre a través de `CampoFecha`, que ya lo abre y lo cierra.

```jsx
<CalendarioDeCampo
  valor="2026-08-19"
  hoy="2026-08-19"
  min="2026-01-01"
  idioma="es"
  onElegir={(iso) => setFecha(iso)}
  onQuitar={() => setFecha('')}   {/* solo si la fecha es OPCIONAL */}
  label="Calendario"
  hoyEtiqueta="Hoy" quitarEtiqueta="Quitar"
  mesAnteriorEtiqueta="Mes anterior" mesSiguienteEtiqueta="Mes siguiente"
/>
```

- **Todo hacia afuera es ISO** (`YYYY-MM-DD`), incluido `hoy`: la pieza no lee el reloj, se lo pasa quien la dibuja. La cuenta —qué mes abre, qué día se puede apretar, qué flecha se apaga— vive en `calendario.js` con su test.
- **No se refunde con `MiniCalendario`**: aquel navega sin elegir y vive al costado de la Agenda; este elige y se va. Comparten `mes.js` —el saber— y el vocabulario de estado: **hoy en el aviso suave, lo elegido en anillo el acento**. El relleno sólido está descartado porque el botón primario del formulario que lo abre ya es sólido.
- **«Hoy» siempre**, y se apaga si hoy no entra en el rango en vez de desaparecer: un botón que a veces está obliga a buscarlo cada vez.
- **«Quitar» solo donde la fecha es opcional** — se dibuja únicamente si le pasás `onQuitar`. Un campo opcional sin manera de vaciarse es una promesa al revés; uno obligatorio con «Quitar» es la promesa contraria.
- Un día fuera de `min`/`max` **se ve apagado y no se aprieta**: esconderlo dejaría un hueco y el mes dejaría de leerse como un mes.
- Teclado: flechas para moverse de día y de semana, RePág/AvPág para cambiar de mes, Enter para elegir, Escape para cerrar. Un solo día entra en el orden de tabulación (roving tabindex).
- El nombre del mes sale de `Intl` con **mayúscula inicial a mano**, nunca con `text-transform: capitalize` — en castellano eso da «Agosto De 2026».
