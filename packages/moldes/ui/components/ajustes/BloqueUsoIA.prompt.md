El bloque «§ · USO DE IA» de Plan y facturación. Recibe el contador ya formateado; no calcula ni formatea nada.

```jsx
<BloqueUsoIA
  uso={contador}                    // ver UsoIA en BloqueUsoIA.d.ts
  textos={{ antetitulo: t('usage.eyebrow'), titulo: t('usage.title', { app }), aviso: t('usage.warn'), hace30: t('usage.30d'), porPersona: t('usage.byPerson'), enQue: t('usage.byUse'), sumar: t('usage.add') }}
  onSumar={abrirCompra}
/>
```

- Con `uso.pausado` se dibuja el estado al llegar al tope: número, barra llena, píldora y la nota.
- Va en Plan y facturación, no en Asistente: el uso se mira donde se paga.
