Elegir una foto y encuadrarla en cuadrado. Dos puertas: el archivo y la cámara.

```jsx
<CampoFoto
  label="Foto"
  required
  nombre={nombre}
  valorUrl={fotoUrl}
  onArchivo={(archivo, encuadre) => recortarYGuardar(archivo, encuadre)}
  onQuitar={() => setFotoUrl(undefined)}
  textos={{ subir, camara, cambiar, quitar, recortar, cancelar, ayudaEncuadre, zoom }}
/>
```

- **Dos botones, no uno con menú.** «Cámara» es el mismo `<input type=file>` con `capture`: en el móvil saltea el carrete, en el escritorio se comporta como el otro. Quien tiene a la persona delante toca «Cámara» y ya está sacando la foto.
- **El recorte es cuadrado y es lo único que se puede hacer.** Se arrastra para mover, se acerca con la barra. Sin rotar, sin filtros, sin relación de aspecto: el cuadrado es la forma en que la foto se ve después —lista, tarjeta, tablero, ficha—, así que quien encuadra ve exactamente lo que va a quedar.
- La imagen **nunca deja ver el fondo**: el desplazamiento se recorta contra los bordes, y acercar lo hace sobre el centro.
- **No comprime ni sube nada.** Entrega el archivo original y el encuadre; convertir eso en un cuadrado de ~200 KB y ponerlo en Storage es trabajo de datos y vive en la app, donde además se puede probar.
- Los ocho `textos` son obligatorios y van traducidos. Ninguno tiene default en español.
