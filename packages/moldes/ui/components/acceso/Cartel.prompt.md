Una pantalla de un solo mensaje y una sola salida: sesión cerrada (P7), almacenamiento borrado (P9).

```jsx
<Cartel
  antetitulo={t('auth.session.eyebrow')}
  titulo={t('auth.session.title')}
  texto={t('auth.session.subtitle')}
  accion={{ texto: t('auth.session.again'), onClick: () => navegar('/login') }}
/>
```
