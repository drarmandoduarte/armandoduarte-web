El índice de una pantalla de ajustes.

```jsx
<SettingsRail
  label="Secciones"
  activeId="cuenta"
  onSelect={setSeccion}
  items={[
    { id: 'apariencia', label: 'Apariencia' },
    { id: 'cuenta', label: 'Cuenta' },
    { id: 'idioma', label: 'Idioma' },
  ]}
/>
```

1. **Texto puro, sin iconos.** Cinco iconos en una columna de cinco palabras es
   ruido: la palabra ya dice todo.
2. La activa se marca con **barra vertical a la izquierda**, no con la píldora
   del Sidebar. La píldora significa "estoy en esta sección del producto"; usarla
   acá hace competir dos jerarquías en la misma pantalla. Un índice señala sin
   gritar.
3. La barra es un borde y no un pseudo-elemento: ocupa su lugar también apagada,
   así el texto no se corre cuando cambia la selección.
4. Siempre columna. Que se apile arriba del panel en pantallas chicas lo decide
   el layout que lo usa.
5. Es un `tablist`: las secciones son pestañas, no rutas. Quien lo usa decide si
   además viajan en la URL.
