Wrapper de Lucide — el set base de iconos del molde (grid 24, stroke 1.5, currentColor, sin relleno); usalo en cualquier lugar donde haga falta un glifo.

```jsx
<Icon name="stethoscope" size={16} />
<Icon name="stethoscope" size={20} label="Consulta" />
```

- Requiere el UMD de Lucide en la página: `<script src="https://unpkg.com/lucide@0.454.0/dist/umd/lucide.js"></script>`.
- Tamaños del sistema: 12, 14, 16, 20, 24. Nunca escalar un icono a un tamaño intermedio.
- El color se hereda (`currentColor`); no pases `color` salvo excepción.
- Lucide trae vocabulario de muchos rubros (`stethoscope`, `house`, `scissors`, `pill`, `activity`, `heart-pulse`, `accessibility`, `calendar-clock`, `clipboard-list`, `scan-barcode`, `mic`, `message-circle`.
