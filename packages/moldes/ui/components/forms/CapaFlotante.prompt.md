La capa que flota colgada de un campo, dibujada fuera de la caja que scrollea.

```jsx
const campo = useRef(null);
<div ref={campo}>…</div>
<CapaFlotante abierta={abierto} ancla={campo} ancho={252} alto={360}>
  <MiPanel />
</CapaFlotante>
```

- **Por qué existe:** un `Dialog` de la casa recorta lo que se le sale (`overflow: hidden` en la caja, `overflowY: auto` en el cuerpo), así que una capa `position: absolute` abierta cerca del pie queda atrapada adentro. Esto la dibuja en `document.body` con `position: fixed` y la mide contra el campo.
- **Decide dónde va y cuánto mide, nada más.** Abrir, cerrar y cerrar-al-tocar-afuera son de quien la usa: «afuera» incluye su propio disparador, y eso solo lo sabe él.
- Se vuelve a medir con el scroll **en captura** y con el `resize`: adentro de un diálogo lo que mueve el campo es el scroll de un `div`, no el de la ventana.
- Con `ancho` mide lo suyo y se trae sola contra el borde derecho de la ventana; sin `ancho` se estira con su contenido.
- Vive en la capa 70, por encima del velo del diálogo (60): ya no es hija del diálogo, así que con 40 se dibujaría debajo de la cortina.
