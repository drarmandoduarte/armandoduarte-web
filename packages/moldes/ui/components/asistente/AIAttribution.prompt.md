Envuelve TODO lo que la IA escribe y se ve en pantalla (un resumen, una sugerencia, el borrador de un mensaje). Es una regla de marca, no una decoración.

```jsx
<AIAttribution source={t('asistente.firma', { app })} note={t('asistente.sugerencia')} actions={<><Button size="sm" variant="secondary">Editar</Button><Button size="sm">Aceptar y firmar</Button></>}>
  Borrador del mensaje: …
</AIAttribution>
```

- Va en el gris que informa, nunca en el acento: la IA informa, no actúa.
- La IA no afirma por la persona: la persona decide, firma y pone el criterio.
