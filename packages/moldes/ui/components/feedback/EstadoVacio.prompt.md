La pantalla que todavía no tiene datos, dicha sin disculparse.

```jsx
<EstadoVacio
  icon="folder-heart"
  title="Todavía no hay fichas."
  description="El primero se carga en menos de un minuto: nombre, documento y su responsable."
  action={<Button icon="plus">Nueva ficha</Button>}
/>
```

1. **No es un error.** Nada de el aviso ni el error, no late, no ofrece "reintentar".
2. La diferencia con `PantallaProxima` es una sola y es de fondo: allá no hay
   nada que ofrecer porque la función no existe; acá existe y espera la primera
   fila. Por eso esta lleva acción y aquella no.
3. Una sola acción. Si hay dos caminos (crear e importar), el segundo va como
   `ghost` al lado, nunca dos primarios.
4. El icono es el mismo que la pieza tiene en el sidebar: quien llega reconoce
   dónde está antes de leer.
