El botón de acción del sistema; una sola acción primaria por pantalla, el resto en secundario o ghost.

```jsx
<Button variant="primary">Guardar</Button>
<Button variant="secondary"><Icon name="file-text" size={16} />Ver historia</Button>
<Button variant="tertiary">Ajustar</Button>
<Button variant="ghost">Cancelar</Button>
<Button variant="danger">Marcar urgencia</Button>
```

- Variantes: `primary` (relleno el acento) · `secondary` (outline el acento) · `tertiary` (outline neutro) · `ghost` (texto en la tinta atenuada) · `danger` (relleno el error).
- **`tertiary` o `ghost`, y no da igual.** `ghost` es para lo que se puede ignorar y vive donde no compite: el «Cancelar» de un diálogo, una acción dentro de una fila. En cuanto un control comparte renglón con un primario o un secundario, va `tertiary`: sin caja se lee como texto suelto y su tinta termina 19 px antes que la de sus hermanos (el padding que los otros tienen dibujado y él no).
- **Forma: píldora** (`--radius-pill`) — lo que se toca es píldora. Este botón es relleno, Outfit 600, sentence case; para el botón de contorno en mayúsculas espaciadas de las pantallas de acceso está `Boton`.
- Tamaños `sm` 32px / `md` 40px / `lg` 48px. En agenda y stock (densidad compacta) usa `sm`.
- Hover = cambio de color, nunca sombra ni escala. Iconos como hijos, siempre a 16px.
- Los textos crecen ~35% en francés y portugués: no pongas anchos fijos.
