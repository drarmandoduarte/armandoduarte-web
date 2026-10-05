La superficie de contenido del sistema: borde fino, radio 16, sin sombra (la sombra se reserva para lo que flota).

```jsx
<Card title="Densidad de agenda" subtitle="Turnos de hoy" actions={<Button size="sm" variant="ghost">Ver todo</Button>}>
  …
</Card>
```

- `tone="sunken"` para bloques anidados dentro de otra card; `quiet` cuando solo quieres el borde.
- Nunca apiles cards con sombra: la jerarquía en el molde se hace con superficie y borde.
