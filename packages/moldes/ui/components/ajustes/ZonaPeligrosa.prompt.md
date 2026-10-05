La zona peligrosa al final de Privacidad y datos (y donde haga falta). Una acción por zona.

```jsx
<ZonaPeligrosa
  antetitulo={t('settings.danger')}
  nombre={t('settings.data.delete')}
  explicacion={t('settings.data.delete.d')}
  palabra={t('settings.data.delete.word')}     // BORRAR
  textos={{ abrir: t('settings.data.delete'), escribiPalabra: t('settings.danger.type', { palabra }), codigo: t('auth.code.label'), confirmar: t('settings.danger.confirm'), cancelar: t('auth.stepup.cancel') }}
  onConfirmar={(codigo) => borrarCuenta(codigo)}
/>
```
